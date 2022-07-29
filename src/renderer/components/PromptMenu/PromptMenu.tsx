/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext, AppUpdateContext } from '../../contexts/AppContext';

export const PromptMenu = () => {
  const { PromptMenuData } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);

  return (
    <div
      id="prompt-menu-container"
      className={`prompt-menu-container z-30 w-full absolute flex items-center justify-center h-full bg-[hsla(228deg,7%,14%,0.75)] dark:bg-[hsla(228deg,7%,14%,0.75)] transition-[visibility,opacity] ${
        PromptMenuData.isVisible ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        changePromptMenuData(false, undefined, '');
      }}
    >
      <div
        className={`prompt-menu w-fit h-fit min-h-[300px] min-w-[50%] max-w-[80%] max-h-[80%] overflow-hidden rounded-2xl bg-background-color-1 dark:bg-dark-background-color-1 relative py-10 shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] transition-[transform,visibility,opacity] ${
          PromptMenuData.isVisible
            ? 'scale-100 opacity-100 visible'
            : 'scale-[0.8] invisible opacity-0'
        }`}
        id="prompt-menu"
        onClick={(e) => {
          e.stopPropagation();
        }}
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
        <div
          className={`prompt-menu-inner relative px-8 text-font-color-black dark:text-font-color-white overflow-y-auto ${
            PromptMenuData.className ?? ''
          }`}
          id="prompt-menuInner"
        >
          {PromptMenuData.content}
        </div>
      </div>
    </div>
  );
};
