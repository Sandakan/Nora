/* eslint-disable react/jsx-no-useless-fragment */
import { useEffect, useState } from 'react';

import Img from '../Img';

import AppIcon from '../../assets/images/webp/logo_light_mode.webp';

const contentLoadStart = window.performance.now();
let isLoadedOnce = false;

const hidePreloader = () => {
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    preloader.classList.add('!invisible', '!opacity-0');
  }
};

const eventHandler = () => {
  setTimeout(hidePreloader, 1000);

  console.warn('contentLoad', window.performance.now() - contentLoadStart);
};

window.addEventListener('load', eventHandler);

const Preloader = () => {
  const [isPreloaderRemoved, setIsPreloaderRemoved] = useState(false);

  useEffect(() => {
    // console.log(window.performance.now());
    if (window.performance.now() > 3000) hidePreloader();
    // this removes preloader in 10 seconds no matter what didn't load.
    setTimeout(() => {
      hidePreloader();
      isLoadedOnce = true;
      setIsPreloaderRemoved(true);
    }, 3000);
  }, []);

  return (
    <>
      {!isPreloaderRemoved && !isLoadedOnce && (
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
