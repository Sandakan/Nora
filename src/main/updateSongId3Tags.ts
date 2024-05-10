/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
import path from 'path';
import { readFile } from 'fs/promises';
import { statSync } from 'fs';
import NodeID3 from 'node-id3';
import sharp from 'sharp';

import {
  DEFAULT_FILE_URL,
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getPaletteData,
  getSongsData,
  getUserData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setPaletteData,
  setSongsData
} from './filesystem';
import {
  getArtistArtworkPath,
  getSongArtworkPath,
  removeDefaultAppProtocolFromFilePath
} from './fs/resolveFilePaths';
import log from './log';
import {
  dataUpdateEvent,
  getCurrentSongPath,
  getSongsOutsideLibraryData,
  sendMessageToRenderer,
  updateSongsOutsideLibraryData
} from './main';
import { generateRandomId } from './utils/randomId';
import { createTempArtwork, removeArtwork, storeArtworks } from './other/artworks';
import generatePalette from './other/generatePalette';
import { parseLyricsFromID3Format, updateCachedLyrics } from './core/getSongLyrics';
import parseLyrics from './utils/parseLyrics';
import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';
import sendSongID3Tags from './core/sendSongId3Tags';
import { isSongBlacklisted } from './utils/isBlacklisted';
import isPathAWebURL from './utils/isPathAWebUrl';

import { appPreferences } from '../../package.json';
import saveLyricsToLRCFile from './core/saveLyricsToLrcFile';

const { metadataEditingSupportedExtensions } = appPreferences;

type PendingMetadataUpdates = {
  songPath: string;
  tags: NodeID3.Tags;
  sendUpdatedData?: boolean;
  isKnownSource?: boolean;
};

const pendingMetadataUpdates = new Map<string, PendingMetadataUpdates>();

export const isMetadataUpdatesPending = (songPath: string) => pendingMetadataUpdates.has(songPath);

export const savePendingMetadataUpdates = (currentSongPath = '', forceSave = false) => {
  const userData = getUserData();
  const pathExt = path.extname(currentSongPath).replace(/\W/, '');
  const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

  if (pendingMetadataUpdates.size === 0) return log('No pending metadata updates found.');

  log(`Started saving pending metadata updates.`, {
    pendingSongs: pendingMetadataUpdates.keys
  });

  const entries = pendingMetadataUpdates.entries();

  for (const [songPath, pendingMetadata] of entries) {
    const isACurrentlyPlayingSong = songPath === currentSongPath;

    if (forceSave || !isACurrentlyPlayingSong) {
      try {
        NodeID3.update(pendingMetadata.tags, songPath);

        if (!isASupportedFormat || userData.preferences.saveLyricsInLrcFilesForSupportedSongs) {
          const { title = '', synchronisedLyrics, unsynchronisedLyrics } = pendingMetadata.tags;

          const lyrics = parseLyricsFromID3Format(synchronisedLyrics, unsynchronisedLyrics);

          if (lyrics) {
            saveLyricsToLRCFile(songPath, {
              title,
              source: 'IN_SONG_LYRICS',
              isOfflineLyricsAvailable: true,
              lyricsType: synchronisedLyrics ? 'SYNCED' : 'UN_SYNCED',
              lyrics
            });
          }
        }

        log(
          `Successfully saved pending metadata updates of '${pendingMetadata.tags.title}'.`,
          { songPath },
          'INFO',
          {
            sendToRenderer: {
              messageCode: 'PENDING_METADATA_UPDATES_SAVED',
              data: { title: pendingMetadata.tags.title }
            }
          }
        );
        dataUpdateEvent('songs/artworks');
        dataUpdateEvent('songs/updatedSong');
        dataUpdateEvent('artists');
        dataUpdateEvent('albums');
        dataUpdateEvent('genres');
        pendingMetadataUpdates.delete(songPath);
      } catch (error) {
        log(`Failed to save pending metadata update of a song. `, { error, songPath }, 'ERROR');
        throw error;
      }

      try {
        const stats = statSync(songPath);
        if (stats?.mtime) {
          const modifiedDate = stats.mtime.getTime();
          if (isACurrentlyPlayingSong) return { modifiedDate };

          const songs = getSongsData();

          for (const song of songs) {
            if (song.path === songPath) song.modifiedDate = modifiedDate;
          }
          setSongsData(songs);
          dataUpdateEvent('songs/updatedSong');
        }
      } catch (error) {
        log(
          `FAILED TO GET SONG STATS AFTER UPDATING THE SONG WITH NEWER METADATA.`,
          { error },
          'ERROR'
        );
        throw error;
      }
    }
  }
  return undefined;
};

const addMetadataToPendingQueue = (data: PendingMetadataUpdates) => {
  // Kept to be saved later
  pendingMetadataUpdates.set(data.songPath, data);
  const currentSongPath = getCurrentSongPath();

  const isACurrentlyPlayingSong = data.songPath === currentSongPath;
  if (!isACurrentlyPlayingSong) return savePendingMetadataUpdates(currentSongPath, true);

  return undefined;
};

export const fetchArtworkBufferFromURL = async (url: string) => {
  try {
    const res = await fetch(url);
    if (res.ok && res.body) return Buffer.from(await res.arrayBuffer());

    log(
      `Error occurred when fetching artwork from url. HTTP Error Code:${res.status} - ${res.statusText}`,
      undefined,
      'ERROR'
    );
    return undefined;
  } catch (error) {
    log('Error occurred when fetching artwork from url', { error }, 'ERROR');
    return undefined;
  }
};

export const generateLocalArtworkBuffer = (filePath: string) =>
  readFile(filePath).catch((err) => {
    log(`ERROR OCCURRED WHEN TRYING TO GENERATE BUFFER OF THE SONG ARTWORK.`, { err }, 'ERROR');
    return undefined;
  });

const generateArtworkBuffer = async (artworkPath?: string) => {
  if (artworkPath) {
    const isArtworkPathAWebURL = isPathAWebURL(artworkPath || '');

    if (isArtworkPathAWebURL) {
      const onlineArtworkBuffer = await fetchArtworkBufferFromURL(artworkPath).catch((err) => {
        log(
          `ERROR OCCURRED WHEN FETCHING ONLINE ARTWORK BUFFER, NEWLY ADDED TO THE SONG.`,
          { err },
          'ERROR'
        );
        return undefined;
      });
      return onlineArtworkBuffer;
    }
    const localArtworkBuffer = await generateLocalArtworkBuffer(artworkPath);
    return localArtworkBuffer;
  }
  return undefined;
};

const parseImgDataForNodeID3 = async (
  artworkPaths: ArtworkPaths,
  artworkBuffer?: Buffer
): Promise<
  | {
      mime: string;
      type: {
        id: number;
        name?: string | undefined;
      };
      description: string;
      imageBuffer: Buffer;
    }
  | undefined
> => {
  if (artworkPaths.isDefaultArtwork) return undefined;

  if (artworkBuffer) {
    const pngBuffer = await sharp(artworkBuffer).toFormat('png').toBuffer();

    if (pngBuffer) {
      return {
        type: { id: 1 },
        mime: 'image/png',
        description: 'artwork',
        imageBuffer: pngBuffer
      };
    }
  }
  return undefined;
};

const manageArtistDataUpdates = (
  artists: SavableArtist[],
  newSongData: SongTags,
  prevSongData: SavableSongData
) => {
  // these artists should be created as new artists.
  const artistsWithoutIds = Array.isArray(newSongData.artists)
    ? newSongData.artists.filter((artist) => typeof artist.artistId !== 'string')
    : [];
  // these artists are available in the library but may not be in the initial song data.
  const artistsWithIds = Array.isArray(newSongData.artists)
    ? newSongData.artists.filter((artist) => typeof artist.artistId === 'string')
    : [];
  //  these artists are available in the library and recently unlinked from the song.
  const unlinkedArtists =
    // eslint-disable-next-line no-nested-ternary
    Array.isArray(artistsWithIds) && Array.isArray(prevSongData.artists)
      ? prevSongData.artists.length > 0 && artistsWithIds.length === 0
        ? prevSongData.artists
        : prevSongData.artists.filter(
            (a) => !artistsWithIds?.some((b) => a.artistId === b.artistId)
          )
      : [];
  // these artists are available in the library and already linked to the song.
  const linkedArtists =
    artistsWithIds.length > 0 && Array.isArray(prevSongData.artists)
      ? artistsWithIds.filter((a) => prevSongData.artists?.some((b) => a.artistId === b.artistId))
      : [];
  //  these artists are available in the library and recently linked to the song.
  const newlyLinkedArtists =
    artistsWithIds.length > 0 && Array.isArray(prevSongData.artists)
      ? artistsWithIds.filter((a) => !prevSongData.artists?.some((b) => a.artistId === b.artistId))
      : [];

  prevSongData.artists = [];

  if (artistsWithoutIds.length > 0) {
    log(`User created ${artistsWithoutIds.length} no of artists when updating a song.`);
    for (let e = 0; e < artistsWithoutIds.length; e += 1) {
      const artistData = artistsWithoutIds[e];
      const songArtworkPaths = getSongArtworkPath(
        prevSongData.songId,
        prevSongData.isArtworkAvailable
      );
      const newArtist: SavableArtist = {
        artistId: generateRandomId(),
        name: artistData.name,
        songs: [{ songId: prevSongData.songId, title: prevSongData.title }],
        artworkName: songArtworkPaths.isDefaultArtwork
          ? undefined
          : path.basename(songArtworkPaths.artworkPath),
        isAFavorite: false
      };
      prevSongData?.artists.push({
        artistId: newArtist.artistId,
        name: artistData.name
      });
      artists.push(newArtist);
    }
  }
  if (unlinkedArtists.length > 0) {
    for (let i = 0; i < artists.length; i += 1) {
      if (
        unlinkedArtists.some((unlinkedArtist) => unlinkedArtist.artistId === artists[i].artistId)
      ) {
        if (artists[i].songs.length === 1 && artists[i].songs[0].songId === prevSongData.songId) {
          log(
            `'${artists[i].name}' got removed because user removed the only link it has with a song.`
          );
          artists.splice(i, 1);
        } else {
          artists[i].songs = artists[i].songs.filter((s) => s.songId !== prevSongData.songId);
        }
      }
    }
  }
  if (linkedArtists.length > 0 || newlyLinkedArtists.length > 0) {
    if (newlyLinkedArtists.length > 0) {
      for (let p = 0; p < artists.length; p += 1) {
        for (let q = 0; q < newlyLinkedArtists.length; q += 1) {
          if (artists[p].artistId === newlyLinkedArtists[q].artistId) {
            artists[p].songs.push({
              title: prevSongData.title,
              songId: prevSongData.songId
            });
          }
        }
      }
    }
    const availArtists = linkedArtists.concat(newlyLinkedArtists);
    prevSongData.artists.push(
      ...availArtists.map((artist) => {
        if (artist.artistId === undefined)
          log(`ARTIST WITHOUT AN ID FOUND.`, { ARTIST_NAME: artist.name }, 'ERROR');
        return {
          artistId: artist.artistId as string,
          name: artist.name
        };
      })
    );
  }

  const updatedArtists = artists.filter((artist) => artist.songs.length > 0);
  return {
    updatedArtists,
    artistsWithIds,
    artistsWithoutIds,
    unlinkedArtists,
    linkedArtists,
    newlyLinkedArtists
  };
};

const manageGenreDataUpdates = (
  genres: SavableGenre[],
  prevSongData: SavableSongData,
  newSongData: SongTags,
  songArtworkPaths: ArtworkPaths
) => {
  const { songId } = prevSongData;
  // these genres should be created as new genres.
  const genresWithoutIds = Array.isArray(newSongData.genres)
    ? newSongData.genres.filter((genre) => typeof genre.genreId !== 'string')
    : [];
  // these genres are available in the library but may not be in the initial song data.
  const genresWithIds = Array.isArray(newSongData.genres)
    ? newSongData.genres.filter((genre) => typeof genre.genreId === 'string')
    : [];
  //  these genres are available in the library and recently unlinked from the song.
  const unlinkedGenres =
    genresWithIds.length > 0 && Array.isArray(prevSongData.genres)
      ? prevSongData.genres.filter((a) => !genresWithIds?.some((b) => a.genreId === b.genreId))
      : [];
  // these Genres are available in the library and already linked to the song.
  const linkedGenres =
    genresWithIds.length > 0 && Array.isArray(prevSongData.genres)
      ? genresWithIds.filter((a) => prevSongData.genres?.some((b) => a.genreId === b.genreId))
      : [];
  //  these Genres are available in the library and recently linked to the song.
  const newlyLinkedGenres =
    genresWithIds.length > 0 && Array.isArray(prevSongData.genres)
      ? genresWithIds.filter((a) => !prevSongData.genres?.some((b) => a.genreId === b.genreId))
      : [];

  prevSongData.genres = [];
  if (genresWithoutIds.length > 0) {
    for (let int = 0; int < genresWithoutIds.length; int += 1) {
      const genreData = genresWithoutIds[int];
      const newGenre: SavableGenre = {
        genreId: generateRandomId(),
        name: genreData.name,
        songs: [{ title: prevSongData.title, songId }],
        artworkName: path.basename(songArtworkPaths.artworkPath),
        paletteId: prevSongData.paletteId
      };
      prevSongData.genres.push({
        genreId: newGenre.genreId,
        name: newGenre.name
      });
      genres.push(newGenre);
    }
  }
  if (unlinkedGenres.length > 0) {
    for (let i = 0; i < genres.length; i += 1) {
      if (unlinkedGenres.some((unlinkedGenre) => unlinkedGenre.genreId === genres[i].genreId)) {
        if (genres[i].songs.length === 1 && genres[i].songs[0].songId === songId) {
          log(
            `'${genres[i].name}' got removed because user removed the only link it has with a song.`
          );
          genres.splice(i, 1);
        } else {
          genres[i].songs = genres[i].songs.filter((s) => s.songId !== songId);
        }
      }
    }
  }
  if (linkedGenres.length > 0 || newlyLinkedGenres.length > 0) {
    if (newlyLinkedGenres.length > 0) {
      for (let p = 0; p < genres.length; p += 1) {
        for (let q = 0; q < newlyLinkedGenres.length; q += 1) {
          if (genres[p].genreId === newlyLinkedGenres[q].genreId) {
            genres[p].songs.push({ title: prevSongData.title, songId });
          }
        }
      }
    }
    const availGenres = linkedGenres.concat(newlyLinkedGenres);
    prevSongData.genres.push(
      ...availGenres.map((genre) => {
        if (genre.genreId === undefined)
          log(`GENRE WITHOUT AN ID FOUND.`, { GENRE_NAME: genre.name }, 'ERROR');
        return { genreId: genre.genreId as string, name: genre.name };
      })
    );
  }

  const updatedGenres = genres.filter((genre) => genre.songs.length > 0);
  return {
    updatedGenres,
    updatedSongData: prevSongData,
    genresWithIds,
    genresWithoutIds,
    newlyLinkedGenres,
    linkedGenres,
    unlinkedGenres
  };
};

const manageAlbumDataUpdates = (
  albums: SavableAlbum[],
  prevSongData: SavableSongData,
  newSongData: SongTags,
  songArtworkPaths: ArtworkPaths
) => {
  const { songId } = prevSongData;
  if (newSongData.album) {
    // album is newly created or available in the library.
    if (newSongData.album.albumId) {
      // album in the song is available in the library.
      if (prevSongData.album?.albumId !== newSongData.album.albumId) {
        // song album changed to some other album in the library.
        for (let i = 0; i < albums.length; i += 1) {
          if (albums[i].albumId === prevSongData.album?.albumId) {
            albums[i].songs = albums[i].songs.filter((z) => z.songId !== songId);
          }
          if (albums[i].albumId === newSongData.album.albumId) {
            // ? These lines are removed because album artists will only be changed if the albumArtist is changed.
            // if (prevSongData.artists && albums[i].artists) {
            //   albums[i].artists = albums[i].artists?.filter(
            //     (d) =>
            //       !prevSongData.artists?.some((e) => e.artistId === d.artistId),
            //   );
            // }
            // if (newSongData.artists) {
            //   albums[i].artists?.push(
            //     ...newSongData.artists.map((x) => ({
            //       name: x.name,
            //       artistId: x.artistId as string,
            //     })),
            //   );
            // }
            albums[i].songs.push({ title: prevSongData.title, songId });
            prevSongData.album = {
              name: albums[i].title,
              albumId: albums[i].albumId
            };
          }
        }
      }
      // song album hasn't changed.
    } else {
      // user created a new album for the song.
      for (let c = 0; c < albums.length; c += 1) {
        if (albums[c].albumId === prevSongData.album?.albumId) {
          albums[c].songs = albums[c].songs.filter((z) => z.songId !== songId);
        }
      }
      const newAlbum: SavableAlbum = {
        albumId: generateRandomId(),
        title: newSongData.album.title,
        songs: [{ title: newSongData.title, songId }],
        artworkName: path.basename(songArtworkPaths.artworkPath),
        artists: prevSongData.albumArtists || prevSongData.artists
      };
      prevSongData.album = { albumId: newAlbum.albumId, name: newAlbum.title };
      albums.push(newAlbum);
    }
  }
  // this means the song has no album or user deleted the previous album.
  else if (prevSongData.album?.albumId) {
    // song previously had an album but the user removed it.
    for (let c = 0; c < albums.length; c += 1) {
      if (albums[c].albumId === prevSongData.album?.albumId) {
        if (albums[c].songs.length === 1 && albums[c].songs[0].songId === songId) {
          albums.splice(c, 1);
        } else {
          albums[c].songs = albums[c].songs.filter((d) => d.songId !== prevSongData.songId);
        }
        prevSongData.album = undefined;
      }
    }
  }
  // song didn't have any album before
  const updatedAlbums = albums.filter((album) => album.songs.length > 0);
  return { updatedAlbums, updatedSongData: prevSongData };
};

const manageArtworkUpdates = async (prevSongData: SavableSongData, newSongData: SongTags) => {
  const { songId } = prevSongData;
  const newArtworkPath = newSongData.artworkPath
    ? removeDefaultAppProtocolFromFilePath(newSongData.artworkPath)
    : undefined;
  let isArtworkChanged = false;

  const artworkBuffer = await generateArtworkBuffer(newArtworkPath);

  const songPrevArtworkPaths = getSongArtworkPath(
    prevSongData.songId,
    prevSongData.isArtworkAvailable,
    false,
    true
  );

  if (songPrevArtworkPaths.artworkPath !== newArtworkPath) {
    log(`User changed the artwork of the song '${songId}'`);
    isArtworkChanged = true;
    // check whether song had an artwork before
    if (prevSongData.isArtworkAvailable) {
      // had an artwork before
      prevSongData.isArtworkAvailable = false;

      await removeArtwork(songPrevArtworkPaths).catch((err) => {
        log(`ERROR OCCURRED WHEN TRYING TO REMOVE SONG ARTWORK OF '${songId}'.`, { err }, 'ERROR');
        throw err;
      });
    }
    if (artworkBuffer) {
      const palettes = getPaletteData();
      const updatedPalettes =
        prevSongData.paletteId === 'DEFAULT_PALETTE'
          ? palettes
          : palettes.filter((palette) => palette.paletteId !== prevSongData.paletteId);
      const palette = await generatePalette(artworkBuffer);

      const artworkPaths = await storeArtworks(songId, 'songs', artworkBuffer);
      if (artworkPaths) {
        prevSongData.isArtworkAvailable = !artworkPaths.isDefaultArtwork;
      }

      prevSongData.paletteId = palette?.paletteId;

      if (palette) updatedPalettes.push(palette);
      setPaletteData(updatedPalettes);
    }
  }
  return {
    songPrevArtworkPaths,
    artworkBuffer,
    updatedSongData: prevSongData,
    isArtworkChanged
  };
};

const manageArtworkUpdatesOfSongsFromUnknownSource = async (
  prevSongTags: SongTags,
  newSongTags: SongTags
) => {
  const oldArtworkPath = prevSongTags.artworkPath
    ? removeDefaultAppProtocolFromFilePath(prevSongTags.artworkPath)
    : undefined;
  const newArtworkPath = newSongTags.artworkPath
    ? removeDefaultAppProtocolFromFilePath(newSongTags.artworkPath)
    : undefined;

  if (oldArtworkPath && newArtworkPath) {
    if (oldArtworkPath === newArtworkPath) {
      // artwork didn't change
      return { artworkPath: newArtworkPath };
    }
    // song previously had an artwork and user changed it with a new artwork
    const artworkBuffer = await generateArtworkBuffer(newArtworkPath);
    const artworkPath = artworkBuffer ? await createTempArtwork(artworkBuffer) : undefined;

    return { artworkPath, artworkBuffer };
  }
  if (typeof oldArtworkPath === 'string' && newArtworkPath === undefined) {
    // user removed the song artwork
    return { artworkPath: undefined };
  }
  if (typeof newArtworkPath === 'string' && oldArtworkPath === undefined) {
    // song didn't have an artwork but user added a new song artwork
    const artworkBuffer = await generateArtworkBuffer(newArtworkPath);
    const artworkPath = artworkBuffer ? await createTempArtwork(artworkBuffer) : undefined;

    return { artworkPath, artworkBuffer };
  }

  return { artworkPath: undefined };
};

const manageLyricsUpdates = (
  tags: SongTags,
  prevTags: NodeID3.Tags,
  prevSongData?: SavableSongData
) => {
  const parsedSyncedLyrics = tags.synchronizedLyrics
    ? parseLyrics(tags.synchronizedLyrics)
    : undefined;
  const parsedUnsyncedLyrics = tags.unsynchronizedLyrics
    ? parseLyrics(tags.unsynchronizedLyrics)
    : undefined;

  const unsynchronisedLyrics = parsedUnsyncedLyrics
    ? { language: 'ENG', text: parsedUnsyncedLyrics.unparsedLyrics }
    : undefined;

  const synchronisedLyrics = convertParsedLyricsToNodeID3Format(
    parsedSyncedLyrics,
    prevTags.synchronisedLyrics
  );

  if (parsedSyncedLyrics || parsedUnsyncedLyrics) {
    updateCachedLyrics((cachedLyrics) => {
      if (cachedLyrics) {
        const { title } = cachedLyrics;
        if (title === tags.title || title === prevSongData?.title) {
          const lyrics = (parsedSyncedLyrics || parsedUnsyncedLyrics) as LyricsData;
          const { isSynced } = lyrics;
          const lyricsType: LyricsTypes = isSynced ? 'SYNCED' : 'ANY';

          cachedLyrics.lyrics = lyrics;
          cachedLyrics.lyricsType = lyricsType;
          cachedLyrics.copyright = lyrics.copyright;
          cachedLyrics.source = 'IN_SONG_LYRICS';
          cachedLyrics.isOfflineLyricsAvailable = true;

          return cachedLyrics;
        }
      }
      return undefined;
    });
  }

  return {
    unsynchronisedLyrics,
    synchronisedLyrics
  };
};

const updateSongId3TagsOfUnknownSource = async (
  songPath: string,
  newSongTags: SongTags,
  sendUpdatedData: boolean
) => {
  const pathExt = path.extname(songPath).replace(/\W/, '');
  const isASupporedFormat = metadataEditingSupportedExtensions.includes(pathExt);

  if (!isASupporedFormat)
    return log(
      `Lyrics cannot be saved because current song extension (${pathExt}) is not supported for modifying metadata.`,
      { songPath },
      'ERROR',
      {
        sendToRenderer: {
          messageCode: 'SONG_EXT_NOT_SUPPORTED_FOR_LYRICS_SAVES',
          data: { ext: pathExt }
        }
      }
    );

  const songsOutsideLibraryData = getSongsOutsideLibraryData();

  for (const songOutsideLibraryData of songsOutsideLibraryData) {
    if (songOutsideLibraryData.path === songPath) {
      const songPathWithoutDefaultUrl = removeDefaultAppProtocolFromFilePath(songPath);

      const oldSongTags = await sendSongID3Tags(songPath, false);
      const oldNodeID3Tags = await NodeID3.Promise.read(songPathWithoutDefaultUrl);

      // ?  /////////// ARTWORK DATA FOR SONGS FROM UNKNOWN SOURCES /////////////////

      const { artworkPath, artworkBuffer } = await manageArtworkUpdatesOfSongsFromUnknownSource(
        oldSongTags,
        newSongTags
      );
      songOutsideLibraryData.artworkPath = artworkPath;

      updateSongsOutsideLibraryData(songOutsideLibraryData.songId, songOutsideLibraryData);

      // ?  /////////// LYRICS DATA FOR SONGS FROM UNKNOWN SOURCES /////////////////
      const { synchronisedLyrics, unsynchronisedLyrics } = manageLyricsUpdates(
        newSongTags,
        oldNodeID3Tags
      );

      const id3Tags: NodeID3.Tags = {
        title: newSongTags.title,
        artist: newSongTags.artists?.map((artist) => artist.name).join(', '),
        album: newSongTags.album?.title,
        genre: newSongTags.genres?.map((genre) => genre.name).join(', '),
        composer: newSongTags.composer,
        trackNumber: newSongTags.trackNumber?.toString(),
        year: newSongTags.releasedYear ? `${newSongTags.releasedYear}` : undefined,
        image: artworkPath ? removeDefaultAppProtocolFromFilePath(artworkPath) : undefined,
        synchronisedLyrics: synchronisedLyrics || [],
        unsynchronisedLyrics
      };

      // Kept to be saved later
      addMetadataToPendingQueue({
        songPath: songPathWithoutDefaultUrl,
        tags: id3Tags,
        isKnownSource: false,
        sendUpdatedData
      });

      if (sendUpdatedData) {
        const updatedData: AudioPlayerData = {
          songId: songOutsideLibraryData.songId,
          title: newSongTags.title,
          artists: newSongTags.artists?.map((artist) => ({
            ...artist,
            artistId: ''
          })),
          album: newSongTags.album
            ? {
                albumId: newSongTags.album?.albumId || '',
                name: newSongTags.album.title
              }
            : undefined,
          artwork: artworkBuffer ? Buffer.from(artworkBuffer).toString('base64') : undefined,
          artworkPath: artworkPath ? path.join(DEFAULT_FILE_URL, artworkPath) : undefined,
          duration: newSongTags.duration,
          isAFavorite: false,
          path: songOutsideLibraryData.path,
          isKnownSource: false,
          isBlacklisted: isSongBlacklisted(
            songOutsideLibraryData.songId,
            songOutsideLibraryData.path
          )
        };

        return updatedData;
      }
    }
  }
  return undefined;
};

const updateSongId3Tags = async (
  songIdOrPath: string,
  tags: SongTags,
  sendUpdatedData = false,
  isKnownSource = true
) => {
  const songs = getSongsData();
  let artists = getArtistsData();
  let albums = getAlbumsData();
  let genres = getGenresData();

  const result: UpdateSongDataResult = { success: false };

  if (!isKnownSource) {
    try {
      const data = await updateSongId3TagsOfUnknownSource(songIdOrPath, tags, sendUpdatedData);
      if (data) result.updatedData = data;
      result.success = true;

      return result;
    } catch (error) {
      log(
        'Error occurred when updating song id3 tags of a song from unknown source.',
        { error, songIdOrPath },
        'ERROR'
      );
      return result;
    }
  }

  if (Array.isArray(songs) && songs.length > 0) {
    const songId = songIdOrPath;
    for (let x = 0; x < songs.length; x += 1) {
      if (songs[x].songId === songId) {
        try {
          log(`Started the song data updating procees of the song '${songId}'`);
          let song = songs[x];
          const prevTags = await NodeID3.Promise.read(song.path);

          // / / / / / SONG TITLE / / / / / / /
          song.title = tags.title;

          // / / / / / SONG YEAR / / / / / / /
          song.year = tags.releasedYear;

          // / / / / / SONG ARTWORK / / / / / / /
          const updatedArtworkData = await manageArtworkUpdates(song, tags);
          const { artworkBuffer, songPrevArtworkPaths } = updatedArtworkData;
          song = updatedArtworkData.updatedSongData;

          // / / / / / SONG ARTISTS / / / / / / /
          const { updatedArtists } = manageArtistDataUpdates(artists, tags, song);
          artists = updatedArtists;

          // / / / / / SONG ALBUM / / / / / /
          const updatedAlbumData = manageAlbumDataUpdates(albums, song, tags, songPrevArtworkPaths);
          albums = updatedAlbumData.updatedAlbums;
          song = updatedAlbumData.updatedSongData;

          // / / / / / / / SONG GENRES / / / / / / /

          const updatedGenreData = manageGenreDataUpdates(genres, song, tags, songPrevArtworkPaths);
          genres = updatedGenreData.updatedGenres;
          song = updatedGenreData.updatedSongData;

          // / / / / / / / SONG TRACK NUMBER / / / / / / /
          song.trackNo = tags.trackNumber;

          // / / / / / / / SONG LYRICS / / / / / / /
          const { synchronisedLyrics, unsynchronisedLyrics } = manageLyricsUpdates(
            tags,
            prevTags,
            song
          );

          // / / / / / SONG FILE UPDATE PROCESS AND UPDATE FINALIZATION / / / / / /
          const artworkPaths = getSongArtworkPath(song.songId, song.isArtworkAvailable, true);

          const id3Tags: NodeID3.Tags = {
            title: tags.title,
            artist: tags.artists?.map((artist) => artist.name).join(', '),
            album: tags.album?.title,
            genre: tags.genres?.map((genre) => genre.name).join(', '),
            composer: tags.composer,
            trackNumber: tags.trackNumber?.toString(),
            year: tags.releasedYear ? `${tags.releasedYear}` : undefined,
            image: await parseImgDataForNodeID3(artworkPaths, artworkBuffer),
            unsynchronisedLyrics,
            synchronisedLyrics: synchronisedLyrics || []
          };

          // Kept to be saved later
          const updatedData = addMetadataToPendingQueue({
            songPath: song.path,
            tags: id3Tags,
            isKnownSource: true,
            sendUpdatedData
          });

          if (updatedData) {
            song.modifiedDate = updatedData.modifiedDate;
          }

          songs[x] = song;
          setSongsData(songs);
          setArtistsData(artists);
          setAlbumsData(albums);
          setGenresData(genres);

          dataUpdateEvent('songs/artworks', [songId]);
          dataUpdateEvent('songs/updatedSong', [songId]);
          dataUpdateEvent('artists');
          dataUpdateEvent('albums');
          dataUpdateEvent('genres');

          result.success = true;

          if (sendUpdatedData) {
            const songArtists = artists
              .filter((z) => song.artists?.some((y) => y.artistId === z.artistId))
              .map((z) => ({
                artistId: z.artistId,
                name: z.name,
                artworkPath: getArtistArtworkPath(z.artworkName).artworkPath,
                onlineArtworkPaths: z.onlineArtworkPaths
              }));

            const data: AudioPlayerData = {
              songId,
              title: song.title,
              artists: songArtists,
              album: song.album,
              artwork: artworkBuffer ? Buffer.from(artworkBuffer).toString('base64') : undefined,
              artworkPath: artworkPaths.artworkPath,
              duration: song.duration,
              isAFavorite: song.isAFavorite,
              isBlacklisted: isSongBlacklisted(song.songId, song.path),
              path: song.path,
              isKnownSource: true
            };
            result.updatedData = data;
          }
          log(`'${id3Tags.title}' song data update successfull.`);
          return result;
        } catch (err: any) {
          if ('message' in err) {
            result.reason = err.message;
            sendMessageToRenderer({
              messageCode: 'METADATA_UPDATE_FAILED',
              data: { message: err.message }
            });
          }
          log('Song metadata update failed.', { err }, 'ERROR');
          return result;
        }
      }
    }
    return result;
  }
  log('FAILED TO UPDATE SONGSDATA. SONGS ARRAY IS EMPTY.', undefined, 'ERROR');
  throw new Error('Called songDataUpdatedFunction without data in the songs array.');
};

export default updateSongId3Tags;
