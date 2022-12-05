/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import LightModeLogo from '../../../../assets/images/logo_light_mode.png';
import { AppContext } from '../../contexts/AppContext';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Img from '../Img';
import NetworkIndicator from './indicators/NetworkIndicator';
import NewUpdateIndicator from './indicators/NewUpdateIndicator';
import ChangeThemeBtn from './special_controls/ChangeThemeBtn';

const TitleBar = React.memo(() => {
  const close = () => window.api.closeApp();
  const minimize = () => window.api.minimizeApp();
  const maximize = () => window.api.toggleMaximizeApp();
  const { pageHistoryIndex, noOfPagesInHistory, bodyBackgroundImage } =
    React.useContext(AppContext);
  const { updatePageHistoryIndex } = React.useContext(AppUpdateContext);

  return (
    <header
      id="title-bar"
      className={`bg-transparent relative top-0 z-10 flex h-10 w-full items-center justify-between overflow-hidden text-font-color-black transition-opacity dark:text-font-color-white ${
        bodyBackgroundImage &&
        'bg-background-color-1/50 backdrop-blur-md dark:bg-dark-background-color-1/70'
      }`}
    >
      <div className="logo-and-app-name-container ml-2 flex h-full w-fit items-center">
        <div className="flex items-center">
          <span className="logo-container">
            <Img
              className="mr-2 h-7 rounded-md p-1 shadow-md"
              src={LightModeLogo}
              alt="Nora Logo"
            />
          </span>
          <span className="app-name-container">
            <span>
              Nora
              <sup className="app-version ml-1 text-[0.6rem] font-semibold text-font-color-highlight dark:text-dark-font-color-highlight">
                ALPHA
              </sup>
            </span>
          </span>
        </div>
        <div className="navigation-controls-container ml-12 flex min-w-[9rem] items-center justify-between">
          <button
            type="button"
            className={`previousPageBtn flex h-fit rounded-md px-2 py-[2px] transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
              pageHistoryIndex > 0
                ? 'available visible translate-x-0 opacity-100'
                : 'invisible -translate-x-8 opacity-0'
            }`}
            onClick={() => updatePageHistoryIndex('decrement')}
            title="Go Back"
          >
            <span className="material-icons-round text-2xl">arrow_back</span>
          </button>

          <button
            type="button"
            className={`goToHomePageBtn flex h-fit rounded-md px-2 py-1 transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
              noOfPagesInHistory > 0
                ? 'available scale-1 visible opacity-100'
                : 'invisible scale-50 opacity-0'
            }`}
            onClick={() => updatePageHistoryIndex('home')}
            title="Go forward"
          >
            <span className="material-icons-round-outlined text-xl leading-none">
              home
            </span>
          </button>

          <button
            type="button"
            className={`forwardPageBtn flex h-fit rounded-md px-2 py-[2px] transition-[background,transform,visibility,opacity] hover:bg-background-color-2 hover:text-font-color-highlight dark:hover:bg-dark-background-color-2 dark:hover:text-dark-font-color-highlight ${
              noOfPagesInHistory !== 0 && pageHistoryIndex < noOfPagesInHistory
                ? 'available visible translate-x-0 opacity-100'
                : 'invisible translate-x-8 opacity-0'
            }`}
            onClick={() => updatePageHistoryIndex('increment')}
            title="Go forward"
          >
            <span className="material-icons-round text-2xl">arrow_forward</span>
          </button>
        </div>
      </div>
      <div className="window-controls-and-special-controls-and-indicators-container flex h-full flex-row">
        <div className="special-controls-and-indicators-container flex items-center justify-between py-1">
          <div className="indicators-container mr-2 flex flex-row">
            <NewUpdateIndicator />
            <NetworkIndicator />
          </div>
          <div className="special-controls-container">
            <ChangeThemeBtn />
          </div>
        </div>
        <div className="window-controls-container ml-8 flex h-full items-center justify-between">
          <span
            className="minimize-btn flex h-full items-center justify-center px-3 text-center text-xl transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]"
            onClick={minimize}
            // onKeyDown={minimize}
            role="button"
            tabIndex={0}
            title="Minimize"
          >
            <span className="material-icons-round icon flex h-fit cursor-pointer items-center justify-center text-center text-xl !font-light transition-[background] ease-in-out">
              minimize
            </span>
          </span>
          <span
            className="maximize-btn flex h-full items-center justify-center px-3 text-center text-xl transition-[background] ease-in-out hover:bg-[hsla(0deg,0%,80%,0.5)]"
            onClick={maximize}
            // onKeyDown={maximize}
            role="button"
            tabIndex={0}
            title="Maximize"
          >
            <span className="material-icons-round-outlined icon flex h-fit cursor-pointer items-center justify-center text-center text-lg !font-light transition-[background] ease-in-out">
              crop_square
            </span>
          </span>
          <span
            className="close-btn flex h-full items-center justify-center px-3 text-center text-xl transition-[background] ease-in-out hover:bg-font-color-crimson hover:text-font-color-white"
            onClick={close}
            // onKeyDown={close}
            role="button"
            tabIndex={0}
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

TitleBar.displayName = 'TitleBar';
export default TitleBar;
