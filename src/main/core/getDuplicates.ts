/* eslint-disable import/prefer-default-export */
import { getArtistArtworkPath } from '../fs/resolveFilePaths';
import { getArtistsData } from '../filesystem';

const withoutAccents = (str: string) => {
  const noAccents = str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

  return noAccents;
};

export const getArtistDuplicates = (artistName: string) => {
  const artists = getArtistsData();

  const duplicates: SavableArtist[] = [];

  for (const artist of artists) {
    const noAccentsName = withoutAccents(artist.name);
    const noAccentsArtistName = withoutAccents(artistName);
    const isADuplicate = noAccentsName === noAccentsArtistName;

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
