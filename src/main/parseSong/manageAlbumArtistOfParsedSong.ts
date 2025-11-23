import { createArtist, getLinkedAlbumArtist, getArtistWithName } from '@main/db/queries/artists';
import { linkArtistToAlbum } from '@main/db/queries/albums';
import type { artists } from '@main/db/schema';

const manageAlbumArtistOfParsedSong = async (
  data: { albumArtists: string[]; albumId?: number },
  trx: DB | DBTransaction
) => {
  const newAlbumArtists: (typeof artists.$inferSelect)[] = [];
  const relevantAlbumArtists: (typeof artists.$inferSelect)[] = [];
  const { albumArtists, albumId } = data;

  if (albumId !== undefined && albumArtists && albumArtists.length > 0) {
    for (const albumArtist of albumArtists) {
      const albumArtistName = albumArtist.trim();

      const availableArtist = await getArtistWithName(albumArtistName, trx);

      if (availableArtist) {
        const availableAlbumArtist = await getLinkedAlbumArtist(albumId, availableArtist.id, trx);
        if (availableAlbumArtist) continue;

        await linkArtistToAlbum(albumId, availableArtist.id, trx);

        relevantAlbumArtists.push(availableArtist);
      } else {
        const artist = await createArtist({ name: albumArtistName }, trx);
        await linkArtistToAlbum(albumId, artist.id, trx);

        relevantAlbumArtists.push(artist);
        newAlbumArtists.push(artist);
      }
    }
  }
  return {
    newAlbumArtists,
    relevantAlbumArtists
  };
};

export default manageAlbumArtistOfParsedSong;
