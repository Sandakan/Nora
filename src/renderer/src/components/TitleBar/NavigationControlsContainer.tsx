import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Button from '../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '../../store';

type Props = { disableHomeButton?: boolean };

const NavigationControlsContainer = (props: Props) => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  const navigationHistory = useStore(store, (state) => state.navigationHistory);

  const pageHistoryIndex = navigationHistory.pageHistoryIndex;
  const noOfPagesInHistory = navigationHistory.history.length - 1;

  const { updatePageHistoryIndex } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { disableHomeButton = false } = props;

  return (
    <div className="navigation-controls-container flex w-fit items-center justify-between gap-2">
      <Button
        iconName="arrow_back"
        iconClassName="material-icons-round-outlined !text-xl"
        className={`previousPageBtn !mr-0 flex h-fit !rounded-md !border-0 bg-transparent !px-2 !py-1 outline-1 outline-offset-1 !transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:bg-transparent dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
          pageHistoryIndex > 0
            ? 'available visible translate-x-0 opacity-100 focus-visible:!outline'
            : 'invisible -translate-x-8 opacity-0'
        } ${bodyBackgroundImage && '!text-font-color-white hover:!text-font-color-highlight'}`}
        clickHandler={() => updatePageHistoryIndex('decrement')}
        tooltipLabel={t('titleBar.goBack')}
      />

      {!disableHomeButton && (
        <Button
          iconName="home"
          iconClassName="material-icons-round-outlined !text-xl"
          className={`goToHomePageBtn !mr-0 flex h-fit !rounded-md !border-0 bg-transparent !px-2 !py-1 outline-1 outline-offset-1 !transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:bg-transparent dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
            noOfPagesInHistory > 0
              ? 'available scale-1 visible opacity-100 focus-visible:!outline'
              : 'invisible scale-50 opacity-0'
          } ${bodyBackgroundImage && '!text-font-color-white hover:!text-font-color-highlight'}`}
          clickHandler={() => updatePageHistoryIndex('home')}
          tooltipLabel={t('titleBar.goHome')}
        />
      )}

      <Button
        iconName="arrow_forward"
        iconClassName="material-icons-round-outlined !text-xl"
        className={`forwardPageBtn !mr-0 flex h-fit !rounded-md !border-0 bg-transparent !px-2 !py-1 outline-1 outline-offset-1 !transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:bg-transparent dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
          noOfPagesInHistory !== 0 && pageHistoryIndex < noOfPagesInHistory
            ? 'available visible translate-x-0 opacity-100 focus-visible:!outline'
            : 'invisible translate-x-8 opacity-0'
        } ${bodyBackgroundImage && '!text-font-color-white hover:!text-font-color-highlight'}`}
        clickHandler={() => updatePageHistoryIndex('increment')}
        tooltipLabel={t('titleBar.goForward')}
      />
    </div>
  );
};

export default NavigationControlsContainer;
