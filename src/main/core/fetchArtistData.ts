import { getAllArtists } from '@main/db/queries/artists';
import { parseArtistArtworks } from '../fs/resolveFilePaths';
import logger from '../logger';
import filterArtists from '../utils/filterArtists';
import sortArtists from '../utils/sortArtists';

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
      start: 0,
      end: 0,
      filterType,
      sortType
    });

    if (artists.data.length > 0) {
      let results: Artist[] = artists.data.map((artist) => ({
        artistId: String(artist.id),
        name: artist.name,
        songs: artist.songs.map((song) => ({
          songId: String(song.song.id),
          title: song.song.title
        })),
        isAFavorite: false,
        artworkPaths: parseArtistArtworks(artist.artworks.map((a) => a.artwork))
      }));
      // if (artistIdsOrNames.length === 0) results = artists;
      // else {
      //   for (let x = 0; x < artistIdsOrNames.length; x += 1) {
      //     for (let y = 0; y < artists.length; y += 1) {
      //       if (
      //         artistIdsOrNames[x] === artists[y].artistId ||
      //         artistIdsOrNames[x] === artists[y].name
      //       )
      //         results.push(artists[y]);
      //     }
      //   }
      // }

      if (sortType || filterType)
        results = sortArtists(filterArtists(results, filterType), sortType);

      return results;
    }
  }
  return [];
};

export default fetchArtistData;
