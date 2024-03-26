import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import { AppContext } from '../../../contexts/AppContext';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';

type Props = { isLyricsVisible: boolean };

const TitleBarContainer = (props: Props) => {
  const { isCurrentSongPlaying, userData } = React.useContext(AppContext);
  const { updatePlayerType, updateUserData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { isLyricsVisible } = props;

  const toggleAlwaysOnTop = React.useCallback(() => {
    if (userData) {
      const state = !userData?.preferences.isMiniPlayerAlwaysOnTop;
      return window.api.miniPlayer.toggleMiniPlayerAlwaysOnTop(state).then(() =>
        updateUserData((prevUserData) => {
          if (prevUserData?.preferences) prevUserData.preferences.isMiniPlayerAlwaysOnTop = state;
          return prevUserData as UserData;
        })
      );
    }
    return undefined;
  }, [updateUserData, userData]);

  return (
    <div
      className={`mini-player-title-bar z-10 flex h-[15%] max-h-[2.25rem] w-full select-none justify-end opacity-0 transition-[visibility,opacity] group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
        !isCurrentSongPlaying ? 'visible opacity-100' : ''
      }`}
    >
      <div
        className={`special-controls-container flex transition-[visibility,opacity] ${
          isLyricsVisible
            ? 'invisible opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'
            : ''
        } ${!isCurrentSongPlaying ? '!visible !opacity-100' : ''}`}
      >
        <Button
          className="go-to-main-player-btn !mr-0 !mt-1 !rounded-md !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 focus-visible:!outline dark:text-font-color-white"
          tooltipLabel={t('player.goToMainPlayer')}
          iconName="pip_exit"
          iconClassName="material-icons-round-outlined !text-xl"
          clickHandler={() => updatePlayerType('normal')}
          removeFocusOnClick
        />
        <Button
          className={`always-on-top-btn !mr-0 !mt-1 !rounded-md !border-0 !p-2 text-font-color-white outline-1 outline-offset-1 focus-visible:!outline dark:text-font-color-white ${
            userData?.preferences.isMiniPlayerAlwaysOnTop
              ? 'bg-dark-background-color-2 dark:bg-dark-background-color-2'
              : ''
          }`}
          iconName={
            userData?.preferences && userData.preferences.isMiniPlayerAlwaysOnTop
              ? 'move_down'
              : 'move_up'
          }
          iconClassName="material-icons-round text-xl"
          tooltipLabel={t(
            `miniPlayer.${userData?.preferences.isMiniPlayerAlwaysOnTop ? 'alwaysOnTopEnabled' : 'alwaysOnTopDisabled'}`
          )}
          removeFocusOnClick
          clickHandler={toggleAlwaysOnTop}
        />
      </div>
      <div className="window-controls-container flex">
        <Button
          className="minimize-btn !m-0 flex h-full items-center justify-center !rounded-none !border-0 !px-2 text-center text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline"
          clickHandler={() => window.api.windowControls.minimizeApp()}
          tooltipLabel={t('titleBar.minimize')}
          iconName="minimize"
          iconClassName="material-icons-round icon flex h-fit cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out"
          removeFocusOnClick
        />
        <Button
          className="close-btn !m-0 flex h-full items-center justify-center !rounded-none !border-0 !px-2 text-center text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-font-color-crimson hover:!text-font-color-white focus-visible:!outline"
          clickHandler={() => {
            if (userData && userData.preferences.hideWindowOnClose)
              window.api.windowControls.hideApp();
            else window.api.windowControls.closeApp();
          }}
          tooltipLabel={t('titleBar.close')}
          iconName="close"
          iconClassName="material-icons-round icon flex h-fit  cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out"
          removeFocusOnClick
        />
      </div>
    </div>
  );
};

export default TitleBarContainer;
