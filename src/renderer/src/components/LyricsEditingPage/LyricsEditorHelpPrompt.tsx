import { lazy, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import ShortcutButton from '../SettingsPage/ShortcutButton';
import Checkbox from '../Checkbox';
import storage from '../../../src/utils/localStorage';
import { store } from '@renderer/store';
import { useStore } from '@tanstack/react-store';

const AppShortcutsPrompt = lazy(() => import('../SettingsPage/AppShortcutsPrompt'));

type Props = {
  showDoNotShowAgainCheckbox?: boolean;
};

const LyricsEditorHelpPrompt = (props: Props) => {
  const preferences = useStore(store, (state) => state.localStorage.preferences);
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { showDoNotShowAgainCheckbox = false } = props;

  return (
    <div>
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight mb-4 flex items-center justify-between">
        <span className="flex items-center text-3xl font-medium">
          <span className="material-icons-round-outlined mr-2 text-4xl">help</span>{' '}
          {t('lyricsEditorHelpPrompt.title')}
        </span>

        {showDoNotShowAgainCheckbox && (
          <Checkbox
            id="doNotShowHelpPageOnLyricsEditorStartUpCheckbox"
            className="no-blacklist-song-confirm-checkbox-container my-8"
            labelContent={t('common.doNotShowThisMessageAgain')}
            isChecked={preferences?.doNotShowHelpPageOnLyricsEditorStartUp || false}
            checkedStateUpdateFunction={(state) => {
              storage.preferences.setPreferences('doNotShowHelpPageOnLyricsEditorStartUp', state);
            }}
          />
        )}
      </div>

      <ul className="list-outside list-disc pl-8">
        <li>
          <h3 className="text-xl font-medium">{t('lyricsEditorHelpPrompt.subTitle1')}</h3>
          <div className="mb-6 py-2 pl-4">
            <Trans
              i18nKey="lyricsEditorHelpPrompt.subTitle1Message"
              components={{
                ol: <ol className="list-outside list-decimal pl-4" />,
                li: <li className="mb-2" />,
                ShortcutButton: <ShortcutButton className="mr-1! inline!" />
              }}
            />
          </div>
        </li>

        <li>
          <h3 className="text-xl font-medium">{t('lyricsEditorHelpPrompt.subTitle2')}</h3>
          <div className="mb-6 py-2 pl-4">
            <p>
              <Trans
                i18nKey="lyricsEditorHelpPrompt.subTitle2Message"
                components={{
                  Button: (
                    <Button
                      className="text-font-color-highlight-2! dark:text-dark-font-color-highlight-2! mr-0! inline! border-0! p-0! text-base! hover:underline"
                      clickHandler={() => changePromptMenuData(true, <AppShortcutsPrompt />)}
                    />
                  )
                }}
              />
            </p>
          </div>
        </li>

        <li>
          <h3 className="text-xl font-medium">{t('lyricsEditorHelpPrompt.subTitle3')}</h3>
          <div className="mb-6 py-2 pl-4">
            <Trans
              i18nKey="lyricsEditorHelpPrompt.subTitle3Message"
              components={{
                ol: <ol className="list-outside list-decimal pl-4" />,
                li: <li className="mb-2" />,
                ShortcutButton: <ShortcutButton className="mr-1! inline!" />
              }}
            />
          </div>
        </li>

        <li>
          <h3 className="text-xl font-medium">{t('lyricsEditorHelpPrompt.subTitle4')}</h3>
          <div className="mb-6 py-2 pl-4">
            <Trans
              i18nKey="lyricsEditorHelpPrompt.subTitle3Message"
              components={{
                ol: <ol className="list-outside list-decimal pl-4" />,
                li: <li className="mb-2" />,
                ShortcutButton: <ShortcutButton className="mr-1! inline!" />
              }}
            />
          </div>
        </li>
      </ul>
    </div>
  );
};

export default LyricsEditorHelpPrompt;
