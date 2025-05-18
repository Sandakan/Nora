import { Suspense, useCallback, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import MainContainer from '../MainContainer';
import PromptMenuNavigationControlsContainer from './PromptMenuNavigationControlsContainer';
import SuspenseLoader from '../SuspenseLoader';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const PromptMenu = () => {
  const promptMenuData = useStore(store, (state) => state.promptMenuData);
  const { changePromptMenuData, updatePromptMenuHistoryIndex } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const promptMenuRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = promptMenuRef.current;

    if (promptMenuData.isVisible && dialog && !dialog.open) dialog.showModal();
  }, [promptMenuData.isVisible]);

  const manageKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') e.stopPropagation();
        if (e.code === 'ArrowRight') updatePromptMenuHistoryIndex('increment');
        if (e.code === 'ArrowLeft') updatePromptMenuHistoryIndex('decrement');
      }
    },
    [updatePromptMenuHistoryIndex]
  );

  useEffect(() => {
    const promptMenu = promptMenuRef.current;

    promptMenu?.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      promptMenu?.removeEventListener('keydown', manageKeyboardShortcuts);
    };
  }, [manageKeyboardShortcuts]);

  return (
    <>
      <Dialog
        open={promptMenuData.isVisible}
        ref={promptMenuRef}
        onClose={() => changePromptMenuData(false)}
        className="relative z-100"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 h-screen bg-black/25 backdrop-blur-xs transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex h-screen items-center justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="bg-background-color-1 dark:bg-dark-background-color-1 relative h-fit max-h-[80%] min-h-[300px] w-[80%] max-w-[90%] min-w-[800px] transform overflow-hidden overflow-y-auto rounded-2xl text-left shadow-xl transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg"
            >
              <div className="my-4 flex w-full items-center justify-between px-6">
                <PromptMenuNavigationControlsContainer />
                <Button
                  key={0}
                  className="prompt-menu-close-btn previousPageBtn hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight m-0! flex h-fit rounded-md! border-0! p-0! px-2! py-1! outline-offset-1 transition-all!"
                  iconName="close"
                  tooltipLabel={t('titleBar.close')}
                  iconClassName="leading-none! text-xl!"
                  clickHandler={(e) => {
                    e.stopPropagation();
                    changePromptMenuData(false);
                  }}
                />
              </div>
              <MainContainer
                className={`prompt-menu-inner text-font-color-black dark:text-font-color-white relative max-h-full min-h-[250px] px-8 pb-2 ${
                  promptMenuData.className ?? ''
                }`}
              >
                <Suspense fallback={<SuspenseLoader />}>{promptMenuData.prompt}</Suspense>
              </MainContainer>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* <dialog
        className={`dialog-menu bg-background-color-1 dark:bg-dark-background-color-1 absolute top-1/2 left-1/2 m-auto h-fit max-h-[80%] min-h-[300px] w-[80%] max-w-[90%] min-w-[800px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl pb-10 open:backdrop:bg-[hsla(228deg,7%,14%,0.75)] open:backdrop:transition-[background,backdrop-filter] dark:backdrop:bg-[hsla(228deg,7%,14%,0)] dark:open:backdrop:bg-[hsla(228deg,7%,14%,0.75)]`}
        open={promptMenuData.isVisible}
        id="prompt-menu"
        onClick={(e) => {
          e.stopPropagation();
        }}
        ref={promptMenuRef}
      >
        <div className="my-4 flex w-full items-center justify-between px-6">
          <PromptMenuNavigationControlsContainer />
          <Button
            key={0}
            className="prompt-menu-close-btn previousPageBtn hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight m-0! flex h-fit rounded-md! border-0! p-0! px-2! py-1! outline-offset-1 transition-all!"
            iconName="close"
            tooltipLabel={t('titleBar.close')}
            iconClassName="leading-none! text-xl!"
            clickHandler={(e) => {
              e.stopPropagation();
              changePromptMenuData(false);
            }}
          />
        </div>
        <MainContainer
          className={`prompt-menu-inner text-font-color-black dark:text-font-color-white relative max-h-full px-8 pb-2 ${
            promptMenuData.className ?? ''
          }`}
        >
          <Suspense fallback={<SuspenseLoader />}>{promptMenuData.prompt}</Suspense>
        </MainContainer>
      </dialog> */}
    </>
  );
};

export default PromptMenu;
