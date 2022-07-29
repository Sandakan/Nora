import React from 'react';

interface RecentSearchResultProp {
  result: string;
  clickHandler: () => void;
}

const RecentSearchResult = React.memo((props: RecentSearchResultProp) => {
  return (
    <div
      className="recent-search-result bg-background-color-2 dark:bg-dark-background-color-2 text-font-color-black dark:text-font-color-white px-4 py-1 rounded-2xl flex items-center mt-3 mr-2 cursor-pointer text-base font-light"
      onClick={props.clickHandler}
      onKeyDown={props.clickHandler}
      role="button"
      tabIndex={0}
      title={props.result}
    >
      <div className="material-icons-round icon mr-2">search</div>
      <span>
        {props.result.length > 20
          ? props.result.substring(0, 20).concat('...')
          : props.result}
      </span>
    </div>
  );
});

RecentSearchResult.displayName = 'RecentSearchResult';
export default RecentSearchResult;
