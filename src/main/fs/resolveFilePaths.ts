// import path from 'path';
import { join as joinPath } from 'node:path/posix';

import { platform } from 'process';

import { DEFAULT_ARTWORK_SAVE_LOCATION, DEFAULT_FILE_URL } from '../filesystem';
import { artworks as artworksSchema } from '@db/schema';

import albumCoverImage from '../../renderer/src/assets/images/webp/album_cover_default.webp?asset';
import songCoverImage from '../../renderer/src/assets/images/webp/song_cover_default.webp?asset';
import artistCoverImage from '../../renderer/src/assets/images/webp/artist_cover_default.webp?asset';
import playlistCoverImage from '../../renderer/src/assets/images/webp/playlist_cover_default.webp?asset';
import favoritesPlaylistCoverImage from '../../renderer/src/assets/images/webp/favorites-playlist-icon.webp?asset';
import historyPlaylistCoverImage from '../../renderer/src/assets/images/webp/history-playlist-icon.webp?asset';

let timestamps = {
  songs: Date.now(),
  songArtworks: Date.now(),
  artistArtworks: Date.now(),
  albumArtworks: Date.now(),
  playlistArtworks: Date.now(),
  genreArtworks: Date.now()
};

export const resetArtworkCache = (type: keyof typeof timestamps | 'all') => {
  const now = Date.now();
  if (type === 'all') {
    timestamps = {
      songs: now,
      songArtworks: now,
      artistArtworks: now,
      albumArtworks: now,
      playlistArtworks: now,
      genreArtworks: now
    };
  } else timestamps[type] = now;
  return now;
};

export const resolveSongFilePath = (songPath: string, resetCache = true, sendRealPath = false) => {
  if (resetCache) resetArtworkCache('songs');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.songs}`;

  const resolvedFilePath = joinPath(FILE_URL, songPath) + timestampStr;
  return resolvedFilePath;
};

export const getSongArtworkPath = (
  id: number,
  isArtworkAvailable = true,
  resetCache = false,
  sendRealPath = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('songArtworks');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.songArtworks}`;

  if (isArtworkAvailable) {
    return {
      isDefaultArtwork: !isArtworkAvailable,
      artworkPath: joinPath(FILE_URL, DEFAULT_ARTWORK_SAVE_LOCATION, `${id}.webp`) + timestampStr,
      optimizedArtworkPath:
        joinPath(FILE_URL, DEFAULT_ARTWORK_SAVE_LOCATION, `${id}-optimized.webp`) + timestampStr
    };
  }
  const defaultPath = joinPath(FILE_URL, songCoverImage) + timestampStr;
  return {
    isDefaultArtwork: isArtworkAvailable,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const parseSongArtworks = (
  artworks: (typeof artworksSchema.$inferSelect)[],
  resetCache = false,
  sendRealPath = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('songArtworks');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.songArtworks}`;
  const isArtworkAvailable = artworks.length > 0;

  if (isArtworkAvailable) {
    const highResImage = artworks.find((artwork) => artwork.width >= 500 && artwork.height >= 500);
    const lowResImage = artworks.find((artwork) => artwork.width < 500 && artwork.height < 500);

    if (highResImage && lowResImage) {
      return {
        isDefaultArtwork: !isArtworkAvailable,
        artworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr,
        optimizedArtworkPath: joinPath(FILE_URL, lowResImage.path) + timestampStr
      };
    }
  }

  const defaultPath = joinPath(FILE_URL, songCoverImage) + timestampStr;
  return {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const getArtistArtworkPath = (artworkName?: string, resetCache = false): ArtworkPaths => {
  if (resetCache) resetArtworkCache('artistArtworks');

  const timestampStr = `?ts=${timestamps.artistArtworks}`;

  if (artworkName) {
    return {
      isDefaultArtwork: !artworkName,
      artworkPath:
        joinPath(DEFAULT_FILE_URL, DEFAULT_ARTWORK_SAVE_LOCATION, `${artworkName}`) + timestampStr,
      optimizedArtworkPath:
        joinPath(
          DEFAULT_FILE_URL,
          DEFAULT_ARTWORK_SAVE_LOCATION,
          `${artworkName.replace(/\.webp^/, '-optimized.webp')}`
        ) + timestampStr
    };
  }
  const defaultPath = joinPath(DEFAULT_FILE_URL, artistCoverImage);
  return {
    isDefaultArtwork: !artworkName,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const parseArtistArtworks = (
  artworks: (typeof artworksSchema.$inferSelect)[],
  resetCache = false,
  sendRealPath = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('artistArtworks');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.artistArtworks}`;
  const isArtworkAvailable = artworks.length > 0;

  if (isArtworkAvailable) {
    const highResImage = artworks.find((artwork) => artwork.width >= 500 && artwork.height >= 500);

    if (highResImage) {
      return {
        isDefaultArtwork: !isArtworkAvailable,
        artworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr,
        optimizedArtworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr
      };
    }
  }

  const defaultPath = joinPath(FILE_URL, artistCoverImage) + timestampStr;
  return {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const parseArtistOnlineArtworks = (
  artworks: (typeof artworksSchema.$inferSelect)[] | undefined
): OnlineArtistArtworks | undefined => {
  if (!artworks) return undefined;

  const highResImage = artworks.find(
    (artwork) => artwork.width >= 500 && artwork.height >= 500 && artwork.source === 'REMOTE'
  );
  const mediumResImage = artworks.find(
    (artwork) => artwork.width >= 300 && artwork.height >= 300 && artwork.source === 'REMOTE'
  );
  const lowResImage = artworks.find(
    (artwork) => artwork.width >= 100 && artwork.height >= 100 && artwork.source === 'REMOTE'
  );

  if (mediumResImage && lowResImage) {
    return {
      picture_xl: highResImage?.path,
      picture_medium: mediumResImage?.path,
      picture_small: lowResImage?.path || mediumResImage?.path
    };
  }
  return undefined;
};

export const getAlbumArtworkPath = (artworkName?: string, resetCache = false): ArtworkPaths => {
  if (resetCache) resetArtworkCache('albumArtworks');

  const timestampStr = `?ts=${timestamps.albumArtworks}`;

  if (artworkName) {
    return {
      isDefaultArtwork: !artworkName,
      artworkPath:
        joinPath(DEFAULT_FILE_URL, DEFAULT_ARTWORK_SAVE_LOCATION, `${artworkName}`) + timestampStr,
      optimizedArtworkPath:
        joinPath(
          DEFAULT_FILE_URL,
          DEFAULT_ARTWORK_SAVE_LOCATION,
          `${artworkName.replace(/\.webp^/, '-optimized.webp')}`
        ) + timestampStr
    };
  }
  const defaultPath = joinPath(DEFAULT_FILE_URL, albumCoverImage);
  return {
    isDefaultArtwork: !artworkName,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const parseAlbumArtworks = (
  artworks: (typeof artworksSchema.$inferSelect)[],
  resetCache = false,
  sendRealPath = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('albumArtworks');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.albumArtworks}`;
  const isArtworkAvailable = artworks.length > 0;

  if (isArtworkAvailable) {
    const highResImage = artworks.find((artwork) => artwork.width >= 500 && artwork.height >= 500);

    if (highResImage) {
      return {
        isDefaultArtwork: !isArtworkAvailable,
        artworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr,
        optimizedArtworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr
      };
    }
  }

  const defaultPath = joinPath(FILE_URL, albumCoverImage) + timestampStr;
  return {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const getGenreArtworkPath = (artworkName?: string, resetCache = false): ArtworkPaths => {
  if (resetCache) resetArtworkCache('genreArtworks');

  const timestampStr = `?ts=${timestamps.genreArtworks}`;

  if (artworkName) {
    return {
      isDefaultArtwork: !artworkName,
      artworkPath:
        joinPath(DEFAULT_FILE_URL, DEFAULT_ARTWORK_SAVE_LOCATION, `${artworkName}`) + timestampStr,
      optimizedArtworkPath:
        joinPath(
          DEFAULT_FILE_URL,
          DEFAULT_ARTWORK_SAVE_LOCATION,
          `${artworkName.replace(/\.webp^/, '-optimized.webp')}`
        ) + timestampStr
    };
  }
  const defaultPath = joinPath(DEFAULT_FILE_URL, songCoverImage);
  return {
    isDefaultArtwork: !artworkName,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const parseGenreArtworks = (
  artworks: (typeof artworksSchema.$inferSelect)[],
  resetCache = false,
  sendRealPath = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('genreArtworks');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.genreArtworks}`;
  const isArtworkAvailable = artworks.length > 0;

  if (isArtworkAvailable) {
    const highResImage = artworks.find((artwork) => artwork.width >= 500 && artwork.height >= 500);

    if (highResImage) {
      return {
        isDefaultArtwork: !isArtworkAvailable,
        artworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr,
        optimizedArtworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr
      };
    }
  }

  const defaultPath = joinPath(FILE_URL, songCoverImage) + timestampStr;
  return {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const getPlaylistArtworkPath = (
  playlistId: number | 'History' | 'Favorites',
  isArtworkAvailable: boolean,
  resetCache = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('playlistArtworks');

  const timestampStr = `?ts=${timestamps.playlistArtworks}`;

  const artworkPath =
    playlistId === 'History'
      ? joinPath(DEFAULT_FILE_URL, historyPlaylistCoverImage) + timestampStr
      : playlistId === 'Favorites'
        ? joinPath(DEFAULT_FILE_URL, favoritesPlaylistCoverImage) + timestampStr
        : isArtworkAvailable
          ? joinPath(DEFAULT_FILE_URL, DEFAULT_ARTWORK_SAVE_LOCATION, `${playlistId}.webp`) +
            timestampStr
          : joinPath(DEFAULT_FILE_URL, playlistCoverImage) + timestampStr;
  return {
    isDefaultArtwork: !isArtworkAvailable,
    artworkPath,
    optimizedArtworkPath: artworkPath
  };
};

export const parsePlaylistArtworks = (
  artworks: (typeof artworksSchema.$inferSelect)[],
  resetCache = false,
  sendRealPath = false
): ArtworkPaths => {
  if (resetCache) resetArtworkCache('playlistArtworks');

  const FILE_URL = sendRealPath ? '' : DEFAULT_FILE_URL;
  const timestampStr = sendRealPath ? '' : `?ts=${timestamps.playlistArtworks}`;
  const isArtworkAvailable = artworks.length > 0;

  if (isArtworkAvailable) {
    const highResImage = artworks.find((artwork) => artwork.width >= 500 && artwork.height >= 500);

    if (highResImage) {
      return {
        isDefaultArtwork: !isArtworkAvailable,
        artworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr,
        optimizedArtworkPath: joinPath(FILE_URL, highResImage.path) + timestampStr
      };
    }
  }

  const defaultPath = joinPath(FILE_URL, playlistCoverImage) + timestampStr;
  return {
    isDefaultArtwork: true,
    artworkPath: defaultPath,
    optimizedArtworkPath: defaultPath
  };
};

export const removeDefaultAppProtocolFromFilePath = (filePath: string) => {
  const strippedPath = filePath.replaceAll(
    /nora:[/\\]{1,2}localfiles[/\\]{1,2}|\?[\w+=\w+&?]+$/gm,
    ''
  );

  if (platform === 'linux' || platform === 'darwin') return `/${strippedPath}`;
  return strippedPath;
};

export const addDefaultAppProtocolToFilePath = (filePath: string) => {
  return joinPath('nora://localfiles/', filePath);
};

