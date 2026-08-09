import { describe, expect, it, vi } from 'vitest';

vi.mock('@main/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

// Module-level prepared queries (songSearchPreparedQuery, etc.) are built at
// import time - the db mock needs a chainable selectDistinct so loading the
// module does not crash. The fake trx passed to each test handles the calls
// under test.
vi.mock('@db/db', () => ({
  db: (() => {
    const chainableFn = () => ({
      selectDistinct: () => chainableFn(),
      from: () => chainableFn(),
      where: () => chainableFn(),
      limit: () => chainableFn(),
      prepare: () => ({ execute: async () => [] }),
      select: () => chainableFn()
    });
    return chainableFn();
  })()
}));

vi.mock('@main/utils/measureTimeUsage', () => ({
  timeStart: vi.fn(() => 0),
  timeEnd: vi.fn()
}));

// convertToSongData pulls in heavy modules at import time - stub the two file-side
// helpers it uses so the test can focus on the query shape.
vi.mock('@main/core/getAllSongs', () => ({
  parsePaletteFromArtworks: vi.fn(() => undefined)
}));

vi.mock('@main/fs/resolveFilePaths', () => ({
  parseSongArtworks: vi.fn(() => ({
    artworkPaths: { image: [], thumbnail: [] },
    artworkColors: [],
    isArtworkAvailable: false
  })),
  parseAlbumArtworks: vi.fn(),
  parseArtistArtworks: vi.fn(),
  parseArtistOnlineArtworks: vi.fn(),
  parseGenreArtworks: vi.fn(),
  parsePlaylistArtworks: vi.fn()
}));

import { searchSongsByLyrics } from '@main/db/queries/search';

const songRow = {
  id: 1,
  title: 'Never Gonna Give You Up',
  titleCI: 'never gonna give you up',
  duration: '213.5',
  skipCount: 0,
  path: '/music/rick.mp3',
  isFavorite: false,
  sampleRate: 44100,
  bitRate: 320,
  noOfChannels: 2,
  year: 1987,
  diskNumber: 1,
  trackNumber: 2,
  folderId: 1,
  isBlacklisted: false,
  isBlacklistedUpdatedAt: new Date(),
  isFavoriteUpdatedAt: new Date(),
  fileCreatedAt: new Date(),
  fileModifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  artists: [{ artist: { id: 10, name: 'Rick Astley' } }],
  albums: [
    {
      album: {
        id: 20,
        title: 'Whenever You Need Somebody',
        artists: [{ artist: { id: 10, name: 'Rick Astley' } }]
      }
    }
  ],
  genres: [{ genre: { id: 30, name: 'Pop' } }],
  artworks: [
    {
      artwork: {
        id: 40,
        path: '/music/cover.jpg',
        source: 'LOCAL',
        width: 600,
        height: 600,
        createdAt: new Date(),
        updatedAt: new Date(),
        palette: { id: 50, swatches: [] }
      }
    }
  ],
  playlists: [{ playlist: { id: 60, name: 'Favorites' } }]
};

const createTrx = (matches: unknown[], songRows: unknown[]) => ({
  select: () => ({
    from: () => ({
      where: () => ({
        orderBy: () => ({
          limit: async () => matches
        })
      })
    })
  }),
  query: {
    songs: {
      findMany: vi.fn(async () => songRows)
    }
  }
});

describe('searchSongsByLyrics', () => {
  it('returns songs with populated artists and artworks (full relation shape)', async () => {
    const trx = createTrx(
      [{ songId: 1, snippet: '\u0001Never gonna\u0002', source: 'LRC' }],
      [songRow]
    );

    const results = await searchSongsByLyrics(
      { keyword: 'never gonna', isSimilaritySearchEnabled: true },
      trx as never
    );

    expect(results).toHaveLength(1);
    expect(trx.query.songs.findMany).toHaveBeenCalledOnce();
    expect(results[0].matchedLyricSnippet).toBe('\u0001Never gonna\u0002');
    expect(results[0].source).toBe('LRC');
    expect(results[0].song.artists).toEqual([{ artistId: 10, name: 'Rick Astley' }]);
    expect(results[0].song.genres).toEqual([{ genreId: 30, name: 'Pop' }]);
    expect(results[0].song.album).toEqual({
      albumId: 20,
      name: 'Whenever You Need Somebody'
    });
    expect(results[0].song.isArtworkAvailable).toBe(true);
    expect(results[0].song.artworkPaths).toBeDefined();
  });

  it('returns empty array when no lyric matches', async () => {
    const trx = createTrx([], []);

    const results = await searchSongsByLyrics(
      { keyword: 'no such lyrics', isSimilaritySearchEnabled: true },
      trx as never
    );

    expect(results).toEqual([]);
    expect(trx.query.songs.findMany).not.toHaveBeenCalled();
  });

  it('preserves lyric rank order and skips songs missing from the relation query', async () => {
    const trx = createTrx(
      [
        { songId: 2, snippet: 'snippet-2', source: 'EMBEDDED' },
        { songId: 1, snippet: 'snippet-1', source: 'LRC' },
        { songId: 3, snippet: 'snippet-3', source: 'BOTH' }
      ],
      [
        { ...songRow, id: 1 },
        { ...songRow, id: 2 }
      ]
    );

    const results = await searchSongsByLyrics(
      { keyword: 'rank check', isSimilaritySearchEnabled: true },
      trx as never
    );

    expect(results.map((r) => r.song.songId)).toEqual([2, 1]);
    expect(results.map((r) => r.source)).toEqual(['EMBEDDED', 'LRC']);
  });
});