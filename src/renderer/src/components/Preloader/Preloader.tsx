import { useEffect } from 'react';
import { router } from '@renderer/index';

import Img from '../Img';

import AppIcon from '../../assets/images/webp/logo_light_mode.webp';

const contentLoadStart = window.performance.now();
const hidePreloader = () => router.navigate({ to: '/main-player/home', replace: true });

window.addEventListener(
  'load',
  () => {
    setTimeout(() => hidePreloader(), 1000);

    console.warn('contentLoad', window.performance.now() - contentLoadStart, document.readyState);
  },
  { once: true }
);

const Preloader = () => {
  useEffect(() => {
    router.preloadRoute({ to: '/main-player/home' });
    // this removes preloader in 5 seconds no matter what didn't load.
    const timeoutId = setTimeout(() => hidePreloader(), 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="preloader bg-background-color-1 dark:bg-dark-background-color-1 visible absolute z-40 flex h-full w-full items-center justify-center opacity-100 transition-[visibility,opacity] delay-700">
      <Img src={AppIcon} className="h-20 w-20 rounded-lg opacity-100! shadow-2xl" loading="eager" />
    </div>
  );
};

export default Preloader;

