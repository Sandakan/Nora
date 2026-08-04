import { useLocation } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { memo } from 'react';

import { version } from '../../../../../package.json';
import LightModeLogo from '../../assets/images/webp/logo_light_mode.webp';
import { store } from '../../store/store';
import { getVersionInfoFromString } from '../../utils/isLatestVersion';
import Img from '../Img';
import CurrentLocationContainer from './CurrentLocationContainer';
import NetworkIndicator from './indicators/NetworkIndicator';
import NewUpdateIndicator from './indicators/NewUpdateIndicator';
import NavigationControlsContainer from './NavigationControlsContainer';
import ChangeThemeBtn from './special_controls/ChangeThemeBtn';
import GoToMainPlayerBtn from './special_controls/GoToMainPlayerBtn';
import WindowControlsContainer from './WindowControlsContainer';

const appReleasePhase = getVersionInfoFromString(version)?.releasePhase || 'stable';

const TitleBar = memo(() => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  const location = useLocation();

  const isFullScreenPlayer = location.href.includes('/fullscreen-player');
  const isDarwin = window.api.properties.platform === 'darwin';

  return (
    <header
      id="title-bar"
      className={`text-font-color-black dark:text-font-color-white relative top-0 z-40 grid h-10 w-full items-center justify-between overflow-hidden bg-transparent transition-opacity ${
        bodyBackgroundImage &&
        'bg-background-color-1/50 text-font-color-white! dark:bg-dark-background-color-1/70 backdrop-blur-md'
      } ${isDarwin ? 'grid-cols-[clamp(10rem,30%,17rem)_1fr_auto] pl-24' : 'grid-cols-[clamp(10rem,30%,18rem)_1fr_auto]'}`}
    >
      <div
        className={`logo-and-app-name-and-navigation-controls-container flex h-full w-full items-center justify-between`}
      >
        <div className="logo-and-app-name-container flex items-center">
          <span className="logo-container">
            <Img
              className={`mr-2 aspect-square h-7 w-7 rounded-md p-1 shadow-md`}
              src={LightModeLogo}
              alt="Nora Logo"
            />
          </span>
          <span className="app-name-container">
            <span>
              Nora
              <sup
                className={`app-version text-font-color-highlight dark:text-dark-font-color-highlight ml-1 cursor-pointer text-[0.6rem] font-semibold uppercase ${
                  bodyBackgroundImage && 'text-dark-font-color-highlight!'
                } `}
                title={`v${version}`}
              >
                {appReleasePhase}
              </sup>
            </span>
          </span>
        </div>
        {!isFullScreenPlayer ? <NavigationControlsContainer /> : <div />}
      </div>
      {window.api.properties.isInDevelopment ? (
        <CurrentLocationContainer href={location.href} className={`${isDarwin ? 'pl-4' : ''}`} />
      ) : (
        <div />
      )}
      <div className="window-controls-and-special-controls-and-indicators-container flex h-full flex-row">
        <div className="special-controls-and-indicators-container mr-2 flex items-center justify-between py-1">
          <div className="indicators-container flex flex-row">
            {/* <ThrottlingIndicator /> */}
            <NewUpdateIndicator />
            <NetworkIndicator />
          </div>
          <div className="special-controls-container flex flex-row">
            {window.api.properties.isInDevelopment && <ChangeThemeBtn />}
            {isFullScreenPlayer && <GoToMainPlayerBtn />}
          </div>
        </div>
        {!isDarwin && <WindowControlsContainer />}
      </div>
    </header>
  );
});

TitleBar.displayName = 'TitleBar';
export default TitleBar;
