function filterArtists<T extends (Artist | SavableArtist)[]>(
  data: T,
  filterType?: ArtistFilterTypes
): T {
  if (data && data.length > 0 && filterType) {
    if (filterType === 'notSelected') return data;

    if (filterType === 'favorites') return data.filter((song) => song.isAFavorite) as T;
  }

  return data;
}

export default filterArtists;
