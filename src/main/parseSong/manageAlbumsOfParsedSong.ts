import path from 'path';

import { generateRandomId } from '../utils/randomId';

const manageAlbumsOfParsedSong = (
  allAlbumsData: SavableAlbum[],
  songInfo: SavableSongData,
  songArtworkPaths?: ArtworkPaths,
) => {
  let relevantAlbum: SavableAlbum | undefined;
  let newAlbum: SavableAlbum | undefined;
  const {
    title,
    songId,
    albumArtists,
    artists,
    year,
    album: songAlbum,
  } = songInfo;

  const songAlbumName = songAlbum?.name.trim();
  const relevantAlbumArtists: { artistId: string; name: string }[] = [];

  if (albumArtists && albumArtists.length > 0)
    relevantAlbumArtists.push(...albumArtists);
  else if (artists && artists.length > 0) relevantAlbumArtists.push(...artists);

  if (songAlbumName) {
    if (Array.isArray(allAlbumsData)) {
      const isAlbumAvailable = allAlbumsData.some(
        //  album.title doesn't need trimming because they are already trimmed when adding them to the database.
        (album) => album.title === songAlbumName,
      );

      if (isAlbumAvailable) {
        const updatedAlbums = allAlbumsData.map((album) => {
          if (album.title === songAlbumName) {
            album.songs.push({
              title,
              songId,
            });
            relevantAlbum = album;
            return album;
          }
          return album;
        });
        return { updatedAlbums, relevantAlbum, newAlbum };
      }
      const newAlbumData: SavableAlbum = {
        title: songAlbumName,
        artworkName:
          songArtworkPaths && !songArtworkPaths.isDefaultArtwork
            ? path.basename(songArtworkPaths.artworkPath)
            : undefined,
        year,
        albumId: generateRandomId(),
        artists: relevantAlbumArtists,
        songs: [
          {
            songId,
            title,
          },
        ],
      };

      allAlbumsData.push(newAlbumData);
      relevantAlbum = newAlbumData;
      newAlbum = newAlbumData;

      return {
        updatedAlbums: allAlbumsData,
        relevantAlbum,
        newAlbum,
      };
    }
    return { updatedAlbums: [], relevantAlbum, newAlbum };
  }
  return {
    updatedAlbums: allAlbumsData || [],
    relevantAlbum,
    newAlbum,
  };
};

export default manageAlbumsOfParsedSong;
