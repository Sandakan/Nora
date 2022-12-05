/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';

interface SearchResultsFilterProp {
  filterType: SearchFilters;
  isCurrentActiveFilter: boolean;
  changeActiveFilter: (filterType: SearchFilters) => void;
}

const SearchResultsFilter = React.memo((props: SearchResultsFilterProp) => {
  const icon = React.useMemo(() => {
    switch (props.filterType) {
      case 'All':
        return 'select_all';
      case 'Songs':
        return 'music_note';
      case 'Artists':
        return 'people';
      case 'Albums':
        return 'album';
      case 'Genres':
        return 'track_changes';
      case 'Playlists':
        return 'queue_music';
      default:
        return '';
    }
  }, [props.filterType]);
  return (
    <li
      className={`appear-from-bottom mr-3 flex w-fit cursor-pointer list-none items-center rounded-3xl py-1 px-4 text-font-color-black ${
        props.isCurrentActiveFilter
          ? 'active bg-background-color-3 dark:bg-dark-background-color-3 dark:text-font-color-black'
          : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:text-font-color-black'
      }`}
      onClick={() =>
        props.changeActiveFilter(props.filterType as SearchFilters)
      }
    >
      {props.isCurrentActiveFilter && (
        <div
          className={`material-icons-round icon ${
            props.isCurrentActiveFilter && 'mr-2'
          }`}
        >
          {icon}
        </div>
      )}
      {props.filterType}
    </li>
  );
});

SearchResultsFilter.displayName = 'SearchResultsFilter';
export default SearchResultsFilter;
