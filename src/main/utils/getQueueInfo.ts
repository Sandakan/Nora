import {
  getAlbumRelatedQueueInfo,
  getArtistRelatedQueueInfo,
  getFolderRelatedQueueInfo,
  getGenreRelatedQueueInfo,
  getPlaylistRelatedQueueInfo,
  getSongRelatedQueueInfo
} from '@main/db/queries/queue';
import {
  addDefaultAppProtocolToFilePath,
  getPlaylistArtworkPath,
  parseSongArtworks
} from '@main/fs/resolveFilePaths';

const addFileUrlToPath = (path?: string) => {
  if (!path) return '';
  return addDefaultAppProtocolToFilePath(path);
};

export const getQueueInfo = async (
  queueType: QueueTypes,
  id: string
): Promise<QueueInfo | undefined> => {
  switch (queueType) {
    case 'songs': {
      if (id !== '') {
        const data = await getSongRelatedQueueInfo(Number(id));
        const artworks = data?.artworks.map((a) => a.artwork) || [];
        const artworkData = parseSongArtworks(artworks);

        return {
          artworkPath: addFileUrlToPath(artworkData.artworkPath),
          title: data?.title || ''
        };
      }
      return { artworkPath: '', title: 'All Songs' };
    }
    case 'artist': {
      const data = await getArtistRelatedQueueInfo(Number(id));
      return {
        artworkPath: addFileUrlToPath(data?.artworks.at(0)?.artwork?.path),
        title: data?.name || ''
      };
    }
    case 'album': {
      const data = await getAlbumRelatedQueueInfo(Number(id));
      return {
        artworkPath: addFileUrlToPath(data?.artworks.at(0)?.artwork?.path),
        title: data?.title || ''
      };
    }
    case 'playlist': {
      const data = await getPlaylistRelatedQueueInfo(Number(id));
      return {
        artworkPath: addFileUrlToPath(data?.artworks.at(0)?.artwork?.path),
        title: data?.name || ''
      };
    }
    case 'genre': {
      const data = await getGenreRelatedQueueInfo(Number(id));
      return {
        artworkPath: addFileUrlToPath(data?.artworks.at(0)?.artwork?.path),
        title: data?.name || ''
      };
    }
    case 'folder': {
      const data = await getFolderRelatedQueueInfo(Number(id));
      return {
        artworkPath: '',
        title: data?.name || ''
      };
    }

    case 'favorites': {
      const artwork = getPlaylistArtworkPath('Favorites', false);
      return {
        artworkPath: artwork.artworkPath,
        title: 'Favorites'
      };
    }

    case 'history': {
      const artwork = getPlaylistArtworkPath('History', false);
      return {
        artworkPath: artwork.artworkPath,
        title: 'History'
      };
    }

    default:
      return undefined;
  }
};
