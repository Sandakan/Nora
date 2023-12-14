import React from 'react';
import { useTranslation } from 'react-i18next';
import Dropdown, { DropdownOption } from 'renderer/components/Dropdown';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import i18n from 'renderer/i18n';

const supportedLanguagesDropdownOptions: DropdownOption<LanguageCodes>[] = [
  { label: `English`, value: 'en' },
  // { label: `Francais`, value: 'fr' },
];

const LanguageSettings = () => {
  const { t } = useTranslation();
  const { userData } = React.useContext(AppContext);
  const { addNewNotifications } = React.useContext(AppUpdateContext);
  const appLang = userData?.language || 'en';

  return (
    <li className="main-container performance-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2 leading-none">
          translate
        </span>
        <span>{t('settingsPage.language')}</span>
      </div>
      <ul className="list-disc pl-6 marker:bg-background-color-3 dark:marker:bg-background-color-3">
        <li className="seekbar-scroll-interval mb-4">
          <div className="description">
            {t('settingsPage.languageDescription')}
          </div>
          <Dropdown
            className="mt-4"
            name="supportedLanguagesDropdown"
            value={appLang}
            options={supportedLanguagesDropdownOptions}
            onChange={(e) => {
              const val = e.currentTarget.value as LanguageCodes;

              if (i18n.languages.includes(val))
                return i18n
                  .changeLanguage(val, (err) => {
                    if (err) return console.warn(err);
                    return window.api.userData.saveUserData('language', val);
                  })
                  .then(() =>
                    addNewNotifications([
                      {
                        id: 'languageChanged',
                        content: t('notifications.languageChanged'),
                        iconName: 'translate',
                      },
                    ]),
                  );
              return console.error(
                `App doesn't support the selected language '${val}'`,
                { supportedLanguages: i18n.languages },
              );
            }}
          />
        </li>
      </ul>
    </li>
  );
};

export default LanguageSettings;
