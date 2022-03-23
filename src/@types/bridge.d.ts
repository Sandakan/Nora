import { api } from '../preload.ts';
import MusicMetaData from 'music-metadata';

declare global {
	interface Window {
		api: typeof api;
	}
	interface imageCoverData {
		format: string;
		data: Buffer;
	}

	// interface songInfo {
	// 	title: string;
	// 	artists: string[];
	// 	duration: number | undefined;
	// 	sampleRate: number | undefined;
	// 	artworkPath?: string[] | string;
	// 	palette?: any;
	// 	path: string;
	// 	songId: string;
	// }

	interface SongData {
		songId: string;
		title: string;
		duration: number;
		artists: string[];
		album?: string;
		albumArtist?: string;
		format?: musicMetaData.IFormat;
		track: musicMetaData.common.track;
		year?: number;
		sampleRate: number | undefined;
		palette?: any;
		path: string;
		artworkPath: string;
		isAFavorite: boolean;
		createdDate: string | undefined;
		modifiedDate: string | undefined;
		folderInfo: {
			name: string;
			path: string;
		};
		albumId?: string;
		artistsId?: string[];
		listeningRate: {
			allTime: number;
			monthly: {
				year: number;
				months: [
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number,
					number
				];
			};
		};
	}

	interface AudioData {
		title: string;
		duration?: number;
		artists: string[] | string;
		artwork: string;
		artworkPath?: string;
		palette: any;
		sampleRate?: number;
		path: string;
		album?: string;
		isAFavorite: string;
	}

	interface Queue {
		currentSongIndex: number | null;
		queue: QueuedSong[];
	}

	interface QueuedSong {
		title: string;
		artists: string[];
		path: string;
		artworkPath: string;
		duration: number;
		songId: string;
	}

	interface AudioInfo {
		title: string;
		artists: string[];
		duration: number;
		artworkPath?: string;
		path: string;
		songId: string;
		palette: {
			DarkVibrant: {
				_rgb: any;
			};
			LightVibrant: {
				_rgb: any;
			};
		};
	}
	interface PlayableAudioInfo {
		title: string;
		artists: string[];
		duration: number;
		artwork?: string;
		artworkPath?: string;
		path: string;
		songId: string;
		isAFavorite: boolean;
	}

	interface UserData {
		theme: {
			isDarkMode: boolean;
		};
		currentSong: {
			songId: string | null;
			stoppedPosition: number;
		};
		volume: {
			isMuted: boolean;
			value: number;
		};
		playlist: Playlist | null;
		recentlyPlayedSongs: SongData[];
		musicFolders: MusicFolderData[];
		defaultPage: 'Home' | 'Songs';
	}

	interface MusicFolderData {
		path: string;
		stats: {
			lastModifiedDate: Date;
			lastChangedDate: Date;
			fileCreatedDate: Date;
			lastParsedDate: Date;
		};
	}

	interface Playlist {
		name: string;
		songs: string[];
		createdDate: Date;
		playlistId: string;
		artworkPath?: string;
	}

	interface playlistDataTemplate {
		playlists: Playlist[];
	}
	interface Data {
		songs: SongData[];
		albums: Album[];
		artists: Artist[];
	}

	interface Album {
		albumId: string;
		title: string;
		artists: string[];
		artists: {
			name: string;
			artistId: string;
		}[];
		artworkPath: string | undefined;
		songs: {
			title: string;
			songId: string;
		}[];
		year: number | undefined;
	}

	interface Artist {
		artistId: string;
		songs: {
			title: string;
			songId: string;
		}[];
		name: string;
		artworkPath?: string;
	}

	interface LogData {
		logs: {
			time: Date | string;
			error: {
				name: string;
				message: string;
				stack: string | undefined;
			};
		}[];
	}
	interface Lyrics {
		lyrics: string;
		source: {
			name: string;
			url: string;
			link: string;
		};
	}

	interface toggleLikeSongReturnValue {
		error: string | null;
		success: boolean;
	}

	interface ArtistInfoFromNetData {
		data: ArtistInfoFromNet[];
	}

	interface ArtistInfoFromNet {
		id: number;
		name: string;
		link: string;
		picture: string;
		picture_small: string;
		picture_medium: string;
		picture_big: string;
		picture_xl: string;
		nb_album: number;
		nb_fan: string;
		radio: boolean;
		tracklist: string;
		type: string;
	}

	interface ContextMenuItem {
		label: string;
		description?: string;
		class?: string;
		handler: (clickEvent: Event) => void;
	}
}
