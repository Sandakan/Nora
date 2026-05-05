import { db } from '../db';
export const getSongRelatedQueueInfo = async (songId: number) => {
  const data = await db.query.songs.findFirst({
    where: (songs, { eq }) => eq(songs.id, songId),
    columns: {
      title: true
    },
    with: {
      artworks: {
        with: {
          artwork: true
        }
      }
    }
  });

  return data;
};

export const getArtistRelatedQueueInfo = async (artistId: number) => {
  const data = await db.query.artists.findFirst({
    where: (artists, { eq }) => eq(artists.id, artistId),
    columns: {
      name: true
    },
    with: {
      artworks: {
        with: {
          artwork: true
        }
      }
    }
  });

  return data;
};

export const getAlbumRelatedQueueInfo = async (albumId: number) => {
  const data = await db.query.albums.findFirst({
    where: (albums, { eq }) => eq(albums.id, albumId),
    columns: {
      title: true
    },
    with: {
      artworks: {
        with: {
          artwork: true
        }
      }
    }
  });

  return data;
};

export const getPlaylistRelatedQueueInfo = async (playlistId: number) => {
  const data = await db.query.playlists.findFirst({
    where: (playlists, { eq }) => eq(playlists.id, playlistId),
    columns: {
      name: true
    },
    with: {
      artworks: {
        with: {
          artwork: true
        }
      }
    }
  });

  return data;
};

export const getGenreRelatedQueueInfo = async (genreId: number) => {
  const data = await db.query.genres.findFirst({
    where: (genres, { eq }) => eq(genres.id, genreId),
    columns: {
      name: true
    },
    with: {
      artworks: {
        with: {
          artwork: true
        }
      }
    }
  });

  return data;
};

export const getFolderRelatedQueueInfo = async (folderId: number) => {
  const data = await db.query.musicFolders.findFirst({
    where: (musicFolders, { eq }) => eq(musicFolders.id, folderId),
    columns: {
      name: true
    }
  });

  return data;
};
