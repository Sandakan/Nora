import { useTranslation } from 'react-i18next';

const SuspenseLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center justify-center bg-background-color-1! text-center text-font-color-highlight dark:bg-dark-background-color-1! dark:text-dark-font-color-highlight">
      <span className="relative mr-2 flex h-4 w-4 items-center justify-center after:absolute after:mx-auto after:block after:h-4 after:w-4 after:animate-spin-ease after:items-center after:justify-center after:rounded-full after:border-2 after:border-[transparent] after:border-t-font-color-highlight after:content-[''] dark:after:border-t-dark-font-color-highlight" />
      <span>{t('common.loading')}...</span>
    </div>
  );
};

export default SuspenseLoader;
