import { Album } from '../../AlbumsPage/Album';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';
import SecondaryContainer from '../../SecondaryContainer';
import VirtualizedGrid from '../../VirtualizedGrid';
import { store } from '@renderer/store/store';
import { useStore } from '@tanstack/react-store';

type Props = { albumData: Album[] };

const MIN_ITEM_WIDTH = 220;
const MIN_ITEM_HEIGHT = 280;

const AllAlbumResults = (prop: Props) => {
  const currentlyActivePage = useStore(store, (state) => state.currentlyActivePage);
  const { albumData } = prop;

  const selectAllHandler = useSelectAllHandler(albumData, 'album', 'albumId');

  return (
    <SecondaryContainer className="albums-container h-full w-full grow">
      {albumData && albumData.length > 0 && (
        <VirtualizedGrid
          data={albumData}
          fixedItemWidth={MIN_ITEM_WIDTH}
          fixedItemHeight={MIN_ITEM_HEIGHT}
          scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
          itemContent={(index, item) => {
            return (
              <Album
                index={index}
                key={`${item.albumId}-${item.title}`}
                selectAllHandler={selectAllHandler}
                {...item}
              />
            );
          }}
        />
      )}
    </SecondaryContainer>
  );
};

export default AllAlbumResults;
