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

export const getSelectedArtist = (artistId: string) => {
  const artists = getArtistsData();

  for (const artist of artists) {
    if (artist.artistId === artistId) return artist;
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

  const selectedArtist = getSelectedArtist(selectedArtistId);

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
        for (let x = 0; x < albums.length; x += 1) {
          // check if the albums are linked to the duplicate artist
          if (
            artistAlbums.some(
              (artistAlbum) => artistAlbum.albumId === albums[x].albumId
            )
          ) {
            if (albums[x].artists) {
              albums[x].artists = albums[x].artists!.filter(
                (songArtist) => songArtist.artistId !== artist.artistId
              );
            } else albums[x].artists = [];

            albums[x].artists?.push({
              artistId: selectedArtist.artistId,
              name: selectedArtist.name,
            });
          }
        }

        // loop through songs
        for (let x = 0; x < songs.length; x += 1) {
          // check if the songs are linked to a duplicate artist
          if (
            artistSongs.some(
              (artistSong) => artistSong.songId === songs[x].songId
            )
          ) {
            // get song tags
            const songTags = await sendSongID3Tags(songs[x].songId, true);

            if (songTags.artists) {
              songTags.artists = songTags.artists.filter(
                (songArtist) => songArtist.artistId !== artist.artistId
              );
            } else songTags.artists = [];

            songTags.artists?.push({
              ...selectedArtist,
            });

            await updateSongId3Tags(songs[x].songId, songTags, false, true);
          }
        }
      }
    }

    setSongsData(songs);
    setAlbumsData(albums);
  }
};
