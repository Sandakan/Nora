/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/self-closing-comp */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable import/prefer-default-export */
// import React from 'react';
import LightModeLogo from '../../../../assets/images/logo_light_mode.png';

interface HeaderProp {
  setDarkMode: () => void;
  isDarkMode: boolean;
}

export const Header = (props: HeaderProp) => {
  const close = () => window.api.closeApp();
  const minimize = () => window.api.minimizeApp();
  const maximize = () => window.api.toggleMaximizeApp();
  return (
    <header id="title-bar">
      <div className="logo-and-app-name-container">
        <span className="logo-container">
          <img src={LightModeLogo} alt="Oto Music for Desktop Logo" />
        </span>
        <span className="app-name-container">
          <span>
            Oto Music for Desktop
            <sup className="app-version" title="v0.0.1">
              ALPHA
            </sup>
          </span>
        </span>
      </div>
      <div className="window-controls-and-special-controls-container">
        <div className="special-controls-container">
          <span className="change-theme-btn">
            <i
              className="material-icons-round"
              onClick={() => props.setDarkMode()}
            >
              {props.isDarkMode ? 'wb_sunny' : 'dark_mode'}
            </i>
          </span>
        </div>
        <div className="window-controls-container">
          <span className="minimize-btn" onClick={minimize}>
            <span className="material-icons-round">minimize</span>
          </span>
          <span className="maximize-btn" onClick={maximize}>
            <span className="material-icons-round">crop_square</span>
          </span>
          <span className="close-btn" onClick={close}>
            <span className="material-icons-round">close</span>{' '}
          </span>
        </div>
      </div>
    </header>
  );
};
