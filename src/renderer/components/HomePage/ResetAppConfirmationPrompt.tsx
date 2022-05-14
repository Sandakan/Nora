export default () => {
  return (
    <>
      <div className="title-container">Confirm App Reset</div>
      <div>
        Resetting the app will remove all of your user data including data about
        songs, data about favorites, data about your preferences, applied
        settings data etc; but NOT the songs in this system. Keep in mind that
        this process is IRREVERSIBLE.
      </div>
      <button
        type="button"
        className="confirm-app-reset-btn danger-btn"
        onClick={() => window.api.resetApp()}
      >
        Reset The App
      </button>
    </>
  );
};
