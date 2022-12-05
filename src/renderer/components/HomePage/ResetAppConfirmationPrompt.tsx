export default () => {
  return (
    <>
      <div className="title-container mt-1 mb-8 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Confirm App Reset
      </div>
      <div>
        Resetting the app will remove all of your user data including data about
        songs, data about favorites, data about your preferences, applied
        settings data etc; but NOT the songs in this system. Keep in mind that
        this process is IRREVERSIBLE.
      </div>
      <button
        type="button"
        className="confirm-app-reset-btn danger-btn float-right mt-6 h-10 w-48 cursor-pointer rounded-lg border-[transparent] !bg-font-color-crimson text-font-color-white outline-none transition-[background] ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
        onClick={() => window.api.resetApp()}
      >
        Reset The App
      </button>
    </>
  );
};
