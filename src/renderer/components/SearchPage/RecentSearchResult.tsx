import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';

interface RecentSearchResultProp {
  result: string;
  clickHandler: () => void;
}

const RecentSearchResult = React.memo((props: RecentSearchResultProp) => {
  const { updateContextMenuData } = React.useContext(AppUpdateContext);
  const recentSearchContextItems: ContextMenuItem[] = [
    {
      label: 'Remove from Search History',
      handlerFunction: () => window.api.clearSearchHistory([props.result]),
      iconName: 'delete',
    },
    // {
    //   label: 'Clear the Search History',
    //   handlerFunction: () => window.api.clearSearchHistory(),
    //   iconName: 'delete',
    // },
  ];

  return (
    <div
      className="recent-search-result mt-3 mr-2 flex cursor-pointer items-center rounded-2xl bg-background-color-2 px-4 py-1 text-base font-light text-font-color-black duration-100 hover:text-font-color-highlight-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:hover:text-dark-font-color-highlight-2"
      onClick={props.clickHandler}
      onKeyDown={props.clickHandler}
      role="button"
      tabIndex={0}
      title={props.result}
      onContextMenu={(e) => {
        e.stopPropagation();
        updateContextMenuData(true, recentSearchContextItems, e.pageX, e.pageY);
      }}
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
