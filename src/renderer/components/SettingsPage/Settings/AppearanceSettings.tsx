/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';

import Img from 'renderer/components/Img';

import HomeImgLight from '../../../../../assets/images/webp/home-skeleton-light.webp';
import HomeImgDark from '../../../../../assets/images/webp/home-skeleton-dark.webp';
import HomeImgLightDark from '../../../../../assets/images/webp/home-skeleton-light-dark.webp';

const ThemeSettings = () => {
  const { userData } = React.useContext(AppContext);

  const [theme, setTheme] = React.useState(userData?.theme);

  const fetchUserData = React.useCallback(
    () =>
      window.api
        .getUserData()
        .then((res) => setTheme(res?.theme))
        .catch((err) => console.error(err)),
    []
  );

  React.useEffect(() => {
    fetchUserData();
    const manageUserDataUpdatesInSettingsPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType.includes('userData')) fetchUserData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageUserDataUpdatesInSettingsPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageUserDataUpdatesInSettingsPage
      );
    };
  }, [fetchUserData]);

  const focusInput = React.useCallback(
    (e: React.KeyboardEvent<HTMLLabelElement>) => {
      if (e.key === 'Enter') {
        const inputId = e.currentTarget.htmlFor;
        const inputElement = document.getElementById(inputId);
        inputElement?.click();
      }
    },
    []
  );

  return theme ? (
    <li className="main-container appearance-settings-container mb-16">
      <div className="title-container mb-4 mt-1 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">dark_mode</span>
        Appearance
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li>
          <div className="description">
            Change the of the application as you need. We don&apos;t judge you
            for it.
          </div>
          <div className="theme-change-radio-btns flex max-w-3xl items-center justify-between pl-4 pt-4">
            <label
              htmlFor="lightThemeRadioBtn"
              tabIndex={0}
              className={`theme-change-radio-btn mb-2 flex cursor-pointer flex-col items-center rounded-md bg-background-color-2/75  p-6 outline-2 outline-offset-1 focus-within:!outline hover:bg-background-color-2 dark:bg-dark-background-color-2/75 dark:hover:bg-dark-background-color-2 ${
                !theme.useSystemTheme &&
                !theme.isDarkMode &&
                '!bg-background-color-3 dark:!bg-dark-background-color-3'
              }`}
              onKeyDown={focusInput}
            >
              <input
                type="radio"
                name="theme"
                className="peer invisible absolute -left-[9999px] mr-4"
                value="lightTheme"
                id="lightThemeRadioBtn"
                defaultChecked={!theme.useSystemTheme && !theme.isDarkMode}
                onClick={() => window.api.changeAppTheme('light')}
              />
              <Img
                loading="eager"
                src={HomeImgLight}
                className="w-40 shadow-md"
              />
              <span className="mt-4 peer-checked:!text-font-color-black dark:peer-checked:!text-font-color-black">
                Light Theme
              </span>
            </label>

            <label
              htmlFor="darkThemeRadioBtn"
              tabIndex={0}
              className={`theme-change-radio-btn mb-2 flex cursor-pointer flex-col items-center rounded-md bg-background-color-2/75  p-6 outline-2 outline-offset-1 focus-within:!outline hover:bg-background-color-2 dark:bg-dark-background-color-2/75 dark:hover:bg-dark-background-color-2 ${
                !theme.useSystemTheme &&
                theme.isDarkMode &&
                '!bg-background-color-3 dark:!bg-dark-background-color-3'
              }`}
              onKeyDown={focusInput}
            >
              <input
                type="radio"
                name="theme"
                className="peer invisible absolute -left-[9999px] mr-4"
                value="darkTheme"
                id="darkThemeRadioBtn"
                defaultChecked={!theme.useSystemTheme && theme.isDarkMode}
                onClick={() => window.api.changeAppTheme('dark')}
              />
              <Img
                loading="eager"
                src={HomeImgDark}
                className="w-40 shadow-md"
              />
              <span className="mt-4 peer-checked:!text-font-color-black dark:peer-checked:!text-font-color-black">
                Dark Theme
              </span>
            </label>

            <label
              htmlFor="systemThemeRadioBtn"
              tabIndex={0}
              className={`theme-change-radio-btn hover:bg-background-color mb-2 flex cursor-pointer flex-col items-center rounded-md bg-background-color-2/75 p-6 outline-2 outline-offset-1 focus-within:!outline dark:bg-dark-background-color-2/75 dark:hover:bg-dark-background-color-2 ${
                theme.useSystemTheme &&
                '!bg-background-color-3 dark:!bg-dark-background-color-3'
              } `}
              onKeyDown={focusInput}
            >
              <input
                type="radio"
                name="theme"
                className="peer invisible absolute -left-[9999px] mr-4"
                value="systemTheme"
                id="systemThemeRadioBtn"
                defaultChecked={theme.useSystemTheme}
                onClick={() => window.api.changeAppTheme('system')}
              />
              <Img
                loading="eager"
                src={HomeImgLightDark}
                className="w-40 shadow-md"
              />
              <span className="mt-4 peer-checked:!text-font-color-black dark:peer-checked:!text-font-color-black">
                System Theme
              </span>
            </label>
          </div>
        </li>
      </ul>
    </li>
  ) : null;
};

export default ThemeSettings;
