import { getArtistWithName } from '@main/db/queries/artists';

import logger from '../logger';
import updateSongId3Tags from '../updateSong/updateSongId3Tags';
import sendSongID3Tags from './sendSongMetadata';

const featArtistsRegex = /\(? ?feat.? (?<featArtists>[\w&, À-ÿ\d]+)\)?/gm;

const getArtist = async (
  name: string
): Promise<{
  name: string;
  artistId?: number;
}> => {
  const artist = await getArtistWithName(name);
  if (artist) return { name, artistId: artist.id };

  return { name };
};

const resolveFeaturingArtists = async (
  songId: number,
  featArtistNames: string[],
  removeFeatInfoInTitle = false
): Promise<UpdateSongDataResult> => {
  try {
    const songTags = await sendSongID3Tags(songId, true);

    const featArtists: SongTagsArtistData[] = await Promise.all(
      featArtistNames.map((featArtistName) => getArtist(featArtistName))
    );

    if (songTags?.artists) songTags?.artists.push(...featArtists);
    else songTags.artists = featArtists;

    if (removeFeatInfoInTitle) {
      const { title } = songTags;
      const featRemovedTitle = title.replace(featArtistsRegex, '').trim();

      songTags.title = featRemovedTitle;
    }

    const updatedData = await updateSongId3Tags(songId, songTags, true, true);

    logger.info(`Resolved suggestion of adding featured artists to the song`, {
      songId,
      songTitle: songTags.title,
      featArtists,
      removeFeatInfoInTitle
    });

    return updatedData;
  } catch (error) {
    logger.debug(`Error occurred when resolving featuring artists suggestion for for a song`, {
      songId,
      removeFeatInfoInTitle,
      error
    });
    return { success: false };
  }
};

export default resolveFeaturingArtists;
