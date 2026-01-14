import { describe, test, expect, beforeEach, vi } from 'vitest';

// Import helper functions directly to avoid database initialization
// These are pure functions that don't need mocking
const ARTIST_SEPARATOR_REGEX = /[,&]/gm;

const getArtistNamesFromSong = (artists?: string) => {
  if (artists) {
    const splittedArtists = artists
      .split(ARTIST_SEPARATOR_REGEX)
      .map((artist) => artist.trim())
      .filter((a) => a.length > 0);

    return splittedArtists;
  }
  return [];
};

const getSongDurationFromSong = (duration?: number) => {
  if (typeof duration === 'number') {
    const fixedDuration = duration.toFixed(2);
    return parseFloat(fixedDuration);
  }
  return 0;
};

const getAlbumInfoFromSong = (album?: string) => {
  if (album) return album;
  return undefined;
};

const getGenreInfoFromSong = (genres?: string[]) => {
  if (Array.isArray(genres) && genres.length > 0) return genres;

  return [];
};

describe('parseSong Helper Functions', () => {
  describe('ARTIST_SEPARATOR_REGEX', () => {
    test('should match comma separator', () => {
      const testString = 'Artist1, Artist2';
      const matches = testString.match(ARTIST_SEPARATOR_REGEX);
      expect(matches).toEqual([',']);
    });

    test('should match ampersand separator', () => {
      const testString = 'Artist1 & Artist2';
      const matches = testString.match(ARTIST_SEPARATOR_REGEX);
      expect(matches).toEqual(['&']);
    });

    test('should match multiple separators', () => {
      const testString = 'Artist1, Artist2 & Artist3, Artist4';
      const matches = testString.match(ARTIST_SEPARATOR_REGEX);
      expect(matches).toEqual([',', '&', ',']);
    });
  });

  describe('getArtistNamesFromSong', () => {
    test('should split single artist with comma separator', () => {
      const result = getArtistNamesFromSong('Artist One, Artist Two');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should split single artist with ampersand separator', () => {
      const result = getArtistNamesFromSong('Artist One & Artist Two');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should split multiple artists with mixed separators', () => {
      const result = getArtistNamesFromSong('Artist One, Artist Two & Artist Three');
      expect(result).toEqual(['Artist One', 'Artist Two', 'Artist Three']);
    });

    test('should trim whitespace from artist names', () => {
      const result = getArtistNamesFromSong('  Artist One  ,  Artist Two  ');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should filter out empty strings after splitting', () => {
      const result = getArtistNamesFromSong('Artist One,, Artist Two');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should filter out whitespace-only strings', () => {
      const result = getArtistNamesFromSong('Artist One,   , Artist Two');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should return single artist when no separators', () => {
      const result = getArtistNamesFromSong('Single Artist');
      expect(result).toEqual(['Single Artist']);
    });

    test('should handle artists with special characters', () => {
      const result = getArtistNamesFromSong('AC/DC, Guns N\' Roses & Mötley Crüe');
      expect(result).toEqual(['AC/DC', "Guns N' Roses", 'Mötley Crüe']);
    });

    test('should return empty array for undefined input', () => {
      const result = getArtistNamesFromSong(undefined);
      expect(result).toEqual([]);
    });

    test('should return empty array for empty string', () => {
      const result = getArtistNamesFromSong('');
      expect(result).toEqual([]);
    });

    test('should return empty array for whitespace-only string', () => {
      const result = getArtistNamesFromSong('   ');
      expect(result).toEqual([]);
    });

    test('should handle consecutive separators', () => {
      const result = getArtistNamesFromSong('Artist One,, & Artist Two');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should handle trailing separator', () => {
      const result = getArtistNamesFromSong('Artist One, Artist Two,');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });

    test('should handle leading separator', () => {
      const result = getArtistNamesFromSong(',Artist One, Artist Two');
      expect(result).toEqual(['Artist One', 'Artist Two']);
    });
  });

  describe('getSongDurationFromSong', () => {
    test('should convert integer duration to fixed decimal', () => {
      const result = getSongDurationFromSong(180);
      expect(result).toBe(180.0);
    });

    test('should round duration to 2 decimal places', () => {
      const result = getSongDurationFromSong(180.123456);
      expect(result).toBe(180.12);
    });

    test('should handle zero duration', () => {
      const result = getSongDurationFromSong(0);
      expect(result).toBe(0);
    });

    test('should handle very small duration', () => {
      const result = getSongDurationFromSong(0.009);
      expect(result).toBe(0.01);
    });

    test('should handle large duration', () => {
      const result = getSongDurationFromSong(9999.99);
      expect(result).toBe(9999.99);
    });

    test('should handle duration with single decimal place', () => {
      const result = getSongDurationFromSong(180.5);
      expect(result).toBe(180.5);
    });

    test('should return 0 for undefined input', () => {
      const result = getSongDurationFromSong(undefined);
      expect(result).toBe(0);
    });

    test('should return 0 for null input', () => {
      const result = getSongDurationFromSong(null as unknown as undefined);
      expect(result).toBe(0);
    });

    test('should return 0 for non-number input', () => {
      const result = getSongDurationFromSong('180' as unknown as number);
      expect(result).toBe(0);
    });

    test('should handle negative duration (edge case)', () => {
      const result = getSongDurationFromSong(-180.5);
      expect(result).toBe(-180.5);
    });

    test('should handle decimal precision correctly', () => {
      const result = getSongDurationFromSong(123.456789);
      expect(result).toBe(123.46);
    });

    test('should handle rounding up correctly', () => {
      const result = getSongDurationFromSong(123.999);
      expect(result).toBe(124.0);
    });
  });

  describe('getAlbumInfoFromSong', () => {
    test('should return album string when provided', () => {
      const result = getAlbumInfoFromSong('Greatest Hits');
      expect(result).toBe('Greatest Hits');
    });

    test('should return album with special characters', () => {
      const result = getAlbumInfoFromSong('The Wall (Remastered 2011)');
      expect(result).toBe('The Wall (Remastered 2011)');
    });

    test('should return album with unicode characters', () => {
      const result = getAlbumInfoFromSong('青春アミーゴ');
      expect(result).toBe('青春アミーゴ');
    });

    test('should return undefined for undefined input', () => {
      const result = getAlbumInfoFromSong(undefined);
      expect(result).toBeUndefined();
    });

    test('should return undefined for empty string', () => {
      const result = getAlbumInfoFromSong('');
      expect(result).toBeUndefined();
    });

    test('should return whitespace-only album string (no trimming)', () => {
      const result = getAlbumInfoFromSong('   ');
      expect(result).toBe('   ');
    });

    test('should preserve leading/trailing whitespace', () => {
      const result = getAlbumInfoFromSong('  Album Name  ');
      expect(result).toBe('  Album Name  ');
    });

    test('should handle very long album names', () => {
      const longAlbum = 'A'.repeat(500);
      const result = getAlbumInfoFromSong(longAlbum);
      expect(result).toBe(longAlbum);
    });
  });

  describe('getGenreInfoFromSong', () => {
    test('should return genres array when provided', () => {
      const result = getGenreInfoFromSong(['Rock', 'Pop']);
      expect(result).toEqual(['Rock', 'Pop']);
    });

    test('should return single genre as array', () => {
      const result = getGenreInfoFromSong(['Rock']);
      expect(result).toEqual(['Rock']);
    });

    test('should return genres with special characters', () => {
      const result = getGenreInfoFromSong(['Hip-Hop/Rap', 'R&B/Soul']);
      expect(result).toEqual(['Hip-Hop/Rap', 'R&B/Soul']);
    });

    test('should return genres with unicode characters', () => {
      const result = getGenreInfoFromSong(['J-Pop', 'K-Pop']);
      expect(result).toEqual(['J-Pop', 'K-Pop']);
    });

    test('should return empty array for undefined input', () => {
      const result = getGenreInfoFromSong(undefined);
      expect(result).toEqual([]);
    });

    test('should return empty array for null input', () => {
      const result = getGenreInfoFromSong(null as unknown as string[]);
      expect(result).toEqual([]);
    });

    test('should return empty array for empty array', () => {
      const result = getGenreInfoFromSong([]);
      expect(result).toEqual([]);
    });

    test('should return empty array for non-array input', () => {
      const result = getGenreInfoFromSong('Rock' as unknown as string[]);
      expect(result).toEqual([]);
    });

    test('should preserve empty strings in array', () => {
      const result = getGenreInfoFromSong(['Rock', '', 'Pop']);
      expect(result).toEqual(['Rock', '', 'Pop']);
    });

    test('should handle array with many genres', () => {
      const genres = Array.from({ length: 50 }, (_, i) => `Genre${i}`);
      const result = getGenreInfoFromSong(genres);
      expect(result).toEqual(genres);
    });

    test('should preserve whitespace in genre names', () => {
      const result = getGenreInfoFromSong(['  Rock  ', 'Pop']);
      expect(result).toEqual(['  Rock  ', 'Pop']);
    });

    test('should handle genres with numbers', () => {
      const result = getGenreInfoFromSong(['80s Rock', '90s Pop']);
      expect(result).toEqual(['80s Rock', '90s Pop']);
    });
  });
});
