/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { type MutableRefObject, Suspense, useCallback, useContext, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import MainContainer from '../MainContainer';
import PromptMenuNavigationControlsContainer from './PromptMenuNavigationControlsContainer';
import SuspenseLoader from '../SuspenseLoader';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const PromptMenu = () => {
  const promptMenuData = useStore(store, (state) => state.promptMenuData);
  const { changePromptMenuData, updatePromptMenuHistoryIndex } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const promptMenuRef = useRef() as MutableRefObject<HTMLDialogElement>;

  useEffect(() => {
    const dialog = promptMenuRef.current;

    if (promptMenuData.isVisible && dialog && !dialog.open) dialog.showModal();
  }, [promptMenuData.isVisible]);

  useEffect(() => {
    const dialog = promptMenuRef.current;

    const manageDialogClose = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isCursorInDialogBoundary =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isCursorInDialogBoundary) changePromptMenuData(false);
    };

    const manageDialogAnimationEnd = () => {
      if (!promptMenuData.isVisible) {
        dialog.close();
        changePromptMenuData(false, null);
      }
    };

    if (dialog) {
      dialog.addEventListener('click', manageDialogClose);
      dialog.addEventListener('animationend', manageDialogAnimationEnd);
    }

    return () => {
      dialog?.removeEventListener('click', manageDialogClose);
      dialog?.removeEventListener('animationend', manageDialogAnimationEnd);
    };
  }, [promptMenuData.isVisible, changePromptMenuData]);

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

  const manageDialogCloseEvent = useCallback(() => {
    changePromptMenuData(false, null);
  }, [changePromptMenuData]);

  useEffect(() => {
    const promptMenu = promptMenuRef.current;

    promptMenu?.addEventListener('close', manageDialogCloseEvent);
    promptMenu?.addEventListener('keydown', manageKeyboardShortcuts);
    return () => {
      promptMenu?.removeEventListener('keydown', manageKeyboardShortcuts);
      promptMenu?.removeEventListener('close', manageDialogCloseEvent);
    };
  }, [manageDialogCloseEvent, manageKeyboardShortcuts]);

  return (
    <dialog
      className={`dialog-menu bg-background-color-1 dark:bg-dark-background-color-1 relative top-1/2 left-1/2 h-fit max-h-[80%] min-h-[300px] w-[80%] max-w-[90%] min-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-3xl pb-10 shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] transition-[transform,visibility,opacity] ease-in-out open:backdrop:transition-[background,backdrop-filter] ${
        promptMenuData.isVisible
          ? 'open:animate-dialog-appear-ease-in-out open:backdrop:bg-[hsla(228deg,7%,14%,0.75)] dark:open:backdrop:bg-[hsla(228deg,7%,14%,0.75)]'
          : 'animate-dialog-dissappear-ease-in-out backdrop:bg-[hsla(228deg,7%,14%,0)] dark:backdrop:bg-[hsla(228deg,7%,14%,0)]'
      } `}
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
          className="prompt-menu-close-btn previousPageBtn hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight m-0! flex h-fit rounded-md! border-0! p-0! px-2! py-1! outline outline-offset-1 transition-[background,transform,visibility,opacity]!"
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
    </dialog>
  );
};

export default PromptMenu;
