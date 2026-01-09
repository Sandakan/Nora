import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';

import Button from '../Button';
import { useStore } from '@tanstack/react-store';
import { store } from '../../store/store';
import { settingsQuery } from '../../queries/settings';

const WindowControlsContainer = () => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  const {
    data: { hideWindowOnClose }
  } = useSuspenseQuery({
    ...settingsQuery.all,
    select: (data) => ({ hideWindowOnClose: data.hideWindowOnClose })
  });

  const { t } = useTranslation();

  const close = useCallback(() => {
    if (hideWindowOnClose) window.api.windowControls.hideApp();
    else window.api.windowControls.closeApp();
  }, [hideWindowOnClose]);

  const minimize = useCallback(() => window.api.windowControls.minimizeApp(), []);
  const maximize = useCallback(() => window.api.windowControls.toggleMaximizeApp(), []);

  return (
    <div
      className="window-controls-container ml-6 flex h-full items-center justify-between"
      id="window-controls-container"
    >
      <Button
        className={`minimize-btn !m-0 h-full !rounded-none !border-0 bg-transparent !px-3 text-xl -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline dark:bg-transparent ${
          bodyBackgroundImage && 'text-font-color-white!'
        } `}
        clickHandler={minimize}
        tooltipLabel={t('titleBar.minimize')}
        iconName="minimize"
        iconClassName="h-fit text-xl font-light! transition-[background] ease-in-out"
      />
      <Button
        className={`maximize-btn !m-0 h-full !rounded-none !border-0 bg-transparent !px-3 text-xl -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline dark:bg-transparent ${
          bodyBackgroundImage && 'text-font-color-white!'
        } `}
        clickHandler={maximize}
        tooltipLabel={t('titleBar.maximize')}
        iconClassName="material-icons-round-outlined h-fit text-lg font-light! transition-[background] ease-in-out"
        iconName="crop_square"
      />
      <Button
        className={`close-btn hover:!bg-font-color-crimson hover:!text-font-color-white !m-0 h-full !rounded-none !border-0 bg-transparent !px-3 text-xl -outline-offset-2 transition-[background] ease-in-out focus-visible:!outline dark:bg-transparent ${
          bodyBackgroundImage && 'text-font-color-white!'
        } `}
        clickHandler={close}
        tooltipLabel={t('titleBar.close')}
        iconName="close"
        iconClassName="h-fit text-xl font-light! transition-[background] ease-in-out"
      />
    </div>
  );
};

export default WindowControlsContainer;
