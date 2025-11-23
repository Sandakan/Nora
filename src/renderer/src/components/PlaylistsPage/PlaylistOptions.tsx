import type { DropdownOption } from '../Dropdown';
import i18n from '@renderer/i18n';

export const playlistSortTypes = [
  'aToZ',
  'zToA',
  'noOfSongsDescending',
  'noOfSongsAscending'
] as const;

export const playlistSortOptions: DropdownOption<PlaylistSortTypes>[] = [
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
