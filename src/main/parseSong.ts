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
import { logger } from './logger';
import { getData, setData, storeSongArtworks } from './filesystem';
import { getAssetPath, sendMessageToRenderer } from './main';

const defaultSongCoverImgBuffer = async () =>
  await fs
    .readFile(getAssetPath('images', 'song_cover_default.png'))
    .then((res) => res)
    .catch((err) => logger(err));

export const parseSong = (
  absoluteFilePath: string
): Promise<SongData | undefined> => {
  return new Promise(async (resolve, reject) => {
    const data = await getData();
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
              return logger(err);
            })
        : undefined;

      const songInfo: SongData = {
        title: songTitle,
        artists: metadata.common.artists
          ? metadata.common.artists.length === 1
            ? metadata.common.artists[0].split(',').map((x) => x.trim())
            : metadata.common.artists
          : [],
        duration: metadata.format.duration || 0,
        sampleRate: metadata.format.sampleRate,
        album: metadata.common.album || 'Single',
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
            if (isAlbumAvailable(data.albums, metadata.common.album)) {
              const allAlbums = data.albums.map((album) => {
                if (
                  metadata.common.album &&
                  metadata.common.album === album.title
                ) {
                  album.songs.push({
                    title: songInfo.title,
                    songId: songInfo.songId,
                  });
                  songInfo.albumId = album.albumId;
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
              songInfo.albumId = newAlbum.albumId;
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
            for (const newArtist of songInfo.artists) {
              if (isArtistAvailable(data.artists, newArtist)) {
                let z = result.filter((val) => val.name === newArtist);
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
                  .filter((val) => val.name !== newArtist)
                  .concat(z);
              } else {
                const artist = {
                  name: newArtist,
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
      songInfo.artistsId = relevantArtists.map(
        (newArtist) => newArtist.artistId
      );

      data.songs.push(songInfo);
      setData({
        songs: data.songs,
        artists: allArtists,
        albums: allAlbums,
      })
        .then(() => {
          sendMessageToRenderer(`'${songTitle}' song added to the library.`);
          resolve(songInfo);
        })
        .catch((err) => reject(err));
    }
    resolve(undefined);
  });
};

const isAlbumAvailable = (albums: Album[], title: string) => {
  for (const album of albums) {
    if (album.title === title) return true;
  }
  return false;
};

const addNewAlbum = (albums: Album[], options: Album) => {
  albums.push(options);
  return { allAlbums: albums, newAlbum: options };
};

const isArtistAvailable = (artists: Artist[], name: string) => {
  for (const artist of artists) {
    if (artist.name === name) return true;
  }
  return false;
};
