import React from 'react';
import Img from 'renderer/components/Img';
import SecondaryContainer from 'renderer/components/SecondaryContainer';
import { AppUpdateContext } from 'renderer/contexts/AppUpdateContext';
import { AppContext } from 'renderer/contexts/AppContext';
import { MostRelevantResult } from '../MostRelevantResult';

type Props = { searchResults: SearchResult };

const MostRelevantSearchResultsContainer = (props: Props) => {
  const { searchResults } = props;
  const { currentSongData, currentlyActivePage, queue } =
    React.useContext(AppContext);
  const {
    playSong,
    changeCurrentActivePage,
    updateQueueData,
    createQueue,
    addNewNotifications,
  } = React.useContext(AppUpdateContext);

  const MostRelevantResults = [];

  const mostRelevantResultContainerRef = React.useRef<HTMLDivElement>(null);

  if (searchResults.songs.length > 0) {
    const firstResult = searchResults.songs[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="song"
        title={firstResult.title}
        key={0}
        id={firstResult.songId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={
          firstResult.artists
            ? firstResult.artists.map((artist) => artist.name).join(',')
            : 'Unknown Artist'
        }
        infoType2={firstResult.album ? firstResult.album.name : 'Unknown Album'}
        contextMenuItems={[
          {
            label: 'Play',
            handlerFunction: () => playSong(firstResult.songId),
            iconName: 'play_arrow',
          },
          {
            label: 'Play Next',
            iconName: 'shortcut',
            handlerFunction: () => {
              const newQueue = queue.queue.filter(
                (songId) => songId !== firstResult.songId
              );
              newQueue.splice(
                queue.queue.indexOf(currentSongData.songId) + 1 || 0,
                0,
                firstResult.songId
              );
              updateQueueData(undefined, newQueue);
              addNewNotifications([
                {
                  id: `${firstResult.title}PlayNext`,
                  delay: 5000,
                  content: (
                    <span>
                      &apos;{firstResult.title}&apos; will be played next.
                    </span>
                  ),
                  icon: <span className="material-icons-round">shortcut</span>,
                },
              ]);
            },
          },
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
              updateQueueData(undefined, [...queue.queue, firstResult.songId]);
              addNewNotifications(
                [
                  {
                    id: `${firstResult.title}AddedToQueue`,
                    delay: 5000,
                    content: <span>Added 1 song to the queue.</span>,
                    icon: (
                      <Img
                        src={firstResult.artworkPaths?.artworkPath}
                        alt="Song Artwork"
                      />
                    ),
                  },
                ]
                // <span className="material-icons-round icon">playlist_add</span>
              );
            },
          },
          {
            label: 'Reveal in File Explorer',
            class: 'reveal-file-explorer',
            iconName: 'folder_open',
            handlerFunction: () =>
              window.api.revealSongInFileExplorer(firstResult.songId),
          },
          {
            label: 'Info',
            class: 'info',
            iconName: 'info',
            handlerFunction: () =>
              changeCurrentActivePage('SongInfo', {
                songId: firstResult.songId,
              }),
          },
        ]}
      />
    );
  }

  if (searchResults.artists.length > 0) {
    const firstResult = searchResults.artists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="artist"
        title={firstResult.name}
        key={1}
        id={firstResult.artistId}
        artworkPaths={firstResult.artworkPaths}
        onlineArtworkPath={
          firstResult.onlineArtworkPaths
            ? firstResult.onlineArtworkPaths.picture_medium
            : undefined
        }
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        contextMenuItems={[
          {
            label: 'Play all Songs',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'artist',
                false,
                firstResult.artistId,
                true
              ),
          },
          {
            label: 'Info',
            iconName: 'info',
            handlerFunction: () =>
              currentlyActivePage.pageTitle === 'ArtistInfo' &&
              currentlyActivePage.data.artistName === firstResult.name
                ? changeCurrentActivePage('Home')
                : changeCurrentActivePage('ArtistInfo', {
                    artistName: firstResult.name,
                  }),
          },
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
              updateQueueData(undefined, [
                ...queue.queue,
                ...firstResult.songs.map((song) => song.songId),
              ]);
            },
          },
        ]}
      />
    );
  }

  if (searchResults.albums.length > 0) {
    const firstResult = searchResults.albums[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="album"
        title={firstResult.title}
        key={2}
        id={firstResult.albumId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={
          firstResult.artists
            ? firstResult.artists.map((artist) => artist.name).join(',')
            : 'Unknown Artist'
        }
        infoType2={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'album',
                false,
                firstResult.albumId,
                true
              ),
          },
          {
            label: 'Add to queue',
            iconName: 'queue',
            handlerFunction: () => {
              queue.queue.push(...firstResult.songs.map((song) => song.songId));
              updateQueueData(undefined, queue.queue, false);
              addNewNotifications([
                {
                  id: 'addedToQueue',
                  delay: 5000,
                  content: (
                    <span>
                      Added {firstResult.songs.length} song
                      {firstResult.songs.length === 1 ? '' : 's'} to the queue.
                    </span>
                  ),
                },
              ]);
            },
          },
        ]}
      />
    );
  }

  if (searchResults.playlists.length > 0) {
    const firstResult = searchResults.playlists[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="playlist"
        title={firstResult.name}
        key={3}
        id={firstResult.playlistId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs,
                'playlist',
                false,
                firstResult.playlistId,
                true
              ),
          },
        ]}
      />
    );
  }

  if (searchResults.genres.length > 0) {
    const firstResult = searchResults.genres[0];
    MostRelevantResults.push(
      <MostRelevantResult
        resultType="genre"
        title={firstResult.name}
        key={4}
        id={firstResult.genreId}
        artworkPaths={firstResult.artworkPaths}
        infoType1={`${firstResult.songs.length} song${
          firstResult.songs.length === 1 ? '' : 's'
        }`}
        contextMenuItems={[
          {
            label: 'Play',
            iconName: 'play_arrow',
            handlerFunction: () =>
              createQueue(
                firstResult.songs.map((song) => song.songId),
                'playlist',
                false,
                firstResult.genreId,
                true
              ),
          },
        ]}
      />
    );
  }

  return (
    <SecondaryContainer
      className={`most-relevant-results-container mt-4 ${
        MostRelevantResults.length > 0
          ? 'active visible relative'
          : 'invisible absolute'
      }`}
    >
      <>
        <div className="title-container mt-1 mb-8 flex items-center pr-4 text-2xl font-medium text-font-color-highlight dark:text-dark-font-color-highlight">
          Most Relevant
        </div>
        <div
          className={`results-container overflow-x-auto ${
            mostRelevantResultContainerRef.current &&
            mostRelevantResultContainerRef.current.scrollWidth >
              mostRelevantResultContainerRef.current.clientWidth
              ? 'overscroll-contain'
              : 'overscroll-auto'
          } transition-[transform,opacity] ${
            MostRelevantResults.length > 0
              ? 'visible flex translate-y-0 pb-4 opacity-100 [&>div]:hidden [&>div.active]:flex'
              : 'tranlate-y-8 invisible opacity-0'
          }`}
          ref={mostRelevantResultContainerRef}
          onWheel={(e) => {
            if (mostRelevantResultContainerRef.current) {
              e.stopPropagation();
              mostRelevantResultContainerRef.current.scrollLeft += e.deltaY;
            }
          }}
        >
          {MostRelevantResults}
        </div>
      </>
    </SecondaryContainer>
  );
};

export default MostRelevantSearchResultsContainer;
