import { useTranslation } from 'react-i18next';

type Props = {
  songComposer?: string;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
};

const SongComposerInput = (props: Props) => {
  const { songComposer, updateSongInfo } = props;
  const { t } = useTranslation();

  return (
    <div className="tag-input flex max-w-2xl min-w-[10rem] flex-col">
      <label htmlFor="song-composer-id3-tag">{t('songTagsEditingPage.composer')}</label>
      <input
        type="text"
        id="song-composer-id3-tag"
        className="border-background-color-2 bg-background-color-2 text-font-color-black focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight mt-2 mr-2 w-[90%] rounded-3xl border-[.15rem] px-4 py-3 transition-colors"
        name="song-composer"
        placeholder={t('songTagsEditingPage.composer')}
        value={songComposer ?? ''}
        onKeyDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const composer = e.currentTarget.value;
          updateSongInfo((prevData) => ({ ...prevData, composer }));
        }}
      />
    </div>
  );
};

export default SongComposerInput;
