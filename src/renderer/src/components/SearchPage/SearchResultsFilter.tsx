/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import { memo } from 'react';
import Button from '../Button';

export interface SearchResultFilter {
  label: string;
  icon: string;
  value: SearchFilters;
}
interface SearchResultsFilterProp extends SearchResultFilter {
  isCurrentActiveFilter: boolean;
  changeActiveFilter: (_filterType: SearchFilters) => void;
}

const SearchResultsFilter = memo((props: SearchResultsFilterProp) => {
  const { label, value, icon, isCurrentActiveFilter, changeActiveFilter } = props;

  return (
    <Button
      className={`appear-from-bottom text-font-color-black mr-3 flex w-fit cursor-pointer list-none items-center !border-0 outline-offset-1 transition-[width,background,color] duration-200 focus-visible:!outline ${
        isCurrentActiveFilter
          ? 'active bg-background-color-3 dark:bg-dark-background-color-3 dark:text-font-color-black!'
          : 'bg-background-color-2 hover:bg-background-color-3 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:bg-dark-background-color-3 dark:hover:text-font-color-black!'
      }`}
      clickHandler={() => changeActiveFilter(value)}
      label={label}
      iconName={icon}
    />
  );
});

SearchResultsFilter.displayName = 'SearchResultsFilter';
export default SearchResultsFilter;
