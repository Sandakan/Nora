/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import calculateTimeFromSeconds from 'renderer/utils/calculateTimeFromSeconds';
import Button from '../Button';
import MainContainer from '../MainContainer';
import Song from '../SongsPage/Song';

const GenreInfoPage = () => {
  const { currentlyActivePage, userData, queue } = React.useContext(AppContext);
  const { createQueue, updateQueueData, addNewNotifications } =
    React.useContext(AppUpdateContext);
  const [genreData, setGenreData] = React.useState({} as Genre);
  const [genreSongs, setGenreSongs] = React.useState([] as AudioInfo[]);

  const fetchGenresData = React.useCallback(() => {
    if (currentlyActivePage.data) {
      window.api
        .getGenresData([currentlyActivePage.data.genreId])
        .then((res) => {
          if (res && res.length > 0 && res[0]) setGenreData(res[0]);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
  }, [currentlyActivePage.data]);

  const fetchSongsData = React.useCallback(() => {
    if (genreData && genreData.songs && genreData.songs.length > 0) {
      window.api
        .getSongInfo(genreData.songs.map((song) => song.songId))
        .then((res) => {
          if (res) return setGenreSongs(res);
          return undefined;
        })
        .catch((err) => console.error(err));
    }
    return undefined;
  }, [genreData]);

  React.useEffect(() => {
    fetchGenresData();
    const manageGenreUpdatesInGenresInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'genres') fetchGenresData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageGenreUpdatesInGenresInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageGenreUpdatesInGenresInfoPage
      );
    };
  }, [fetchGenresData]);

  React.useEffect(() => {
    fetchSongsData();
    const manageSongUpdatesInGenreInfoPage = (e: Event) => {
      if ('detail' in e) {
        const dataEvents = (e as DetailAvailableEvent<DataUpdateEvent[]>)
          .detail;
        for (let i = 0; i < dataEvents.length; i += 1) {
          const event = dataEvents[i];
          if (event.dataType === 'songs') fetchSongsData();
        }
      }
    };
    document.addEventListener(
      'app/dataUpdates',
      manageSongUpdatesInGenreInfoPage
    );
    return () => {
      document.removeEventListener(
        'app/dataUpdates',
        manageSongUpdatesInGenreInfoPage
      );
    };
  }, [fetchSongsData]);

  const songComponents = React.useMemo(
    () =>
      genreSongs.map((song, index) => (
        <Song
          key={index}
          index={index}
          isIndexingSongs={
            userData !== undefined && userData.preferences.songIndexing
          }
          songId={song.songId}
          title={song.title}
          artists={song.artists}
          duration={song.duration}
          artworkPaths={song.artworkPaths}
          path={song.path}
          isAFavorite={song.isAFavorite}
        />
      )),
    [genreSongs, userData]
  );

  const totalGenreSongsDuration = React.useMemo(() => {
    const { hours, minutes, seconds } = calculateTimeFromSeconds(
      genreSongs.reduce((prev, current) => prev + current.duration, 0)
    );
    return `${
      hours >= 1 ? `${hours} hour${hours === 1 ? '' : 's'} ` : ''
    }${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${
      seconds === 1 ? '' : 's'
    }`;
  }, [genreSongs]);

  return (
    <MainContainer
      className="main-container songs-list-container genre-info-page-container !h-full"
      style={
        genreData.backgroundColor && {
          background: `linear-gradient(180deg, ${`rgb(${
            (genreData.backgroundColor.rgb as number[])[0]
          },${(genreData.backgroundColor.rgb as number[])[1]},${
            (genreData.backgroundColor.rgb as number[])[2]
          })`} 0%, var(--background-color-1) 90%)`,
        }
      }
    >
      <>
        {genreData.genreId && (
          <div className="genre-info-container my-8 h-fit text-font-color-white dark:text-font-color-white">
            <div className="genre-title h-fit max-w-[80%] overflow-hidden text-ellipsis whitespace-nowrap py-2 text-6xl">
              {genreData.name}
            </div>
            <div className="genre-no-of-songs">{`${
              genreData.songs.length
            } song${genreData.songs.length !== 1 ? 's' : ''}`}</div>
            <div className="genre-total-duration">
              {totalGenreSongsDuration}
            </div>
            {genreSongs.length > 0 && (
              <div className="album-buttons mt-4 flex">
                <Button
                  label="Play All"
                  iconName="play_arrow"
                  clickHandler={() =>
                    createQueue(
                      genreSongs.map((song) => song.songId),
                      'genre',
                      false,
                      genreData.genreId,
                      true
                    )
                  }
                />
                <Button
                  label="Shuffle and Play"
                  iconName="shuffle"
                  clickHandler={() =>
                    createQueue(
                      genreSongs.map((song) => song.songId),
                      'genre',
                      true,
                      genreData.genreId,
                      true
                    )
                  }
                />
                <Button
                  label="Add to Queue"
                  iconName="add"
                  clickHandler={() => {
                    updateQueueData(
                      undefined,
                      [
                        ...queue.queue,
                        ...genreSongs.map((song) => song.songId),
                      ],
                      false,
                      false
                    );
                    addNewNotifications([
                      {
                        id: genreData.genreId,
                        delay: 5000,
                        content: (
                          <span>
                            Added {genreSongs.length} song
                            {genreSongs.length === 1 ? '' : 's'} to the queue.
                          </span>
                        ),
                      },
                    ]);
                  }}
                />
              </div>
            )}
          </div>
        )}
        {genreSongs.length > 0 && (
          <div className="songs-container">{songComponents}</div>
        )}
      </>
    </MainContainer>
  );
};

export default GenreInfoPage;
