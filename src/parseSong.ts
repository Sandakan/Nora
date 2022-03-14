import * as musicMetaData from 'music-metadata';
import nodeVibrant from 'node-vibrant';

import path from 'path';
import fs from 'fs/promises';

import { generateRandomId } from './randomId';
import { logger } from './logger';
import { getData, setData, storeSongArtworks } from './filesystem';

const defaultSongCoverImgBuffer = async () =>
	await fs
		.readFile(path.join(__dirname, 'public', 'images', 'song_cover_default.png'))
		.then((res) => res);

export const parseSong = async (absoluteFilePath: string) => {
	const data = await getData();
	const stats = await fs.stat(absoluteFilePath).catch((err) => console.log(err));

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
						: ['Unknown Artist'],
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
				};

				const albums = metadata.common.album
					? Array.isArray(data.albums)
						? isAlbumAvailable(data.albums, metadata.common.album)
							? data.albums.map((album) => {
									if (metadata.common.album && metadata.common.album === album.title) {
										album.songs.push({
											title: songInfo.title,
											songId: songInfo.songId,
										});
										return album;
									} else return album;
							  })
							: addNewAlbum(data.albums, {
									title: metadata.common.album,
									artworkPath: '',
									year: metadata.common.year || undefined,
									albumId: generateRandomId(),
									artists: songInfo.artists,
									songs: [
										{
											songId: songInfo.songId,
											title: songInfo.title,
										},
									],
							  })
						: []
					: data.albums;

				const manageArtists = () => {
					let result = data.artists;
					const newArtists: Artist[] = [];
					if (Array.isArray(result)) {
						if (songInfo.artists && songInfo.artists.length > 0) {
							for (const newArtist of songInfo.artists) {
								if (isArtistAvailable(data.artists, newArtist)) {
									const z = result.filter((val) => val.name === newArtist);
									z[0].songs.push({
										title: songInfo.title,
										songId: songInfo.songId,
									});
									result = result.filter((val) => val.name !== newArtist).concat(z);
								} else {
									result.push({
										name: newArtist,
										artistId: generateRandomId(),
										songs: [
											{
												songId: songInfo.songId,
												title: songInfo.title,
											},
										],
									});
								}
							}
							return { allArtists: result, newArtists: newArtists };
						} else return { allArtists: result, newArtists: newArtists };
					} else return { allArtists: [], newArtists: newArtists };
				};

				const artists = manageArtists().allArtists;
				data.songs.push(songInfo);
				await setData({ songs: data.songs, artists: artists, albums: albums });
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
	return albums;
};

const isArtistAvailable = (artists: Artist[], name: string, artistId?: string) => {
	for (const artist of artists) {
		if (artist.name === name) return true;
	}
	return false;
};
