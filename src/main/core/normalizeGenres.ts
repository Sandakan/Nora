export const normalizeGenres = (genres?: string[]): string[] => {
  if (!Array.isArray(genres) || genres.length === 0) return [];

  const splitGenres: string[] = [];
  const seen = new Set<string>();
  for (const genre of genres) {
    const parts = genre
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    for (const part of parts) {
      // Case-insensitive deduplication preserves first-seen order and prevents
      // duplicate genre links from violating the genresSongs composite key.
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      splitGenres.push(part);
    }
  }

  return splitGenres;
};
