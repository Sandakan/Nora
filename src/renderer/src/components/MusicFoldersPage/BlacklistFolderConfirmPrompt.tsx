import { useContext, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

// import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import Checkbox from '../Checkbox';

const BlacklistFolderConfrimPrompt = (props: { folderPaths: string[]; folderName?: string }) => {
  // const { isMultipleSelectionEnabled } = useContext(AppContext);
  const { addNewNotifications, changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { folderPaths, folderName } = props;
  const [isDoNotShowAgain, setIsDoNotShowAgain] = useState(false);
  return (
    <>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-3xl font-medium">
        Confirm Blacklisting{' '}
        {folderPaths.length === 1 && folderName ? (
          <>&apos;{folderName}&apos; folder</>
        ) : (
          `${folderPaths.length} folders`
        )}
        .
      </div>
      <div className="description">
        {t('blacklistFolderConfirmPrompt.message', {
          count: folderPaths.length
        })}

        <div className="mt-4">
          {t('blacklistFolderConfirmPrompt.effectTitle')}
          <ul className="marker:text-font-color-highlight dark:marker:text-dark-font-color-highlight list-inside list-disc pl-4">
            <li>
              <Trans
                i18nKey="blacklistFolderConfirmPrompt.effect1"
                components={{
                  span: (
                    <span className="material-icons-round text-font-color-highlight dark:text-dark-font-color-highlight" />
                  )
                }}
              />
            </li>
            <li>{t('blacklistFolderConfirmPrompt.effect2')}</li>
          </ul>
        </div>
        <div className="mt-4">
          {t('blacklistFolderConfirmPrompt.effectTitle2')}
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
          label={`Blacklist Folder${folderPaths.length !== 1 ? 's' : ''}`}
          className="blacklist-folders-btn bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 mt-4 px-8 text-lg"
          clickHandler={() => {
            return window.api.folderData.blacklistFolders(folderPaths).then(() => {
              addNewNotifications([
                {
                  id: `${folderName}Blacklisted`,
                  duration: 5000,
                  content: t('blacklistFolderConfirmPrompt.folderBlacklisted', {
                    count: folderPaths.length
                  }),
                  iconName: 'block'
                }
              ]);
              return changePromptMenuData(false);
            });
          }}
        />
      </div>
    </>
  );
};

export default BlacklistFolderConfrimPrompt;
