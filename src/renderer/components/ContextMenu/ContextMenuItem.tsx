/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
// import react from 'react';

interface ContextMenuItemProp {
  label: string;
  class?: string;
  handlerFunction: () => void;
  updateContextMenuData: (
    isVisible: boolean,
    menuItems: ContextMenuItem[],
    pageX?: number,
    pageY?: number
  ) => void;
}

export default (props: ContextMenuItemProp) => {
  return (
    <div
      className={`menu-item ${props.class}`}
      onClick={() => {
        props.handlerFunction();
        props.updateContextMenuData(false, []);
      }}
    >
      {props.label}
    </div>
  );
};
