import { useTranslation } from 'react-i18next';
import Button from '../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '../../store';
import { useRouter } from '@tanstack/react-router';

type Props = { disableHomeButton?: boolean };

const NavigationControlsContainer = (props: Props) => {
  const { history, navigate } = useRouter();
  // const canGoBack = useCanGoBack();
  const canGoBack = history.length > 0;

  // const canGoForward = history.index < history.entries.length - 1;

  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  // const pageHistoryIndex = useStore(store, (state) => state.navigationHistory.pageHistoryIndex);
  // const noOfPagesInHistory = useStore(store, (state) => state.navigationHistory.history.length - 1);

  // const { updatePageHistoryIndex } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { disableHomeButton = false } = props;

  return (
    <div className="navigation-controls-container flex w-fit items-center justify-between gap-2">
      <Button
        iconName="arrow_back"
        iconClassName="material-icons-round-outlined text-xl!"
        className={`previousPageBtn app-region-no-drag hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight invisible mr-0! flex h-fit -translate-x-8 rounded-md! border-0! bg-transparent px-2! py-1! opacity-0 outline-offset-1 transition-all! dark:bg-transparent ${
          canGoBack ? 'visible! translate-x-0! opacity-100! focus-visible:outline!' : ''
        } ${bodyBackgroundImage && 'text-font-color-white! hover:text-font-color-highlight!'}`}
        clickHandler={() => history.back()}
        tooltipLabel={t('titleBar.goBack')}
      />

      {!disableHomeButton && (
        <Button
          iconName="home"
          iconClassName="material-icons-round-outlined text-xl!"
          className={`goToHomePageBtn app-region-no-drag hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight invisible mr-0! flex h-fit scale-50 rounded-md! border-0! bg-transparent px-2! py-1! opacity-0 outline-offset-1 transition-all! dark:bg-transparent ${
            canGoBack ? 'visible! scale-100! opacity-100! focus-visible:outline!' : ''
          } `}
          clickHandler={() => navigate({ to: '/main-player/home', replace: true })}
          tooltipLabel={t('titleBar.goHome')}
        />
      )}

      {/* <Button
        iconName="arrow_forward"
        iconClassName="material-icons-round-outlined text-xl!"
        className={`forwardPageBtn app-region-no-drag hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight invisible mr-0! flex h-fit translate-x-8 rounded-md! border-0! bg-transparent px-2! py-1! opacity-0 outline-offset-1 transition-all! dark:bg-transparent ${
          noOfPagesInHistory !== 0 && pageHistoryIndex < noOfPagesInHistory
            ? 'visible! translate-x-0! opacity-100! focus-visible:outline!'
            : ''
        } ${bodyBackgroundImage && 'text-font-color-white! hover:text-font-color-highlight!'}`}
        clickHandler={() => updatePageHistoryIndex('increment')}
        tooltipLabel={t('titleBar.goForward')}
      /> */}
    </div>
  );
};

export default NavigationControlsContainer;
