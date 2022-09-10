/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import LightModeLogo from '../../../../assets/images/png/logo_light_mode.png';
import { AppContext, AppUpdateContext } from '../../contexts/AppContext';

const Header = React.memo(() => {
  const close = () => window.api.closeApp();
  const minimize = () => window.api.minimizeApp();
  const maximize = () => window.api.toggleMaximizeApp();
  const { isDarkMode, pageHistoryIndex } = React.useContext(AppContext);
  const { updatePageHistoryIndex } = React.useContext(AppUpdateContext);

  return (
    <header
      id="title-bar"
      className="w-full h-10 relative top-0 bg-transparent flex items-center justify-between text-font-color-black dark:text-font-color-white"
    >
      <div className="logo-and-app-name-container h-full flex items-center ml-2">
        <span className="logo-container">
          <img
            className="h-7 p-1 mr-2"
            src={LightModeLogo}
            alt="Oto Music for Desktop Logo"
          />
        </span>
        <span className="app-name-container">
          <span>
            Oto Music for Desktop
            <sup className="app-version text-[0.6rem] font-semibold text-background-color-3 ml-1">
              ALPHA
            </sup>
          </span>
        </span>
        <div className="navigation-controls-container ml-8">
          <button
            type="button"
            className={`previousPageBtn h-fit border-2 border-dark-background-color-2/0 rounded-full flex  transition-all duration-200 ease-in-out ${
              pageHistoryIndex > 0
                ? 'available visible opacity-100 translate-x-0 hover:text-font-color-black dark:hover:text-font-color-white'
                : 'invisible opacity-0 -translate-x-8'
            }`}
            onClick={() => updatePageHistoryIndex('decrement')}
            title="Go Back"
          >
            <span className="material-icons-round text-2xl">arrow_back</span>
          </button>

          {/* <button
            type="button"
            className={`forwardPageBtn ${
              pageHistoryIndex > 0 && 'available'
            } h-fit border-2 border-dark-background-color-2/0 rounded-full flex invisible opacity-0 -translate-x-8 transition-all duration-200 ease-in-out`}
            onClick={() => updatePageHistoryIndex('increment')}
            title="Go forward"
          >
            <span className="material-icons-round text-2xl">arrow_forward</span>
          </button> */}
        </div>
      </div>
      <div className="window-controls-and-special-controls-container h-full flex flex-row">
        <div className="special-controls-container h-fll flex items-center justify-between pt-2 [&>*]:mr-1 [&>*]:h-full [&>*]:px-3 [&>*]:transition-[color,visibility,opacity [&>*]:rounded-md [&>*]:cursor-pointer">
          <span
            className={`network-indicator flex items-center justify-center text-center hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 transition-[background] ${
              navigator.onLine &&
              '!transition-[visibility] duration-150 delay-[2500ms] invisible'
            }`}
            title={`You are ${
              navigator.onLine ? 'connected to' : 'disconnected from'
            } the internet.`}
          >
            <span
              className={`material-icons-round-outlined ${
                navigator.onLine &&
                'transition-[opacity,visibility] invisible opacity-0 duration-150 delay-[2500ms] text-background-color-3 dark:text-dark-background-color-3'
              }`}
            >
              {navigator.onLine ? 'wifi' : 'wifi_off'}
            </span>
          </span>
          <span
            className="change-theme-btn text-xl flex items-center justify-center text-center transition-[color,background] ease-in-out dark:hover:text-dark-background-color-3 hover:bg-background-color-2 dark:hover:bg-dark-background-color-2"
            onClick={() => window.api.changeAppTheme()}
            title="Change Theme"
          >
            <span className="material-icons-round icon h-fit text-xl flex items-center justify-center text-center transition-[background] ease-in-out">
              {isDarkMode ? 'wb_sunny' : 'dark_mode'}
            </span>
          </span>
        </div>
        <div className="window-controls-container h-full flex items-center justify-between ml-8">
          <span
            className="minimize-btn h-full px-3 text-xl flex items-center justify-center text-center transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]"
            onClick={minimize}
            title="Minimize"
          >
            <span className="material-icons-round icon h-fit !font-light text-xl flex items-center justify-center text-center transition-[background] ease-in-out cursor-pointer">
              minimize
            </span>
          </span>
          <span
            className="maximize-btn h-full px-3 text-xl flex items-center justify-center text-center transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]"
            onClick={maximize}
            title="Maximize"
          >
            <span className="material-icons-round-outlined icon h-fit !font-light text-lg flex items-center justify-center text-center transition-[background] ease-in-out cursor-pointer">
              crop_square
            </span>
          </span>
          <span
            className="close-btn h-full px-3 text-xl flex items-center justify-center text-center transition-[background] ease-in-out hover:bg-foreground-color-1 hover:text-font-color-white"
            onClick={close}
            title="Close"
          >
            <span className="material-icons-round icon h-fit !font-light  text-xl flex items-center justify-center text-center transition-[background] ease-in-out cursor-pointer">
              close
            </span>{' '}
          </span>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
