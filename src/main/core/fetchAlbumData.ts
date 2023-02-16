import { getAlbumsData } from '../filesystem';
import { getAlbumArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortAlbums from '../utils/sortAlbums';

const fetchAlbumData = async (
  albumIds: string[] = [],
  sortType?: AlbumSortTypes
): Promise<Album[]> => {
  if (albumIds) {
    log(`Requested albums data for ids '${albumIds.join(',')}'`);
    const albums = getAlbumsData();
    if (albums.length > 0) {
      let results: SavableAlbum[] = [];
      if (albumIds.length === 0) results = albums;
      else {
        for (let x = 0; x < albums.length; x += 1) {
          for (let y = 0; y < albumIds.length; y += 1) {
            if (albums[x].albumId === albumIds[y]) results.push(albums[x]);
          }
        }
      }

      const output = results.map(
        (x) =>
          ({
            ...x,
            artworkPaths: getAlbumArtworkPath(x.artworkName),
          } satisfies Album)
      );
      if (sortType) return sortAlbums(output, sortType);
      return output;
    }
  }
  return [];
};

export default fetchAlbumData;
