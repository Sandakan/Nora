import { getAllArtists } from '@main/db/queries/artists';

import { convertToArtist } from '../utils/convert';

const withoutAccents = (str: string) => {
  const noAccents = str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

  return noAccents;
};

export const getArtistDuplicates = async (artistName: string) => {
  const artistsResponse = await getAllArtists({});
  const artists = artistsResponse.data.map(convertToArtist);

  const duplicates: Artist[] = [];

  for (const artist of artists) {
    const noAccentsName = withoutAccents(artist.name);
    const noAccentsArtistName = withoutAccents(artistName);
    const isADuplicate = noAccentsName === noAccentsArtistName;

    if (isADuplicate) duplicates.push(artist);
  }

  return duplicates;
};
