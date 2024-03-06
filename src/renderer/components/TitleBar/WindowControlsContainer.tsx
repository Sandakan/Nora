import React from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../contexts/AppContext';

import Button from '../Button';

const WindowControlsContainer = () => {
  const { userData, bodyBackgroundImage } = React.useContext(AppContext);
  const { t } = useTranslation();

  const close = React.useCallback(() => {
    if (userData && userData.preferences.hideWindowOnClose)
      window.api.windowControls.hideApp();
    else window.api.windowControls.closeApp();
  }, [userData]);

  const minimize = React.useCallback(
    () => window.api.windowControls.minimizeApp(),
    [],
  );
  const maximize = React.useCallback(
    () => window.api.windowControls.toggleMaximizeApp(),
    [],
  );

  return (
    <div
      className="window-controls-container ml-6 flex h-full items-center justify-between"
      id="window-controls-container"
    >
      <Button
        className={`minimize-btn !m-0 h-full !rounded-none !border-0 !px-3 text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline ${
          bodyBackgroundImage && '!text-font-color-white'
        } `}
        clickHandler={minimize}
        tooltipLabel={t('titleBar.minimize')}
        iconName="minimize"
        iconClassName="h-fit text-xl !font-light transition-[background] ease-in-out"
      />
      <Button
        className={`maximize-btn !m-0 h-full !rounded-none !border-0 !px-3 text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline ${
          bodyBackgroundImage && '!text-font-color-white'
        } `}
        clickHandler={maximize}
        tooltipLabel={t('titleBar.maximize')}
        iconClassName="material-icons-round-outlined h-fit text-lg !font-light transition-[background] ease-in-out"
        iconName="crop_square"
      />
      <Button
        className={`close-btn !m-0 h-full !rounded-none !border-0 !px-3 text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-font-color-crimson hover:!text-font-color-white focus-visible:!outline ${
          bodyBackgroundImage && '!text-font-color-white'
        } `}
        clickHandler={close}
        tooltipLabel={t('titleBar.close')}
        iconName="close"
        iconClassName="h-fit text-xl !font-light transition-[background] ease-in-out"
      />
    </div>
  );
};

export default WindowControlsContainer;
