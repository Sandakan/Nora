import i18n from '@renderer/i18n';
import type { DropdownOption } from '../Dropdown';

export const albumSortTypes = [
  'aToZ',
  'zToA',
  'noOfSongsAscending',
  'noOfSongsDescending'
] as const;

export const albumSortOptions: DropdownOption<AlbumSortTypes>[] = [
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
