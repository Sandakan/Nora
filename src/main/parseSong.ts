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

import { generateRandomId } from './randomId';
import { logger } from './logger';
import { getData, setData, storeSongArtworks } from './filesystem';

const defaultSongCoverImgBuffer = async () =>
  await fs
    .readFile(
      path.join(__dirname, 'public', 'images', 'song_cover_default.png')
    )
    .then((res) => res);

export const parseSong = async (absoluteFilePath: string) => {
  const data = await getData();
  const stats = await fs
    .stat(absoluteFilePath)
    .catch((err) => console.log(err));

  if (data && Object.keys(data).length !== 0) {
    return musicMetaData
      .parseFile(absoluteFilePath)
      .then(async (metadata) => {
        const songTitle =
          metadata.common.title ||
          path.basename(absoluteFilePath).split('.')[0] ||
          'Unknown Title';
        const songId = generateRandomId();
        const coverBuffer = metadata.common.picture
          ? metadata.common.picture[0].data
          : await defaultSongCoverImgBuffer();
        const songCoverPath = metadata.common.picture
          ? await storeSongArtworks(metadata.common.picture, songId)
          : path.join(__dirname, 'public', 'images', 'song_cover_default.png');
        const palette = await nodeVibrant
          .from(coverBuffer)
          .getPalette()
          .then(
            (palette) => palette,
            (err) => {
              logger(err);
              return undefined;
            }
          );

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

        // const albums = metadata.common.album
        // 	? Array.isArray(data.albums)
        // 		? isAlbumAvailable(data.albums, metadata.common.album)
        // 			? data.albums.map((album) => {
        // 					if (metadata.common.album && metadata.common.album === album.title) {
        // 						album.songs.push({
        // 							title: songInfo.title,
        // 							songId: songInfo.songId,
        // 						});
        // 						songInfo.albumId = album.albumId;
        // 						return album;
        // 					} else return album;
        // 			  })
        // 			: addNewAlbum(data.albums, {
        // 					title: metadata.common.album,
        // 					artworkPath: songInfo.artworkPath,
        // 					year: metadata.common.year || undefined,
        // 					albumId: generateRandomId(),
        // 					artists: songInfo.artists,
        // 					songs: [
        // 						{
        // 							songId: songInfo.songId,
        // 							title: songInfo.title,
        // 						},
        // 					],
        // 			  }).allAlbums
        // 		: []
        // 	: data.albums;

        const manageAlbums = () => {
          const relevantAlbums: Album[] = [];
          // const allAlbums: Album[] = [];
          if (metadata.common.album) {
            if (Array.isArray(data.albums)) {
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
                // return allAlbums;
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
              allAlbums: data.albums,
              relevantAlbums: [],
              newAlbums: [],
            };
        };

        const { allAlbums, newAlbums, relevantAlbums } = manageAlbums();

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
        const { allArtists, newArtists, relevantArtists } = manageArtists();
        songInfo.artistsId = relevantArtists.map(
          (newArtist) => newArtist.artistId
        );
        const artists = allArtists;

        // const manageSongData = () => {
        // 	const songData = songInfo;
        // 	const artistsData = relevantArtists;
        // 	const albumData = '';
        // };

        data.songs.push(songInfo);
        await setData({ songs: data.songs, artists, albums: allAlbums });
        return songInfo;
      })
      .catch((err) => logger(err));
  }
};

const isAlbumAvailable = (albums: Album[], title: string, albumId?: string) => {
  for (const album of albums) {
    if (album.title === title) return true;
  }
  return false;
};

const addNewAlbum = (albums: Album[], options: Album) => {
  albums.push(options);
  return { allAlbums: albums, newAlbum: options };
};

const isArtistAvailable = (
  artists: Artist[],
  name: string,
  artistId?: string
) => {
  for (const artist of artists) {
    if (artist.name === name) return true;
  }
  return false;
};
