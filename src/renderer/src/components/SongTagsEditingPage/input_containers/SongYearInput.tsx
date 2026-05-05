import { useTranslation } from 'react-i18next';

type Props = {
  songYear?: number;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
};

const SongYearInput = (props: Props) => {
  const { t } = useTranslation();

  const { songYear, updateSongInfo } = props;

  return (
    <div className="tag-input flex max-w-2xl min-w-[10rem] flex-col">
      <label htmlFor="song-year-id3-tag">{t('common.releasedYear')}</label>
      <input
        type="number"
        maxLength={4}
        minLength={4}
        id="song-year-id3-tag"
        className="border-background-color-2 bg-background-color-2 text-font-color-black focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight mt-2 mr-2 w-[90%] rounded-3xl border-[.15rem] px-4 py-3 transition-colors"
        name="song-year"
        placeholder={t('common.releasedYear')}
        value={songYear ?? ''}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const releasedYear = Number(e.currentTarget.value);
          updateSongInfo(
            (prevData): SongTags => ({
              ...prevData,
              releasedYear: releasedYear ?? prevData.releasedYear
            })
          );
        }}
      />
    </div>
  );
};

export default SongYearInput;
