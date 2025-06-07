import { createArtist, getArtistWithName } from '@main/db/queries/artists';
import { linkArtistToAlbum } from '@main/db/queries/albums';
import type { artists } from '@main/db/schema';

const manageAlbumArtistOfParsedSong = async (
  data: { albumArtists: string[] },
  trx: DB | DBTransaction
) => {
  const newAlbumArtists: (typeof artists.$inferSelect)[] = [];
  const relevantAlbumArtists: (typeof artists.$inferSelect)[] = [];
  const { albumArtists } = data;

  if (albumArtists && albumArtists.length > 0) {
    for (const albumArtist of albumArtists) {
      const albumArtistName = albumArtist.trim();

      const availableAlbumArtist = await getArtistWithName(albumArtistName, trx);

      if (availableAlbumArtist) {
        linkArtistToAlbum(availableAlbumArtist.id, availableAlbumArtist.id, trx);
        relevantAlbumArtists.push(availableAlbumArtist);
      } else {
        const artist = await createArtist({ name: albumArtistName }, trx);
        linkArtistToAlbum(artist.id, artist.id, trx);
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
