import { store } from '@renderer/store/store';
import { useSelector } from '@tanstack/react-store';
import { useTranslation } from 'react-i18next';

import NavLink from '../../NavLink';

const GoToMainPlayerBtn = () => {
  const bodyBackgroundImage = useSelector(store, (state) => state.bodyBackgroundImage);

  const { t } = useTranslation();

  return (
    // <Button
    //   className={`change-theme-btn hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 !px-3 !py-1 text-center text-xl outline-offset-1 transition-[color,background] ease-in-out focus-visible:!outline ${
    //     bodyBackgroundImage && 'text-font-color-white! hover:text-font-color-highlight!'
    //   }`}
    //   clickHandler={() => updatePlayerType('normal')}
    //   tooltipLabel={t('player.goToMainPlayer')}
    //   iconName="close_fullscreen"
    //   iconClassName="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out"
    // />

    <NavLink
      to="/main-player/home"
      className={`change-theme-btn hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 mr-1! flex cursor-pointer items-center justify-center rounded-md border-0! px-3! py-1.5! text-center text-xl outline-offset-1 transition-[color,background] ease-in-out focus-visible:outline! ${
        bodyBackgroundImage && 'text-font-color-white! hover:text-font-color-highlight!'
      }`}
      title={t('player.currentQueue')}
    >
      {({ isActive }) => {
        return (
          <span
            className={`${isActive ? 'material-icons-round' : 'material-icons-round-outlined'} icon text-center text-xl leading-none transition-[background] ease-in-out`}
          >
            close_fullscreen
          </span>
        );
      }}
    </NavLink>
  );
};

export default GoToMainPlayerBtn;
