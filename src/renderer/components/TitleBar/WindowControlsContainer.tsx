import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import Button from '../Button';

const WindowControlsContainer = () => {
  const { userData } = React.useContext(AppContext);

  const close = React.useCallback(() => {
    if (userData && userData.preferences.hideWindowOnClose)
      window.api.hideApp();
    else window.api.closeApp();
  }, [userData]);

  const minimize = React.useCallback(() => window.api.minimizeApp(), []);
  const maximize = React.useCallback(() => window.api.toggleMaximizeApp(), []);

  return (
    <div
      className="window-controls-container ml-6 flex h-full items-center justify-between"
      id="window-controls-container"
    >
      <Button
        className="minimize-btn !m-0 h-full !rounded-none !border-0 !px-3 text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline"
        clickHandler={minimize}
        tooltipLabel="Minimize"
        iconName="minimize"
        iconClassName="h-fit text-xl !font-light transition-[background] ease-in-out"
      />
      <Button
        className="maximize-btn !m-0 h-full !rounded-none !border-0 !px-3 text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-[hsla(0deg,0%,80%,0.5)] focus-visible:!outline"
        clickHandler={maximize}
        tooltipLabel="Maximize"
        iconClassName="material-icons-round-outlined h-fit text-lg !font-light transition-[background] ease-in-out"
        iconName="crop_square"
      />
      <Button
        className="close-btn !m-0 h-full !rounded-none !border-0 !px-3 text-xl outline-1 -outline-offset-2 transition-[background] ease-in-out hover:!bg-font-color-crimson hover:!text-font-color-white focus-visible:!outline"
        clickHandler={close}
        tooltipLabel="Close"
        iconName="close"
        iconClassName="h-fit text-xl !font-light transition-[background] ease-in-out"
      />
    </div>
  );
};

export default WindowControlsContainer;
