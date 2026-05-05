import { useTranslation } from 'react-i18next';

type Props = {
  songTrackNumber?: number;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
};

const SongTrackNumberInput = (props: Props) => {
  const { t } = useTranslation();

  const { songTrackNumber, updateSongInfo } = props;
  return (
    <div className="tag-input flex max-w-2xl min-w-[10rem] flex-col">
      <label htmlFor="song-track-number-id3-tag">{t('common.albumTrackNo')}</label>
      <input
        type="number"
        id="song-track-number-id3-tag"
        className="border-background-color-2 bg-background-color-2 text-font-color-black focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight mt-2 mr-2 w-[90%] rounded-3xl border-[.15rem] px-4 py-3 transition-colors"
        name="song-track-number"
        placeholder={t('common.albumTrackNo')}
        value={songTrackNumber ?? ''}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const trackNumber = e.currentTarget.valueAsNumber;
          updateSongInfo((prevData) => ({ ...prevData, trackNumber }));
        }}
      />
    </div>
  );
};

export default SongTrackNumberInput;
