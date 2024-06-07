import { useContext } from 'react';

import Genre from '../../GenresPage/Genre';
import SecondaryContainer from '../../SecondaryContainer';
import { AppContext } from '../../../contexts/AppContext';
import useSelectAllHandler from '../../../hooks/useSelectAllHandler';
import VirtualizedGrid from '../../VirtualizedGrid';

type Props = { genreData: Genre[] };

const MIN_ITEM_WIDTH = 320;
const MIN_ITEM_HEIGHT = 180;

const AllGenreResults = (prop: Props) => {
  const { currentlyActivePage } = useContext(AppContext);
  const { genreData } = prop;

  const selectAllHandler = useSelectAllHandler(genreData, 'genre', 'genreId');

  return (
    <SecondaryContainer
      className={`genres-container flex h-full flex-wrap ${
        !(genreData && genreData.length > 0) && 'hidden'
      }`}
      focusable
      onKeyDown={(e) => {
        if (e.ctrlKey && e.key === 'a') {
          e.stopPropagation();
          selectAllHandler();
        }
      }}
    >
      {genreData && genreData.length > 0 && (
        <VirtualizedGrid
          data={genreData}
          fixedItemWidth={MIN_ITEM_WIDTH}
          fixedItemHeight={MIN_ITEM_HEIGHT}
          scrollTopOffset={currentlyActivePage.data?.scrollTopOffset}
          itemContent={(index, genre) => {
            return (
              <Genre
                index={index}
                title={genre.name}
                songIds={genre.songs.map((song) => song.songId)}
                selectAllHandler={selectAllHandler}
                {...genre}
              />
            );
          }}
        />
      )}
    </SecondaryContainer>
  );
};

export default AllGenreResults;
