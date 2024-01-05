/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react';
import { getVersionInfoFromString } from 'renderer/utils/isLatestVersion';
import { AppContext } from '../../contexts/AppContext';

import { version } from '../../../../package.json';

import Img from '../Img';
import NetworkIndicator from './indicators/NetworkIndicator';
import NewUpdateIndicator from './indicators/NewUpdateIndicator';
import ChangeThemeBtn from './special_controls/ChangeThemeBtn';
import NavigationControlsContainer from './NavigationControlsContainer';
import WindowControlsContainer from './WindowControlsContainer';

import LightModeLogo from '../../../../assets/images/webp/logo_light_mode.webp';
import GoToMainPlayerBtn from './special_controls/GoToMainPlayerBtn';

const appReleasePhase =
  getVersionInfoFromString(version)?.releasePhase || 'stable';

const TitleBar = React.memo(() => {
  const { bodyBackgroundImage, playerType } = React.useContext(AppContext);

  return (
    <header
      id="title-bar"
      className={`relative top-0 z-40 flex h-10 w-full items-center justify-between overflow-hidden bg-transparent text-font-color-black transition-opacity dark:text-font-color-white ${
        bodyBackgroundImage &&
        'bg-background-color-1/50 !text-font-color-white backdrop-blur-md dark:bg-dark-background-color-1/70'
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
              <sup
                className={`app-version ml-1 cursor-pointer text-[0.6rem] font-semibold uppercase text-font-color-highlight dark:text-dark-font-color-highlight ${
                  bodyBackgroundImage && '!text-dark-font-color-highlight'
                } `}
                title={`v${version}`}
              >
                {appReleasePhase}
              </sup>
            </span>
          </span>
        </div>
        {playerType !== 'full' && <NavigationControlsContainer />}
      </div>
      <div className="window-controls-and-special-controls-and-indicators-container flex h-full flex-row">
        <div className="special-controls-and-indicators-container mr-2 flex items-center justify-between py-1">
          <div className="indicators-container flex flex-row">
            {/* <ThrottlingIndicator /> */}
            <NewUpdateIndicator />
            <NetworkIndicator />
          </div>
          <div className="special-controls-container flex flex-row">
            {window.api.properties.isInDevelopment && <ChangeThemeBtn />}
            {playerType === 'full' && <GoToMainPlayerBtn />}
          </div>
        </div>
        <WindowControlsContainer />
      </div>
    </header>
  );
});

TitleBar.displayName = 'TitleBar';
export default TitleBar;
