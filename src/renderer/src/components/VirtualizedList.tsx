import { CSSProperties, ReactNode, RefObject, forwardRef, useContext, useRef } from 'react';
import { Virtuoso, Components, VirtuosoHandle } from 'react-virtuoso';
import debounce from '../utils/debounce';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { useVirtualizer } from '@tanstack/react-virtual';

type Props<T extends object> = {
  data: T[];
  fixedItemHeight: number;
  scrollTopOffset?: number;
  itemContent: (index: number, item: T) => ReactNode;
  components?: Components<T>;
  scrollerRef?: any;
  useWindowScroll?: boolean;
  style?: CSSProperties;
  noRangeUpdates?: boolean;
};

const VirtualizedList = <T extends object = object>(props: Props<T>, ref?: RefObject<null>) => {
  const { updateCurrentlyActivePageData } = useContext(AppUpdateContext);

  const {
    data,
    fixedItemHeight,
    scrollTopOffset,
    itemContent,
    // components = {},
    // scrollerRef,
    // useWindowScroll = false,
    style
    // noRangeUpdates = false
  } = props;

  ref = useRef(null);

  // The virtualizer
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => ref.current,
    estimateSize: () => fixedItemHeight,
    overscan: 5,
    initialOffset: scrollTopOffset
  });

  return (
    // <Virtuoso
    //   style={
    //     useWindowScroll
    //       ? { ...style }
    //       : {
    //           width: '100%',
    //           height: '100%',
    //           ...style
    //         }
    //   }
    //   // className="pb-4"
    //   data={data}
    //   overscan={(fixedItemHeight || 0) * 5}
    //   useWindowScroll={useWindowScroll}
    //   atBottomThreshold={20}
    //   fixedItemHeight={fixedItemHeight}
    //   components={components}
    //   ref={ref}
    //   initialTopMostItemIndex={{ index: scrollTopOffset ?? 0 }}
    //   scrollerRef={scrollerRef}
    //   increaseViewportBy={{
    //     top: fixedItemHeight * 5, // to overscan 5 elements
    //     bottom: fixedItemHeight * 5 // to overscan 5 elements
    //   }}
    //   rangeChanged={(range) => {
    //     if (!noRangeUpdates)
    //       debounce(
    //         () =>
    //           updateCurrentlyActivePageData((currentPageData) => ({
    //             ...currentPageData,
    //             scrollTopOffset: range.startIndex <= 5 ? 0 : range.startIndex + 5
    //           })),
    //         500
    //       );
    //   }}
    //   itemContent={itemContent}
    // />
    <>
      {/* The scrollable element for your list */}
      <div
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto', // Make it scroll!
          ...style
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          ref={ref}
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {/* Only the visible items in the virtualizer, manually positioned to be in view */}
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              {itemContent(virtualItem.index, data[virtualItem.index])}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// const VirtualizedList = forwardRef(List) as <T extends object>(
//   props: Props<T> & { ref?: React.ForwardedRef<VirtuosoHandle> }
// ) => ReturnType<typeof List>;

export default VirtualizedList;
