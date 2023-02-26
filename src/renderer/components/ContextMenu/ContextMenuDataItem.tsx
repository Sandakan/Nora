/* eslint-disable react/destructuring-assignment */
// import React from 'react';

import Img from '../Img';

const ContextMenuDataItem = (props: { data: ContextMenuAdditionalData }) => {
  const { title, artworkPath, subTitle, subTitle2, button, artworkClassName } =
    props.data;
  return (
    <div className="context-menu-data-item flex max-w-full flex-row items-center justify-between border-b-[1px] border-b-font-color-dimmed/50 px-3  py-2 font-light text-font-color-black dark:text-font-color-white">
      <div className="flex">
        <Img
          className={`mr-2 aspect-square w-8 rounded-sm ${artworkClassName}`}
          src={artworkPath}
          alt="Context menu data item artwork path"
        />
        <div className="info-container max-width-full flex flex-col items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap">
          <div className="title-container text-sm">{title}</div>
          {(subTitle || subTitle2) && (
            <div className="sub-titles-container flex">
              <span className="sub-title text-[0.6rem] font-light leading-none">
                {subTitle}
              </span>
              <span className="sub-title text-[0.6rem] font-light leading-none">
                {subTitle2}
              </span>
            </div>
          )}
        </div>
      </div>
      {button}
    </div>
  );
};

export default ContextMenuDataItem;
