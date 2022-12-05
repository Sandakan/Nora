/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
import React from 'react';
import LightModeLogo from '../../../../assets/images/png/logo_light_mode.png';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import { AppContext } from '../../contexts/AppContext';
import Img from '../Img';

const Header = React.memo(() => {
  const close = () => window.api.closeApp();
  const minimize = () => window.api.minimizeApp();
  const maximize = () => window.api.toggleMaximizeApp();
  const { isDarkMode, pageHistoryIndex, bodyBackgroundImage } =
    React.useContext(AppContext);
  const { updatePageHistoryIndex } = React.useContext(AppUpdateContext);

  return (
    <header
      id="title-bar"
      className={`bg-transparent relative top-0 flex h-10 w-full items-center justify-between text-font-color-black dark:text-font-color-white ${
        bodyBackgroundImage &&
        'backdrop-blur-md dark:bg-dark-background-color-1/70'
      }}`}
    >
      <div className="logo-and-app-name-container ml-2 flex h-full items-center">
        <span className="logo-container">
          <Img className="mr-2 h-7 p-1" src={LightModeLogo} alt="Nora Logo" />
        </span>
        <span className="app-name-container">
          <span>
            Nora
            <sup className="app-version ml-1 text-[0.6rem] font-semibold text-background-color-3">
              ALPHA
            </sup>
          </span>
        </span>
        <div className="navigation-controls-container ml-8">
          <button
            type="button"
            className={`previousPageBtn flex h-fit rounded-full border-2 border-dark-background-color-2/0 transition-all duration-200 ease-in-out hover:bg-background-color-dimmed/30 ${
              pageHistoryIndex > 0
                ? 'available visible translate-x-0 opacity-100 hover:text-font-color-black dark:hover:text-font-color-white'
                : 'invisible -translate-x-8 opacity-0'
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
      <div className="window-controls-and-special-controls-container flex h-full flex-row">
        <div className="special-controls-container h-fll [&>*]:transition-[color,visibility,opacity flex items-center justify-between pt-2 [&>*]:mr-1 [&>*]:h-full [&>*]:cursor-pointer [&>*]:rounded-md [&>*]:px-3">
          <span
            className={`network-indicator flex items-center justify-center text-center transition-[background] hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 ${
              navigator.onLine &&
              'invisible !transition-[visibility] delay-[2500ms] duration-150'
            }`}
            title={`You are ${
              navigator.onLine ? 'connected to' : 'disconnected from'
            } the internet.`}
          >
            <span
              className={`material-icons-round-outlined ${
                navigator.onLine &&
                'invisible text-background-color-3 opacity-0 transition-[opacity,visibility] delay-[2500ms] duration-150 dark:text-dark-background-color-3'
              }`}
            >
              {navigator.onLine ? 'wifi' : 'wifi_off'}
            </span>
          </span>
          <span
            className="change-theme-btn flex items-center justify-center text-center text-xl transition-[color,background] ease-in-out hover:bg-background-color-2 dark:hover:bg-dark-background-color-2 dark:hover:text-dark-background-color-3"
            onClick={() => window.api.changeAppTheme()}
            title="Change Theme"
          >
            <span className="material-icons-round icon flex h-fit items-center justify-center text-center text-xl transition-[background] ease-in-out">
              {isDarkMode ? 'wb_sunny' : 'dark_mode'}
            </span>
          </span>
        </div>
        <div className="window-controls-container ml-8 flex h-full items-center justify-between">
          <span
            className="minimize-btn flex h-full items-center justify-center px-3 text-center text-xl transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]"
            onClick={minimize}
            title="Minimize"
          >
            <span className="material-icons-round icon flex h-fit cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out">
              minimize
            </span>
          </span>
          <span
            className="maximize-btn flex h-full items-center justify-center px-3 text-center text-xl transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]"
            onClick={maximize}
            title="Maximize"
          >
            <span className="material-icons-round-outlined icon flex h-fit cursor-pointer items-center justify-center text-center text-lg !font-light transition-[background] ease-in-out">
              crop_square
            </span>
          </span>
          <span
            className="close-btn flex h-full items-center justify-center px-3 text-center text-xl transition-[background] ease-in-out hover:bg-foreground-color-1 hover:text-font-color-white"
            onClick={close}
            title="Close"
          >
            <span className="material-icons-round icon flex h-fit  cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out">
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
