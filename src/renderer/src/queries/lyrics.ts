import { createQueryKeys } from '@lukemorales/query-key-factory';

import log from '../utils/log';

export const lyricsQuery = createQueryKeys('lyrics', {
  single: (data: {
    title: string;
    artists: string[];
    album?: string;
    path: string;
    duration: number;
    lyricsType?: LyricsTypes;
    lyricsRequestType?: LyricsRequestTypes;
    saveLyricsAutomatically?: AutomaticallySaveLyricsTypes;
  }) => {
    const {
      title,
      artists,
      album,
      path,
      duration,
      lyricsType,
      lyricsRequestType,
      saveLyricsAutomatically
    } = data;

    return {
      queryKey: [
        `title=${title}`,
        `artists=${artists.join(',')}`,
        `album=${album}`,
        `path=${path}`,
        `duration=${duration}`,
        `lyricsType=${lyricsType}`,
        `lyricsRequestType=${lyricsRequestType}`,
        `saveLyricsAutomatically=${saveLyricsAutomatically}`
      ],
      queryFn: () =>
        window.api.lyrics.getSongLyrics(
          {
            songTitle: title,
            songArtists: artists,
            album: album,
            songPath: path,
            duration: duration
          },
          lyricsType,
          lyricsRequestType,
          saveLyricsAutomatically
        )
    };
  },
  fullScreenPlayer: (data: {
    title: string;
    artists: string[];
    album?: string;
    path: string;
    duration: number;
    language: string;
    autoTranslate: boolean;
    autoConvert: boolean;
  }) => {
    const { title, artists, album, path, duration, language, autoTranslate, autoConvert } = data;

    return {
      queryKey: [
        `fsp-title=${title}`,
        `fsp-artists=${artists.join(',')}`,
        `fsp-album=${album ?? ''}`,
        `fsp-path=${path}`,
        `fsp-duration=${duration}`,
        `fsp-language=${language}`,
        `fsp-autoTranslate=${autoTranslate}`,
        `fsp-autoConvert=${autoConvert}`
      ],
      queryFn: async (): Promise<SongLyrics | null> => {
        try {
          const initial = await window.api.lyrics.getSongLyrics({
            songTitle: title,
            songArtists: artists,
            album: album,
            songPath: path,
            duration: duration
          });

          if (!initial?.lyrics) return initial ?? null;

          let current: SongLyrics = initial;
          const isReset = !!current.lyrics.isReset;

          if (autoTranslate && !isReset && !current.lyrics.isTranslated) {
            const translated = await window.api.lyrics.getTranslatedLyrics(
              language as LanguageCodes
            );
            if (translated) current = translated;
          }

          if (autoConvert && !isReset && !current.lyrics.isRomanized) {
            const originalLanguage = current.lyrics.originalLanguage;
            if (originalLanguage === 'zh') {
              const pinyin = await window.api.lyrics.convertLyricsToPinyin();
              if (pinyin) current = pinyin;
            } else if (originalLanguage === 'ja') {
              const romanized = await window.api.lyrics.romanizeLyrics();
              if (romanized) current = romanized;
            } else if (originalLanguage === 'ko') {
              const romaja = await window.api.lyrics.convertLyricsToRomaja();
              if (romaja) current = romaja;
            }
          }

          return current;
        } catch (error) {
          log('Failed to fetch full-screen-player lyrics:', { error }, 'ERROR');
          return null;
        }
      }
    };
  }
});
