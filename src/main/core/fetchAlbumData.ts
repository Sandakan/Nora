import { getAlbumsData } from '../filesystem';
import { getAlbumArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortAlbums from '../utils/sortAlbums';

const fetchAlbumData = async (
  albumTitlesOrIds: string[] = [],
  sortType?: AlbumSortTypes
): Promise<Album[]> => {
  if (albumTitlesOrIds) {
    log(`Requested albums data for ids '${albumTitlesOrIds.join(',')}'`);
    const albums = getAlbumsData();

    if (albums.length > 0) {
      let results: SavableAlbum[] = [];
      if (albumTitlesOrIds.length === 0) results = albums;
      else {
        for (let x = 0; x < albums.length; x += 1) {
          for (let y = 0; y < albumTitlesOrIds.length; y += 1) {
            if (
              albums[x].albumId === albumTitlesOrIds[y] ||
              albums[x].title === albumTitlesOrIds[y]
            )
              results.push(albums[x]);
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
