import NodeID3 from 'node-id3';
// eslint-disable-next-line import/no-cycle
import { getData } from './filesystem';

export const updateSongId3Tags = (songId: string, tags: SongId3Tags) => {
  const data = getData();
  if (data && data.songs && data.songs.length > 0) {
    const { songs } = data;
    for (let x = 0; x < songs.length; x += 1) {
      if (songs[x].songId === songId) {
        return NodeID3.Promise.update(tags, songs[x].path);
      }
    }
  }
  return undefined;
};

export const getSongId3Tags = (songPath: string) =>
  NodeID3.Promise.read(songPath, { noRaw: true });
