import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../Button';
import { AppContext } from '../../../contexts/AppContext';

const ChangeThemeBtn = () => {
  const { isDarkMode, bodyBackgroundImage } = React.useContext(AppContext);
  const { t } = useTranslation();

  return (
    <Button
      className={`change-theme-btn !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 bg-transparent !px-3 !py-1 text-center text-xl outline-1 outline-offset-1 transition-[color,background] ease-in-out hover:bg-background-color-2 hover:text-font-color-highlight focus-visible:!outline dark:bg-transparent dark:hover:bg-dark-background-color-2 dark:hover:text-font-color-highlight ${
        bodyBackgroundImage && '!text-font-color-white hover:!text-font-color-highlight'
      }`}
      clickHandler={() => window.api.theme.changeAppTheme()}
      tooltipLabel={t('titleBar.changeTheme')}
      iconName={isDarkMode ? 'wb_sunny' : 'dark_mode'}
      iconClassName="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out"
    />
  );
};

export default ChangeThemeBtn;
