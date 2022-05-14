/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import { AppContext } from '../../contexts/AppContext';

export const PromptMenu = () => {
  const { changePromptMenuData, PromptMenuData } = React.useContext(AppContext);

  return (
    <div
      id="prompt-menu-container"
      className={`prompt-menu-container ${
        PromptMenuData.isVisible ? 'visible' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        changePromptMenuData(false);
      }}
    >
      <div
        className="prompt-menu"
        id="prompt-menu"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <span
          className="material-icons-round prompt-menu-close-btn"
          id="promptMenuCloseBtn"
          onClick={(e) => {
            e.stopPropagation();
            changePromptMenuData(false);
          }}
        >
          close
        </span>
        <div
          className={`prompt-menu-inner ${PromptMenuData.className}`}
          id="prompt-menuInner"
        >
          {PromptMenuData.content}
        </div>
      </div>
    </div>
  );
};
