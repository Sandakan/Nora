import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageAlbums = (
  allAlbumsData: SavableAlbum[],
  songTitle: string,
  songId: string,
  songAlbumName?: string,
  songArtworkPaths?: ArtworkPaths,
  songArtists?: { name: string; artistId: string }[],
  songYear?: number
) => {
  const relevantAlbums: SavableAlbum[] = [];
  if (songAlbumName) {
    if (Array.isArray(allAlbumsData)) {
      const isAlbumAvailable = allAlbumsData.some(
        (a) => a.title === songAlbumName
      );
      if (isAlbumAvailable) {
        const updatedAlbums = allAlbumsData.map((album) => {
          if (album.title === songAlbumName) {
            album.songs.push({
              title: songTitle,
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
    return { updatedAlbums: [], relevantAlbums, newAlbums: [] };
  }
  return {
    updatedAlbums: allAlbumsData || [],
    relevantAlbums: [],
    newAlbums: [],
  };
};

export default manageAlbums;
