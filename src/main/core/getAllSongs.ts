// import { getListeningData } from '../filesystem';
import { parseSongArtworks } from '@main/fs/resolveFilePaths';
import logger from '../logger';
import paginateData from '../utils/paginateData';
import { getAllSongs as getAllSavedSongs } from '@main/db/queries/songs';

const getAllSongs = async (
  sortType = 'aToZ' as SongSortTypes,
  filterType?: SongFilterTypes,
  paginatingData?: PaginatingData
) => {
  const songsData = await getAllSavedSongs();
  // const listeningData = getListeningData();

  let result = paginateData([] as AudioInfo[], sortType, paginatingData);

  if (songsData && songsData.length > 0) {
    const audioData: AudioInfo[] =
      // sortSongs(
      // filterSongs(songsData, filterType),
      // sortType,
      // listeningData
      // )

      songsData.map((song) => {
        // Artists
        const artists =
          song.artists?.map((a) => ({ artistId: String(a.artist.id), name: a.artist.name })) ?? [];

        // Album (pick first if multiple)
        const albumObj = song.albums?.[0]?.album;
        const album = albumObj ? { albumId: String(albumObj.id), name: albumObj.title } : undefined;

        // // Artworks (pick highest and lowest resolution)
        // let artworkPath = '';
        // let optimizedArtworkPath = '';
        // let isDefaultArtwork = true;
        // if (song.artworks && song.artworks.length > 0) {
        //   // Sort by resolution (width * height), fallback to 0 if missing
        //   const sortedArtworks = song.artworks
        //     .map((a) => a.artwork)
        //     .filter((a) => !!a)
        //     .sort((a, b) => {
        //       const aRes = a.width * a.height;
        //       const bRes = b.width * b.height;

        //       return aRes - bRes;
        //     });
        //   if (sortedArtworks.length > 0) {
        //     isDefaultArtwork = false;
        //     optimizedArtworkPath = sortedArtworks[0]?.path ?? '';
        //     artworkPath = sortedArtworks[sortedArtworks.length - 1]?.path ?? '';
        //   }
        // }
        // const artworkPaths = {
        //   isDefaultArtwork,
        //   artworkPath,
        //   optimizedArtworkPath
        // };

        // Blacklist
        const isBlacklisted = !!song.blacklist;
        // Track number
        const trackNo = song.trackNumber ?? undefined;
        // Added date
        const addedDate = song.createdAt ? new Date(song.createdAt).getTime() : 0;
        // isAFavorite: You must join your favorites table if you have one. Here we default to false.
        const isAFavorite = false;
        // Palette data: You must join palettes if you want this. Here we default to undefined.
        const paletteData = undefined;

        return {
          title: song.title,
          artists,
          album,
          duration: Number(song.duration),
          artworkPaths: parseSongArtworks(song.artworks.map((a) => a.artwork)),
          path: song.path,
          songId: String(song.id),
          addedDate,
          isAFavorite,
          year: song.year ?? undefined,
          paletteData,
          isBlacklisted,
          trackNo
        };
      });

    result = paginateData(audioData, sortType, paginatingData);
  }

  logger.debug(`Sending data related to all the songs`, {
    sortType,
    filterType,
    start: result.start,
    end: result.end
  });
  return result;
};

export default getAllSongs;
