import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { SimilarTracksOutput } from '../../../@types/last_fm_similar_tracks_api';
import UnAvailableTrack from './UnAvailableTrack';
import TitleContainer from '../TitleContainer';
import Song from '../SongsPage/Song';

type Props = { songId: string };

const SimilarTracksContainer = (props: Props) => {
  const { bodyBackgroundImage, localStorageData, queue, currentSongData } =
    React.useContext(AppContext);
  const { createQueue, playSong, updateQueueData, addNewNotifications } =
    React.useContext(AppUpdateContext);

  const { songId } = props;

  const [similarTracks, setSimilarTracks] = React.useState<
    NonNullable<SimilarTracksOutput>
  >({
    sortedAvailTracks: [],
    sortedUnAvailTracks: [],
  });

  React.useEffect(() => {
    window.api.audioLibraryControls
      .getSimilarTracksForASong(songId)
      .then((res) => {
        if (res) setSimilarTracks(res);
        return undefined;
      })
      .catch((err) => console.log(err));
  }, [songId]);

  const handleSongPlayBtnClick = React.useCallback(
    (startSongId?: string) => {
      const songs = similarTracks.sortedAvailTracks.map(
        (song) => song.songData!,
      );
      const queueSongIds = songs
        .filter((song) => !song.isBlacklisted)
        .map((song) => song.songId);

      createQueue(queueSongIds, 'songs', false, undefined, !startSongId);
      if (startSongId) playSong(startSongId, true);
    },
    [similarTracks.sortedAvailTracks, createQueue, playSong],
  );

  const addSongsToPlayNext = React.useCallback(() => {
    const songs = similarTracks.sortedAvailTracks.map((song) => song.songData!);
    const queueSongIds = songs
      .filter((song) => !song.isBlacklisted)
      .map((song) => song.songId);

    let currentSongIndex =
      queue.currentSongIndex ?? queue.queue.indexOf(currentSongData.songId);
    const duplicateIds: string[] = [];

    const newQueue = queue.queue.filter((id) => {
      const isADuplicate = queueSongIds.includes(id);
      if (isADuplicate) duplicateIds.push(id);

      return !isADuplicate;
    });

    for (const duplicateId of duplicateIds) {
      const duplicateIdPosition = queue.queue.indexOf(duplicateId);

      if (
        duplicateIdPosition !== -1 &&
        duplicateIdPosition < currentSongIndex &&
        currentSongIndex - 1 >= 0
      )
        currentSongIndex -= 1;
    }
    newQueue.splice(currentSongIndex + 1, 0, ...queueSongIds);
    updateQueueData(currentSongIndex, newQueue, undefined, false);
    addNewNotifications([
      {
        id: `${queueSongIds.length}PlayNext`,
        delay: 5000,
        content: `${queueSongIds.length} songs will be played next.`,
        iconName: 'shortcut',
      },
    ]);
  }, [
    similarTracks.sortedAvailTracks,
    queue.currentSongIndex,
    queue.queue,
    currentSongData.songId,
    updateQueueData,
    addNewNotifications,
  ]);

  const availableSimilarTrackComponents = React.useMemo(
    () =>
      similarTracks.sortedAvailTracks.map((track, index) => {
        const { songData } = track;
        const song = songData!;
        return (
          <Song
            key={song.songId}
            index={index}
            isIndexingSongs={
              localStorageData?.preferences?.isSongIndexingEnabled
            }
            title={song.title}
            artists={song.artists}
            album={song.album}
            artworkPaths={song.artworkPaths}
            duration={song.duration}
            songId={song.songId}
            path={song.path}
            isAFavorite={song.isAFavorite}
            year={song.year}
            isBlacklisted={song.isBlacklisted}
            onPlayClick={handleSongPlayBtnClick}
          />
        );
      }),
    [
      handleSongPlayBtnClick,
      localStorageData?.preferences?.isSongIndexingEnabled,
      similarTracks.sortedAvailTracks,
    ],
  );

  const unAvailableSimilarTrackComponents = React.useMemo(
    () =>
      similarTracks.sortedUnAvailTracks.map((track) => {
        const { title, url, artists } = track;
        return (
          <UnAvailableTrack
            title={title}
            artists={artists}
            url={url}
            key={url}
          />
        );
      }),
    [similarTracks.sortedUnAvailTracks],
  );

  return (
    <div className="max-w-[62rem]">
      {availableSimilarTrackComponents.length > 0 && (
        <>
          <TitleContainer
            title="Similar Tracks In the Library"
            buttons={[
              {
                label: 'Play',
                clickHandler: () => handleSongPlayBtnClick(),
                iconName: 'play_arrow',
              },
              {
                label: 'Add to Play Next',
                clickHandler: addSongsToPlayNext,
                iconName: 'shortcut',
              },
            ]}
            titleClassName="!text-xl text-font-color-black !font-normal dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } !mt-8 mb-4`}
          />
          <div className="flex flex-wrap my-2">
            {availableSimilarTrackComponents}
          </div>
        </>
      )}
      {unAvailableSimilarTrackComponents.length > 0 && (
        <>
          <TitleContainer
            title="Other Similar Tracks"
            titleClassName="!text-xl text-font-color-black !font-normal dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } !my-4`}
          />
          <div className="flex flex-wrap ">
            {unAvailableSimilarTrackComponents}
          </div>
        </>
      )}
    </div>
  );
};

export default SimilarTracksContainer;
