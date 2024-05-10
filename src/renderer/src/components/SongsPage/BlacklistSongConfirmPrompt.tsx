/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import storage from '../../utils/localStorage';
import Button from '../Button';
import Checkbox from '../Checkbox';

const BlacklistSongConfrimPrompt = (props: { songIds: string[]; title?: string }) => {
  const { addNewNotifications, changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { songIds, title } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = React.useState(false);
  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        {t('blacklistSongConfirmPrompt.title', { count: songIds.length })}
      </div>
      <div className="description">
        {t('blacklistSongConfirmPrompt.message', { count: songIds.length })}
        <div className="mt-4">
          {t('blacklistSongConfirmPrompt.effectTitle')}
          <ul className="list-inside list-disc pl-4 marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight">
            <li>
              <Trans
                i18nKey="blacklistSongConfirmPrompt.effect1"
                components={{
                  span: (
                    <span className="material-icons-round text-font-color-highlight dark:text-dark-font-color-highlight">
                      block
                    </span>
                  )
                }}
              />
            </li>
            <li>
              <Trans
                i18nKey="blacklistSongConfirmPrompt.effect2"
                components={{
                  span: (
                    <span className="text-font-color-highlight dark:text-dark-font-color-highlight" />
                  )
                }}
              />
            </li>
            <li>
              <Trans
                i18nKey="blacklistSongConfirmPrompt.effect3"
                components={{
                  span: (
                    <span className="text-font-color-highlight dark:text-dark-font-color-highlight" />
                  )
                }}
              />
            </li>
          </ul>
        </div>
      </div>
      <Checkbox
        id="doNotShowAgainCheckbox"
        className="no-blacklist-song-confirm-checkbox-container mt-8"
        labelContent={t('common.doNotShowThisMessageAgain')}
        isChecked={isDoNotShowAgain}
        checkedStateUpdateFunction={(state) => {
          setIsDoNotShowAgain(state);
        }}
      />
      <div className="buttons-container flex items-center justify-end">
        <Button
          label={t('song.blacklistSong', { count: songIds.length })}
          className="blacklist-song-btn mt-4 !bg-background-color-3 px-8 text-lg text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3"
          clickHandler={() =>
            window.api.audioLibraryControls
              .blacklistSongs(songIds)
              .then(() => {
                if (isDoNotShowAgain)
                  storage.preferences.setPreferences('isSongIndexingEnabled', isDoNotShowAgain);
                changePromptMenuData(false);
                return addNewNotifications([
                  {
                    id: `${title}Blacklisted`,
                    delay: 5000,
                    content: t('blacklistSongConfirmPrompt.songsBlacklisted', {
                      count: songIds.length
                    }),
                    iconName: 'delete_outline'
                  }
                ]);
              })
              .catch((err) => console.error(err))
          }
        />
      </div>
    </>
  );
};

export default BlacklistSongConfrimPrompt;
