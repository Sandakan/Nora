import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { settingsMutation, settingsQuery } from '@renderer/queries/settings';
import { queryClient } from '@renderer/index';

type Props = { isLyricsVisible: boolean };

const TitleBarContainer = (props: Props) => {
  const isCurrentSongPlaying = useStore(store, (state) => state.player.isCurrentSongPlaying);
  const {
    data: { isMiniPlayerAlwaysOnTop, hideWindowOnClose }
  } = useSuspenseQuery({
    ...settingsQuery.all,
    select: (data) => ({
      isMiniPlayerAlwaysOnTop: data.isMiniPlayerAlwaysOnTop,
      hideWindowOnClose: data.hideWindowOnClose
    })
  });

  const { mutate: toggleAlwaysOnTop } = useMutation({
    mutationKey: settingsMutation.toggleMiniPlayerAlwaysOnTop.mutationKey,
    mutationFn: async (state: boolean) => {
      await window.api.miniPlayer.toggleMiniPlayerAlwaysOnTop(state);
    },
    onMutate: async (state) => {
      await queryClient.cancelQueries({ queryKey: settingsQuery.all.queryKey });

      const prevSettings = queryClient.getQueryData(settingsQuery.all.queryKey);

      const newSettings = {
        ...prevSettings!,
        isMiniPlayerAlwaysOnTop: state
      };
      queryClient.setQueryData(settingsQuery.all.queryKey, newSettings);

      return { prevSettings, newSettings };
    },
    onError: (_, __, onMutateResult) =>
      queryClient.setQueryData(settingsQuery.all.queryKey, onMutateResult?.prevSettings),
    onSettled: () => queryClient.invalidateQueries(settingsQuery.all)
  });

  const { updatePlayerType } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { isLyricsVisible } = props;

  return (
    <div
      className={`mini-player-title-bar z-10 flex h-[15%] max-h-[2.25rem] w-full justify-end opacity-0 transition-[visibility,opacity] select-none group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
        !isCurrentSongPlaying ? 'visible opacity-100' : ''
      }`}
    >
      <div
        className={`special-controls-container flex transition-[visibility,opacity] ${
          isLyricsVisible
            ? 'invisible opacity-0 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100'
            : ''
        } ${!isCurrentSongPlaying ? 'visible! opacity-100!' : ''}`}
      >
        <Button
          className="go-to-main-player-btn text-font-color-white dark:text-font-color-white mt-1! mr-0! rounded-md! border-0! bg-[transparent]! p-2! outline-offset-1 focus-visible:outline!"
          tooltipLabel={t('player.goToMainPlayer')}
          iconName="pip_exit"
          iconClassName="material-icons-round-outlined text-xl!"
          clickHandler={() => updatePlayerType('normal')}
          removeFocusOnClick
        />
        <Button
          className={`always-on-top-btn text-font-color-white dark:text-font-color-white !mt-1 !mr-0 !rounded-md !border-0 !bg-[transparent] !p-2 outline-offset-1 focus-visible:!outline ${
            isMiniPlayerAlwaysOnTop
              ? 'bg-dark-background-color-2! dark:bg-dark-background-color-2!'
              : ''
          }`}
          iconName={isMiniPlayerAlwaysOnTop ? 'move_down' : 'move_up'}
          iconClassName="material-icons-round text-xl"
          tooltipLabel={t(
            `miniPlayer.${isMiniPlayerAlwaysOnTop ? 'alwaysOnTopEnabled' : 'alwaysOnTopDisabled'}`
          )}
          removeFocusOnClick
          clickHandler={() => toggleAlwaysOnTop(!isMiniPlayerAlwaysOnTop)}
        />
      </div>
      <div className="window-controls-container flex">
        <Button
          className="minimize-btn m-0! flex h-full items-center justify-center rounded-none! border-0! bg-[transparent]! px-2! text-center text-xl -outline-offset-2 transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]! focus-visible:outline!"
          clickHandler={() => window.api.windowControls.minimizeApp()}
          tooltipLabel={t('titleBar.minimize')}
          iconName="minimize"
          iconClassName="material-icons-round icon flex h-fit cursor-pointer items-center justify-center text-center text-xl font-light! transition-[background] ease-in-out"
          removeFocusOnClick
        />
        <Button
          className="close-btn hover:bg-font-color-crimson! hover:text-font-color-white! m-0! flex h-full items-center justify-center rounded-none! border-0! bg-[transparent]! px-2! text-center text-xl -outline-offset-2 transition-[background] ease-in-out focus-visible:outline!"
          clickHandler={() => {
            if (hideWindowOnClose) window.api.windowControls.hideApp();
            else window.api.windowControls.closeApp();
          }}
          tooltipLabel={t('titleBar.close')}
          iconName="close"
          iconClassName="material-icons-round icon flex h-fit  cursor-pointer items-center justify-center text-center text-xl font-light! transition-[background] ease-in-out"
          removeFocusOnClick
        />
      </div>
    </div>
  );
};

export default TitleBarContainer;
