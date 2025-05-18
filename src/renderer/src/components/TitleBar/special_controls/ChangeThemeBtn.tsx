import { useTranslation } from 'react-i18next';

import Button from '../../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

const ChangeThemeBtn = () => {
  const isDarkMode = useStore(store, (state) => state.isDarkMode);
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  const { t } = useTranslation();

  return (
    <Button
      className={`change-theme-btn hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-font-color-highlight !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 bg-transparent !px-3 !py-1 text-center text-xl outline-offset-1 transition-[color,background] ease-in-out focus-visible:!outline dark:bg-transparent ${
        bodyBackgroundImage && 'text-font-color-white! hover:text-font-color-highlight!'
      }`}
      clickHandler={() => window.api.theme.changeAppTheme()}
      tooltipLabel={t('titleBar.changeTheme')}
      iconName={isDarkMode ? 'wb_sunny' : 'dark_mode'}
      iconClassName="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out"
    />
  );
};

export default ChangeThemeBtn;
