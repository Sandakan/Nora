import React from 'react';
import Button from 'renderer/components/Button';
import { AppContext } from 'renderer/contexts/AppContext';

const ChangeThemeBtn = () => {
  const { isDarkMode } = React.useContext(AppContext);

  return (
    <Button
      className="change-theme-btn !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 !px-3 !py-1 text-center text-xl outline-1 outline-offset-1 transition-[color,background] ease-in-out hover:bg-background-color-2 hover:text-font-color-highlight focus-visible:!outline dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight"
      clickHandler={() => window.api.theme.changeAppTheme()}
      tooltipLabel="Change Theme (Ctrl + Y)"
      iconName={isDarkMode ? 'wb_sunny' : 'dark_mode'}
      iconClassName="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out"
    />
  );
};

export default ChangeThemeBtn;
