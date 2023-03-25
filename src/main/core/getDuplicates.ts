/* eslint-disable import/prefer-default-export */
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import { getArtistsData } from '../filesystem';

const withoutAccents = (str: string) => {
  const noAccents = str.normalize('NFD').replace(/\p{Diacritic}/gu, '');

  return noAccents;
};

export const getArtistDuplicates = (artistName: string) => {
  const artists = getArtistsData();
  const regex = new RegExp(artistName, 'gi');

  const duplicates: SavableArtist[] = [];

  for (const artist of artists) {
    const noAccentsName = withoutAccents(artist.name);
    const isADuplicate = regex.test(noAccentsName);

    if (isADuplicate) duplicates.push(artist);
  }

  const duplicateArtists = duplicates.map(
    (artist): Artist => ({
      ...artist,
      artworkPaths: getArtistArtworkPath(artist.artworkName),
    })
  );

  return duplicateArtists;
};
