import { useTranslation } from 'react-i18next';

const SuspenseLoader = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-background-color-1! text-font-color-highlight dark:bg-dark-background-color-1! dark:text-dark-font-color-highlight flex h-full w-full grow items-center justify-center text-center">
      <span className="after:animate-spin-ease after:border-t-font-color-highlight dark:after:border-t-dark-font-color-highlight relative mr-2 flex h-4 w-4 items-center justify-center after:absolute after:mx-auto after:block after:h-4 after:w-4 after:items-center after:justify-center after:rounded-full after:border-2 after:border-[transparent] after:content-['']" />
      <span>{t('common.loading')}...</span>
    </div>
  );
};

export default SuspenseLoader;
