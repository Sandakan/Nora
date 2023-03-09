import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import Button from '../Button';

const NavigationControlsContainer = () => {
  const { pageHistoryIndex, noOfPagesInHistory } = React.useContext(AppContext);
  const { updatePageHistoryIndex } = React.useContext(AppUpdateContext);
  return (
    <div className="navigation-controls-container ml-12 flex min-w-[9rem] items-center justify-between">
      <Button
        iconName="arrow_back"
        iconClassName="material-icons-round-outlined !text-xl"
        className={`previousPageBtn flex h-fit !rounded-md !border-0 !px-2 !py-0 outline-1 outline-offset-1 !transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
          pageHistoryIndex > 0
            ? 'available visible translate-x-0 opacity-100 focus-visible:!outline'
            : 'invisible -translate-x-8 opacity-0'
        }`}
        clickHandler={() => updatePageHistoryIndex('decrement')}
        tooltipLabel="Go Back"
      />

      <Button
        iconName="home"
        iconClassName="material-icons-round-outlined !text-xl"
        className={`goToHomePageBtn flex h-fit !rounded-md !border-0 !px-2 !py-0 outline-1 outline-offset-1 !transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
          noOfPagesInHistory > 0
            ? 'available scale-1 visible opacity-100 focus-visible:!outline'
            : 'invisible scale-50 opacity-0'
        }`}
        clickHandler={() => updatePageHistoryIndex('home')}
        tooltipLabel="Go to Home"
      />

      <Button
        iconName="arrow_forward"
        iconClassName="material-icons-round-outlined !text-xl"
        className={`forwardPageBtn flex h-fit !rounded-md !border-0 !px-2 !py-0 outline-1 outline-offset-1 !transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
          noOfPagesInHistory !== 0 && pageHistoryIndex < noOfPagesInHistory
            ? 'available visible translate-x-0 opacity-100 focus-visible:!outline'
            : 'invisible translate-x-8 opacity-0'
        }`}
        clickHandler={() => updatePageHistoryIndex('increment')}
        tooltipLabel="Go forward"
      />
    </div>
  );
};

export default NavigationControlsContainer;
