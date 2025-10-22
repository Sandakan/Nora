import {
  linkSongToAlbum,
  createAlbum,
  getAlbumWithTitle
  // getLinkedAlbumSong
} from '@main/db/queries/albums';
import type { albums } from '@main/db/schema';
import { linkArtworksToAlbum } from '@main/db/queries/artworks';

const manageAlbumsOfParsedSong = async (
  data: {
    songId: number;
    artworkId: number;
    songYear?: number | null;
    artists: string[];
    albumArtists: string[];
    albumName?: string;
  },
  trx: DBTransaction
) => {
  const { songId, artworkId, songYear, artists, albumArtists, albumName } = data;

  let relevantAlbum: typeof albums.$inferSelect | undefined;
  let newAlbum: typeof albums.$inferSelect | undefined;

  const songAlbumName = albumName?.trim();
  const relevantAlbumArtists: string[] = [];

  if (albumArtists.length > 0) relevantAlbumArtists.push(...albumArtists);
  else if (artists.length > 0) relevantAlbumArtists.push(...artists);

  if (songAlbumName) {
    const availableAlbum = await getAlbumWithTitle(songAlbumName, trx);

    if (availableAlbum) {
      // const linkedAlbumSong = await getLinkedAlbumSong(availableAlbum.id, songId, trx);
      // if (linkedAlbumSong) {
      //   relevantAlbum = availableAlbum;

      //   return { relevantAlbum, newAlbum };
      // }

      await linkSongToAlbum(availableAlbum.id, songId, trx);
      relevantAlbum = availableAlbum;
    } else {
      const album = await createAlbum({ title: songAlbumName, year: songYear }, trx);

      await linkArtworksToAlbum([{ albumId: album.id, artworkId }], trx);
      await linkSongToAlbum(album.id, songId, trx);

      relevantAlbum = album;
      newAlbum = album;
    }
    return {
      relevantAlbum,
      newAlbum,
      relevantAlbumArtists
    };
  }
  return {
    relevantAlbum,
    newAlbum,
    relevantAlbumArtists
  };
};

export default manageAlbumsOfParsedSong;
