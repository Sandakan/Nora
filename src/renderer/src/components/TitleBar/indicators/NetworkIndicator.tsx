import { useTranslation } from 'react-i18next';
import useNetworkConnectivity from '../../../hooks/useNetworkConnectivity';

const NetworkIndicator = () => {
  const { t } = useTranslation();

  const { isOnline } = useNetworkConnectivity();

  return (
    <div
      className={`network-indicator group mr-1 flex cursor-pointer items-center justify-center rounded-md bg-background-color-2 px-3 py-1 text-center transition-[background] dark:bg-dark-background-color-2 ${
        isOnline && 'invisible hidden transition-[visibility]! delay-[2500ms] duration-150'
      }`}
      title={t(`common.${isOnline ? 'hasInternet' : 'noInternet'}`)}
    >
      <span
        className={`material-icons-round-outlined py-[2px] leading-none group-hover:text-font-color-highlight dark:group-hover:text-dark-font-color-highlight ${
          isOnline &&
          'invisible text-font-color-highlight opacity-0 transition-[opacity,visibility] delay-[2500ms] duration-200 dark:text-dark-font-color-highlight'
        }`}
      >
        {isOnline ? 'wifi' : 'wifi_off'}
      </span>
    </div>
  );
};

export default NetworkIndicator;
