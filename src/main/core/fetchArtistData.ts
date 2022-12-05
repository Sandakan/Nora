import { getArtistsData } from '../filesystem';
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import sortArtists from '../utils/sortArtists';

const fetchArtistData = async (
  artistIdsOrNames = [] as string[],
  sortType?: ArtistSortTypes
): Promise<Artist[]> => {
  if (artistIdsOrNames) {
    log(`Requested artists data for ids '${artistIdsOrNames.join(',')}'`);
    const artists = getArtistsData();
    if (artists.length > 0) {
      let results: SavableArtist[] = [];
      if (artistIdsOrNames.length === 0) results = artists;
      else {
        for (let x = 0; x < artistIdsOrNames.length; x += 1) {
          for (let y = 0; y < artists.length; y += 1) {
            if (
              artistIdsOrNames[x] === artists[y].artistId ||
              artistIdsOrNames[x] === artists[y].name
            )
              results.push(artists[y]);
          }
        }
      }
      if (sortType) sortArtists(results, sortType);
      return results.map((x) => ({
        ...x,
        artworkPaths: getArtistArtworkPath(x.artworkName),
      }));
    }
  }
  return [];
};

export default fetchArtistData;
