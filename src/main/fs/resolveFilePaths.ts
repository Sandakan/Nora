import path from 'path';
import { DEFAULT_ARTWORK_SAVE_LOCATION, DEFAULT_FILE_URL } from '../filesystem';
import getAssetPath from '../utils/getAssetPath';

export const getSongArtworkPath = (
  id: string,
  isArtworkAvailable = true,
  timestampAsQuery = false
): ArtworkPaths => {
  const timestampStr = timestampAsQuery
    ? `?timestamp=${new Date().getTime()}`
    : '';
  if (isArtworkAvailable) {
    return {
      isDefaultArtwork: isArtworkAvailable,
      artworkPath:
        path.join(
          DEFAULT_FILE_URL,
          DEFAULT_ARTWORK_SAVE_LOCATION,
          `${id}.webp`
        ) + timestampStr,
      optimizedArtworkPath:
        path.join(
          DEFAULT_FILE_URL,
          DEFAULT_ARTWORK_SAVE_LOCATION,
          `${id}-optimized.webp`
        ) + timestampStr,
    };
  }
  const defaultPath =
    path.join(
      DEFAULT_FILE_URL,
      getAssetPath('images', 'png', 'song_cover_default.png')
    ) + timestampStr;
  return {
    isDefaultArtwork: isArtworkAvailable,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath,
  };
};

export const getArtistArtworkPath = (artworkName?: string): ArtworkPaths => {
  if (artworkName) {
    return {
      isDefaultArtwork: !!artworkName,
      artworkPath: path.join(
        DEFAULT_FILE_URL,
        DEFAULT_ARTWORK_SAVE_LOCATION,
        `${artworkName}`
      ),
      optimizedArtworkPath: path.join(
        DEFAULT_FILE_URL,
        DEFAULT_ARTWORK_SAVE_LOCATION,
        `${artworkName.replace(/\.webp^/, '-optimized.webp')}`
      ),
    };
  }
  const defaultPath = path.join(
    DEFAULT_FILE_URL,
    getAssetPath('images', 'png', 'artist_cover_default.png')
  );
  return {
    isDefaultArtwork: !!artworkName,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath,
  };
};

export const getAlbumArtworkPath = (artworkName?: string): ArtworkPaths => {
  if (artworkName) {
    return {
      isDefaultArtwork: !!artworkName,
      artworkPath: path.join(
        DEFAULT_FILE_URL,
        DEFAULT_ARTWORK_SAVE_LOCATION,
        `${artworkName}`
      ),
      optimizedArtworkPath: path.join(
        DEFAULT_FILE_URL,
        DEFAULT_ARTWORK_SAVE_LOCATION,
        `${artworkName.replace(/\.webp^/, '-optimized.webp')}`
      ),
    };
  }
  const defaultPath = path.join(
    DEFAULT_FILE_URL,
    getAssetPath('images', 'png', 'album_cover_default.png')
  );
  return {
    isDefaultArtwork: !!artworkName,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath,
  };
};

export const getGenreArtworkPath = (artworkName?: string): ArtworkPaths => {
  if (artworkName) {
    return {
      isDefaultArtwork: !!artworkName,
      artworkPath: path.join(
        DEFAULT_FILE_URL,
        DEFAULT_ARTWORK_SAVE_LOCATION,
        `${artworkName}`
      ),
      optimizedArtworkPath: path.join(
        DEFAULT_FILE_URL,
        DEFAULT_ARTWORK_SAVE_LOCATION,
        `${artworkName.replace(/\.webp^/, '-optimized.webp')}`
      ),
    };
  }
  const defaultPath = path.join(
    DEFAULT_FILE_URL,
    getAssetPath('images', 'png', 'song_cover_default.png')
  );
  return {
    isDefaultArtwork: !!artworkName,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath,
  };
};

export const getPlaylistArtworkPath = (
  playlistId: string,
  isArtworkAvailable: boolean
): ArtworkPaths => {
  const artworkPath =
    playlistId === 'History'
      ? path.join(
          DEFAULT_FILE_URL,
          getAssetPath('images', 'png', 'history-playlist-icon.png')
        )
      : playlistId === 'Favorites'
      ? path.join(
          DEFAULT_FILE_URL,
          getAssetPath('images', 'png', 'favorites-playlist-icon.png')
        )
      : isArtworkAvailable
      ? path.join(
          DEFAULT_FILE_URL,
          DEFAULT_ARTWORK_SAVE_LOCATION,
          `${playlistId}.webp`
        )
      : path.join(
          DEFAULT_FILE_URL,
          getAssetPath('images', 'png', 'playlist_cover_default.png')
        );
  return {
    isDefaultArtwork: !isArtworkAvailable,
    artworkPath,
    optimizedArtworkPath: artworkPath,
  };
};

export const removeDefaultFileUrlFromPath = (filePath: string) => {
  return filePath.replace(/nora:[/\\]{1,2}localFiles[/\\]{1,2}/gm, '');
};
