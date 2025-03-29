import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../Button';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

const GoToMainPlayerBtn = () => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  const { updatePlayerType } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <Button
      className={`change-theme-btn !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 !px-3 !py-1 text-center text-xl outline-1 outline-offset-1 transition-[color,background] ease-in-out hover:bg-background-color-2 focus-visible:!outline dark:hover:bg-dark-background-color-2 ${
        bodyBackgroundImage && '!text-font-color-white hover:!text-font-color-highlight'
      }`}
      clickHandler={() => updatePlayerType('normal')}
      tooltipLabel={t('player.goToMainPlayer')}
      iconName="close_fullscreen"
      iconClassName="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out"
    />
  );
};

export default GoToMainPlayerBtn;
