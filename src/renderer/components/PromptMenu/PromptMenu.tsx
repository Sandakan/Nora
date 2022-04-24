/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/self-closing-comp */
/* eslint-disable import/prefer-default-export */
import { ReactElement } from 'react';

interface PromptMenuProp {
  data: { content: any; isVisible: boolean; className: string };
  changePromptMenuData: (
    isVisible: boolean,
    content?: ReactElement<any, any>,
    className?: string
  ) => void;
}

export const PromptMenu = (props: PromptMenuProp) => {
  return (
    <div
      id="promptMenuContainer"
      className={`prompt-menu-container ${
        props.data.isVisible ? 'visible' : ''
      }`}
      onClick={(e) => {
        e.stopPropagation();
        props.changePromptMenuData(false);
      }}
    >
      <div
        className="prompt-menu"
        id="promptMenu"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <i
          className="fas fa-close prompt-close-btn"
          id="promptMenuCloseBtn"
          onClick={(e) => {
            e.stopPropagation();
            props.changePromptMenuData(false);
          }}
        ></i>
        <div
          className={`prompt-menu-inner ${props.data.className}`}
          id="promptMenuInner"
        >
          {props.data.content}
        </div>
      </div>
    </div>
  );
};
