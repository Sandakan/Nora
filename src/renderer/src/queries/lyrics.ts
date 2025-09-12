import { createQueryKeys } from '@lukemorales/query-key-factory';

export const lyricsQuery = createQueryKeys('lyrics', {
  single: (data: {
    title: string;
    artists: string[];
    album?: string;
    path: string;
    duration: number;
  }) => {
    const { title, artists, album, path, duration } = data;

    return {
      queryKey: [
        `title=${title}`,
        `artists=${artists.join(',')}`,
        `album=${album}`,
        `path=${path}`,
        `duration=${duration}`
      ],
      queryFn: () =>
        window.api.lyrics.getSongLyrics({
          songTitle: title,
          songArtists: artists,
          album: album,
          songPath: path,
          duration: duration
        })
    };
  }
});
