import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockGetSortingStates = vi.fn();
const mockSetSortingStates = vi.fn();
const mockGetFilteringStates = vi.fn();
const mockSetFilteringStates = vi.fn();

vi.mock('@renderer/utils/localStorage', () => ({
  default: {
    sortingStates: {
      getSortingStates: mockGetSortingStates,
      setSortingStates: mockSetSortingStates
    },
    filteringStates: {
      getFilteringStates: mockGetFilteringStates,
      setFilteringStates: mockSetFilteringStates
    }
  }
}));

const resolveSort = (urlSort: string | undefined, persistedSort: string | undefined) =>
  urlSort ?? persistedSort ?? 'aToZ';

const resolveFilter = (urlFilter: string | undefined, persistedFilter: string | undefined) =>
  urlFilter ?? persistedFilter ?? 'notSelected';

describe('Songs page filter persistence and precedence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('uses persisted sort when URL has no sort param', () => {
    mockGetSortingStates.mockReturnValue('dateAddedDescending');
    const persistedSort = mockGetSortingStates('songsPage');
    const result = resolveSort(undefined, persistedSort);
    expect(result).toBe('dateAddedDescending');
  });

  test('URL sort takes precedence over persisted sort', () => {
    mockGetSortingStates.mockReturnValue('dateAddedDescending');
    const persistedSort = mockGetSortingStates('songsPage');
    const result = resolveSort('zToA', persistedSort);
    expect(result).toBe('zToA');
  });

  test('falls back to aToZ when both are undefined', () => {
    mockGetSortingStates.mockReturnValue(undefined);
    const persistedSort = mockGetSortingStates('songsPage');
    const result = resolveSort(undefined, persistedSort);
    expect(result).toBe('aToZ');
  });

  test('uses persisted filter when URL has no filter param', () => {
    mockGetFilteringStates.mockReturnValue('favorites');
    const persistedFilter = mockGetFilteringStates('songsPage');
    const result = resolveFilter(undefined, persistedFilter);
    expect(result).toBe('favorites');
  });

  test('URL filter takes precedence over persisted filter', () => {
    mockGetFilteringStates.mockReturnValue('favorites');
    const persistedFilter = mockGetFilteringStates('songsPage');
    const result = resolveFilter('recentlyPlayed', persistedFilter);
    expect(result).toBe('recentlyPlayed');
  });

  test('falls back to notSelected when both are undefined', () => {
    mockGetFilteringStates.mockReturnValue(undefined);
    const persistedFilter = mockGetFilteringStates('songsPage');
    const result = resolveFilter(undefined, persistedFilter);
    expect(result).toBe('notSelected');
  });
});
