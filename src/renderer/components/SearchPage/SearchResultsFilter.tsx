/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import Button from '../Button';

interface SearchResultsFilterProp {
  filterType: SearchFilters;
  isCurrentActiveFilter: boolean;
  changeActiveFilter: (_filterType: SearchFilters) => void;
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
    <Button
      className={`appear-from-bottom mr-3 flex w-fit cursor-pointer list-none items-center !border-0 py-1 px-4 text-font-color-black outline-1 outline-offset-1 transition-[width,background,color] duration-200 focus-visible:!outline ${
        props.isCurrentActiveFilter
          ? 'active bg-background-color-3 dark:bg-dark-background-color-3 dark:!text-font-color-black'
          : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:!text-font-color-black'
      }`}
      clickHandler={() =>
        props.changeActiveFilter(props.filterType as SearchFilters)
      }
      label={props.filterType}
      iconName={icon}
    />
  );
});

SearchResultsFilter.displayName = 'SearchResultsFilter';
export default SearchResultsFilter;
