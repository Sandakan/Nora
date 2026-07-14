import { describe, test, expect } from 'vitest';

import addMissingPropsToAnObject from '@renderer/utils/addMissingPropsToAnObject';

const TEMPLATE: LocalStorage = {
  preferences: {
    seekbarScrollInterval: 5,
    isSongIndexingEnabled: false,
    disableBackgroundArtworks: true,
    doNotShowBlacklistSongConfirm: false,
    doNotVerifyWhenOpeningLinks: false,
    isReducedMotion: false,
    showArtistArtworkNearSongControls: false,
    showSongRemainingTime: false,
    noUpdateNotificationForNewUpdate: '',
    defaultPageOnStartUp: 'Home',
    enableArtworkFromSongCovers: false,
    shuffleArtworkFromSongCovers: false,
    removeAnimationsOnBatteryPower: false,
    isSimilaritySearchEnabled: true,
    lyricsAutomaticallySaveState: 'NONE',
    showTrackNumberAsSongIndex: true,
    allowToPreventScreenSleeping: true,
    enableImageBasedDynamicThemes: false,
    doNotShowHelpPageOnLyricsEditorStartUp: false,
    autoTranslateLyrics: false,
    autoConvertLyrics: false
  },
  playback: {
    currentSong: { songId: null, stoppedPosition: 0 },
    isRepeating: 'false',
    isShuffling: false,
    volume: { isMuted: false, value: 50 },
    playbackRate: 1.0
  },
  queue: { position: 0, songIds: [] },
  sortingStates: {
    albumsPage: 'aToZ',
    artistsPage: 'aToZ',
    genresPage: 'aToZ',
    playlistsPage: 'aToZ',
    songsPage: 'aToZ',
    musicFoldersPage: 'aToZ',
    playlistDetailPage: 'addedOrder',
    albumDetailPage: 'trackNoDescending',
    genreDetailPage: 'aToZ',
    artistDetailPage: 'aToZ'
  },
  equalizerPreset: {
    thirtyTwoHertzFilter: 0,
    sixtyFourHertzFilter: 0,
    hundredTwentyFiveHertzFilter: 0,
    twoHundredFiftyHertzFilter: 0,
    fiveHundredHertzFilter: 0,
    thousandHertzFilter: 0,
    twoThousandHertzFilter: 0,
    fourThousandHertzFilter: 0,
    eightThousandHertzFilter: 0,
    sixteenThousandHertzFilter: 0
  },
  lyricsEditorSettings: {
    offset: 0,
    editNextAndCurrentStartAndEndTagsAutomatically: true
  },
  keyboardShortcuts: []
};

describe('addMissingPropsToAnObject with sortingStates', () => {
  test('should fill in missing detail page sorting keys when loading old localStorage', () => {
    const oldStorage = {
      ...TEMPLATE,
      sortingStates: {
        albumsPage: 'aToZ' as const,
        artistsPage: 'aToZ' as const,
        genresPage: 'aToZ' as const,
        playlistsPage: 'aToZ' as const,
        songsPage: 'aToZ' as const,
        musicFoldersPage: 'aToZ' as const
      }
    };

    const onMissing = (key: string) => {
      expect(['playlistDetailPage', 'albumDetailPage', 'genreDetailPage', 'artistDetailPage']).toContain(key);
    };

    const result = addMissingPropsToAnObject(TEMPLATE, oldStorage, onMissing);
    expect(result.sortingStates).toHaveProperty('playlistDetailPage', 'addedOrder');
    expect(result.sortingStates).toHaveProperty('albumDetailPage', 'trackNoDescending');
    expect(result.sortingStates).toHaveProperty('genreDetailPage', 'aToZ');
    expect(result.sortingStates).toHaveProperty('artistDetailPage', 'aToZ');
    expect(Object.keys(result.sortingStates)).toHaveLength(10);
  });

  test('should preserve existing detail page sorting keys when present', () => {
    const currentStorage = {
      ...TEMPLATE,
      sortingStates: {
        songsPage: 'aToZ' as const,
        artistsPage: 'aToZ' as const,
        playlistsPage: 'aToZ' as const,
        albumsPage: 'aToZ' as const,
        genresPage: 'aToZ' as const,
        musicFoldersPage: 'aToZ' as const,
        playlistDetailPage: 'artistNameAscending' as const,
        albumDetailPage: 'releasedYearDescending' as const,
        genreDetailPage: 'dateAddedDescending' as const,
        artistDetailPage: 'trackNoAscending' as const
      }
    };

    const onMissing = () => {
      throw new Error('onMissing should not be called when all keys exist');
    };

    const result = addMissingPropsToAnObject(TEMPLATE, currentStorage, onMissing);
    expect(result.sortingStates).toHaveProperty('playlistDetailPage', 'artistNameAscending');
    expect(result.sortingStates).toHaveProperty('albumDetailPage', 'releasedYearDescending');
    expect(result.sortingStates).toHaveProperty('genreDetailPage', 'dateAddedDescending');
    expect(result.sortingStates).toHaveProperty('artistDetailPage', 'trackNoAscending');
  });

  test('should fill in partial missing keys (only some detail pages present)', () => {
    const partialStorage = {
      ...TEMPLATE,
      sortingStates: {
        songsPage: 'aToZ' as const,
        artistsPage: 'aToZ' as const,
        playlistsPage: 'aToZ' as const,
        albumsPage: 'aToZ' as const,
        genresPage: 'aToZ' as const,
        musicFoldersPage: 'aToZ' as const,
        playlistDetailPage: 'addedOrder' as const
      }
    };

    const missingKeys: string[] = [];
    const onMissing = (key: string) => { missingKeys.push(key); };

    const result = addMissingPropsToAnObject(TEMPLATE, partialStorage, onMissing);
    expect(result.sortingStates).toHaveProperty('playlistDetailPage', 'addedOrder');
    expect(result.sortingStates).toHaveProperty('albumDetailPage', 'trackNoDescending');
    expect(result.sortingStates).toHaveProperty('genreDetailPage', 'aToZ');
    expect(result.sortingStates).toHaveProperty('artistDetailPage', 'aToZ');
    expect(missingKeys).toEqual(['albumDetailPage', 'genreDetailPage', 'artistDetailPage']);
  });

  test('should not modify the template object', () => {
    const oldStorage = {
      ...TEMPLATE,
      sortingStates: {
        songsPage: 'aToZ' as const,
        artistsPage: 'aToZ' as const,
        playlistsPage: 'aToZ' as const,
        albumsPage: 'aToZ' as const,
        genresPage: 'aToZ' as const,
        musicFoldersPage: 'aToZ' as const
      }
    };

    const templateBefore = JSON.stringify(TEMPLATE);
    addMissingPropsToAnObject(TEMPLATE, oldStorage);
    expect(JSON.stringify(TEMPLATE)).toBe(templateBefore);
  });

  test('should handle null/undefined nested values in existing object', () => {
    const storageWithNullSorting = {
      ...TEMPLATE,
      sortingStates: undefined
    };

    const result = addMissingPropsToAnObject(TEMPLATE, storageWithNullSorting as any);
    expect(result.sortingStates).toBeDefined();
    expect(result.sortingStates).toHaveProperty('playlistDetailPage', 'addedOrder');
    expect(Object.keys(result.sortingStates)).toHaveLength(10);
  });

  test('should preserve pre-existing top-level keys while filling sortingStates', () => {
    const oldStorage = {
      ...TEMPLATE,
      sortingStates: {
        songsPage: 'aToZ' as const,
        artistsPage: 'aToZ' as const,
        playlistsPage: 'aToZ' as const,
        albumsPage: 'aToZ' as const,
        genresPage: 'aToZ' as const,
        musicFoldersPage: 'aToZ' as const
      },
      preferences: {
        ...TEMPLATE.preferences,
        showSongRemainingTime: true
      }
    };

    const result = addMissingPropsToAnObject(TEMPLATE, oldStorage);
    expect(result.sortingStates).toHaveProperty('playlistDetailPage', 'addedOrder');
    expect(result.preferences.showSongRemainingTime).toBe(true);
  });
});
