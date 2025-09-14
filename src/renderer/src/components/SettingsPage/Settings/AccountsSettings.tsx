import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '../../Button';
import Checkbox from '../../Checkbox';

import LastFMIcon from '../../../assets/images/webp/last-fm-logo.webp';
import { useMutation, useQuery } from '@tanstack/react-query';
import { settingsQuery } from '@renderer/queries/settings';
import { queryClient } from '@renderer/index';

const AccountsSettings = () => {
  const { data: userSettings } = useQuery(settingsQuery.all);
  const { t } = useTranslation();

  const isLastFmConnected = useMemo(
    () => !!userSettings?.lastFmSessionKey,
    [userSettings?.lastFmSessionKey]
  );

  const { mutate: updateDiscordRpcState } = useMutation({
    mutationFn: (enableDiscordRpc: boolean) =>
      window.api.settings.updateDiscordRpcState(enableDiscordRpc),
    onSuccess: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  const { mutate: updateSongScrobblingToLastFMState } = useMutation({
    mutationFn: (enableScrobbling: boolean) =>
      window.api.settings.updateSongScrobblingToLastFMState(enableScrobbling),
    onSuccess: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  const { mutate: updateSongFavoritesToLastFMState } = useMutation({
    mutationFn: (enableFavorites: boolean) =>
      window.api.settings.updateSongFavoritesToLastFMState(enableFavorites),
    onSuccess: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  const { mutate: updateSendNowPlayingSongDataToLastFMState } = useMutation({
    mutationFn: (enableNowPlaying: boolean) =>
      window.api.settings.updateNowPlayingSongDataToLastFMState(enableNowPlaying),
    onSuccess: () => {
      queryClient.invalidateQueries(settingsQuery.all);
    }
  });

  return (
    <li className="main-container startup-settings-container mb-16">
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-4 flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">account_circle</span>
        {t('settingsPage.accounts')}
      </div>
      <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 list-disc pl-6">
        <li className="discord-rpc-integration mb-4">
          <div className="description">{t('settingsPage.enableDiscordRpcDescription')}</div>
          <Checkbox
            id="enableDiscordRpc"
            isChecked={userSettings?.enableDiscordRPC ?? false}
            checkedStateUpdateFunction={(state) => updateDiscordRpcState(state)}
            labelContent={t('settingsPage.enableDiscordRpc')}
          />
        </li>
        <li className="last-fm-integration mb-4">
          <div className="description">{t('settingsPage.integrateLastFm')}</div>
          <div className="flex p-4 pb-0">
            <img
              src={LastFMIcon}
              alt={t('settingsPage.lastFmLogo')}
              className={`mr-4 h-16 w-16 rounded-md ${
                !isLastFmConnected && 'brightness-90 grayscale'
              }`}
            />
            <div className="grow-0">
              <p
                className={`flex items-center font-semibold uppercase ${
                  isLastFmConnected ? 'text-green-500' : 'text-red-500'
                } `}
              >
                {t(
                  isLastFmConnected
                    ? 'settingsPage.lastFmConnected'
                    : 'settingsPage.lastFmNotConnected'
                )}{' '}
                {isLastFmConnected &&
                  userSettings?.lastFmSessionName &&
                  `(${t('settingsPage.loggedInAs')} ${userSettings.lastFmSessionName})`}
              </p>
              <ul className="list-inside list-disc text-sm">
                <li>{t('settingsPage.lastFmDescription1')}</li>
                <li>{t('settingsPage.lastFmDescription2')}</li>
                <li>{t('settingsPage.lastFmDescription3')}</li>
                <li>{t('settingsPage.lastFmDescription4')}</li>
              </ul>
              <Button
                label={
                  isLastFmConnected
                    ? t('settingsPage.authenticateAgain')
                    : t('settingsPage.loginInBrowser')
                }
                iconName="open_in_new"
                className="mt-2"
                clickHandler={() => window.api.settingsHelpers.loginToLastFmInBrowser()}
              />
            </div>
          </div>
          <ul className="marker:bg-background-color-3 dark:marker:bg-background-color-3 mt-4 list-disc pl-8">
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">{t('settingsPage.scrobblingDescription')}</div>
              <Checkbox
                id="sendSongScrobblingDataToLastFM"
                isChecked={!!userSettings?.sendSongScrobblingDataToLastFM}
                checkedStateUpdateFunction={(state) => updateSongScrobblingToLastFMState(state)}
                labelContent={t('settingsPage.enableScrobbling')}
                isDisabled={!isLastFmConnected}
              />
            </li>
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                {t('settingsPage.sendFavoritesToLastFmDescription')}
              </div>
              <Checkbox
                id="sendSongFavoritesDataToLastFM"
                isChecked={!!userSettings?.sendSongFavoritesDataToLastFM}
                checkedStateUpdateFunction={(state) => updateSongFavoritesToLastFMState(state)}
                labelContent={t('settingsPage.sendFavoritesToLastFm')}
                isDisabled={!isLastFmConnected}
              />
            </li>
            <li
              className={`last-fm-integration mb-4 transition-opacity ${
                !isLastFmConnected && 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className="description">
                {t('settingsPage.sendNowPlayingToLastFmDescription')}
              </div>
              <Checkbox
                id="sendNowPlayingSongDataToLastFM"
                isChecked={!!userSettings?.sendNowPlayingSongDataToLastFM}
                checkedStateUpdateFunction={(state) =>
                  updateSendNowPlayingSongDataToLastFMState(state)
                }
                labelContent={t('settingsPage.sendNowPlayingToLastFm')}
                isDisabled={!isLastFmConnected}
              />
            </li>
          </ul>
        </li>
      </ul>
    </li>
  );
};

export default AccountsSettings;
