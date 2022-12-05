/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import MainContainer from '../MainContainer';

const PromptMenu = () => {
  const { PromptMenuData } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const promptMenuRef =
    React.useRef() as React.MutableRefObject<HTMLDialogElement>;

  React.useEffect(() => {
    if (PromptMenuData && promptMenuRef.current) {
      const { isVisible } = PromptMenuData;
      if (isVisible) {
        if (!promptMenuRef.current.open) promptMenuRef.current.showModal();
      }
    }
  }, [PromptMenuData]);

  React.useEffect(() => {
    const dialog = promptMenuRef.current;
    const manageDialogClose = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!isInDialog) changePromptMenuData(false, undefined, '');
    };

    const manageDialogAnimationEnd = () => {
      if (dialog && !PromptMenuData.isVisible) dialog.close();
    };

    if (promptMenuRef.current) {
      promptMenuRef.current.addEventListener('click', manageDialogClose);
      promptMenuRef.current.addEventListener(
        'animationend',
        manageDialogAnimationEnd
      );
    }
    return () => {
      if (dialog) {
        dialog.removeEventListener('click', manageDialogClose);
        dialog.removeEventListener('animationend', manageDialogAnimationEnd);
      }
    };
  }, [PromptMenuData.isVisible, changePromptMenuData]);

  return (
    <dialog
      className={`dialog-menu relative top-1/2 left-1/2 max-h-[80%] min-h-[300px] w-[80%] min-w-[800px] -translate-x-1/2 -translate-y-1/2  rounded-lg bg-background-color-1 py-10 shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] transition-[transform,visibility,opacity] backdrop:backdrop-blur-[2px] open:backdrop:transition-[background,backdrop-filter] dark:bg-dark-background-color-1  
      ${
        PromptMenuData.isVisible
          ? 'open:animate-dialog-appear-ease-in-out open:backdrop:bg-[hsla(228deg,7%,14%,0.75)] open:backdrop:dark:bg-[hsla(228deg,7%,14%,0.75)]'
          : 'animate-dialog-dissappear-ease-in-out backdrop:bg-[hsla(228deg,7%,14%,0)] backdrop:dark:bg-[hsla(228deg,7%,14%,0)]'
      }
      `}
      id="prompt-menu"
      onClick={(e) => {
        e.stopPropagation();
      }}
      ref={promptMenuRef}
    >
      <span
        className="material-icons-round prompt-menu-close-btn absolute top-4 right-4 cursor-pointer text-xl text-font-color-black dark:text-font-color-white"
        id="promptMenuCloseBtn"
        onClick={(e) => {
          e.stopPropagation();
          changePromptMenuData(false, undefined, '');
        }}
      >
        close
      </span>
      <MainContainer
        className={`prompt-menu-inner relative max-h-full px-8 text-font-color-black dark:text-font-color-white ${
          PromptMenuData.className ?? ''
        }`}
      >
        {PromptMenuData.content}
      </MainContainer>
    </dialog>
  );
};

export default PromptMenu;
