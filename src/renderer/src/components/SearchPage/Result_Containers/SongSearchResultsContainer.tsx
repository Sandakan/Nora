import { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import SecondaryContainer from '../../SecondaryContainer';
import Song from '../../SongsPage/Song';
import { AppUpdateContext } from '../../../contexts/AppUpdateContext';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store/store';
import { useNavigate } from '@tanstack/react-router';

type Props = {
  songs: SongData[];
  searchInput: string;
  noOfVisibleSongs?: number;
  isSimilaritySearchEnabled: boolean;
};

const SongSearchResultsContainer = (props: Props) => {
  const { searchInput, songs, noOfVisibleSongs = 5, isSimilaritySearchEnabled } = props;
  const multipleSelectionsData = useStore(store, (state) => state.multipleSelectionsData);
  const isMultipleSelectionEnabled = useStore(
    store,
    (state) => state.multipleSelectionsData.isEnabled
  );
  const preferences = useStore(store, (state) => state.localStorage.preferences);

  const { toggleMultipleSelections, createQueue, playSong } = useContext(AppUpdateContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSongPlayBtnClick = useCallback(
    (currSongId: number) => {
      const queueSongIds = songs.filter((song) => !song.isBlacklisted).map((song) => song.songId);
      createQueue(queueSongIds, 'songs', false, undefined, false);
      playSong(currSongId, true);
    },
    [createQueue, playSong, songs]
  );

  const songResults = useMemo(
    () =>
      songs.length > 0
        ? songs
            .map((song, index) => {
              if (index < noOfVisibleSongs)
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
              return undefined;
            })
            .filter((song) => song !== undefined)
        : [],
    [handleSongPlayBtnClick, preferences?.isSongIndexingEnabled, noOfVisibleSongs, songs]
  );

  return (
    <SecondaryContainer
      className={`secondary-container songs-list-container ${
        songResults.length > 0 ? 'active relative mt-8' : 'absolute mt-4'
      }`}
    >
      <>
        <div
          className={`title-container text-font-color-highlight dark:text-dark-font-color-highlight mt-1 mb-8 flex items-center pr-4 text-2xl font-medium ${
            songResults.length > 0 ? 'visible opacity-100' : 'invisible opacity-0'
          }`}
        >
          <div className="container flex">
            Songs{' '}
            <div className="other-stats-container ml-12 flex items-center text-xs">
              {songs && songs.length > 0 && (
                <span className="no-of-songs">
                  {t(
                    `searchPage.${
                      songs.length > noOfVisibleSongs ? 'resultAndVisibleCount' : 'resultCount'
                    }`,
                    { count: songs.length, noVisible: noOfVisibleSongs }
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="other-controls-container flex">
            <Button
              label={t(
                `common.${
                  isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'songs'
                    ? 'unselectAll'
                    : 'select'
                }`
              )}
              className="select-btn text-sm md:text-lg md:[&>.button-label-text]:hidden md:[&>.icon]:mr-0"
              iconName={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType === 'songs'
                  ? 'remove_done'
                  : 'checklist'
              }
              clickHandler={() => toggleMultipleSelections(!isMultipleSelectionEnabled, 'songs')}
              isDisabled={
                isMultipleSelectionEnabled && multipleSelectionsData.selectionType !== 'songs'
              }
              tooltipLabel={t(`common.${isMultipleSelectionEnabled ? 'unselectAll' : 'select'}`)}
            />
            {songs.length > noOfVisibleSongs && (
              <Button
                label={t('common.showAll')}
                iconName="apps"
                className="show-all-btn text-sm font-normal"
                clickHandler={() =>
                  navigate({
                    to: '/main-player/search/all',
                    search: { isSimilaritySearchEnabled, keyword: searchInput, filterBy: 'Songs' }
                  })
                }
              />
            )}
          </div>
        </div>
        <div
          className={`songs-container mb-12 ${
            songResults.length > 0
              ? 'visible translate-y-0 opacity-100'
              : 'invisible translate-y-8 opacity-0 transition-transform'
          }`}
        >
          {songResults}
        </div>
      </>
    </SecondaryContainer>
  );
};

export default SongSearchResultsContainer;
