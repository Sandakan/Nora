/* eslint-disable jsx-a11y/label-has-associated-control */

type Props = {
  songTitle: string;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
};

const SongNameInput = (props: Props) => {
  const { updateSongInfo, songTitle } = props;
  return (
    <div className="tag-input flex min-w-[10rem] max-w-2xl flex-col">
      <label htmlFor="song-name-id3-tag">Song Name</label>
      <input
        type="text"
        id="song-name-id3-tag"
        className="mr-2 mt-2 w-[90%] rounded-3xl border-[.15rem] border-background-color-2 bg-background-color-2 px-4 py-3 text-font-color-black transition-colors focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-2 dark:text-font-color-white dark:focus:border-dark-font-color-highlight"
        name="song-name"
        placeholder="Song Name"
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
