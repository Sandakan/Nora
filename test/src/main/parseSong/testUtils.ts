import { vi, expect } from 'vitest';
import type { Picture } from 'node-taglib-sharp';

/**
 * Mock song metadata factory for node-taglib-sharp File objects
 */
export function createMockSongMetadata(overrides: Partial<MockSongMetadata> = {}): MockFileObject {
  const defaults: MockSongMetadata = {
    title: 'Test Song',
    performers: ['Test Artist'],
    album: 'Test Album',
    albumArtists: [],
    genres: ['Test Genre'],
    year: 2023,
    disc: undefined,
    track: undefined,
    pictures: [],
    durationMilliseconds: 180000, // 3 minutes
    audioSampleRate: 44100,
    audioBitrate: 320,
    audioChannels: 2
  };

  const merged = { ...defaults, ...overrides };

  return {
    tag: {
      title: merged.title,
      performers: merged.performers,
      album: merged.album,
      albumArtists: merged.albumArtists,
      genres: merged.genres,
      year: merged.year,
      disc: merged.disc,
      track: merged.track,
      pictures: merged.pictures
    },
    properties: {
      durationMilliseconds: merged.durationMilliseconds,
      audioSampleRate: merged.audioSampleRate,
      audioBitrate: merged.audioBitrate,
      audioChannels: merged.audioChannels
    }
  };
}

/**
 * Create mock picture data for embedded artwork
 */
export function createMockPicture(size: 'small' | 'large' = 'small'): Picture {
  const dataSize = size === 'large' ? 10000 : 100;
  const mockData = new Uint8Array(dataSize).fill(255);

  return {
    data: {
      toByteArray: () => mockData
    },
    type: 3, // Front cover
    mimeType: 'image/jpeg',
    description: 'Cover'
  } as unknown as Picture;
}

/**
 * Create mock file stats
 */
export function createMockFileStats(overrides: Partial<MockFileStats> = {}) {
  return {
    birthtime: new Date('2023-01-01T00:00:00Z'),
    mtime: new Date('2023-06-15T12:30:00Z'),
    ...overrides
  };
}

/**
 * Create mock database transaction
 */
export function createMockTransaction() {
  return {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([]))
      }))
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([]))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([]))
    }))
  };
}

/**
 * Assertion helpers for common test scenarios
 */
export function expectDataUpdateEventCalled(
  mockFn: ReturnType<typeof vi.fn>,
  dataType: string,
  times = 1
) {
  expect(mockFn).toHaveBeenCalledTimes(times);
  if (times > 0) {
    expect(mockFn).toHaveBeenCalledWith(dataType, expect.anything());
  }
}

export function expectDataUpdateEventCalledWith(
  mockFn: ReturnType<typeof vi.fn>,
  dataType: string,
  ids: number[]
) {
  expect(mockFn).toHaveBeenCalledWith(dataType, ids);
}

export function expectMessageSentToRenderer(
  mockFn: ReturnType<typeof vi.fn>,
  messageCode: 'PARSE_SUCCESSFUL' | 'PARSE_FAILED',
  songName?: string
) {
  expect(mockFn).toHaveBeenCalledWith(
    expect.objectContaining({
      messageCode,
      data: expect.objectContaining({
        name: songName || expect.any(String)
      })
    })
  );
}

/**
 * Mock artwork data structure (2 items: full + optimized)
 */
export function createMockArtworkData() {
  return [
    {
      id: 1,
      path: 'artwork-full.webp',
      artworkType: 'LOCAL' as const,
      width: 1000,
      height: 1000
    },
    {
      id: 2,
      path: 'artwork-optimized.webp',
      artworkType: 'LOCAL' as const,
      width: 50,
      height: 50
    }
  ];
}

/**
 * Mock song data from database
 */
export function createMockSongData(overrides: Partial<MockSongData> = {}): MockSongData {
  return {
    id: 1,
    title: 'Test Song',
    duration: '180.00',
    year: 2023,
    path: '/test/path/song.mp3',
    sampleRate: 44100,
    bitRate: 320,
    noOfChannels: 2,
    diskNumber: undefined,
    trackNumber: undefined,
    fileCreatedAt: new Date('2023-01-01'),
    fileModifiedAt: new Date('2023-06-15'),
    folderId: undefined,
    isFavorite: false,
    isBlacklisted: false,
    createdAt: new Date('2023-01-01'),
    ...overrides
  };
}

/**
 * Mock album/artist/genre manager results
 */
export function createMockAlbumManagerResult(overrides: Partial<MockAlbumResult> = {}) {
  return {
    relevantAlbum: overrides.relevantAlbum || { id: 1, title: 'Test Album' },
    newAlbum: overrides.newAlbum || null,
    relevantAlbumArtists: overrides.relevantAlbumArtists || []
  };
}

export function createMockArtistManagerResult(overrides: Partial<MockArtistResult> = {}) {
  return {
    newArtists: overrides.newArtists || [],
    relevantArtists: overrides.relevantArtists || [{ id: 1, name: 'Test Artist' }]
  };
}

export function createMockGenreManagerResult(overrides: Partial<MockGenreResult> = {}) {
  return {
    newGenres: overrides.newGenres || [],
    relevantGenres: overrides.relevantGenres || [{ id: 1, name: 'Test Genre' }]
  };
}

// Type definitions
export interface MockSongMetadata {
  title: string;
  performers: string[];
  album: string;
  albumArtists: string[];
  genres: string[];
  year?: number;
  disc?: number;
  track?: number;
  pictures: Picture[];
  durationMilliseconds: number;
  audioSampleRate: number;
  audioBitrate: number;
  audioChannels: number;
}

export interface MockFileObject {
  tag: {
    title: string;
    performers: string[];
    album: string;
    albumArtists: string[];
    genres: string[];
    year?: number;
    disc?: number;
    track?: number;
    pictures: Picture[];
  };
  properties: {
    durationMilliseconds: number;
    audioSampleRate: number;
    audioBitrate: number;
    audioChannels: number;
  };
}

export interface MockFileStats {
  birthtime: Date;
  mtime: Date;
}

export interface MockSongData {
  id: number;
  title: string;
  duration: string;
  year?: number;
  path: string;
  sampleRate: number;
  bitRate?: number;
  noOfChannels: number;
  diskNumber?: number;
  trackNumber?: number;
  fileCreatedAt: Date;
  fileModifiedAt: Date;
  folderId?: number;
  isFavorite: boolean;
  isBlacklisted: boolean;
  createdAt: Date;
}

export interface MockAlbumResult {
  relevantAlbum: { id: number; title: string } | null;
  newAlbum: { id: number; title: string } | null;
  relevantAlbumArtists: Array<{ id: number; name: string }>;
}

export interface MockArtistResult {
  newArtists: Array<{ id: number; name: string }>;
  relevantArtists: Array<{ id: number; name: string }>;
}

export interface MockGenreResult {
  newGenres: Array<{ id: number; name: string }>;
  relevantGenres: Array<{ id: number; name: string }>;
}
