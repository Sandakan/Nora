import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageAlbumsOfParsedSong = (
  allAlbumsData: SavableAlbum[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths
) => {
  const relevantAlbums: SavableAlbum[] = [];
  const { title, songId, artists, year, album: songAlbum } = songInfo;
  const songAlbumName = songAlbum?.name;

  if (songAlbumName) {
    if (Array.isArray(allAlbumsData)) {
      const isAlbumAvailable = allAlbumsData.some(
        (a) => a.title === songAlbumName
      );
      if (isAlbumAvailable) {
        const updatedAlbums = allAlbumsData.map((album) => {
          if (album.title === songAlbumName) {
            album.songs.push({
              title,
              songId,
            });
            relevantAlbums.push(album);
            return album;
          }
          return album;
        });
        return { updatedAlbums, relevantAlbums, newAlbums: [] };
      }
      const newAlbum: SavableAlbum = {
        title: songAlbumName,
        artworkName:
          songArtworkPaths && !songArtworkPaths.isDefaultArtwork
            ? path.basename(songArtworkPaths.artworkPath)
            : undefined,
        year,
        albumId: generateRandomId(),
        artists,
        songs: [
          {
            songId,
            title,
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
    return { updatedAlbums: [], relevantAlbums, newAlbums: [] };
  }
  return {
    updatedAlbums: allAlbumsData || [],
    relevantAlbums: [],
    newAlbums: [],
  };
};

export default manageAlbumsOfParsedSong;
