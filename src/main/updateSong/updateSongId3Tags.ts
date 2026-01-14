import path from 'path';
import { readFile } from 'fs/promises';
import { statSync } from 'fs';
import sharp from 'sharp';
import { ByteVector, Picture, PictureType } from 'node-taglib-sharp';

import { DEFAULT_FILE_URL } from '../filesystem';
import {
  getArtistArtworkPath,
  getSongArtworkPath,
  removeDefaultAppProtocolFromFilePath
} from '../fs/resolveFilePaths';
import {
  dataUpdateEvent,
  getCurrentSongPath,
  getSongsOutsideLibraryData,
  sendMessageToRenderer,
  updateSongsOutsideLibraryData
} from '../main';
import { createTempArtwork, storeArtworks } from '../other/artworks';
import generatePalette from '../other/generatePalette';
import { updateCachedLyrics } from '../core/getSongLyrics';
import parseLyrics from '../../common/parseLyrics';
import sendSongMetadata from '../core/sendSongMetadata';
import { isSongBlacklisted } from '../utils/isBlacklisted';
import isPathAWebURL from '../utils/isPathAWebUrl';

import { appPreferences } from '../../../package.json';
import saveLyricsToLRCFile from '../core/saveLyricsToLrcFile';
import logger from '../logger';
import { getUserSettings } from '../db/queries/settings';
import {
  updateSongModifiedAtByPath,
  getSongByPath,
  getSongById,
  updateSongBasicFields
} from '../db/queries/songs';
import { db } from '../db/db';
import {
  createArtist,
  getArtistWithName,
  linkSongToArtist,
  unlinkSongFromArtist,
  getArtistSongIds,
  deleteArtist
} from '../db/queries/artists';
import {
  createAlbum,
  getAlbumWithTitle,
  linkSongToAlbum,
  unlinkSongFromAlbum,
  getAlbumSongIds,
  deleteAlbum
} from '../db/queries/albums';
import {
  createGenre,
  linkSongToGenre,
  unlinkSongFromGenre,
  getGenreByName,
  getGenreSongIds,
  deleteGenre
} from '../db/queries/genres';
import { linkArtworksToSong } from '../db/queries/artworks';
import { withFileHandle } from '../utils/withFileHandle';

const { metadataEditingSupportedExtensions } = appPreferences;

type TagData = {
  title?: string;
  artists?: string[];
  album?: string;
  genres?: string[];
  composer?: string;
  trackNumber?: number;
  year?: number;
  artwork?: Picture;
  lyrics?: string;
};

type PendingMetadataUpdates = {
  songPath: string;
  tags: TagData;
  sendUpdatedData?: boolean;
  isKnownSource?: boolean;
};

const pendingMetadataUpdates = new Map<string, PendingMetadataUpdates>();

export const isMetadataUpdatesPending = (songPath: string) => pendingMetadataUpdates.has(songPath);

export const savePendingMetadataUpdates = async (currentSongPath = '', forceSave = false) => {
  const { saveLyricsInLrcFilesForSupportedSongs } = await getUserSettings();
  const pathExt = path.extname(currentSongPath).replace(/\W/, '');
  const isASupportedFormat = metadataEditingSupportedExtensions.includes(pathExt);

  if (pendingMetadataUpdates.size === 0) return logger.debug('No pending metadata updates found.');

  logger.debug(`Started saving pending metadata updates.`, {
    pendingSongs: pendingMetadataUpdates.keys
  });

  const entries = pendingMetadataUpdates.entries();

  for (const [songPath, pendingMetadata] of entries) {
    const isACurrentlyPlayingSong = songPath === currentSongPath;

    if (forceSave || !isACurrentlyPlayingSong) {
      try {
        await withFileHandle(songPath, async (file) => {
          const { tags } = pendingMetadata;

          // Write metadata using node-taglib-sharp
          if (tags.title) file.tag.title = tags.title;
          if (tags.artists) file.tag.performers = tags.artists;
          if (tags.album) file.tag.album = tags.album;
          if (tags.genres) file.tag.genres = tags.genres;
          if (tags.composer) file.tag.composers = [tags.composer];
          if (tags.trackNumber !== undefined) file.tag.track = tags.trackNumber;
          if (tags.year !== undefined) file.tag.year = tags.year;

          // Handle artwork
          if (tags.artwork) {
            file.tag.pictures = [tags.artwork];
          }

          // Handle lyrics - only unsynchronized (taglib-sharp doesn't support SYLT frames)
          if (tags.lyrics) {
            file.tag.lyrics = tags.lyrics;
          }

          file.save();
        });

        // Save lyrics to LRC file if needed
        if (!isASupportedFormat || saveLyricsInLrcFilesForSupportedSongs) {
          const { title = '', lyrics } = pendingMetadata.tags;

          if (lyrics) {
            const parsedLyrics = parseLyrics(lyrics);
            if (parsedLyrics) {
              saveLyricsToLRCFile(songPath, {
                title,
                source: 'IN_SONG_LYRICS',
                isOfflineLyricsAvailable: true,
                lyricsType: parsedLyrics.isSynced ? 'SYNCED' : 'UN_SYNCED',
                lyrics: parsedLyrics
              });
            }
          }
        }

        logger.info(
          `Successfully saved pending metadata updates of '${pendingMetadata.tags.title}'.`,
          { songPath }
        );
        sendMessageToRenderer({
          messageCode: 'PENDING_METADATA_UPDATES_SAVED',
          data: { title: pendingMetadata.tags.title }
        });
        dataUpdateEvent('songs/artworks');
        dataUpdateEvent('songs/updatedSong');
        dataUpdateEvent('artists');
        dataUpdateEvent('albums');
        dataUpdateEvent('genres');
        pendingMetadataUpdates.delete(songPath);
      } catch (error) {
        logger.error(`Failed to save pending metadata update of a song. `, { error, songPath });
      }

      try {
        const stats = statSync(songPath);
        if (stats?.mtime) {
          const modifiedDate = stats.mtime.getTime();
          if (isACurrentlyPlayingSong) return { modifiedDate };

          await updateSongModifiedAtByPath(songPath, new Date(modifiedDate));
          dataUpdateEvent('songs/updatedSong');
        }
      } catch (error) {
        logger.error(`FAILED TO GET SONG STATS AFTER UPDATING THE SONG WITH NEWER METADATA.`, {
          error
        });
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

    logger.warn(`Error occurred when fetching artwork from url.`, {
      status: res.status,
      statusText: res.statusText,
      url
    });

    return undefined;
  } catch (error) {
    logger.error('Error occurred when fetching artwork from url', { error, url });
    return undefined;
  }
};

export const generateLocalArtworkBuffer = (filePath: string) =>
  readFile(filePath).catch((err) => {
    logger.error(`Error occurred when trying to generate buffer of the song artwork.`, {
      err,
      filePath
    });
    return undefined;
  });

const generateArtworkBuffer = async (artworkPath?: string) => {
  if (artworkPath) {
    const isArtworkPathAWebURL = isPathAWebURL(artworkPath || '');

    if (isArtworkPathAWebURL) {
      const onlineArtworkBuffer = await fetchArtworkBufferFromURL(artworkPath).catch((err) => {
        return logger.warn(`Failed to fetch online artwork buffer newly added to the song.`, {
          err,
          artworkPath
        });
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
  artworkBuffer?: Buffer | void
): Promise<Picture | undefined> => {
  if (artworkPaths.isDefaultArtwork) return undefined;

  if (artworkBuffer) {
    const pngBuffer = await sharp(artworkBuffer).toFormat('png').toBuffer();

    if (pngBuffer) {
      const picture = Picture.fromData(ByteVector.fromByteArray(new Uint8Array(pngBuffer)));
      picture.mimeType = 'image/png';
      picture.type = PictureType.FrontCover;
      picture.description = 'artwork';
      return picture;
    }
  }
  return undefined;
};

/* DEPRECATED - Old function not used in new implementation
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
    logger.debug(`User created ${artistsWithoutIds.length} no of artists when updating a song.`, {
      artistsWithoutIds
    });
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
          logger.debug(
            `'${artists[i].name}' got removed because user removed the only link it has with a song.`,
            { artistId: artists[i].artistId }
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
          logger.warn(`Artist without an id found.`, { ARTIST_NAME: artist.name });
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
*/

/* DEPRECATED - Old function not used in new implementation
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
          logger.debug(
            `'${genres[i].name}' got removed because user removed the only link it has with a song.`,
            { genreId: genres[i].genreId }
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
          logger.warn(`Genre without an id found.`, { genreName: genre.name });
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
*/

/* DEPRECATED - Old function not used in new implementation
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
*/

/* DEPRECATED - Old function not used in new implementation
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
    logger.debug(`User changed the artwork of the song`, { songId });
    isArtworkChanged = true;
    // check whether song had an artwork before
    if (prevSongData.isArtworkAvailable) {
      // had an artwork before
      prevSongData.isArtworkAvailable = false;

      await removeArtwork(songPrevArtworkPaths).catch((err) => {
        logger.error(`Failed to remove the artwork of a song`, { err, songId });
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
*/

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
  prevSongData?: SavableSongData
) => {
  const parsedSyncedLyrics = tags.synchronizedLyrics
    ? parseLyrics(tags.synchronizedLyrics)
    : undefined;
  const parsedUnsyncedLyrics = tags.unsynchronizedLyrics
    ? parseLyrics(tags.unsynchronizedLyrics)
    : undefined;

  // For node-taglib-sharp, we only store unsynchronized lyrics in the tag
  // Synchronized lyrics will be saved to LRC file separately
  const lyricsText = parsedSyncedLyrics
    ? parsedSyncedLyrics.unparsedLyrics
    : parsedUnsyncedLyrics?.unparsedLyrics;

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
          cachedLyrics.lyrics.copyright = lyrics.copyright;
          cachedLyrics.source = 'IN_SONG_LYRICS';
          cachedLyrics.isOfflineLyricsAvailable = true;

          return cachedLyrics;
        }
      }
      return undefined;
    });
  }

  return {
    lyricsText,
    parsedSyncedLyrics,
    parsedUnsyncedLyrics
  };
};

const updateSongId3TagsOfUnknownSource = async (
  songPath: string,
  newSongTags: SongTags,
  sendUpdatedData: boolean
) => {
  const pathExt = path.extname(songPath).replace(/\W/, '');
  const isASupporedFormat = metadataEditingSupportedExtensions.includes(pathExt);

  if (!isASupporedFormat) {
    logger.warn(
      `Lyrics cannot be saved because current song extension (${pathExt}) is not supported for modifying metadata.`,
      { songPath }
    );
    return sendMessageToRenderer({
      messageCode: 'SONG_EXT_NOT_SUPPORTED_FOR_LYRICS_SAVES',
      data: { ext: pathExt }
    });
  }

  const songsOutsideLibraryData = getSongsOutsideLibraryData();

  for (const songOutsideLibraryData of songsOutsideLibraryData) {
    if (songOutsideLibraryData.path === songPath) {
      const songPathWithoutDefaultUrl = removeDefaultAppProtocolFromFilePath(songPath);

      const oldSongTags = await sendSongMetadata(songPath, false);

      // ?  /////////// ARTWORK DATA FOR SONGS FROM UNKNOWN SOURCES /////////////////

      const { artworkPath, artworkBuffer } = await manageArtworkUpdatesOfSongsFromUnknownSource(
        oldSongTags,
        newSongTags
      );
      songOutsideLibraryData.artworkPath = artworkPath;

      updateSongsOutsideLibraryData(songOutsideLibraryData.songId, songOutsideLibraryData);

      // ?  /////////// LYRICS DATA FOR SONGS FROM UNKNOWN SOURCES /////////////////
      const { lyricsText, parsedSyncedLyrics } = manageLyricsUpdates(newSongTags);

      // Create artwork Picture object if available
      let artworkPicture: Picture | undefined;
      if (artworkPath) {
        const artworkPathWithoutProtocol = removeDefaultAppProtocolFromFilePath(artworkPath);
        const artBuf = artworkBuffer || (await generateLocalArtworkBuffer(artworkPathWithoutProtocol));
        if (artBuf) {
          const pngBuffer = await sharp(artBuf).toFormat('png').toBuffer();
          artworkPicture = Picture.fromData(ByteVector.fromByteArray(new Uint8Array(pngBuffer)));
          artworkPicture.mimeType = 'image/png';
          artworkPicture.type = PictureType.FrontCover;
          artworkPicture.description = 'artwork';
        }
      }

      const tags: TagData = {
        title: newSongTags.title,
        artists: newSongTags.artists?.map((artist) => artist.name),
        album: newSongTags.albums?.[0]?.title,
        genres: newSongTags.genres?.map((genre) => genre.name),
        composer: newSongTags.composer,
        trackNumber: newSongTags.trackNumber,
        year: newSongTags.releasedYear,
        artwork: artworkPicture,
        lyrics: lyricsText
      };

      // Kept to be saved later
      addMetadataToPendingQueue({
        songPath: songPathWithoutDefaultUrl,
        tags,
        isKnownSource: false,
        sendUpdatedData
      });

      // Save synced lyrics to LRC file
      if (parsedSyncedLyrics) {
        saveLyricsToLRCFile(songPath, {
          title: newSongTags.title,
          source: 'IN_SONG_LYRICS',
          isOfflineLyricsAvailable: true,
          lyricsType: 'SYNCED',
          lyrics: parsedSyncedLyrics
        });
      }

      if (sendUpdatedData) {
        const updatedData: AudioPlayerData = {
          songId: songOutsideLibraryData.songId,
          title: newSongTags.title,
          artists: newSongTags.artists?.map((artist) => ({
            ...artist,
            artistId: artist.artistId || 0
          })),
          album: newSongTags.albums?.[0]
            ? {
                albumId: newSongTags.albums[0].albumId || 0,
                name: newSongTags.albums[0].title
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
  songIdOrPath: number | string,
  tags: SongTags,
  sendUpdatedData = false,
  isKnownSource = true
) => {
  const result: UpdateSongDataResult = { success: false };

  if (!isKnownSource) {
    try {
      const data = await updateSongId3TagsOfUnknownSource(songIdOrPath as string, tags, sendUpdatedData);
      if (data) result.updatedData = data;
      result.success = true;

      return result;
    } catch (error) {
      logger.error('Failed to update id3 tags of a song from unknown source.', {
        error,
        songIdOrPath,
        sendUpdatedData
      });
      return result;
    }
  }

  try {
    logger.debug(`Started the song data updating process for song '${songIdOrPath}'`);

    // Get song data by ID or path
    const song = typeof songIdOrPath === 'number' 
      ? await getSongById(songIdOrPath)
      : await getSongByPath(songIdOrPath);
    
    if (!song) {
      logger.error('Song not found in database', { songIdOrPath });
      throw new Error('Song not found in database');
    }

    const songId = song.id;
    let artworkBuffer: Buffer | undefined;
    let artwork: Picture | undefined;

    // Execute all updates in a database transaction
    await db.transaction(async (trx) => {
      // / / / / / SONG BASIC FIELDS / / / / / / /
      await updateSongBasicFields(
        songId,
        {
          title: tags.title,
          year: tags.releasedYear,
          trackNumber: tags.trackNumber
        },
        trx
      );

      // / / / / / SONG ARTWORK / / / / / / /
      const newArtworkPath = tags.artworkPath
        ? removeDefaultAppProtocolFromFilePath(tags.artworkPath)
        : undefined;

      if (newArtworkPath) {
        const buffer = await generateArtworkBuffer(newArtworkPath);
        artworkBuffer = buffer || undefined;
        
        if (artworkBuffer) {
          // Store artwork and generate palette
          await generatePalette(artworkBuffer);
          const artworkData = await storeArtworks('songs', artworkBuffer, trx);

          if (artworkData && artworkData.length > 0) {
            // Link artwork to song
            await linkArtworksToSong(
              artworkData.map((art) => ({ songId, artworkId: art.id })),
              trx
            );
          }

          artwork = await parseImgDataForNodeID3(
            getSongArtworkPath(songId, true),
            artworkBuffer
          );
        }
      }

      // / / / / / SONG ARTISTS / / / / / / /
      if (tags.artists) {
        // Get current artists linked to song
        const currentArtists = song.artists?.map((a) => a.artist) || [];
        const currentArtistIds = currentArtists.map((a) => a.id);

        // Separate new artists (without ID) from existing artists (with ID)
        const artistsWithoutIds = tags.artists.filter((artist) => !artist.artistId);
        const artistsWithIds = tags.artists.filter((artist) => artist.artistId);

        // Create new artists
        for (const artistData of artistsWithoutIds) {
          const existingArtist = await getArtistWithName(artistData.name, trx);
          
          if (existingArtist) {
            await linkSongToArtist(existingArtist.id, songId, trx);
          } else {
            const newArtist = await createArtist({ name: artistData.name }, trx);
            await linkSongToArtist(newArtist.id, songId, trx);
          }
        }

        // Handle existing artists - link newly linked ones
        const newlyLinkedArtistIds = artistsWithIds
          .filter((a) => !currentArtistIds.includes(Number(a.artistId)))
          .map((a) => Number(a.artistId));

        for (const artistId of newlyLinkedArtistIds) {
          await linkSongToArtist(artistId, songId, trx);
        }

        // Unlink removed artists
        const unlinkedArtistIds = currentArtistIds.filter(
          (id) => !artistsWithIds.some((a) => Number(a.artistId) === id)
        );

        for (const artistId of unlinkedArtistIds) {
          await unlinkSongFromArtist(artistId, songId, trx);

          // Check if artist should be deleted (no more songs)
          // Safe cascade pattern: Check for remaining songs before deletion
          // When artist is deleted, database CASCADE will automatically clean up:
          // - artistsSongs entries (already cleaned up above)
          // - albumsArtists entries
          // - artistsArtworks entries
          const artistSongIds = await getArtistSongIds(artistId, trx);
          if (artistSongIds.length === 0) {
            await deleteArtist(artistId, trx);
          }
        }
      }

      // / / / / / SONG ALBUM / / / / / /
      if (tags.albums && tags.albums.length > 0) {
        // Get current album
        const currentAlbum = song.albums?.[0]?.album;

        if (tags.albums[0].albumId) {
          // Link to existing album
          const albumId = Number(tags.albums[0].albumId);

          if (currentAlbum && currentAlbum.id !== albumId) {
            // Unlink from old album
            await unlinkSongFromAlbum(currentAlbum.id, songId, trx);

            // Check if old album should be deleted (no more songs)
            // Safe cascade pattern: Check for remaining songs before deletion
            // When album is deleted, database CASCADE will automatically clean up:
            // - albumsSongs entries (already cleaned up above)
            // - albumsArtists entries
            // - albumsArtworks entries
            const albumSongIds = await getAlbumSongIds(currentAlbum.id, trx);
            if (albumSongIds.length === 0) {
              await deleteAlbum(currentAlbum.id, trx);
            }
          }

          if (!currentAlbum || currentAlbum.id !== albumId) {
            await linkSongToAlbum(albumId, songId, trx);
          }
        } else {
          // Create new album
          const existingAlbum = await getAlbumWithTitle(tags.albums[0].title, trx);

          if (existingAlbum) {
            await linkSongToAlbum(existingAlbum.id, songId, trx);
          } else {
            const newAlbum = await createAlbum({ title: tags.albums[0].title }, trx);
            await linkSongToAlbum(newAlbum.id, songId, trx);
          }

          // Unlink from old album if it existed
          if (currentAlbum) {
            await unlinkSongFromAlbum(currentAlbum.id, songId, trx);

            // Safe cascade pattern: Verify no remaining songs before deletion
            const albumSongIds = await getAlbumSongIds(currentAlbum.id, trx);
            if (albumSongIds.length === 0) {
              await deleteAlbum(currentAlbum.id, trx);
            }
          }
        }
      } else if (song.albums && song.albums.length > 0) {
        // User removed the album
        const currentAlbum = song.albums[0].album;
        await unlinkSongFromAlbum(currentAlbum.id, songId, trx);

        // Safe cascade pattern: Verify no remaining songs before deletion
        const albumSongIds = await getAlbumSongIds(currentAlbum.id, trx);
        if (albumSongIds.length === 0) {
          await deleteAlbum(currentAlbum.id, trx);
        }
      }

      // / / / / / SONG GENRES / / / / / /
      if (tags.genres) {
        // Get current genres linked to song
        const currentGenres = song.genres?.map((g) => g.genre) || [];
        const currentGenreIds = currentGenres.map((g) => g.id);

        // Separate new genres from existing ones
        const genresWithoutIds = tags.genres.filter((genre) => !genre.genreId);
        const genresWithIds = tags.genres.filter((genre) => genre.genreId);

        // Create new genres
        for (const genreData of genresWithoutIds) {
          const existingGenre = await getGenreByName(genreData.name, trx);

          if (existingGenre) {
            await linkSongToGenre(existingGenre.id, songId, trx);
          } else {
            const newGenre = await createGenre({ name: genreData.name }, trx);
            await linkSongToGenre(newGenre.id, songId, trx);
          }
        }

        // Link newly linked genres
        const newlyLinkedGenreIds = genresWithIds
          .filter((g) => !currentGenreIds.includes(Number(g.genreId)))
          .map((g) => Number(g.genreId));

        for (const genreId of newlyLinkedGenreIds) {
          await linkSongToGenre(genreId, songId, trx);
        }

        // Unlink removed genres
        const unlinkedGenreIds = currentGenreIds.filter(
          (id) => !genresWithIds.some((g) => Number(g.genreId) === id)
        );

        for (const genreId of unlinkedGenreIds) {
          await unlinkSongFromGenre(genreId, songId, trx);

          // Check if genre should be deleted (no more songs)
          // Safe cascade pattern: Check for remaining songs before deletion
          // When genre is deleted, database CASCADE will automatically clean up:
          // - genresSongs entries (already cleaned up above)
          // - artworksGenres entries
          const genreSongIds = await getGenreSongIds(genreId, trx);
          if (genreSongIds.length === 0) {
            await deleteGenre(genreId, trx);
          }
        }
      }
    });

    // Transaction succeeded, now update the file system
    logger.debug('Database transaction completed successfully');

    // / / / / / SONG LYRICS / / / / / / /
    const { lyricsText, parsedSyncedLyrics } = manageLyricsUpdates(tags);

    // / / / / / SONG FILE UPDATE PROCESS / / / / / /
    const tagData: TagData = {
      title: tags.title,
      artists: tags.artists?.map((artist) => artist.name),
      album: tags.albums?.[0]?.title,
      genres: tags.genres?.map((genre) => genre.name),
      composer: tags.composer,
      trackNumber: tags.trackNumber,
      year: tags.releasedYear,
      artwork,
      lyrics: lyricsText
    };

    // Add to pending queue for file write
    const updatedData = await addMetadataToPendingQueue({
      songPath: song.path,
      tags: tagData,
      isKnownSource: true,
      sendUpdatedData
    });

    // Save synced lyrics to LRC file
    if (parsedSyncedLyrics) {
      saveLyricsToLRCFile(song.path, {
        title: tags.title,
        source: 'IN_SONG_LYRICS',
        isOfflineLyricsAvailable: true,
        lyricsType: 'SYNCED',
        lyrics: parsedSyncedLyrics
      });
    }

    if (updatedData && 'modifiedDate' in updatedData) {
      await updateSongModifiedAtByPath(song.path, new Date(updatedData.modifiedDate));
    }

    // Emit data update events
    dataUpdateEvent('songs/artworks', [songId]);
    dataUpdateEvent('songs/updatedSong', [songId]);
    dataUpdateEvent('artists');
    dataUpdateEvent('albums');
    dataUpdateEvent('genres');

    result.success = true;

    if (sendUpdatedData) {
      // Fetch updated song data for response
      const updatedSong = await getSongByPath(song.path);
      
      if (updatedSong) {
        const songArtists = updatedSong.artists?.map((a) => ({
          artistId: a.artist.id,
          name: a.artist.name,
          artworkPath: getArtistArtworkPath(undefined).artworkPath,
          onlineArtworkPaths: undefined
        })) || [];

        const data: AudioPlayerData = {
          songId: songId,
          title: updatedSong.title,
          artists: songArtists,
          album: updatedSong.albums?.[0]
            ? {
                albumId: updatedSong.albums[0].album.id,
                name: updatedSong.albums[0].album.title
              }
            : undefined,
          artwork: artworkBuffer ? Buffer.from(artworkBuffer).toString('base64') : undefined,
          artworkPath: getSongArtworkPath(songId, !!artworkBuffer).artworkPath,
          duration: parseFloat(updatedSong.duration),
          isAFavorite: updatedSong.isFavorite,
          isBlacklisted: isSongBlacklisted(songId, updatedSong.path),
          path: updatedSong.path,
          isKnownSource: true
        };
        result.updatedData = data;
      }
    }

    logger.debug(`Song data updated successfully`, { songId });
    return result;
  } catch (err: any) {
    if ('message' in err) {
      result.reason = err.message;
      sendMessageToRenderer({
        messageCode: 'METADATA_UPDATE_FAILED',
        data: { message: err.message }
      });
    }
    logger.error('Song metadata update failed.', { err });
    return result;
  }
};

export default updateSongId3Tags;
