import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import ErrorBoundary from '../ErrorBoundary';
import CurrentlyPlayingSongInfoContainer from './CurrentlyPlayingSongInfoContainer';
import OtherSongControlsContainer from './OtherSongControlsContainer';
import SongControlsAndSeekbarContainer from './SongControlsAndSeekbarContainer';

const SongControlsContainer = () => {
  const { bodyBackgroundImage } = useContext(AppContext);

  return (
    <footer
      className={`song-controls-container relative bottom-0 z-20 grid h-[6rem] w-full grid-cols-[minmax(0,1fr)_clamp(20rem,40%,40rem)_minmax(0,1fr)] justify-between gap-4 overflow-hidden rounded-tl-md rounded-tr-md text-font-color-black  shadow-[0px_-10px_25px_7px_rgba(0,0,0,0.1)] sm:gap-2 dark:text-font-color-white ${
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
