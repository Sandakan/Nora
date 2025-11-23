import { getSongArtworksBySongIds } from '@main/db/queries/songs';
import { parseSongArtworks } from '../fs/resolveFilePaths';

const getArtworksForMultipleArtworksCover = async (songIds: string[]) => {
  const artworkData = await getSongArtworksBySongIds(songIds.map((id) => parseInt(id)));

  const artworks = artworkData.map((artwork) => {
    const artworkPaths = parseSongArtworks(artwork.artworks.map((a) => a.artwork));

    return {
      songId: String(artwork.id),
      artworkPaths
    };
  });

  return artworks;
};

export default getArtworksForMultipleArtworksCover;
