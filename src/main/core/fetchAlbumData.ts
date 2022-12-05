import { getAlbumsData } from '../filesystem';
import { getAlbumArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortAlbums from '../utils/sortAlbums';

const fetchAlbumData = async (
  albumIds = [] as string[],
  sortType?: AlbumSortTypes
) => {
  if (albumIds) {
    log(`Requested albums data for ids '${albumIds.join(',')}'`);
    const albums = getAlbumsData();
    if (albums.length > 0) {
      let results = [];
      if (albumIds.length === 0) results = albums;
      else {
        for (let x = 0; x < albums.length; x += 1) {
          for (let y = 0; y < albumIds.length; y += 1) {
            if (albums[x].albumId === albumIds[y]) results.push(albums[x]);
          }
        }
      }

      results = results.map(
        (x) =>
          ({
            ...x,
            artworkPaths: getAlbumArtworkPath(x.artworkName),
          } as Album)
      );
      if (sortType) return sortAlbums(results, sortType);
      return results;
    }
  }
  return [];
};

export default fetchAlbumData;
