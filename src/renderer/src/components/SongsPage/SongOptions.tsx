import i18n from '../../i18n';
import { type DropdownOption } from '../Dropdown';

export const songSortTypes = [
  'aToZ',
  'zToA',
  'addedOrder',
  'dateAddedAscending',
  'dateAddedDescending',
  'releasedYearAscending',
  'releasedYearDescending',
  'trackNoAscending',
  'trackNoDescending',
  'artistNameAscending',
  'artistNameDescending',
  'allTimeMostListened',
  'allTimeLeastListened',
  'monthlyMostListened',
  'monthlyLeastListened',
  'artistNameDescending',
  'albumNameAscending',
  'albumNameDescending',
  'blacklistedSongs',
  'whitelistedSongs'
] as const;

export const songFilterTypes = ['notSelected', 'blacklistedSongs', 'whitelistedSongs'] as const;

export const songSortOptions: DropdownOption<SongSortTypes>[] = [
  { label: i18n.t('sortTypes.addedOrder'), value: 'addedOrder' },
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.dateAddedAscending'),
    value: 'dateAddedAscending'
  },
  {
    label: i18n.t('sortTypes.dateAddedDescending'),
    value: 'dateAddedDescending'
  },
  {
    label: i18n.t('sortTypes.releasedYearAscending'),
    value: 'releasedYearAscending'
  },
  {
    label: i18n.t('sortTypes.releasedYearDescending'),
    value: 'releasedYearDescending'
  },
  {
    label: i18n.t('sortTypes.allTimeMostListened'),
    value: 'allTimeMostListened'
  },
  {
    label: i18n.t('sortTypes.allTimeLeastListened'),
    value: 'allTimeLeastListened'
  },
  {
    label: i18n.t('sortTypes.monthlyMostListened'),
    value: 'monthlyMostListened'
  },
  {
    label: i18n.t('sortTypes.monthlyLeastListened'),
    value: 'monthlyLeastListened'
  },
  {
    label: i18n.t('sortTypes.artistNameAscending'),
    value: 'artistNameAscending'
  },
  {
    label: i18n.t('sortTypes.artistNameDescending'),
    value: 'artistNameDescending'
  },
  {
    label: i18n.t('sortTypes.albumNameAscending'),
    value: 'albumNameAscending'
  },
  {
    label: i18n.t('sortTypes.albumNameDescending'),
    value: 'albumNameDescending'
  }
];

export const songFilterOptions: DropdownOption<SongFilterTypes>[] = [
  { label: i18n.t('filterTypes.notSelected'), value: 'notSelected' },
  { label: i18n.t('filterTypes.blacklistedSongs'), value: 'blacklistedSongs' },
  {
    label: i18n.t('filterTypes.whitelistedSongs'),
    value: 'whitelistedSongs'
  }
];
