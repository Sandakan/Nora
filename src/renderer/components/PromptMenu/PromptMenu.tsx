/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React, { ReactElement } from 'react';
import { AppContext } from '../../contexts/AppContext';

export const PromptMenu = () => {
  const { changePromptMenuData, promptMenuData } = React.useContext(AppContext);

  return (
    <div
      id="promptMenuContainer"
      className={`prompt-menu-container ${
        promptMenuData.isVisible ? 'visible' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        changePromptMenuData(false);
      }}
    >
      <div
        className="prompt-menu"
        id="promptMenu"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <span
          className="material-icons-round"
          id="promptMenuCloseBtn"
          onClick={(e) => {
            e.stopPropagation();
            changePromptMenuData(false);
          }}
        >
          close
        </span>
        <div
          className={`prompt-menu-inner ${promptMenuData.className}`}
          id="promptMenuInner"
        >
          {promptMenuData.content}
        </div>
      </div>
    </div>
  );
};
