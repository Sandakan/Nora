import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import logger from '../logger';
import updateSongId3Tags from '../updateSong/updateSongId3Tags';
import {
  getAlbumsData,
  getArtistsData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setSongsData
} from '../filesystem';
import { getSelectedArtist } from './resolveDuplicates';
import sendSongID3Tags from './sendSongMetadata';

export const resolveSeparateArtists = async (
  separateArtistId: number,
  separateArtistNames: string[]
) => {
  let updatedData: UpdateSongDataResult | undefined;

  let artistsData = getArtistsData();
  const songsData = getSongsData();
  const albumsData = getAlbumsData();

  const selectedArtistData = getSelectedArtist(separateArtistId);
  const selectedArtistSongIds = selectedArtistData?.artist?.songs.map((x) => x.songId);

  if (selectedArtistData) {
    const selectedArtist = selectedArtistData.artist;

    const availArtists: SavableArtist[] = [];
    const newArtists: SavableArtist[] = [];

    // ARTISTS
    for (const artistName of separateArtistNames) {
      const artistData = getSelectedArtist(artistName);

      if (artistData && artistsData[artistData.index]) {
        artistsData[artistData.index].songs.push(...selectedArtist.songs);
        availArtists.push(artistsData[artistData.index]);
      } else
        newArtists.push({
          artistId: Math.floor(Math.random() * 1000000),
          isAFavorite: false,
          name: artistName,
          songs: selectedArtist?.songs,
          artworkName: selectedArtist.artworkName,
          albums: selectedArtist.albums
        });
    }

    artistsData = artistsData.filter((x) => x.artistId !== selectedArtist.artistId);

    artistsData.push(...newArtists);

    // ALBUMS
    for (const album of albumsData) {
      if (album?.artists?.some((x) => x.artistId === selectedArtist.artistId)) {
        album.artists = album.artists!.filter((x) => {
          if (x.artistId === selectedArtist.artistId) return false;
          if (availArtists.some((y) => y.artistId === x.artistId)) return false;
          return true;
        });

        album.artists!.push(
          ...newArtists.concat(availArtists).map((x) => ({ artistId: x.artistId, name: x.name }))
        );
      }
    }

    // SONGS
    for (const song of songsData) {
      if (selectedArtistSongIds?.includes(song.songId)) {
        if (song.artists) {
          const songTags = await sendSongID3Tags(song.songId, true);

          song.artists = song.artists!.filter((x) => {
            if (x.artistId === selectedArtist.artistId) return false;
            if (availArtists.some((y) => y.artistId === x.artistId)) return false;
            return true;
          });

          if (songTags.artists) {
            songTags.artists = songTags.artists.filter((x) => {
              if (x.artistId === selectedArtist.artistId) return false;
              if (availArtists.some((y) => y.artistId === x.artistId)) return false;
              return true;
            });

            songTags.artists.push(
              ...(newArtists.concat(availArtists).map((x) => {
                return {
                  name: x.name,
                  artistId: x.artistId,
                  artworkPath: getArtistArtworkPath(x.artworkName).artworkPath,
                  onlineArtworkPaths: x.onlineArtworkPaths
                };
              }) as typeof songTags.artists)
            );
          }

          song.artists!.push(
            ...newArtists.concat(availArtists).map((x) => ({
              artistId: x.artistId,
              name: x.name
            }))
          );

          updatedData = await updateSongId3Tags(song.songId, songTags, true, true);
        }
      }
    }

    setArtistsData(artistsData);
    setSongsData(songsData);
    setAlbumsData(albumsData);

    logger.debug(`Resolved suggestion to separate artist`, {
      separateArtistId,
      separateArtistNames
    });
  }
  return updatedData;
};
