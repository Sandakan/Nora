import { createArtist, getArtistWithName, linkSongToArtist } from '@main/db/queries/artists';
import { linkArtworksToArtist } from '@main/db/queries/artworks';
import type { artists } from '@main/db/schema';

const manageArtistsOfParsedSong = async (
  data: {
    songId: number;
    songArtists: string[];
    artworkId: number;
  },
  trx: DBTransaction
) => {
  const newArtists: (typeof artists.$inferSelect)[] = [];
  const relevantArtists: (typeof artists.$inferSelect)[] = [];
  const { songId, songArtists, artworkId } = data;

  if (songArtists && songArtists.length > 0) {
    for (const songArtist of songArtists) {
      const newArtistName = songArtist.trim();

      const availableArtist = await getArtistWithName(newArtistName);

      if (availableArtist) {
        linkSongToArtist(availableArtist.id, songId, trx);
        relevantArtists.push(availableArtist);
      } else {
        const artist = await createArtist({ name: newArtistName }, trx);

        linkArtworksToArtist([{ artistId: artist.id, artworkId: artworkId }], trx);
        linkSongToArtist(artist.id, songId, trx);
        relevantArtists.push(artist);
        newArtists.push(artist);
      }
    }
    return { newArtists, relevantArtists };
  }
  return { newArtists, relevantArtists };
};

export default manageArtistsOfParsedSong;
