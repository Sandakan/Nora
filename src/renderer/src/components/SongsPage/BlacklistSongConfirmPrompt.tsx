import { useContext, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import Checkbox from '../Checkbox';

import storage from '../../utils/localStorage';

const BlacklistSongConfrimPrompt = (props: { songIds: number[]; title?: string }) => {
  const { addNewNotifications, changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { songIds, title } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = useState(false);
  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        {t('blacklistSongConfirmPrompt.title', { count: songIds.length })}
      </div>
      <div className="description">
        {t('blacklistSongConfirmPrompt.message', { count: songIds.length })}
        <div className="mt-4">
          {t('blacklistSongConfirmPrompt.effectTitle')}
          <ul className="marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight list-inside list-disc pl-4">
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
          className="blacklist-song-btn bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 mt-4 px-8 text-lg"
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
                    duration: 5000,
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
