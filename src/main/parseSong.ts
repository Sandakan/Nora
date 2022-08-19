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

export const defaultSongCoverImgBuffer = async () =>
  await fs
    .readFile(getAssetPath('images', 'png', 'song_cover_default.png'))
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
    log(
      `Starting the parsing process of song '${path.basename(
        absoluteFilePath
      )}'.`
    );
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
        ? (await storeSongArtworks(
            songId,
            metadata.common?.picture[0]?.data
          ).catch((err) => reject(err))) ||
          getAssetPath('images', 'png', 'song_cover_default.png')
        : getAssetPath('images', 'png', 'song_cover_default.png');
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
        listeningRate: {
          allTime: 0,
          monthly: {
            year: new Date().getFullYear(),
            months: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          },
        },
      };

      const { updatedAlbums, relevantAlbums, newAlbums } = manageAlbums(
        data.albums,
        songInfo.title,
        songInfo.songId,
        metadata.common.album,
        songInfo.artworkPath,
        songInfo.artists,
        songInfo.year
      );

      if (songInfo.album)
        songInfo.album = {
          name: relevantAlbums[0].title,
          albumId: relevantAlbums[0].albumId,
        };

      const { allArtists, relevantArtists, newArtists } = manageArtists(
        data.artists,
        songInfo.title,
        songInfo.songId,
        songInfo.artists,
        songInfo.artworkPath,
        relevantAlbums
      );

      if (songInfo.artists) {
        for (let x = 0; x < relevantArtists.length; x += 1) {
          for (let y = 0; y < songInfo.artists.length; y += 1) {
            if (relevantArtists[x].name === songInfo.artists[y].name)
              songInfo.artists[y].artistId = relevantArtists[x].artistId;
          }
        }
      }

      const { allGenres, relevantGenres, newGenres } = manageGenres(
        data.genres,
        songInfo.title,
        songInfo.songId,
        metadata.common.genre,
        songInfo.artworkPath,
        songInfo.palette?.DarkVibrant
      );

      songInfo.genres = relevantGenres.map((genre) => {
        return { name: genre.name, genreId: genre.genreId };
      });

      data.songs.push(songInfo);
      log(
        `Finished the parsing process of song with name '${songInfo.title}'. Updated ${relevantArtists.length} artists, ${relevantAlbums.length}  albums, ${relevantGenres.length} genres in the process of parsing song.`
      );
      setData({
        songs: data.songs,
        artists: allArtists,
        albums: updatedAlbums,
        genres: allGenres,
      });
      dataUpdateEvent('songs/newSong');
      if (newArtists.length > 0) dataUpdateEvent('artists/newArtist');
      if (newAlbums.length > 0) dataUpdateEvent('albums/newAlbum');
      if (newGenres.length > 0) dataUpdateEvent('genres/newGenre');
      sendMessageToRenderer(
        `'${songTitle}' song added to the library.`,
        'PARSE_SUCCESSFUL'
      );
      return resolve(songInfo);
    }
    resolve(undefined);
  });
};

export const manageAlbums = (
  allAlbumsData: Album[],
  songTitle: string,
  songId: string,
  songAlbumName?: string,
  songArtworkPath?: string,
  songArtists?: { name: string; artistId: string }[],
  songYear?: number
) => {
  const relevantAlbums: Album[] = [];
  if (songAlbumName) {
    if (Array.isArray(allAlbumsData)) {
      if (allAlbumsData.some((a) => a.title === songAlbumName)) {
        const updatedAlbums = allAlbumsData.map((album) => {
          if (album.title === songAlbumName) {
            album.songs.push({
              title: songTitle,
              songId,
            });
            relevantAlbums.push(album);
            return album;
          } else return album;
        });
        return { updatedAlbums, relevantAlbums, newAlbums: [] };
      } else {
        const newAlbum: Album = {
          title: songAlbumName,
          artworkPath: songArtworkPath,
          year: songYear,
          albumId: generateRandomId(),
          artists: songArtists,
          songs: [
            {
              songId,
              title: songTitle,
            },
          ],
        };
        allAlbumsData.push(newAlbum);
        relevantAlbums.push(newAlbum);
        return {
          updatedAlbums: allAlbumsData,
          relevantAlbums,
          newAlbums: [newAlbum],
        };
      }
    } else return { updatedAlbums: [], relevantAlbums, newAlbums: [] };
  } else
    return {
      updatedAlbums: allAlbumsData || [],
      relevantAlbums: [],
      newAlbums: [],
    };
};

export const manageArtists = (
  allArtists: Artist[],
  songTitle: string,
  songId: string,
  songArtists?: { name: string; artistId?: string }[],
  songArtworkPath?: string,
  relevantAlbums = [] as Album[]
) => {
  let updatedArtists = allArtists;
  const newArtists: Artist[] = [];
  const relevantArtists: Artist[] = [];
  if (Array.isArray(updatedArtists)) {
    if (songArtists && songArtists.length > 0) {
      for (let x = 0; x < songArtists.length; x += 1) {
        const newArtist = songArtists[x];
        if (allArtists.some((artist) => artist.name === newArtist.name)) {
          let z = updatedArtists.filter((val) => val.name === newArtist.name);
          z = z.map((artist) => {
            artist.songs.push({
              title: songTitle,
              songId,
            });
            if (relevantAlbums.length > 0) {
              relevantAlbums.forEach((relevantAlbum) =>
                artist.albums?.push({
                  title: relevantAlbum.title,
                  albumId: relevantAlbum.albumId,
                })
              );
            }
            relevantArtists.push(artist);
            return artist;
          });
          updatedArtists = updatedArtists
            .filter((val) => val.name !== newArtist.name)
            .concat(z);
        } else {
          const artist = {
            name: newArtist.name,
            artistId: generateRandomId(),
            songs: [
              {
                songId,
                title: songTitle,
              },
            ],
            artworkPath: songArtworkPath,
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
          updatedArtists.push(artist);
        }
      }
      return { allArtists: updatedArtists, newArtists, relevantArtists };
    } else return { allArtists: updatedArtists, newArtists, relevantArtists };
  } else return { allArtists: [], newArtists, relevantArtists };
};

export const manageGenres = (
  allGenres: Genre[],
  songTitle: string,
  songId: string,
  songGenres?: string[],
  songArtworkPath?: string,
  darkVibrantBgColor?: { rgb: unknown }
) => {
  const newGenres: Genre[] = [];
  const relevantGenres: Genre[] = [];
  let genres = allGenres;
  if (
    Array.isArray(songGenres) &&
    songGenres.length > 0 &&
    Array.isArray(genres)
  ) {
    for (let x = 0; x < songGenres.length; x += 1) {
      const songGenre = songGenres[x];
      if (genres.some((x) => x.name === songGenre)) {
        let y = genres.filter((genre) => genre.name === songGenre);
        y = y.map((z) => {
          z.artworkPath = songArtworkPath;
          z.backgroundColor = darkVibrantBgColor;
          z.songs.push({
            songId,
            title: songTitle,
          });
          relevantGenres.push(z);
          return z;
        });
        genres = genres.filter((genre) => genre.name !== songGenre).concat(y);
      } else {
        const newGenre: Genre = {
          name: songGenre,
          genreId: generateRandomId(),
          songs: [
            {
              songId,
              title: songTitle,
            },
          ],
          artworkPath: songArtworkPath,
          backgroundColor: darkVibrantBgColor,
        };
        relevantGenres.push(newGenre);
        newGenres.push(newGenre);
        genres.push(newGenre);
      }
    }
    return { allGenres: genres, newGenres, relevantGenres };
  } else return { allGenres: genres || [], newGenres, relevantGenres };
};
