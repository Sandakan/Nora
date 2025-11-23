import { memo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';

interface RecentSearchResultProp {
  result: string;
  clickHandler: () => void;
}

const RecentSearchResult = memo((props: RecentSearchResultProp) => {
  const { updateContextMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const recentSearchContextItems: ContextMenuItem[] = [
    {
      label: 'Remove from Search History',
      handlerFunction: () => window.api.search.clearSearchHistory([props.result]),
      iconName: 'delete'
    }
  ];

  return (
    <Button
      className="bg-background-color-2! hover:text-font-color-highlight-2 dark:bg-dark-background-color-2/75! dark:hover:text-dark-font-color-highlight-2 mt-3! mr-2! border-0! px-4! py-2! outline-offset-0 focus-visible:outline!"
      label={props.result.length > 20 ? props.result.substring(0, 20).concat('...') : props.result}
      tooltipLabel={t('searchPage.recentSearchResultTooltipLabel', {
        value: props.result
      })}
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
