import { getSongArtworkPath } from '../fs/resolveFilePaths';

export default (songIds: string[]) => {
  const artworks = songIds.map((id) => {
    const artworkPaths = getSongArtworkPath(id);
    return artworkPaths.artworkPath;
  });

  return artworks;
};
