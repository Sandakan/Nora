import { type CSSProperties, type ReactNode, forwardRef, useContext, useRef } from 'react';
import { Virtuoso, type Components, type VirtuosoHandle } from 'react-virtuoso';
import debounce from '../utils/debounce';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { useVirtualizer } from '@tanstack/react-virtual';

type Props<T extends object> = {
  data: T[];
  fixedItemHeight: number;
  scrollTopOffset?: number;
  itemContent: (index: number, item: T) => ReactNode;
  components?: Components<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollerRef?: any;
  useWindowScroll?: boolean;
  style?: CSSProperties;
  noRangeUpdates?: boolean;
};

const List = <T extends object>(props: Props<T>, ref) => {
  const { updateCurrentlyActivePageData } = useContext(AppUpdateContext);
  const parentRef = useRef(null);

  const {
    data,
    fixedItemHeight,
    scrollTopOffset,
    itemContent,
    components = {},
    scrollerRef,
    useWindowScroll = false,
    style,
    noRangeUpdates = false
  } = props;

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => fixedItemHeight,
    overscan: (fixedItemHeight || 0) * 5
  });

  return (
    <Virtuoso
      style={
        useWindowScroll
          ? { ...style }
          : {
              width: '100%',
              height: '100%',
              ...style
            }
      }
      // className="pb-4"
      data={data}
      overscan={(fixedItemHeight || 0) * 5}
      useWindowScroll={useWindowScroll}
      atBottomThreshold={20}
      fixedItemHeight={fixedItemHeight}
      components={components}
      ref={ref}
      initialTopMostItemIndex={{ index: scrollTopOffset ?? 0 }}
      scrollerRef={scrollerRef}
      increaseViewportBy={{
        top: fixedItemHeight * 5, // to overscan 5 elements
        bottom: fixedItemHeight * 5 // to overscan 5 elements
      }}
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

const VirtualizedList = forwardRef(List) as <T extends object>(
  props: Props<T> & { ref?: React.ForwardedRef<VirtuosoHandle> }
) => ReturnType<typeof List>;

export default VirtualizedList;
