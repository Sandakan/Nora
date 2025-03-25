import { Artist } from '../../ArtistPage/Artist';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';
import SecondaryContainer from '../../SecondaryContainer';
import VirtualizedGrid from '../../VirtualizedGrid';
import { useStore } from '@tanstack/react-store';
import { store } from '@renderer/store';

type Props = { artistData: Artist[] };

const MIN_ITEM_WIDTH = 175;
const MIN_ITEM_HEIGHT = 200;

const AllArtistResults = (prop: Props) => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);

  const { artistData } = prop;

  const selectAllHandler = useSelectAllHandler(artistData, 'artist', 'artistId');

  return (
    <SecondaryContainer
      className="artists-container mb-0! flex h-full! flex-wrap"
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      {artistData && artistData.length > 0 && (
        <VirtualizedGrid
          data={artistData}
          fixedItemWidth={MIN_ITEM_WIDTH}
          fixedItemHeight={MIN_ITEM_HEIGHT}
          scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
          itemContent={(index, artist) => {
            return (
              <Artist
                index={index}
                key={artist.artistId}
                className="mb-4"
                songIds={artist.songs.map((song) => song.songId)}
                selectAllHandler={selectAllHandler}
                appearFromBottom={false}
                {...artist}
              />
            );
          }}
        />
      )}
    </SecondaryContainer>
  );
};

export default AllArtistResults;
