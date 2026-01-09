import { getAllAlbums } from '@main/db/queries/albums';
import logger from '../logger';
import { convertToAlbum } from '../utils/convert';

const fetchAlbumData = async (
  albumTitlesOrIds: string[] = [],
  sortType?: AlbumSortTypes,
  start = 0,
  end = 0
): Promise<PaginatedResult<Album, AlbumSortTypes>> => {
  const result: PaginatedResult<Album, AlbumSortTypes> = {
    data: [],
    total: 0,
    sortType,
    start: 0,
    end: 0
  };

  if (albumTitlesOrIds) {
    logger.debug(`Requested albums data for ids`, { albumTitlesOrIds });
    const albums = await getAllAlbums({
      albumIds: albumTitlesOrIds.map((x) => Number(x)),
      sortType,
      start,
      end
    });

    const output = albums.data.map((x) => convertToAlbum(x));

    result.data = output;
    result.total = albums.data.length;
    result.start = albums.start;
    result.end = albums.end;
  }
  return result;
};

export default fetchAlbumData;
