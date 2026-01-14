import { getAllArtists } from '@main/db/queries/artists';
import logger from '../logger';
import { convertToArtist } from '../utils/convert';

const fetchArtistData = async (
  artistIdsOrNames: string[] = [],
  sortType?: ArtistSortTypes,
  filterType?: ArtistFilterTypes,
  start = 0,
  end = 0,
  limit = 0
): Promise<PaginatedResult<Artist, ArtistSortTypes>> => {
  const result: PaginatedResult<Artist, ArtistSortTypes> = {
    data: [],
    total: 0,
    sortType,
    start: 0,
    end: 0
  };

  logger.debug(`Requested artists data`, {
    artistIdsOrNamesCount: artistIdsOrNames.length,
    sortType,
    limit
  });
  const artists = await getAllArtists({
    artistIds: artistIdsOrNames.map((id) => Number(id)).filter((id) => !isNaN(id)),
    start,
    end,
    filterType,
    sortType
  });

  const results: Artist[] = artists.data.map((artist) => convertToArtist(artist));

  result.data = results;
  result.total = artists.data.length;
  result.start = artists.start;
  result.end = artists.end;

  return {
    data: results,
    total: result.total,
    start: result.start,
    end: result.end,
    sortType: result.sortType
  } satisfies PaginatedResult<Artist, ArtistSortTypes>;
};

export default fetchArtistData;
