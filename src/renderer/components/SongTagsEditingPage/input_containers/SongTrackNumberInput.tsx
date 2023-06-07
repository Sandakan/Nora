/* eslint-disable jsx-a11y/label-has-associated-control */

type Props = {
  songTrackNumber?: number;
  updateSongInfo: (_callback: (_prevSongInfo: SongTags) => SongTags) => void;
};

const SongTrackNumberInput = (props: Props) => {
  const { songTrackNumber, updateSongInfo } = props;
  return (
    <div className="tag-input flex min-w-[10rem] max-w-2xl flex-col">
      <label htmlFor="song-track-number-id3-tag">Track Number</label>
      <input
        type="number"
        id="song-track-number-id3-tag"
        className="mr-2 mt-2 w-[90%] rounded-3xl border-[.15rem] border-background-color-2 bg-background-color-1 px-4 py-3 text-font-color-black transition-colors focus:border-font-color-highlight dark:border-dark-background-color-2 dark:bg-dark-background-color-1 dark:text-font-color-white dark:focus:border-dark-font-color-highlight"
        name="song-track-number"
        placeholder="Track Number"
        value={songTrackNumber}
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
