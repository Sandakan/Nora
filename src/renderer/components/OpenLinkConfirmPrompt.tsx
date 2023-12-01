/* eslint-disable react/require-default-props */
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import storage from 'renderer/utils/localStorage';

import Button from './Button';
import Checkbox from './Checkbox';

interface OpenLinkConfirmPromptProps {
  link: string;
  title?: string;
  buttonClassName?: string;
}

const OpenLinkConfirmPrompt = (props: OpenLinkConfirmPromptProps) => {
  const { title, link, buttonClassName } = props;
  const { localStorageData } = React.useContext(AppContext);
  const { changePromptMenuData } = React.useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [checkboxState, setCheckboxState] = React.useState(
    (localStorageData &&
      localStorageData.preferences.doNotVerifyWhenOpeningLinks) ??
      false,
  );

  return (
    <div>
      <div className="title-container mb-4 flex items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round mr-2 text-4xl">link</span> {title}
      </div>
      <div className="description">
        <Trans
          i18nKey="openLinkConfirmPrompt.description"
          components={{
            span: (
              <span
                className="cursor-pointer font-normal text-font-color-highlight-2 hover:underline dark:text-dark-font-color-highlight-2"
                onClick={() => {
                  changePromptMenuData(false);
                  window.api.settingsHelpers.openInBrowser(link);
                }}
                onKeyDown={() => {
                  changePromptMenuData(false);
                  window.api.settingsHelpers.openInBrowser(link);
                }}
                role="link"
                tabIndex={0}
              >
                &apos;{link}&apos;
              </span>
            ),
            br: <br />,
          }}
        />
      </div>
      <Checkbox
        id="doNotVerifyWhenOpeningLinks"
        isChecked={checkboxState}
        checkedStateUpdateFunction={(state) => setCheckboxState(state)}
        labelContent={t('openLinkConfirmPrompt.doNotVerifyLink')}
      />
      <div className="buttons-container mt-12 flex justify-end">
        <Button
          label={t('common.cancel')}
          className={`remove-song-from-library-btn w-[10rem] text-font-color-black hover:border-background-color-3 dark:text-font-color-white dark:hover:border-background-color-3 ${buttonClassName}`}
          clickHandler={() => {
            changePromptMenuData(false);
          }}
        />
        <Button
          label={t('openLinkConfirmPrompt.openLink')}
          className={`remove-song-from-library-btn w-[10rem] !bg-background-color-3 text-font-color-black hover:border-background-color-3 dark:!bg-dark-background-color-3 dark:!text-font-color-black dark:hover:border-background-color-3 ${buttonClassName}`}
          clickHandler={() => {
            storage.preferences.setPreferences(
              'doNotVerifyWhenOpeningLinks',
              checkboxState,
            );
            window.api.settingsHelpers.openInBrowser(link);
            changePromptMenuData(false);
          }}
        />
      </div>
    </div>
  );
};

export default OpenLinkConfirmPrompt;
