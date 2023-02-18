/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

const ChangeThemeBtn = () => {
  const { isDarkMode } = React.useContext(AppContext);
  return (
    <div
      className="change-theme-btn mr-1 flex cursor-pointer items-center justify-center rounded-md px-3 py-1 text-center text-xl transition-[color,background] ease-in-out hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight"
      onClick={() => window.api.changeAppTheme()}
      // onKeyDown={() => window.api.changeAppTheme()}
      role="button"
      tabIndex={0}
      title="Change Theme"
    >
      <span className="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out">
        {isDarkMode ? 'wb_sunny' : 'dark_mode'}
      </span>
    </div>
  );
};

export default ChangeThemeBtn;
