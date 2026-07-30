export const normalizeGenres = (genres?: string[]): string[] => {
  if (!Array.isArray(genres) || genres.length === 0) return [];

  const splitGenres: string[] = [];
  for (const genre of genres) {
    const parts = genre
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    splitGenres.push(...parts);
  }

  return splitGenres;
};
