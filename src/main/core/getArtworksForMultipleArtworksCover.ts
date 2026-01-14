import { getSongArtworksBySongIds } from '@main/db/queries/songs';
import { parseSongArtworks } from '../fs/resolveFilePaths';

const getArtworksForMultipleArtworksCover = async (songIds: number[]) => {
  const artworkData = await getSongArtworksBySongIds(songIds);

  const artworks = artworkData.map((artwork) => {
    const artworkPaths = parseSongArtworks(artwork.artworks.map((a) => a.artwork));

    return {
      songId: artwork.id,
      artworkPaths
    };
  });

  return artworks;
};

export default getArtworksForMultipleArtworksCover;
