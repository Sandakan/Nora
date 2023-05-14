import updateSongId3Tags from '../updateSongId3Tags';
import sendSongID3Tags from './sendSongId3Tags';
import { getArtistsData } from '../filesystem';
import log from '../log';

const featArtistsRegex = /\(? ?feat.? (?<featArtists>[\w&, À-ÿ\d]+)\)?/gm;

const getArtist = (
  name: string
): {
  name: string;
  artistId?: string;
} => {
  const artists = getArtistsData();
  const lowerCasedName = name.toLowerCase();

  for (const artist of artists) {
    if (artist.name.toLowerCase() === lowerCasedName)
      return { name, artistId: artist.artistId };
  }
  return { name };
};

const resolveFeaturingArtists = async (
  songId: string,
  featArtistNames: string[],
  removeFeatInfoInTitle = false
): Promise<UpdateSongDataResult> => {
  try {
    const songTags = await sendSongID3Tags(songId, true);

    const featArtists: SongTagsArtistData[] = featArtistNames.map(
      (featArtistName) => getArtist(featArtistName)
    );

    if (songTags?.artists) songTags?.artists.push(...featArtists);
    else songTags.artists = featArtists;

    if (removeFeatInfoInTitle) {
      const { title } = songTags;
      const featRemovedTitle = title.replace(featArtistsRegex, '').trim();

      songTags.title = featRemovedTitle;
    }

    const updatedData = await updateSongId3Tags(songId, songTags, true, true);

    log(
      `Resolved suggestion add featuring artists to the song '${songTags.title}'.`
    );

    return updatedData;
  } catch (error) {
    log(
      `Error occurred when resolving featuring artists suggestion for for a song`,
      { songId, removeFeatInfoInTitle, error }
    );
    throw error;
  }
};

export default resolveFeaturingArtists;
