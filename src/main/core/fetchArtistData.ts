import { getAllArtists } from '@main/db/queries/artists';
import logger from '../logger';
import { convertToArtist } from '../../common/convert';

const fetchArtistData = async (
  artistIdsOrNames: string[] = [],
  sortType?: ArtistSortTypes,
  filterType?: ArtistFilterTypes,
  limit = 0
): Promise<Artist[]> => {
  if (artistIdsOrNames) {
    logger.debug(`Requested artists data`, {
      artistIdsOrNamesCount: artistIdsOrNames.length,
      sortType,
      limit
    });
    const artists = await getAllArtists({
      artistIds: artistIdsOrNames.map((id) => Number(id)).filter((id) => !isNaN(id)),
      start: 0,
      end: 0,
      filterType,
      sortType
    });

    if (artists.data.length > 0) {
      const results: Artist[] = artists.data.map((artist) => convertToArtist(artist));

      return results;
    }
  }
  return [];
};

export default fetchArtistData;
