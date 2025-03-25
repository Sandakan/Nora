import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const PromptMenuNavigationControlsContainer = () => {
  const promptMenuData = useStore(store, (state) => state.promptMenuData);
  const { updatePromptMenuHistoryIndex } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { noOfPrompts, promptActiveIndex } = useMemo(() => {
    return {
      promptActiveIndex: promptMenuData.currentActiveIndex + 1,
      noOfPrompts: promptMenuData.noOfPrompts
    };
  }, [promptMenuData.currentActiveIndex, promptMenuData.noOfPrompts]);

  return (
    <div className="navigation-controls-container flex w-fit items-center justify-between gap-2">
      <Button
        iconName="arrow_back"
        iconClassName="material-icons-round-outlined text-xl!"
        className={`previousPageBtn hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight !mr-0 flex h-fit !rounded-md !border-0 !px-2 !py-1 outline-offset-1 !transition-[background,transform,visibility,opacity] ${
          promptActiveIndex > 1
            ? 'available visible translate-x-0 opacity-100 focus-visible:outline!'
            : 'invisible -translate-x-8 opacity-0'
        }`}
        clickHandler={() => updatePromptMenuHistoryIndex('decrement')}
        tooltipLabel={t('titleBar.goBack')}
      />

      <Button
        iconName="arrow_forward"
        iconClassName="material-icons-round-outlined text-xl!"
        className={`forwardPageBtn hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight !mr-0 flex h-fit !rounded-md !border-0 !px-2 !py-1 outline-offset-1 !transition-[background,transform,visibility,opacity] ${
          noOfPrompts !== 0 && promptActiveIndex < noOfPrompts
            ? 'available visible translate-x-0 opacity-100 focus-visible:outline!'
            : 'invisible translate-x-8 opacity-0'
        }`}
        clickHandler={() => updatePromptMenuHistoryIndex('increment')}
        tooltipLabel={t('titleBar.goForward')}
      />
    </div>
  );
};

export default PromptMenuNavigationControlsContainer;
