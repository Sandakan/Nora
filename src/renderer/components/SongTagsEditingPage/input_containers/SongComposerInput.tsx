/* eslint-disable jsx-a11y/label-has-associated-control */

type Props = {
  songComposer?: string;
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
};

const SongComposerInput = (props: Props) => {
  const { songComposer, updateSongInfo } = props;
  return (
    <div className="tag-input mb-6 flex w-[45%] min-w-[10rem] flex-col">
      <label htmlFor="song-composer-id3-tag">Composer</label>
      <input
        type="text"
        id="song-composer-id3-tag"
        className="mt-2 mr-2 w-[90%] rounded-3xl border-[.15rem] border-background-color-2 bg-background-color-1 py-3 px-4 text-font-color-black dark:border-dark-background-color-2 dark:bg-dark-background-color-1 dark:text-font-color-white"
        name="song-composer"
        placeholder="Composer"
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
