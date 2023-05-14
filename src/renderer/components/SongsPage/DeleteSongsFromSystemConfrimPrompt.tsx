/* eslint-disable jsx-a11y/label-has-associated-control */
import React from 'react';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import Button from '../Button';
import Checkbox from '../Checkbox';

export default (props: { songIds: string[] }) => {
  const { currentSongData } = React.useContext(AppContext);
  const { addNewNotifications, changePromptMenuData, clearAudioPlayerData } =
    React.useContext(AppUpdateContext);
  const { songIds } = props;

  const [songsData, setSongsData] = React.useState<SongData[]>([]);
  const [isPermanentDelete, setIsPermenanentDelete] = React.useState(false);

  React.useEffect(() => {
    if (songIds.length > 0) {
      window.api.audioLibraryControls
        .getSongInfo(songIds)
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            return setSongsData(res);
          }
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [songIds]);

  return (
    <>
      <div className="title-container mb-8 mt-1 flex items-center pr-4 text-3xl font-medium text-font-color-black dark:text-font-color-white">
        Delete{' '}
        {songsData.length === 1
          ? `'${songsData[0].title}'`
          : `${songsData.length} songs`}{' '}
        from system
      </div>
      <div className="description">
        You will lose {songsData.length === 1 ? `this song` : `these songs`}{' '}
        from your system and may not be able to recover{' '}
        {songsData.length === 1 ? `it` : `them`} again if you select
        &apos;Permanently delete from system&apos; option.
      </div>
      <div className="info-about-affecting-files-container mt-4">
        <p>Proceeding this action affects these files :</p>
        <ul className="ml-4 list-inside list-disc">
          {songsData.map((song) => (
            <li className="text-sm font-light">{song.path}</li>
          ))}
        </ul>
      </div>
      <Checkbox
        id="permanentDelete"
        isChecked={isPermanentDelete}
        checkedStateUpdateFunction={setIsPermenanentDelete}
        labelContent="Permanently delete from the system."
      />
      <div className="buttons-container flex items-center justify-end">
        <Button
          label="Delete Song"
          className="delete-song-confirm-btn danger-btn float-right mt-6 h-10 w-48 cursor-pointer rounded-lg !bg-font-color-crimson font-medium text-font-color-white outline-none ease-in-out hover:border-font-color-crimson dark:!bg-font-color-crimson dark:text-font-color-white dark:hover:border-font-color-crimson"
          clickHandler={() => {
            changePromptMenuData(false);
            return window.api.audioLibraryControls
              .deleteSongsFromSystem(
                songsData.map((song) => song.path),
                isPermanentDelete
              )
              .then((res) => {
                if (res.success) {
                  if (
                    songsData
                      .map((song) => song.songId)
                      .includes(currentSongData.songId)
                  ) {
                    clearAudioPlayerData();
                  }
                  addNewNotifications([
                    {
                      id: `songRemoved`,
                      delay: 5000,
                      content: (
                        <span>
                          {isPermanentDelete
                            ? `${songsData.length} songs removed from the system.`
                            : `${songsData.length} songs moved to the Recycle Bin.`}
                        </span>
                      ),
                      icon: (
                        <span className="material-icons-round icon">
                          done_all
                        </span>
                      ),
                    },
                  ]);
                }
                return undefined;
              });
          }}
        />
      </div>
    </>
  );
};
