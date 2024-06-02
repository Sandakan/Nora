import React, { CSSProperties, ReactNode, forwardRef, useContext, useMemo } from 'react';
import { GridComponents, VirtuosoGrid, VirtuosoHandle } from 'react-virtuoso';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import debounce from '../utils/debounce';

type Props<T extends object> = {
  data: T[];
  fixedItemHeight: number;
  fixedItemWidth: number;
  scrollTopOffset?: number;
  itemContent: (index: number, item: T) => ReactNode;
  components?: GridComponents<T>;
  scrollerRef?: any;
  useWindowScroll?: boolean;
  style?: CSSProperties;
  noRangeUpdates?: boolean;
};

const Grid = <T extends object>(props: Props<T>, ref) => {
  const { updateCurrentlyActivePageData } = useContext(AppUpdateContext);

  const {
    data,
    fixedItemHeight,
    fixedItemWidth,
    scrollTopOffset,
    itemContent,
    components = {},
    scrollerRef,
    useWindowScroll = false,
    style: mainStyle,
    noRangeUpdates = false
  } = props;

  const gridComponents = useMemo(
    () => ({
      // eslint-disable-next-line react/display-name
      List: forwardRef<HTMLDivElement, { style?: CSSProperties; children?: any }>(
        ({ style, children, ...props }, ref) => (
          <div
            ref={ref}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat( auto-fill, minmax(${fixedItemWidth}px, 1fr) )`,
              ...style
            }}
            {...props}
          >
            {children}
          </div>
        )
      ),
      Item: ({ children, ...props }: { children?: any }) => (
        <div
          {...props}
          style={{
            justifySelf: 'center',
            alignSelf: 'center'
          }}
        >
          {children}
        </div>
      )
    }),
    [fixedItemWidth]
  );

  return (
    <VirtuosoGrid
      style={{
        height: '100%',
        width: '100%',
        paddingBottom: '2rem',
        ...mainStyle
      }}
      // className="pb-4"
      data={data}
      overscan={fixedItemHeight * 5}
      useWindowScroll={useWindowScroll}
      components={{ ...gridComponents, ...components }}
      ref={ref}
      initialTopMostItemIndex={{ index: scrollTopOffset ?? 0 }}
      scrollerRef={scrollerRef}
      rangeChanged={(range) => {
        if (!noRangeUpdates)
          debounce(
            () =>
              updateCurrentlyActivePageData((currentPageData) => ({
                ...currentPageData,
                scrollTopOffset: range.startIndex <= 5 ? 0 : range.startIndex + 5
              })),
            500
          );
      }}
      itemContent={itemContent}
    />
  );
};

const VirtualizedGrid = forwardRef(Grid) as <T extends object>(
  props: Props<T> & { ref?: React.ForwardedRef<VirtuosoHandle> }
) => ReturnType<typeof Grid>;

export default VirtualizedGrid;
