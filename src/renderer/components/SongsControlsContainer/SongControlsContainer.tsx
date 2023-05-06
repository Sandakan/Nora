import { useContext } from 'react';
import { AppContext } from 'renderer/contexts/AppContext';
import ErrorBoundary from '../ErrorBoundary';
import CurrentlyPlayingSongInfoContainer from './CurrentlyPlayingSongInfoContainer';
import OtherSongControlsContainer from './OtherSongControlsContainer';
import SongControlsAndSeekbarContainer from './SongControlsAndSeekbarContainer';

const SongControlsContainer = () => {
  const { bodyBackgroundImage } = useContext(AppContext);

  return (
    <footer
      className={`song-controls-container relative bottom-0 z-20 flex h-[6rem] w-full flex-row justify-between overflow-hidden rounded-tl-md rounded-tr-md  text-font-color-black shadow-[0px_-10px_25px_7px_rgba(0,0,0,0.1)] dark:text-font-color-white ${
        bodyBackgroundImage
          ? 'bg-background-color-1/70 backdrop-blur-md dark:bg-dark-background-color-1/70'
          : 'bg-background-color-1 dark:bg-dark-background-color-1'
      }`}
    >
      <ErrorBoundary>
        <>
          <CurrentlyPlayingSongInfoContainer />
          <SongControlsAndSeekbarContainer />
          <OtherSongControlsContainer />
        </>
      </ErrorBoundary>
    </footer>
  );
};

SongControlsContainer.displayName = 'SongControlsContainer';
export default SongControlsContainer;
