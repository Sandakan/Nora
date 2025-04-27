import BodyAndSideBarContainer from '@renderer/components/BodyAndSidebarContainer';
import ContextMenu from '@renderer/components/ContextMenu/ContextMenu';
import Img from '@renderer/components/Img';
import PromptMenu from '@renderer/components/PromptMenu/PromptMenu';
import SongControlsContainer from '@renderer/components/SongsControlsContainer/SongControlsContainer';
import TitleBar from '@renderer/components/TitleBar/TitleBar';
import { store } from '@renderer/store';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';

export const Route = createFileRoute('/main-player')({
  component: RouteComponent
});

function RouteComponent() {
  const isReducedMotion = useStore(store, (state) => {
    // storeRef.current = state;

    return (
      state.localStorage.preferences.isReducedMotion ||
      (state.isOnBatteryPower && state.localStorage.preferences.removeAnimationsOnBatteryPower)
    );
  });
  const isDarkMode = useStore(store, (state) => state.isDarkMode);
  const bodyBackgroundImage = useStore(store, (state) => state.bodyBackgroundImage);

  return (
    <div
      className={`App relative select-none ${
        isDarkMode ? 'dark bg-dark-background-color-1' : 'bg-background-color-1'
      } ${
        isReducedMotion
          ? 'reduced-motion animate-none transition-none delay-0! duration-0! [&.dialog-menu]:backdrop-blur-none!'
          : 'transition-colors duration-200'
      } after:text-font-color-white dark:after:text-font-color-white grid !h-screen min-h-screen w-full grid-rows-[auto_1fr_auto] items-center overflow-y-hidden after:invisible after:absolute after:-z-10 after:grid after:h-full after:w-full after:place-items-center after:bg-[rgba(0,0,0,0)] after:text-4xl after:font-medium after:content-["Drop_your_song_here"] dark:after:bg-[rgba(0,0,0,0)] [&.blurred_#title-bar]:opacity-40 [&.fullscreen_#window-controls-container]:hidden [&.song-drop]:after:visible [&.song-drop]:after:z-20 [&.song-drop]:after:border-4 [&.song-drop]:after:border-dashed [&.song-drop]:after:border-[#ccc] [&.song-drop]:after:bg-[rgba(0,0,0,0.7)] [&.song-drop]:after:transition-[background,visibility,color] dark:[&.song-drop]:after:border-[#ccc] dark:[&.song-drop]:after:bg-[rgba(0,0,0,0.7)]`}
    >
      {bodyBackgroundImage && (
        <div
          className={`body-background-image-container bg-dark-background-color-1! absolute h-full w-full overflow-hidden bg-center`}
        >
          <Img
            className={`blur-0 w-full bg-cover opacity-100 brightness-100 transition-[filter,opacity] duration-500 ${
              bodyBackgroundImage &&
              'opacity-100! blur-[1.5rem]! brightness-[.75]! dark:brightness-[.5]!'
            }`}
            loading="eager"
            src={bodyBackgroundImage}
            alt=""
          />
        </div>
      )}
      <ContextMenu />
      <PromptMenu />
      <TitleBar />
      <BodyAndSideBarContainer />
      <SongControlsContainer />
    </div>
  );
}

