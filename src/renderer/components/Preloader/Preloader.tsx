/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';

import Img from '../Img';

import AppIcon from '../../../../assets/images/webp/logo_light_mode.webp';

const contentLoadStart = window.performance.now();

window.addEventListener('load', () => {
  setTimeout(() => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      preloader.classList.add('!invisible', '!opacity-0');
    }
  }, 1000);

  console.log('contentLoad', window.performance.now() - contentLoadStart);
});

const Preloader = () => {
  const [isPreloaderRemoved, setIsPreloaderRemoved] = React.useState(false);

  React.useEffect(() => {
    // console.log(window.performance.now());
    if (window.performance.now() > 5000) setIsPreloaderRemoved(true);
    // this removes preloader in 10 seconds no matter what didn't load.
    else setTimeout(() => setIsPreloaderRemoved(true), 10000);
  }, []);

  return (
    <>
      {!isPreloaderRemoved && (
        <div className="preloader visible absolute z-40 flex h-full w-full items-center justify-center bg-background-color-1 opacity-100 transition-[visibility,opacity] delay-700 dark:bg-dark-background-color-1">
          <Img
            src={AppIcon}
            className="h-20 w-20 rounded-lg !opacity-100 shadow-2xl"
            loading="eager"
          />
        </div>
      )}
    </>
  );
};

export default Preloader;
