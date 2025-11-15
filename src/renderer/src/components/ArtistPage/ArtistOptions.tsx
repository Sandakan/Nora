import i18n from '@renderer/i18n';
import type { DropdownOption } from '../Dropdown';

export const artistSortTypes = [
  'aToZ',
  'zToA',
  'noOfSongsAscending',
  'noOfSongsDescending',
  'mostLovedAscending',
  'mostLovedDescending'
] as const;

export const artistFilterTypes = ['notSelected', 'favorites'] as const;

export const artistSortOptions: DropdownOption<ArtistSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending'
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending'
  },
  {
    label: i18n.t('sortTypes.mostLovedDescending'),
    value: 'mostLovedDescending'
  },
  {
    label: i18n.t('sortTypes.mostLovedAscending'),
    value: 'mostLovedAscending'
  }
];

export const artistFilterOptions: DropdownOption<ArtistFilterTypes>[] = [
  { label: i18n.t('filterTypes.notSelected'), value: 'notSelected' },
  { label: i18n.t('filterTypes.favorites'), value: 'favorites' }
];
