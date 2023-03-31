/* eslint-disable no-await-in-loop */
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import log from '../log';
import updateSongId3Tags from '../updateSongId3Tags';
import {
  getAlbumsData,
  getArtistsData,
  getSongsData,
  setAlbumsData,
  setArtistsData,
  setSongsData,
} from '../filesystem';
import { generateRandomId } from '../utils/randomId';
import { getSelectedArtist } from './resolveDuplicates';
import sendSongID3Tags from './sendSongId3Tags';

/* eslint-disable import/prefer-default-export */
export const resolveSeparateArtists = async (
  separateArtistId: string,
  separateArtistNames: string[]
) => {
  let artistData = getArtistsData();
  const songData = getSongsData();
  const albumData = getAlbumsData();

  const selectedArtist = getSelectedArtist(separateArtistId);
  const selectedArtistSongIds = selectedArtist?.songs.map((x) => x.songId);

  if (selectedArtist) {
    const newArtists = separateArtistNames.map((artistName): SavableArtist => {
      return {
        artistId: generateRandomId(),
        isAFavorite: false,
        name: artistName,
        songs: selectedArtist?.songs,
        artworkName: selectedArtist.artworkName,
        albums: selectedArtist.albums,
      };
    });

    artistData = artistData.filter(
      (x) => x.artistId !== selectedArtist.artistId
    );
    artistData.push(...newArtists);

    for (let i = 0; i < songData.length; i += 1) {
      if (selectedArtistSongIds?.includes(songData[i].songId)) {
        if (songData[i].artists) {
          const songTags = await sendSongID3Tags(songData[i].songId, true);

          songData[i].artists = songData[i].artists!.filter(
            (x) => x.artistId !== selectedArtist.artistId
          );

          if (songTags.artists) {
            songTags.artists = songTags.artists.filter(
              (x) => x.artistId !== selectedArtist.artistId
            );

            songTags.artists.push(
              ...(newArtists.map((x) => {
                return {
                  name: x.name,
                  artistId: x.artistId,
                  artworkPath: getArtistArtworkPath(x.artworkName).artworkPath,
                  onlineArtworkPaths: x.onlineArtworkPaths,
                };
              }) as typeof songTags.artists)
            );
          }

          songData[i].artists!.push(
            ...newArtists.map((x) => ({ artistId: x.artistId, name: x.name }))
          );

          await updateSongId3Tags(songData[i].songId, songTags, false, true);
        }
      }
    }

    for (let i = 0; i < albumData.length; i += 1) {
      if (
        albumData[i]?.artists?.some(
          (x) => x.artistId === selectedArtist.artistId
        )
      ) {
        albumData[i].artists = albumData[i].artists!.filter(
          (x) => x.artistId !== selectedArtist.artistId
        );
        albumData[i].artists!.push(
          ...newArtists.map((x) => ({ artistId: x.artistId, name: x.name }))
        );
      }
    }

    setArtistsData(artistData);
    setSongsData(songData);
    setAlbumsData(albumData);

    log(`Resolved suggestion to separate artist ${selectedArtist.name}`);
  }
};
