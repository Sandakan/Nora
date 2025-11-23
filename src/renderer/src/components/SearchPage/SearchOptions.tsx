import i18n from '@renderer/i18n';
import type { SearchResultFilter } from './SearchResultsFilter';

export const searchFilterTypes = [
  'All',
  'Songs',
  'Albums',
  'Artists',
  'Playlists',
  'Genres'
] as const;

export const searchFilter: SearchResultFilter[] = [
  { label: i18n.t('searchPage.allFilter'), icon: 'select_all', value: 'All' },
  { label: i18n.t('common.song_other'), icon: 'music_note', value: 'Songs' },
  { label: i18n.t('common.album_other'), icon: 'people', value: 'Albums' },
  { label: i18n.t('common.artist_other'), icon: 'album', value: 'Artists' },
  {
    label: i18n.t('common.playlist_other'),
    icon: 'track_changes',
    value: 'Playlists'
  },
  { label: i18n.t('common.genre_other'), icon: 'queue_music', value: 'Genres' }
];
