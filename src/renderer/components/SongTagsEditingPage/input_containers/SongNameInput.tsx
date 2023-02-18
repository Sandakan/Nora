/* eslint-disable jsx-a11y/label-has-associated-control */

type Props = {
  songTitle: string;
  updateSongInfo: (callback: (prevSongInfo: SongTags) => SongTags) => void;
};

const SongNameInput = (props: Props) => {
  const { updateSongInfo, songTitle } = props;
  return (
    <div className="tag-input mb-6 flex w-[45%] min-w-[10rem] flex-col">
      <label htmlFor="song-name-id3-tag">Song Name</label>
      <input
        type="text"
        id="song-name-id3-tag"
        className="mt-2 mr-2 w-[90%] rounded-3xl border-[.15rem] border-background-color-2 bg-background-color-1 py-3 px-4 text-font-color-black dark:border-dark-background-color-2 dark:bg-dark-background-color-1 dark:text-font-color-white"
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
