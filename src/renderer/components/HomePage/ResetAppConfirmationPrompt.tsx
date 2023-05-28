import Button from '../Button';

export default () => {
  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confirm App Reset
      </div>
      <div>
        Resetting the app will remove all of your user data including data about
        songs, data about favorites, data about your preferences, applied
        settings data etc; but NOT the songs in this system. Keep in mind that
        this process is{' '}
        <span className="font-semibold text-font-color-crimson">
          IRREVERSIBLE
        </span>
        .
      </div>
      <div className="buttons-container flex items-center justify-end">
        <Button
          label="Reset The App"
          className="confirm-app-reset-btn danger-btn float-right mt-6 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          clickHandler={() => window.api.appControls.resetApp()}
        />
      </div>
    </>
  );
};
