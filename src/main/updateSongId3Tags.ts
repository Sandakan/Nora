/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
import NodeID3 from 'node-id3';
import path from 'path';
import { readFile } from 'fs/promises';
import {
  getAlbumsData,
  getArtistsData,
  getGenresData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setGenresData,
  setSongsData,
} from './filesystem';
import {
  getArtistArtworkPath,
  getSongArtworkPath,
  removeDefaultAppProtocolFromFilePath,
} from './fs/resolveFilePaths';
import log from './log';
import { dataUpdateEvent } from './main';
import { generateRandomId } from './utils/randomId';
import { removeSongArtwork, storeArtworks } from './other/artworks';
import generatePalette from './other/generatePalette';
import { updateCachedLyrics } from './core/getSongLyrics';
import parseLyrics from './utils/parseLyrics';
import convertParsedLyricsToNodeID3Format from './core/convertParsedLyricsToNodeID3Format';

const fetchArtworkBufferFromURL = async (url: string) => {
  try {
    const res = await fetch(url);
    return res.ok && res.body
      ? Buffer.from(await res.arrayBuffer())
      : undefined;
  } catch (error) {
    return undefined;
  }
};

const generateArtworkBuffer = async (artworkPath?: string) => {
  if (artworkPath) {
    const isArtworkPathAWebURL =
      /(^$|(http(s)?:\/\/)([\w-]+\.)+[\w-]+([\w- ;,./?%&=]*))/gm.test(
        artworkPath || ''
      );

    if (isArtworkPathAWebURL) {
      const onlineArtworkBuffer = await fetchArtworkBufferFromURL(
        artworkPath
      ).catch((err) =>
        log(
          `ERROR OCCURRED WHEN FETCHING ONLINE ARTWORK BUFFER, NEWLY ADDED TO THE SONG.`,
          { err },
          'ERROR'
        )
      );
      return onlineArtworkBuffer;
    }
    const localArtworkBuffer = await readFile(artworkPath).catch((err) =>
      log(
        `ERROR OCCURRED WHEN TRYING TO GENERATE BUFFER OF THE SONG ARTWORK.`,
        { err },
        'ERROR'
      )
    );
    return localArtworkBuffer;
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
    ? newSongData.artists.filter(
        (artist) => typeof artist.artistId !== 'string'
      )
    : [];
  // these artists are available in the library but may not be in the initial song data.
  const artistsWithIds = Array.isArray(newSongData.artists)
    ? newSongData.artists.filter(
        (artist) => typeof artist.artistId === 'string'
      )
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
      ? artistsWithIds.filter((a) =>
          prevSongData.artists?.some((b) => a.artistId === b.artistId)
        )
      : [];
  //  these artists are available in the library and recently linked to the song.
  const newlyLinkedArtists =
    artistsWithIds.length > 0 && Array.isArray(prevSongData.artists)
      ? artistsWithIds.filter(
          (a) => !prevSongData.artists?.some((b) => a.artistId === b.artistId)
        )
      : [];

  prevSongData.artists = [];

  if (artistsWithoutIds.length > 0) {
    log(
      `User created ${artistsWithoutIds.length} no of artists when updating a song.`
    );
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
        isAFavorite: false,
      };
      prevSongData?.artists.push({
        artistId: newArtist.artistId,
        name: artistData.name,
      });
      artists.push(newArtist);
    }
  }
  if (unlinkedArtists.length > 0) {
    for (let i = 0; i < artists.length; i += 1) {
      if (
        unlinkedArtists.some(
          (unlinkedArtist) => unlinkedArtist.artistId === artists[i].artistId
        )
      ) {
        if (
          artists[i].songs.length === 1 &&
          artists[i].songs[0].songId === prevSongData.songId
        ) {
          log(
            `'${artists[i].name}' got removed because user removed the only link it has with a song.`
          );
          artists.splice(i, 1);
        } else {
          artists[i].songs = artists[i].songs.filter(
            (s) => s.songId !== prevSongData.songId
          );
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
              songId: prevSongData.songId,
            });
          }
        }
      }
    }
    const availArtists = linkedArtists.concat(newlyLinkedArtists);
    prevSongData.artists.push(
      ...availArtists.map((artist) => {
        if (artist.artistId === undefined)
          log(
            `ARTIST WITHOUT AN ID FOUND.`,
            { ARTIST_NAME: artist.name },
            'ERROR'
          );
        return {
          artistId: artist.artistId as string,
          name: artist.name,
        };
      })
    );
  }
  return {
    updatedArtists: artists,
    artistsWithIds,
    artistsWithoutIds,
    unlinkedArtists,
    linkedArtists,
    newlyLinkedArtists,
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
      ? prevSongData.genres.filter(
          (a) => !genresWithIds?.some((b) => a.genreId === b.genreId)
        )
      : [];
  // these Genres are available in the library and already linked to the song.
  const linkedGenres =
    genresWithIds.length > 0 && Array.isArray(prevSongData.genres)
      ? genresWithIds.filter((a) =>
          prevSongData.genres?.some((b) => a.genreId === b.genreId)
        )
      : [];
  //  these Genres are available in the library and recently linked to the song.
  const newlyLinkedGenres =
    genresWithIds.length > 0 && Array.isArray(prevSongData.genres)
      ? genresWithIds.filter(
          (a) => !prevSongData.genres?.some((b) => a.genreId === b.genreId)
        )
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
        backgroundColor: prevSongData.palette?.DarkVibrant,
      };
      prevSongData.genres.push({
        genreId: newGenre.genreId,
        name: newGenre.name,
      });
      genres.push(newGenre);
    }
  }
  if (unlinkedGenres.length > 0) {
    for (let i = 0; i < genres.length; i += 1) {
      if (
        unlinkedGenres.some(
          (unlinkedGenre) => unlinkedGenre.genreId === genres[i].genreId
        )
      ) {
        if (
          genres[i].songs.length === 1 &&
          genres[i].songs[0].songId === songId
        ) {
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
          log(
            `GENRE WITHOUT AN ID FOUND.`,
            { GENRE_NAME: genre.name },
            'ERROR'
          );
        return { genreId: genre.genreId as string, name: genre.name };
      })
    );
  }
  return {
    updatedGenres: genres,
    updatedSongData: prevSongData,
    genresWithIds,
    genresWithoutIds,
    newlyLinkedGenres,
    linkedGenres,
    unlinkedGenres,
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
        for (let c = 0; c < albums.length; c += 1) {
          if (albums[c].albumId === prevSongData.album?.albumId) {
            albums[c].songs = albums[c].songs.filter(
              (z) => z.songId !== songId
            );
          }
          if (albums[c].albumId === newSongData.album.albumId) {
            albums[c].artists = prevSongData.artists;
            albums[c].songs.push({ title: prevSongData.title, songId });
            prevSongData.album = {
              name: albums[c].title,
              albumId: albums[c].albumId,
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
        artists: prevSongData.artists,
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
        if (
          albums[c].songs.length === 1 &&
          albums[c].songs[0].songId === songId
        ) {
          albums.splice(c, 1);
        } else {
          albums[c].songs = albums[c].songs.filter(
            (d) => d.songId !== prevSongData.songId
          );
        }
        prevSongData.album = undefined;
      }
    }
  }
  // song didn't have any album before
  return { updatedAlbums: albums, updatedSongData: prevSongData };
};

const manageArtworkUpdates = async (
  prevSongData: SavableSongData,
  newSongData: SongTags
) => {
  const { songId } = prevSongData;
  const artworkPath = newSongData.artworkPath
    ? removeDefaultAppProtocolFromFilePath(newSongData.artworkPath)
    : undefined;

  const artworkBuffer = await generateArtworkBuffer(artworkPath);

  const songPrevArtworkPaths = getSongArtworkPath(
    prevSongData.songId,
    prevSongData.isArtworkAvailable
  );

  if (songPrevArtworkPaths.artworkPath !== newSongData.artworkPath) {
    log(`User changed the artwork of the song '${songId}'`);
    // check whether song had an artwork before
    if (prevSongData.isArtworkAvailable) {
      // had an artwork before
      prevSongData.isArtworkAvailable = false;

      await removeSongArtwork(songPrevArtworkPaths).catch((err) =>
        log(
          `ERROR OCCURRED WHEN TRYING TO REMOVE SONG ARTWORK OF '${songId}'.`,
          { err },
          'ERROR'
        )
      );
    }
    if (artworkBuffer) {
      const palette = await generatePalette(artworkBuffer);

      const artworkPaths = await storeArtworks(songId, 'songs', artworkBuffer);
      if (artworkPaths) {
        prevSongData.isArtworkAvailable = !artworkPaths.isDefaultArtwork;
      }

      if (palette && palette.DarkVibrant && palette.LightVibrant) {
        prevSongData.palette = {
          DarkVibrant: palette.DarkVibrant,
          LightVibrant: palette.LightVibrant,
        };
      } else prevSongData.palette = undefined;
    }
  }
  return { songPrevArtworkPaths, artworkBuffer, updatedSongData: prevSongData };
};

const updateSongId3Tags = async (
  songId: string,
  tags: SongTags,
  sendUpdatedData = false
) => {
  const songs = getSongsData();
  let artists = getArtistsData();
  let albums = getAlbumsData();
  let genres = getGenresData();

  const result: UpdateSongDataResult = { success: false };

  if (Array.isArray(songs) && songs.length > 0) {
    for (let x = 0; x < songs.length; x += 1) {
      if (songs[x].songId === songId) {
        log(`Started the song data updating procees of the song '${songId}'`);
        let song = songs[x];

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
        const updatedAlbumData = manageAlbumDataUpdates(
          albums,
          song,
          tags,
          songPrevArtworkPaths
        );
        albums = updatedAlbumData.updatedAlbums;
        song = updatedAlbumData.updatedSongData;

        // / / / / / / / SONG GENRES / / / / / / /

        const updatedGenreData = manageGenreDataUpdates(
          genres,
          song,
          tags,
          songPrevArtworkPaths
        );
        genres = updatedGenreData.updatedGenres;
        song = updatedGenreData.updatedSongData;

        // / / / / / / / SONG LYRICS / / / / / / /

        const parsedLyrics = tags.lyrics ? parseLyrics(tags.lyrics) : undefined;

        const unsynchronisedLyrics =
          parsedLyrics && !parsedLyrics.isSynced
            ? { language: 'ENG', text: parsedLyrics.unparsedLyrics }
            : undefined;

        const synchronisedLyrics =
          convertParsedLyricsToNodeID3Format(parsedLyrics);

        if (parsedLyrics) {
          updateCachedLyrics((cachedLyrics) => {
            if (cachedLyrics && tags.lyrics) {
              const { title } = cachedLyrics;
              if (title === tags.title || title === song.title) {
                const { isSynced } = parsedLyrics;
                const lyricsType: LyricsTypes = isSynced ? 'SYNCED' : 'ANY';

                cachedLyrics.lyrics = parsedLyrics;
                cachedLyrics.lyricsType = lyricsType;
                cachedLyrics.copyright = parsedLyrics.copyright;
                return cachedLyrics;
              }
            }
            return undefined;
          });
        }

        // / / / / / SONG FILE UPDATE PROCESS AND UPDATE FINALIZATION / / / / / /
        const artworkPaths = getSongArtworkPath(
          song.songId,
          song.isArtworkAvailable,
          true
        );

        const id3Tags: NodeID3.Tags = {
          title: tags.title,
          artist: tags.artists?.map((artist) => artist.name).join(', '),
          album: tags.album?.title,
          genre: tags.genres?.map((genre) => genre.name).join(', '),
          composer: tags.composer,
          year: tags.releasedYear ? `${tags.releasedYear}` : undefined,
          image: removeDefaultAppProtocolFromFilePath(artworkPaths.artworkPath),
          unsynchronisedLyrics,
          synchronisedLyrics,
        };

        songs[x] = song;
        setSongsData(songs);
        setArtistsData(artists);
        setAlbumsData(albums);
        setGenresData(genres);

        await NodeID3.Promise.update(id3Tags, song.path).catch((err) => {
          log(
            `FAILED TO UPDATE THE SONG FILE WITH THE NEW UPDATES. `,
            { err },
            'ERROR'
          );
          throw err;
        });

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
              onlineArtworkPaths: z.onlineArtworkPaths,
            }));
          const data: AudioPlayerData = {
            songId,
            title: song.title,
            artists: songArtists,
            album: song.album,
            artwork: artworkBuffer
              ? Buffer.from(artworkBuffer).toString('base64')
              : undefined,
            artworkPath: artworkPaths.artworkPath,
            duration: song.duration,
            isAFavorite: song.isAFavorite,
            path: song.path,
            isKnownSource: true,
          };
          result.updatedData = data;
        }
        log(`'${id3Tags.title}' song data update successfull.`);
        return result;
      }
    }
    return result;
  }
  log('FAILED TO UPDATE SONGSDATA. SONGS ARRAY IS EMPTY.', undefined, 'ERROR');
  throw new Error(
    'Called songDataUpdatedFunction without data in the songs array.'
  );
};

export default updateSongId3Tags;
