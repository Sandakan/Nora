/* eslint-disable promise/no-nesting */
/* eslint-disable no-console */
/* eslint-disable no-nested-ternary */
/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-cycle */
/* eslint-disable import/newline-after-import */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable no-async-promise-executor */
/* eslint-disable @typescript-eslint/return-await */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable promise/always-return */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-else-return */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import * as musicMetaData from 'music-metadata';
import nodeVibrant from 'node-vibrant';

import path from 'path';
import fs from 'fs/promises';

import sharp from 'sharp';
import { generateRandomId } from './randomId';
import log from './log';
import { getData, setData, storeSongArtworks } from './filesystem';
import { dataUpdateEvent, getAssetPath, sendMessageToRenderer } from './main';

const defaultSongCoverImgBuffer = async () =>
  await fs
    .readFile(getAssetPath('images', 'song_cover_default.png'))
    .then((res) => res)
    .catch((err) =>
      log(
        `====== ERROR OCCURRED WHEN READING A FILE OF NAME 'song_cover_default.png'. ======\nERROR : ${err}`
      )
    );

export const parseSong = (
  absoluteFilePath: string
): Promise<SongData | undefined> => {
  return new Promise(async (resolve, reject) => {
    // log(`Starting the parsing process of song of path '${absoluteFilePath}'.`);
    const data = getData();
    const stats = await fs.stat(absoluteFilePath).catch((err) => reject(err));
    const metadata = await musicMetaData
      .parseFile(absoluteFilePath)
      .catch((err) => reject(err));
    if (
      data &&
      metadata &&
      Object.keys(data).length !== 0 &&
      !data.songs.some((song) => song.path === absoluteFilePath)
    ) {
      const songTitle =
        metadata.common.title ||
        path.basename(absoluteFilePath).split('.')[0] ||
        'Unknown Title';
      const songId = generateRandomId();
      const coverBuffer = metadata.common.picture
        ? metadata.common.picture[0].format === 'image/webp'
          ? await sharp(metadata.common.picture[0].data).png().toBuffer()
          : metadata.common.picture[0].data
        : await defaultSongCoverImgBuffer();
      const songCoverPath = metadata.common.picture
        ? (await storeSongArtworks(metadata.common.picture, songId).catch(
            (err) => reject(err)
          )) || getAssetPath('images', 'song_cover_default.png')
        : getAssetPath('images', 'song_cover_default.png');
      const palette = coverBuffer
        ? await nodeVibrant
            .from(coverBuffer)
            .getPalette()
            .catch((err) => {
              reject(err);
              return log(
                `====== ERROR OCCURRED WHEN PARSING A SONG ARTWORK TO GET A COLOR PALETTE. ======\nERROR : ${err}`
              );
            })
        : undefined;

      if (metadata.common.lyrics)
        console.log(metadata.common.title, metadata.common.lyrics);

      const songInfo: SongData = {
        title: songTitle,
        artists: metadata.common.artists
          ? metadata.common.artists[0].split(',').map((x) => {
              return { name: x.trim(), artistId: '' };
            })
          : undefined,
        duration: metadata.format.duration || 0,
        sampleRate: metadata.format.sampleRate,
        album: metadata.common.album
          ? { name: metadata.common.album, albumId: '' }
          : undefined,
        genres: [],
        albumArtist: metadata.common.albumartist || undefined,
        track: metadata.common.track,
        year: metadata.common.year,
        format: metadata.format,
        path: absoluteFilePath,
        artworkPath: songCoverPath,
        palette: palette
          ? {
              DarkVibrant: { rgb: palette.DarkVibrant?.rgb },
              LightVibrant: { rgb: palette.LightVibrant?.rgb },
            }
          : undefined,
        songId,
        isAFavorite: false,
        addedDate: `${new Date()}`,
        createdDate: stats ? `${stats.birthtime}` : undefined,
        modifiedDate: stats ? `${stats.mtime}` : undefined,
        folderInfo: {
          name: path.basename(path.dirname(absoluteFilePath)),
          path: path.dirname(absoluteFilePath),
        },
        listeningRate: {
          allTime: 0,
          monthly: {
            year: new Date().getFullYear(),
            months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          },
        },
      };

      const manageAlbums = () => {
        const relevantAlbums: Album[] = [];
        if (metadata.common.album) {
          if (
            data &&
            Object.keys(data).length !== 0 &&
            Array.isArray(data.albums)
          ) {
            if (data.albums.some((a) => a.title === metadata.common.album)) {
              const allAlbums = data.albums.map((album) => {
                if (
                  metadata.common.album &&
                  metadata.common.album === album.title
                ) {
                  album.songs.push({
                    title: songInfo.title,
                    songId: songInfo.songId,
                  });
                  relevantAlbums.push(album);
                  return album;
                } else return album;
              });
              return { allAlbums, relevantAlbums, newAlbums: [] };
            } else {
              const { allAlbums, newAlbum } = addNewAlbum(data.albums, {
                title: metadata.common.album,
                artworkPath: songInfo.artworkPath,
                year: metadata.common.year || undefined,
                albumId: generateRandomId(),
                artists: songInfo.artists,
                songs: [
                  {
                    songId: songInfo.songId,
                    title: songInfo.title,
                  },
                ],
              });
              if (songInfo.album) songInfo.album.albumId = newAlbum.albumId;
              relevantAlbums.push(newAlbum);
              return {
                allAlbums,
                relevantAlbums,
                newAlbums: newAlbum,
              };
            }
          } else return { allAlbums: [], relevantAlbums, newAlbums: [] };
        } else
          return {
            allAlbums: data.albums || [],
            relevantAlbums: [],
            newAlbums: [],
          };
      };

      const { allAlbums, relevantAlbums } = manageAlbums();

      const manageArtists = () => {
        let result = data.artists;
        const newArtists: Artist[] = [];
        const relevantArtists: Artist[] = [];
        if (Array.isArray(result)) {
          if (songInfo.artists && songInfo.artists.length > 0) {
            for (let x = 0; x < songInfo.artists.length; x += 1) {
              const newArtist = songInfo.artists[x];
              if (
                data.artists.some((artist) => artist.name === newArtist.name)
              ) {
                let z = result.filter((val) => val.name === newArtist.name);
                z = z.map((artist) => {
                  artist.songs.push({
                    title: songInfo.title,
                    songId: songInfo.songId,
                  });
                  if (relevantAlbums.length > 0) {
                    relevantAlbums.forEach((relevantAlbum) =>
                      artist.albums.push({
                        title: relevantAlbum.title,
                        albumId: relevantAlbum.albumId,
                      })
                    );
                  }
                  relevantArtists.push(artist);
                  return artist;
                });
                result = result
                  .filter((val) => val.name !== newArtist.name)
                  .concat(z);
              } else {
                const artist = {
                  name: newArtist.name,
                  artistId: generateRandomId(),
                  songs: [
                    {
                      songId: songInfo.songId,
                      title: songInfo.title,
                    },
                  ],
                  artworkPath: songInfo.artworkPath || undefined,
                  albums:
                    relevantAlbums.length > 0
                      ? [
                          {
                            title: relevantAlbums[0].title,
                            albumId: relevantAlbums[0].albumId,
                          },
                        ]
                      : [],
                };
                relevantArtists.push(artist);
                result.push(artist);
              }
            }
            return { allArtists: result, newArtists, relevantArtists };
          } else return { allArtists: result, newArtists, relevantArtists };
        } else return { allArtists: [], newArtists, relevantArtists };
      };
      const { allArtists, relevantArtists } = manageArtists();

      if (songInfo.artists) {
        for (let x = 0; x < relevantArtists.length; x += 1) {
          for (let y = 0; y < songInfo.artists.length; y += 1) {
            if (relevantArtists[x].name === songInfo.artists[y].name)
              songInfo.artists[y].artistId = relevantArtists[x].artistId;
          }
        }
      }

      const manageGenres = () => {
        const newGenres: Genre[] = [];
        const relevantGenres: Genre[] = [];
        let { genres } = data;
        if (
          Array.isArray(metadata.common.genre) &&
          metadata.common.genre.length > 0 &&
          Array.isArray(genres)
        ) {
          for (let x = 0; x < metadata.common.genre.length; x += 1) {
            const songGenre = metadata.common.genre[x];
            if (genres.some((x) => x.name === songGenre)) {
              let y = genres.filter((genre) => genre.name === songGenre);
              y = y.map((y) => {
                y.artworkPath = songInfo.artworkPath;
                y.backgroundColor = songInfo.palette?.DarkVibrant;
                y.songs.push({
                  songId: songInfo.songId,
                  title: songInfo.title,
                });
                relevantGenres.push(y);
                return y;
              });
              genres = genres
                .filter((genre) => genre.name !== songGenre)
                .concat(y);
            } else {
              const newGenre: Genre = {
                name: songGenre,
                genreId: generateRandomId(),
                songs: [
                  {
                    songId: songInfo.songId,
                    title: songInfo.title,
                  },
                ],
                artworkPath: songInfo.artworkPath,
                backgroundColor: songInfo.palette?.DarkVibrant,
              };
              relevantGenres.push(newGenre);
              newGenres.push(newGenre);
              genres.push(newGenre);
            }
          }
          return { allGenres: genres, newGenres, relevantGenres };
        } else return { allGenres: genres || [], newGenres, relevantGenres };
      };

      const { allGenres, relevantGenres } = manageGenres();

      songInfo.genres = relevantGenres.map((genre) => {
        return { name: genre.name, genreId: genre.genreId };
      });

      data.songs.push(songInfo);
      log(
        `Finished the parsing process of song with name '${songInfo.title}'. Updated ${relevantArtists.length} no of artists, ${relevantAlbums.length} no of albums, ${relevantGenres.length} no of genres in the process of parsing song.`
      );
      setData({
        songs: data.songs,
        artists: allArtists,
        albums: allAlbums,
        genres: allGenres,
      });
      dataUpdateEvent('songs/newSong');
      sendMessageToRenderer(`'${songTitle}' song added to the library.`);
      return resolve(songInfo);
    }
    resolve(undefined);
  });
};

const addNewAlbum = (albums: Album[], options: Album) => {
  albums.push(options);
  return { allAlbums: albums, newAlbum: options };
};
