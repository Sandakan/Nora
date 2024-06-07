import { lazy, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';

import Button from '../Button';
import ShortcutButton from '../SettingsPage/ShortcutButton';

const AppShortcutsPrompt = lazy(() => import('../SettingsPage/AppShortcutsPrompt'));

const LyricsEditorHelpPrompt = () => {
  const { changePromptMenuData } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  return (
    <div>
      <div className="title-container mb-4 flex items-center text-3xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 text-4xl">help</span>{' '}
        {t('lyricsEditorHelpPrompt.title')}
      </div>
      <ul className="pl-4">
        <li>
          <h3 className="text-xl font-medium">{t('lyricsEditorHelpPrompt.subTitle1')}</h3>
          <div className="mb-6 py-2 pl-4">
            <Trans
              i18nKey="lyricsEditorHelpPrompt.subTitle1Message"
              components={{
                ol: <ol className="list-outside list-decimal pl-4" />,
                li: <li className="mb-2" />,
                ShortcutButton: <ShortcutButton className="!mr-1 !inline" />
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
                      className="!mr-0 !inline !border-0 !p-0 !text-base !text-font-color-highlight-2 hover:underline dark:!text-dark-font-color-highlight-2"
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
                ShortcutButton: <ShortcutButton className="!mr-1 !inline" />
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
                ShortcutButton: <ShortcutButton className="!mr-1 !inline" />
              }}
            />
          </div>
        </li>
      </ul>
    </div>
  );
};

export default LyricsEditorHelpPrompt;
