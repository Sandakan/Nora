import { useTranslation } from 'react-i18next';
import useNetworkConnectivity from '../../../hooks/useNetworkConnectivity';

const NetworkIndicator = () => {
  const { t } = useTranslation();

  const { isOnline } = useNetworkConnectivity();

  return (
    <div
      className={`network-indicator group bg-background-color-2 dark:bg-dark-background-color-2 mr-1 flex cursor-pointer items-center justify-center rounded-md px-3 py-1 text-center transition-[background] ${
        isOnline && 'invisible hidden transition-[visibility]! delay-[2500ms] duration-150'
      }`}
      title={t(`common.${isOnline ? 'hasInternet' : 'noInternet'}`)}
    >
      <span
        className={`material-icons-round-outlined group-hover:text-font-color-highlight dark:group-hover:text-dark-font-color-highlight py-[2px] leading-none ${
          isOnline &&
          'text-font-color-highlight dark:text-dark-font-color-highlight invisible opacity-0 transition-[opacity,visibility] delay-[2500ms] duration-200'
        }`}
      >
        {isOnline ? 'wifi' : 'wifi_off'}
      </span>
    </div>
  );
};

export default NetworkIndicator;
