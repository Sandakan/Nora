/* eslint-disable react/jsx-no-useless-fragment */
import { useEffect, useState } from 'react';

import Img from '../Img';

import AppIcon from '../../assets/images/webp/logo_light_mode.webp';

const contentLoadStart = window.performance.now();
let isLoadedOnce = false;

const hidePreloader = () => {
  const preloader = document.querySelector('.preloader');
  const isHidable = preloader && !preloader.classList.contains('invisible!');
  console.warn('hide preloader requested', {
    time: window.performance.now() - contentLoadStart,
    state: document.readyState,
    isHidable
  });

  if (isHidable) {
    preloader.classList.add('invisible!', 'opacity-0!');
    console.warn(
      'preloader hidden',
      window.performance.now() - contentLoadStart,
      document.readyState
    );
  }
};

window.addEventListener(
  'load',
  () => {
    setTimeout(hidePreloader, 1000);

    console.warn('contentLoad', window.performance.now() - contentLoadStart, document.readyState);
  },
  { once: true }
);

const Preloader = () => {
  const [isPreloaderRemoved, setIsPreloaderRemoved] = useState(false);

  useEffect(() => {
    // this removes preloader in 5 seconds no matter what didn't load.
    const timeoutId = setTimeout(() => {
      hidePreloader();
      isLoadedOnce = true;
      setIsPreloaderRemoved(true);
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <>
      {!isPreloaderRemoved && !isLoadedOnce && (
        <div className="preloader visible absolute z-40 flex h-full w-full items-center justify-center bg-background-color-1 opacity-100 transition-[visibility,opacity] delay-700 dark:bg-dark-background-color-1">
          <Img
            src={AppIcon}
            className="h-20 w-20 rounded-lg opacity-100! shadow-2xl"
            loading="eager"
          />
        </div>
      )}
    </>
  );
};

export default Preloader;
