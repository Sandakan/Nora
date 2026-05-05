import { useTranslation } from 'react-i18next';

type Props = {
  songTitle: string;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
};

const SongNameInput = (props: Props) => {
  const { t } = useTranslation();

  const { updateSongInfo, songTitle } = props;
  return (
    <div className="tag-input flex max-w-2xl min-w-[10rem] flex-col">
      <label htmlFor="song-name-id3-tag">{t('songTagsEditingPage.songName')}</label>
      <input
        type="text"
        id="song-name-id3-tag"
        className="border-background-color-2 bg-background-color-2 text-font-color-black focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight mt-2 mr-2 w-[90%] rounded-3xl border-[.15rem] px-4 py-3 transition-colors"
        name="song-name"
        placeholder={t('songTagsEditingPage.songName')}
        value={songTitle}
        onChange={(e) => {
          const title = e.currentTarget.value;
          updateSongInfo((prevData) => ({ ...prevData, title }));
        }}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default SongNameInput;
