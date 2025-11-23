import i18n from '@renderer/i18n';
import type { DropdownOption } from '../Dropdown';

export const genreSortTypes = [
  'aToZ',
  'zToA',
  'noOfSongsAscending',
  'noOfSongsDescending'
] as const;

export const genreSortOptions: DropdownOption<GenreSortTypes>[] = [
  { label: i18n.t('sortTypes.aToZ'), value: 'aToZ' },
  { label: i18n.t('sortTypes.zToA'), value: 'zToA' },
  {
    label: i18n.t('sortTypes.noOfSongsDescending'),
    value: 'noOfSongsDescending'
  },
  {
    label: i18n.t('sortTypes.noOfSongsAscending'),
    value: 'noOfSongsAscending'
  }
];
