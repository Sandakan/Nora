import i18n from '@renderer/i18n';
import type { DropdownOption } from '../Dropdown';

export const folderSortTypes = [
  'aToZ',
  'zToA',
  'noOfSongsAscending',
  'noOfSongsDescending',
  'blacklistedFolders',
  'whitelistedFolders'
] as const;

export const folderDropdownOptions: DropdownOption<FolderSortTypes>[] = [
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
    label: i18n.t('sortTypes.blacklistedFolders'),
    value: 'blacklistedFolders'
  },
  {
    label: i18n.t('sortTypes.whitelistedFolders'),
    value: 'whitelistedFolders'
  }
];
