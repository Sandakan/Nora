import storage from 'renderer/utils/localStorage';

import Button from '../Button';

export default () => {
  const { resetLocalStorage } = storage;

  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confirm Clearing Local Storage Data
      </div>
      <p>
        This process will clear any corrupted local storage data in Nora and
        revert it back to the default settings.
      </p>

      <div className="info-about-affecting-files-container mt-4">
        <p className="mb-1">Proceeding this action affects these data :</p>
        <ul className="ml-4 list-inside list-disc marker:text-font-color-highlight marker:dark:text-dark-font-color-highlight">
          <li className="text-sm font-light">
            Most Preference Settings in Nora
          </li>
          <li className="text-sm font-light">
            Playback settings such as currently playing song, volume etc.
          </li>
          <li className="text-sm font-light">Current queue data</li>
          <li className="text-sm font-light">
            Ignored suggestions data such as featuring artists, separate artists
            and duplicates
          </li>
          <li className="text-sm font-light">Page sorting data</li>
          <li className="text-sm font-light">Equalizer data</li>
          <li className="text-sm font-light">Lyrics Editor settings</li>
        </ul>
      </div>

      <br />
      <p>Nora will restart after the process.</p>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label="Reset The App"
          className="confirm-app-reset-btn danger-btn float-right mt-6 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          clickHandler={() => {
            resetLocalStorage();
            window.api.appControls.restartRenderer('LOCAL_STORAGE_CLEARED');
          }}
        />
      </div>
    </>
  );
};
