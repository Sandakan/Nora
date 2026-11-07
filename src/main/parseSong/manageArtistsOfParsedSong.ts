import {
  createArtist,
  getArtistWithName,
  linkSongToArtist,
  updateArtistMbid
} from '@main/db/queries/artists';
import { linkArtworksToArtist } from '@main/db/queries/artworks';
import type { artists } from '@main/db/schema';

const manageArtistsOfParsedSong = async (
  data: {
    songId: number;
    songArtists: string[];
    artworkId: number;
    mbid?: string;
  },
  trx: DBTransaction
) => {
  const newArtists: (typeof artists.$inferSelect)[] = [];
  const relevantArtists: (typeof artists.$inferSelect)[] = [];
  const { songId, songArtists, artworkId, mbid } = data;

  if (songArtists && songArtists.length > 0) {
    const isSingleArtist = songArtists.length === 1;
    for (const songArtist of songArtists) {
      const newArtistName = songArtist.trim();

      const availableArtist = await getArtistWithName(newArtistName, trx);

      if (availableArtist) {
        if (isSingleArtist && !availableArtist.mbid && mbid) {
          availableArtist.mbid = mbid;
          await updateArtistMbid(availableArtist.id, mbid, trx);
        }
        await linkSongToArtist(availableArtist.id, songId, trx);
        relevantArtists.push(availableArtist);
      } else {
        const artist = await createArtist(
          { name: newArtistName, mbid: isSingleArtist ? mbid : undefined },
          trx
        );

        await linkArtworksToArtist([{ artistId: artist.id, artworkId: artworkId }], trx);
        await linkSongToArtist(artist.id, songId, trx);

        relevantArtists.push(artist);
        newArtists.push(artist);
      }
    }
    return { newArtists, relevantArtists };
  }
  return { newArtists, relevantArtists };
};

export default manageArtistsOfParsedSong;
