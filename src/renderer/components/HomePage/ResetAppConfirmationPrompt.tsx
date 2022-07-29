export default () => {
  return (
    <>
      <div className="title-container mt-1 pr-4 flex items-center mb-8 text-font-color-black text-3xl font-medium dark:text-font-color-white">
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
        className="confirm-app-reset-btn danger-btn w-48 h-10 rounded-lg outline-none !bg-foreground-color-1 dark:!bg-foreground-color-1 text-font-color-white dark:text-font-color-white mt-6 border-[transparent] float-right cursor-pointer hover:border-foreground-color-1 dark:hover:border-foreground-color-1 transition-[background] ease-in-out"
        onClick={() => window.api.resetApp()}
      >
        Reset The App
      </button>
    </>
  );
};
