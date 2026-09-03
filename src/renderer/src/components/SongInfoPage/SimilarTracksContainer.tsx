import { useQueueOperations } from '@renderer/hooks/useQueueOperations';
import { songQuery } from '@renderer/queries/songs';
import { store } from '@renderer/store/store';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { SimilarTracksOutput } from '../../../../types/last_fm_similar_tracks_api';
import { AppUpdateContext } from '../../contexts/AppUpdateContext';
import Song from '../SongsPage/Song';
import TitleContainer from '../TitleContainer';
import UnAvailableTrack from './UnAvailableTrack';

type Props = { songId: number };

const SimilarTracksContainer = (props: Props) => {
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { addToNext } = useQueueOperations();
  const { createQueue, playSong, addNewNotifications } = useContext(AppUpdateContext);
  const { t } = useTranslation();

  const { songId } = props;

  const { data: similarTracks } = useSuspenseQuery({
    ...songQuery.similarTracks({ songId }),
    select: (data) => {
      return data as NonNullable<SimilarTracksOutput>;
    }
  });

  const handleSongPlayBtnClick = useCallback(
    (startSongId?: number) => {
      const songs = similarTracks.sortedAvailTracks.map((song) => song.songData!);
      const queueSongIds = songs.filter((song) => !song.isBlacklisted).map((song) => song.songId);

      createQueue(queueSongIds, 'songs', false, undefined, !startSongId);
      if (startSongId) playSong(startSongId, true);
    },
    [similarTracks.sortedAvailTracks, createQueue, playSong]
  );

  const addSongsToPlayNext = useCallback(() => {
    const songs = similarTracks.sortedAvailTracks.map((song) => song.songData!);
    const queueSongIds = songs.filter((song) => !song.isBlacklisted).map((song) => song.songId);

    addToNext(queueSongIds, { removeDuplicates: false });
    addNewNotifications([
      {
        id: `${queueSongIds.length}PlayNext`,
        duration: 5000,
        content: t('notifications.playingNextSongsWithCount', {
          count: queueSongIds.length
        }),
        iconName: 'shortcut'
      }
    ]);
  }, [similarTracks.sortedAvailTracks, addToNext, addNewNotifications, t]);

  const availableSimilarTrackComponents = useMemo(
    () =>
      similarTracks.sortedAvailTracks.map((track, index) => {
        const { songData } = track;
        const song = songData!;
        return (
          <Song
            key={song.songId}
            index={index}
            isIndexingSongs={preferences?.isSongIndexingEnabled}
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
    [handleSongPlayBtnClick, preferences?.isSongIndexingEnabled, similarTracks.sortedAvailTracks]
  );

  const unAvailableSimilarTrackComponents = useMemo(
    () =>
      similarTracks.sortedUnAvailTracks.map((track) => {
        const { title, url, artists } = track;
        return <UnAvailableTrack title={title} artists={artists} url={url} key={url} />;
      }),
    [similarTracks.sortedUnAvailTracks]
  );

  return (
    <div className="w-full">
      {availableSimilarTrackComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('songInfoPage.similarTracksInLibrary')}
            buttons={[
              {
                label: t('common.play'),
                clickHandler: () => handleSongPlayBtnClick(),
                iconName: 'play_arrow',
                className: 'bg-background-color-1/40! dark:bg-dark-background-color-1/40!'
              },
              {
                label: t('common.playNextAll'),
                clickHandler: addSongsToPlayNext,
                iconName: 'shortcut',
                className: 'bg-background-color-1/40! dark:bg-dark-background-color-1/40!'
              }
            ]}
            titleClassName="text-xl! text-font-color-black font-normal! dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } !mt-8 mb-4`}
          />
          <div className="my-2 flex flex-wrap">{availableSimilarTrackComponents}</div>
        </>
      )}
      {unAvailableSimilarTrackComponents.length > 0 && (
        <>
          <TitleContainer
            title={t('songInfoPage.otherSimilarTracks')}
            titleClassName="text-xl! text-font-color-black font-normal! dark:text-font-color-white"
            className={`title-container ${
              bodyBackgroundImage
                ? 'text-font-color-white'
                : 'text-font-color-black dark:text-font-color-white'
            } !my-4`}
          />
          <div className="flex flex-wrap">{unAvailableSimilarTrackComponents}</div>
        </>
      )}
    </div>
  );
};

export default SimilarTracksContainer;
