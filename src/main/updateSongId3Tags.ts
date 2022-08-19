/* eslint-disable import/no-cycle */
import NodeID3 from 'node-id3';
import nodeVibrant from 'node-vibrant';
import {
  getData,
  removeSongArtwork,
  setData,
  storeSongArtworks,
} from './filesystem';
import log from './log';
import { dataUpdateEvent } from './main';
import { generateRandomId } from './randomId';

export const updateSongId3Tags = (songId: string, tags: SongTags) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const data = getData();
    const { songs, artists, albums, genres } = data;
    if (data && Array.isArray(songs) && songs.length > 0) {
      for (let x = 0; x < songs.length; x += 1) {
        if (songs[x].songId === songId) {
          log(`Started the song data updating procees of the song '${songId}'`);
          const song = songs[x];
          // / / / / / SONG TITLE / / / / / / /
          song.title = tags.title;
          // / / / / / SONG YEAR / / / / / / /
          song.year = tags.releasedYear;
          // / / / / / SONG ARTWORK / / / / / / /
          if (song.artworkPath !== tags.artworkPath) {
            log(`User changed the artwork of the song '${songId}'`);
            if (!song.artworkPath.includes('song_cover_default')) {
              // eslint-disable-next-line no-await-in-loop
              await removeSongArtwork(song.artworkPath).catch((err) =>
                log(
                  `===== ERROR OCCURRED WHEN TRYING TO REMOVE SONG ARTWORK OF '${songId}'. ======\nERROR : ${err}`
                )
              );
            }
            // eslint-disable-next-line no-await-in-loop
            const palette = await nodeVibrant
              .from(tags.artworkPath)
              .getPalette()
              .catch((err) => {
                reject(err);
                return log(
                  `====== ERROR OCCURRED WHEN PARSING A SONG ARTWORK TO GET A COLOR PALETTE. ======\nERROR : ${err}`
                );
              });
            // eslint-disable-next-line no-await-in-loop
            const songArtworkPath = await storeSongArtworks(
              songId,
              tags.artworkPath
            );
            song.artworkPath = songArtworkPath;
            if (palette) {
              song.palette = {
                DarkVibrant: { rgb: palette.DarkVibrant?.rgb },
                LightVibrant: { rgb: palette.LightVibrant?.rgb },
              };
            } else song.palette = undefined;
          }
          // / / / / / SONG ARTISTS / / / / / / /
          // these artists should be created as new artists.
          const artistsWithoutIds = Array.isArray(tags.artists)
            ? tags.artists.filter(
                (artist) => typeof artist.artistId !== 'string'
              )
            : [];
          // these artists are available in the library but may not be in the initial song data.
          const artistsWithIds = Array.isArray(tags.artists)
            ? tags.artists.filter(
                (artist) => typeof artist.artistId === 'string'
              )
            : [];
          //  these artists are available in the library and recently unlinked from the song.
          const unlinkedArtists =
            // eslint-disable-next-line no-nested-ternary
            Array.isArray(artistsWithIds) && Array.isArray(song.artists)
              ? song.artists.length > 0 && artistsWithIds.length === 0
                ? song.artists
                : song.artists.filter(
                    (a) =>
                      !artistsWithIds?.some((b) => a.artistId === b.artistId)
                  )
              : [];
          // these artists are available in the library and already linked to the song.
          const linkedArtists =
            artistsWithIds.length > 0 && Array.isArray(song.artists)
              ? artistsWithIds.filter((a) =>
                  song.artists?.some((b) => a.artistId === b.artistId)
                )
              : [];
          //  these artists are available in the library and recently linked to the song.
          const newlyLinkedArtists =
            artistsWithIds.length > 0 && Array.isArray(song.artists)
              ? artistsWithIds.filter(
                  (a) => !song.artists?.some((b) => a.artistId === b.artistId)
                )
              : [];

          song.artists = [];
          if (artistsWithoutIds.length > 0) {
            log(
              `User created ${artistsWithoutIds.length} no of artists when updating a song.`
            );
            for (let e = 0; e < artistsWithoutIds.length; e += 1) {
              const artistData = artistsWithoutIds[e];
              const newArtist: Artist = {
                artistId: generateRandomId(),
                name: artistData.name,
                songs: [{ songId, title: song.title }],
                artworkPath: song.artworkPath ?? artistData.artworkPath,
              };
              song.artists.push({
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
                  (unlinkedArtist) =>
                    unlinkedArtist.artistId === artists[i].artistId
                )
              ) {
                if (
                  artists[i].songs.length === 1 &&
                  artists[i].songs[0].songId === songId
                ) {
                  log(
                    `'${artists[i].name}' got removed because user removed the only link it has with a song.`
                  );
                  artists.splice(i, 1);
                } else {
                  artists[i].songs = artists[i].songs.filter(
                    (s) => s.songId !== songId
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
                    artists[p].songs.push({ title: song.title, songId });
                  }
                }
              }
            }
            const availArtists = linkedArtists.concat(newlyLinkedArtists);
            song.artists.push(
              ...availArtists.map((artist) => {
                if (artist.artistId === undefined)
                  log(
                    `====== GENRE WITHOUT AN ID FOUND. =======\nGENRE NAME:${artist.name}`
                  );
                return {
                  artistId: artist.artistId as string,
                  name: artist.name,
                };
              })
            );
          }

          // / / / / / / / / SONG ALBUM / / / / / /
          if (tags.album) {
            // album is newly created or available in the library.
            if (tags.album.albumId) {
              // album in the song is available in the library.
              if (song.album?.albumId !== tags.album.albumId) {
                // song album changed to some other album in the library.
                for (let c = 0; c < albums.length; c += 1) {
                  if (albums[c].albumId === song.album?.albumId) {
                    albums[c].songs = albums[c].songs.filter(
                      (z) => z.songId !== songId
                    );
                  }
                  if (albums[c].albumId === tags.album.albumId) {
                    albums[c].artists = song.artists;
                    albums[c].songs.push({ title: song.title, songId });
                    song.album = {
                      name: albums[c].title,
                      albumId: albums[c].albumId,
                    };
                  }
                }
              }
              // else {}
              // song album haven't changed.
            } else {
              // user created a new album for the song.
              for (let c = 0; c < albums.length; c += 1) {
                if (albums[c].albumId === song.album?.albumId) {
                  albums[c].songs = albums[c].songs.filter(
                    (z) => z.songId !== songId
                  );
                }
              }
              const newAlbum: Album = {
                albumId: generateRandomId(),
                title: tags.album.title,
                songs: [{ title: tags.title, songId }],
                artworkPath: song.artworkPath,
                artists: song.artists,
              };
              song.album = { albumId: newAlbum.albumId, name: newAlbum.title };
              albums.push(newAlbum);
            }
          } else {
            // this means the song has no album or user deleted the previous album.
            // eslint-disable-next-line no-lonely-if
            if (song.album?.albumId) {
              // song previously had an album but the user removed it.
              for (let c = 0; c < albums.length; c += 1) {
                if (albums[c].albumId === song.album?.albumId) {
                  if (
                    albums[c].songs.length === 1 &&
                    albums[c].songs[0].songId === songId
                  ) {
                    albums.splice(c, 1);
                  } else {
                    albums[c].songs = albums[c].songs.filter(
                      (d) => d.songId !== song.songId
                    );
                  }
                  song.album = undefined;
                }
              }
            } else {
              // song didn't have any album before
            }
          }

          // / / / / / / / SONG GENRES / / / / / / /

          // these genres should be created as new genres.
          const genresWithoutIds = Array.isArray(tags.genres)
            ? tags.genres.filter((genre) => typeof genre.genreId !== 'string')
            : [];
          // these genres are available in the library but may not be in the initial song data.
          const genresWithIds = Array.isArray(tags.genres)
            ? tags.genres.filter((genre) => typeof genre.genreId === 'string')
            : [];
          //  these genres are available in the library and recently unlinked from the song.
          const unlinkedGenres =
            genresWithIds.length > 0 && Array.isArray(song.genres)
              ? song.genres.filter(
                  (a) => !genresWithIds?.some((b) => a.genreId === b.genreId)
                )
              : [];
          // these Genres are available in the library and already linked to the song.
          const linkedGenres =
            genresWithIds.length > 0 && Array.isArray(song.genres)
              ? genresWithIds.filter((a) =>
                  song.genres?.some((b) => a.genreId === b.genreId)
                )
              : [];
          //  these Genres are available in the library and recently linked to the song.
          const newlyLinkedGenres =
            genresWithIds.length > 0 && Array.isArray(song.genres)
              ? genresWithIds.filter(
                  (a) => !song.genres?.some((b) => a.genreId === b.genreId)
                )
              : [];

          song.genres = [];
          if (genresWithoutIds.length > 0) {
            for (let int = 0; int < genresWithoutIds.length; int += 1) {
              const genreData = genresWithoutIds[int];
              const newGenre: Genre = {
                genreId: generateRandomId(),
                name: genreData.name,
                songs: [{ title: song.title, songId }],
                artworkPath: genreData.artworkPath ?? song.artworkPath,
                backgroundColor: song.palette?.DarkVibrant,
              };
              song.genres.push({
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
                  genres[i].songs = genres[i].songs.filter(
                    (s) => s.songId !== songId
                  );
                }
              }
            }
          }
          if (linkedGenres.length > 0 || newlyLinkedGenres.length > 0) {
            if (newlyLinkedGenres.length > 0) {
              for (let p = 0; p < genres.length; p += 1) {
                for (let q = 0; q < newlyLinkedGenres.length; q += 1) {
                  if (genres[p].genreId === newlyLinkedGenres[q].genreId) {
                    genres[p].songs.push({ title: song.title, songId });
                  }
                }
              }
            }
            const availGenres = linkedGenres.concat(newlyLinkedGenres);
            song.genres.push(
              ...availGenres.map((genre) => {
                if (genre.genreId === undefined)
                  log(
                    `====== GENRE WITHOUT AN ID FOUND. =======\nGENRE NAME:${genre.name}`
                  );
                return { genreId: genre.genreId as string, name: genre.name };
              })
            );
          }
          // / / / / / SONG FILE UPDATE PROCESS AND UPDATE FINALIZATION / / / / / /
          const id3Tags: NodeID3.Tags = {
            title: tags.title,
            artist: tags.artists?.map((artist) => artist.name).join(', '),
            album: tags.album?.title,
            genre: tags.genres?.map((genre) => genre.name).join(', '),
            composer: tags.composer,
            year: tags.releasedYear ? `${tags.releasedYear}` : undefined,
            unsynchronisedLyrics: tags.lyrics
              ? { language: 'UNKNOWN', text: tags.lyrics }
              : undefined,
            image: tags?.artworkPath,
          };

          songs[x] = song;
          setData({ songs, artists, albums, genres });
          // eslint-disable-next-line no-await-in-loop
          await NodeID3.Promise.update(id3Tags, song.path).catch((err) => {
            log(
              `====== FAILED TO UPDATE THE SONG FILE WITH THE NEW UPDATES. =======\n ERROR : ${err}`
            );
            reject(err);
          });

          dataUpdateEvent('songs/artworks', songId);
          dataUpdateEvent('songs/updatedSong', songId);
          dataUpdateEvent('artists');
          dataUpdateEvent('albums');
          dataUpdateEvent('genres');

          resolve(true);
          log(`'${id3Tags.title}' song data update successfull.`);
          break;
        }
      }
    } else {
      log('====== FAILED TO UPDATE SONGSDATA. SONGS ARRAY IS EMPTY. ======');
      reject(
        new Error(
          'Called songDataUpdatedFunction without data in the songs array.'
        )
      );
    }
  });
};

export const getSongId3Tags = (songPath: string) =>
  NodeID3.Promise.read(songPath, { noRaw: true });
