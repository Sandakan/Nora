import { useContext, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import storage from '../utils/localStorage';

import Button from './Button';
import Checkbox from './Checkbox';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';

interface OpenLinkConfirmPromptProps {
  link: string;
  title?: string;
  buttonClassName?: string;
}

const OpenLinkConfirmPrompt = (props: OpenLinkConfirmPromptProps) => {
  const { title, link, buttonClassName } = props;
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const [checkboxState, setCheckboxState] = useState(
    preferences?.doNotVerifyWhenOpeningLinks ?? false
  );

  return (
    <div>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mb-4 flex items-center text-3xl font-medium">
        <span className="material-icons-round mr-2 text-4xl">link</span> {title}
      </div>
      <div className="description">
        <Trans
          i18nKey="openLinkConfirmPrompt.description"
          components={{
            span: (
              <span
                className="text-font-color-highlight-2 dark:text-dark-font-color-highlight-2 cursor-pointer font-normal hover:underline"
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
            br: <br />
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
          className={`remove-song-from-library-btn text-font-color-black hover:border-background-color-3 dark:text-font-color-white dark:hover:border-background-color-3 w-[10rem] py-3! ${buttonClassName}`}
          clickHandler={() => {
            changePromptMenuData(false);
          }}
        />
        <Button
          label={t('openLinkConfirmPrompt.openLink')}
          className={`remove-song-from-library-btn bg-background-color-3! text-font-color-black hover:border-background-color-3 dark:bg-dark-background-color-3! dark:text-font-color-black! dark:hover:border-background-color-3 w-[10rem] py-3! ${buttonClassName}`}
          clickHandler={() => {
            storage.preferences.setPreferences('doNotVerifyWhenOpeningLinks', checkboxState);
            window.api.settingsHelpers.openInBrowser(link);
            changePromptMenuData(false);
          }}
        />
      </div>
    </div>
  );
};

export default OpenLinkConfirmPrompt;
