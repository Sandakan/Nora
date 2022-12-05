/* eslint-disable jsx-a11y/label-has-associated-control */

type Props = { themeData?: AppThemeData };

const ThemeSettings = (props: Props) => {
  const { themeData: theme } = props;
  return theme ? (
    <>
      <div className="title-container mt-1 mb-4 flex items-center text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
        <span className="material-icons-round-outlined mr-2">dark_mode</span>
        Appearance
      </div>
      <ul className="list-disc pl-6 marker:bg-font-color-highlight dark:marker:bg-dark-font-color-highlight">
        <li>
          <div className="description">
            Change the of the application as you need. We don&apos;t judge you
            for it.
          </div>
          <div className="theme-change-radio-btns pt-4 pl-4">
            <div className="theme-change-radio-btn mb-2">
              <input
                type="radio"
                name="theme"
                className="peer mr-4 hidden"
                value="lightTheme"
                id="lightThemeRadioBtn"
                defaultChecked={!theme.useSystemTheme && !theme.isDarkMode}
                onClick={() => window.api.changeAppTheme('light')}
              />
              <label
                className="cursor-pointer before:mr-4 before:inline-block before:h-4 before:w-4 before:rounded-full before:border-[0.2rem] before:border-solid before:border-[#ccc] before:align-middle before:content-[''] hover:text-font-color-highlight dark:hover:text-dark-font-color-highlight"
                htmlFor="lightThemeRadioBtn"
              >
                Light Theme
              </label>
            </div>
            <div className="theme-change-radio-btn mb-2">
              <input
                type="radio"
                name="theme"
                className="mr-4 hidden"
                value="darkTheme"
                id="darkThemeRadioBtn"
                defaultChecked={!theme.useSystemTheme && theme.isDarkMode}
                onClick={() => window.api.changeAppTheme('dark')}
              />
              <label
                className="cursor-pointer before:mr-4 before:inline-block before:h-4 before:w-4 before:rounded-full before:border-[0.2rem] before:border-solid before:border-[#ccc] before:align-middle before:content-[''] hover:text-font-color-highlight dark:hover:text-dark-font-color-highlight"
                htmlFor="darkThemeRadioBtn"
              >
                Dark Theme
              </label>
            </div>
            <div className="theme-change-radio-btn mb-2">
              <input
                type="radio"
                name="theme"
                className="mr-4 hidden"
                value="systemTheme"
                id="systemThemeRadioBtn"
                defaultChecked={theme.useSystemTheme}
                onClick={() => window.api.changeAppTheme('system')}
              />
              <label
                className="cursor-pointer before:mr-4 before:inline-block before:h-4 before:w-4 before:rounded-full before:border-[0.2rem] before:border-solid before:border-[#ccc] before:align-middle before:content-[''] hover:text-font-color-highlight dark:hover:text-dark-font-color-highlight"
                htmlFor="systemThemeRadioBtn"
              >
                Use System Theme
              </label>
            </div>
          </div>
        </li>
      </ul>
    </>
  ) : null;
};

export default ThemeSettings;
