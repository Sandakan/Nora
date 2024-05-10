import React from 'react';

import { Album } from '../../AlbumsPage/Album';
import { AppContext } from '../../../contexts/AppContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';
import SecondaryContainer from '../../SecondaryContainer';
import VirtualizedGrid from '../../VirtualizedGrid';

type Props = { albumData: Album[] };

const MIN_ITEM_WIDTH = 220;
const MIN_ITEM_HEIGHT = 280;

const AllAlbumResults = (prop: Props) => {
  const { currentlyActivePage } = React.useContext(AppContext);
  const { albumData } = prop;

  const selectAllHandler = useSelectAllHandler(albumData, 'album', 'albumId');

  return (
    <SecondaryContainer className="albums-container h-full w-full flex-grow">
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
