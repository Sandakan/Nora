import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../Button';
import { AppContext } from '../../../contexts/AppContext';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';

const GoToMainPlayerBtn = () => {
  const { bodyBackgroundImage } = React.useContext(AppContext);
  const { updatePlayerType } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <Button
      className={`change-theme-btn !mr-1 flex cursor-pointer items-center justify-center rounded-md !border-0 !px-3 !py-1 text-center text-xl outline-1 outline-offset-1 transition-[color,background] ease-in-out hover:bg-background-color-2 focus-visible:!outline dark:hover:bg-dark-background-color-2 ${
        bodyBackgroundImage &&
        '!text-font-color-white hover:!text-font-color-highlight'
      }`}
      clickHandler={() => updatePlayerType('normal')}
      tooltipLabel={t('player.goToMainPlayer')}
      iconName="close_fullscreen"
      iconClassName="material-icons-round icon text-center text-xl leading-none transition-[background] ease-in-out"
    />
  );
};

export default GoToMainPlayerBtn;
