/* eslint-disable no-await-in-loop */
/* eslint-disable import/prefer-default-export */
import updateSongId3Tags from '../updateSongId3Tags';
import {
  getAlbumsData,
  getArtistsData,
  getSongsData,
  setAlbumsData,
  setSongsData,
} from '../filesystem';
import sendSongID3Tags from './sendSongId3Tags';

export const getSelectedArtist = (artistIdOrName: string) => {
  const artists = getArtistsData();

  for (let index = 0; index < artists.length; index += 1) {
    const artist = artists[index];

    if (artist.artistId === artistIdOrName || artist.name === artistIdOrName)
      return { artist, index };
  }
  return undefined;
};

export const resolveArtistDuplicates = async (
  selectedArtistId: string,
  duplicateIds: string[]
) => {
  const artists = getArtistsData();
  const songs = getSongsData();
  const albums = getAlbumsData();

  const selectedArtist = getSelectedArtist(selectedArtistId)?.artist;

  if (selectedArtist) {
    for (const artist of artists) {
      // check if artist is a duplicate
      if (duplicateIds.includes(artist.artistId)) {
        // get songs of the duplicate artist
        const artistSongs = artist.songs;
        // copy all the songs from the duplicate artist to the selected artist.
        selectedArtist?.songs.push(...artistSongs);

        const artistAlbums = artist.albums || [];

        // loop through albums
        for (const album of albums) {
          // check if the albums are linked to the duplicate artist
          if (
            artistAlbums.some(
              (artistAlbum) => artistAlbum.albumId === album.albumId
            )
          ) {
            if (album.artists) {
              album.artists = album.artists!.filter(
                (songArtist) => songArtist.artistId !== artist.artistId
              );
            } else album.artists = [];

            album.artists?.push({
              artistId: selectedArtist.artistId,
              name: selectedArtist.name,
            });
          }
        }

        // loop through songs
        for (const song of songs) {
          // check if the songs are linked to a duplicate artist
          if (
            artistSongs.some((artistSong) => artistSong.songId === song.songId)
          ) {
            // get song tags
            const songTags = await sendSongID3Tags(song.songId, true);

            if (songTags.artists) {
              songTags.artists = songTags.artists.filter(
                (songArtist) => songArtist.artistId !== artist.artistId
              );
            } else songTags.artists = [];

            songTags.artists?.push({
              ...selectedArtist,
            });

            await updateSongId3Tags(song.songId, songTags, false, true);
          }
        }
      }
    }

    setSongsData(songs);
    setAlbumsData(albums);
  }
};
