import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

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
  ];

  return (
    <Button
      className="!mt-3 !mr-2 !border-0 !bg-background-color-2 !px-4 !py-2 hover:text-font-color-highlight-2 dark:!bg-dark-background-color-2/75 dark:hover:text-dark-font-color-highlight-2"
      label={
        props.result.length > 20
          ? props.result.substring(0, 20).concat('...')
          : props.result
      }
      tooltipLabel={`Search for '${props.result}'`}
      iconName="search"
      clickHandler={props.clickHandler}
      onContextMenu={(e) => {
        e.stopPropagation();
        updateContextMenuData(true, recentSearchContextItems, e.pageX, e.pageY);
      }}
    />
  );
});

RecentSearchResult.displayName = 'RecentSearchResult';
export default RecentSearchResult;
