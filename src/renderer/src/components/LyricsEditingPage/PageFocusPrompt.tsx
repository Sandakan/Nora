import { useTranslation } from 'react-i18next';

type Props = {
  isFocused: boolean;
  isTheEditingSongTheCurrSong: boolean;
  isPlaying: boolean;
};

const PageFocusPrompt = (props: Props) => {
  const { t } = useTranslation();

  const { isFocused, isPlaying, isTheEditingSongTheCurrSong } = props;

  return (
    <div
      className={`invisible absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 scale-90 cursor-pointer items-center justify-center rounded-3xl bg-background-color-2 px-4 py-2 opacity-0 shadow-xl transition-[transform,opacity,visibility] duration-200 ease-in-out dark:bg-dark-background-color-2 ${
        !isFocused &&
        isTheEditingSongTheCurrSong &&
        !isPlaying &&
        '!visible !-translate-y-6 !scale-100 !opacity-100'
      }`}
      title="Page focus is required for the page-specific shortcuts to work. Click on this page to gain focus."
    >
      <span className="material-icons-round-outlined mr-2 text-xl text-font-color-highlight dark:text-dark-font-color-highlight">
        error
      </span>
      <p className="">{t('pageFocusPrompt.pageNotFocused')}</p>
    </div>
  );
};

export default PageFocusPrompt;
