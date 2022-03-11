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
		createdDate: string | undefined;
		modifiedDate: string | undefined;
		folderInfo: {
			name: string;
			path: string;
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
	}
	interface PlayableAudioInfo {
		title: string;
		artists: string[];
		duration: number;
		artwork?: string;
		artworkPath?: string;
		path: string;
		songId: string;
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
		musicFolders: string[];
		defaultPage: 'Home' | 'Songs';
	}

	interface Playlist {
		name: string;
		songs: [];
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
}
