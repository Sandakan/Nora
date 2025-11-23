/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */

import { queryClient } from '@renderer/index';
import { settingsMutation, settingsQuery } from '@renderer/queries/settings';
import { store } from '@renderer/store/store';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { type KeyboardEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import HomeImgDark from '../../../assets/images/webp/home-skeleton-dark.webp';
import HomeImgLight from '../../../assets/images/webp/home-skeleton-light.webp';
import HomeImgLightDark from '../../../assets/images/webp/home-skeleton-light-dark.webp';
import storage from '../../../utils/localStorage';
import Checkbox from '../../Checkbox';
import Img from '../../Img';
import DynamicThemeSettings from './DynamicThemeSettings';
import CollapsibleSection from "./CollapsibleSection";

const ThemeSettings = () => {
  const { data: userSettings } = useQuery(settingsQuery.all);

  const { mutate: changeAppTheme } = useMutation({
    mutationKey: settingsMutation.changeAppTheme.mutationKey,
    mutationFn: async (theme: AppTheme) => window.api.theme.changeAppTheme(theme),
    // When mutate is called:
    onMutate: async (theme) => {
      await queryClient.cancelQueries({ queryKey: settingsQuery.all.queryKey });

      const prevSettings = queryClient.getQueryData<typeof userSettings>(
        settingsQuery.all.queryKey
      );

      const newSettings = {
        ...prevSettings!,
        isDarkMode:
          theme === 'dark' ? true : theme === 'light' ? false : (prevSettings?.isDarkMode ?? false),
        useSystemTheme: theme === 'system'
      };
      queryClient.setQueryData<typeof userSettings>(settingsQuery.all.queryKey, newSettings);

      return { prevSettings, newSettings };
    },
    onError: (_, __, onMutateResult) =>
      queryClient.setQueryData<typeof userSettings>(
        settingsQuery.all.queryKey,
        onMutateResult?.prevSettings
      ),
    onSettled: () => queryClient.invalidateQueries(settingsQuery.all)
  });

  const currentSongPaletteData = useStore(store, (state) => state.currentSongData?.paletteData);
  const enableImageBasedDynamicThemes = useStore(
    store,
    (state) => state.localStorage.preferences?.enableImageBasedDynamicThemes
  );

  const { t } = useTranslation();

  const focusInput = useCallback((e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter') {
      const inputId = e.currentTarget.htmlFor;
      const inputElement = document.getElementById(inputId);
      inputElement?.click();
    }
  }, []);

  return userSettings ? (
    <li
      className="main-container appearance-settings-container mb-4"
      id="appearance-settings-container"
    >
    <CollapsibleSection
      defaultOpen={false}
      title={
      <div className="title-container text-font-color-highlight dark:text-dark-font-color-highlight flex items-center text-2xl font-medium">
        <span className="material-icons-round-outlined mr-2">dark_mode</span>
        {t('settingsPage.appearance')}
      </div>
      }
    >
      <ul className="marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight list-disc pl-6">
        <li>
          <div className="description">{t('settingsPage.changeTheme')}</div>
          <div className="theme-change-radio-btns flex max-w-3xl items-center justify-between pt-4 pl-4">
            <label
              htmlFor="lightThemeRadioBtn"
              tabIndex={0}
              className={`theme-change-radio-btn bg-background-color-2/75 hover:bg-background-color-2 dark:bg-dark-background-color-2/75 dark:hover:bg-dark-background-color-2 mb-2 flex cursor-pointer flex-col items-center rounded-md p-6 outline-offset-1 focus-within:outline-2 ${
                !userSettings.useSystemTheme &&
                !userSettings.isDarkMode &&
                'bg-background-color-3! dark:bg-dark-background-color-3!'
              }`}
              onKeyDown={focusInput}
            >
              <input
                type="radio"
                name="theme"
                className="peer invisible absolute -left-[9999px] mr-4"
                value="lightTheme"
                id="lightThemeRadioBtn"
                defaultChecked={!userSettings.useSystemTheme && !userSettings.isDarkMode}
                onClick={() => changeAppTheme('light')}
              />
              <Img loading="eager" src={HomeImgLight} className="h-24 w-40 shadow-md" />
              <span className="peer-checked:text-font-color-black! dark:peer-checked:text-font-color-black! mt-4">
                {t('settingsPage.lightTheme')}
              </span>
            </label>

            <label
              htmlFor="darkThemeRadioBtn"
              tabIndex={0}
              className={`theme-change-radio-btn bg-background-color-2/75 hover:bg-background-color-2 dark:bg-dark-background-color-2/75 dark:hover:bg-dark-background-color-2 mb-2 flex cursor-pointer flex-col items-center rounded-md p-6 outline-offset-1 focus-within:outline-2 ${
                !userSettings.useSystemTheme &&
                userSettings.isDarkMode &&
                'bg-background-color-3! dark:bg-dark-background-color-3!'
              }`}
              onKeyDown={focusInput}
            >
              <input
                type="radio"
                name="theme"
                className="peer invisible absolute -left-[9999px] mr-4"
                value="darkTheme"
                id="darkThemeRadioBtn"
                defaultChecked={!userSettings.useSystemTheme && userSettings.isDarkMode}
                onClick={() => changeAppTheme('dark')}
              />
              <Img loading="eager" src={HomeImgDark} className="h-24 w-40 shadow-md" />
              <span className="peer-checked:text-font-color-black! dark:peer-checked:text-font-color-black! mt-4">
                {t('settingsPage.darkTheme')}
              </span>
            </label>

            <label
              htmlFor="systemThemeRadioBtn"
              tabIndex={0}
              className={`theme-change-radio-btn hover:bg-background-color bg-background-color-2/75 dark:bg-dark-background-color-2/75 dark:hover:bg-dark-background-color-2 mb-2 flex cursor-pointer flex-col items-center rounded-md p-6 outline-offset-1 focus-within:outline-2 ${
                userSettings.useSystemTheme &&
                'bg-background-color-3! dark:bg-dark-background-color-3!'
              } `}
              onKeyDown={focusInput}
            >
              <input
                type="radio"
                name="theme"
                className="peer invisible absolute -left-[9999px] mr-4"
                value="systemTheme"
                id="systemThemeRadioBtn"
                defaultChecked={userSettings.useSystemTheme}
                onClick={() => changeAppTheme('system')}
              />
              <Img loading="eager" src={HomeImgLightDark} className="h-24 w-40 shadow-md" />
              <span className="peer-checked:text-font-color-black! dark:peer-checked:text-font-color-black! mt-4">
                {t('settingsPage.systemTheme')}
              </span>
            </label>
          </div>
        </li>
        <li className="secondary-container enable-image-based-dynamic-themes mb-4">
          <div className="description">
            {t('settingsPage.enableImageBasedDynamicThemesDescription')}
          </div>
          <Checkbox
            id="toggleEnableImageBasedDynamicThemes"
            isChecked={enableImageBasedDynamicThemes}
            checkedStateUpdateFunction={(state) =>
              storage.preferences.setPreferences('enableImageBasedDynamicThemes', state)
            }
            labelContent={t('settingsPage.enableImageBasedDynamicThemes')}
          />
          {enableImageBasedDynamicThemes && currentSongPaletteData && (
            <DynamicThemeSettings palette={currentSongPaletteData} />
          )}
        </li>
      </ul>
    </CollapsibleSection>
    </li>
  ) : null;
};

export default ThemeSettings;
