import {
  type CSSProperties,
  type ReactNode,
  forwardRef,
  useContext,
  useRef,
  useEffect
} from 'react';
import { Virtuoso, type Components, type VirtuosoHandle } from 'react-virtuoso';
import { AppUpdateContext } from '../contexts/AppUpdateContext';
import { useVirtualizer, Virtualizer, type VirtualItem } from '@tanstack/react-virtual';
import debounce from '@renderer/utils/debounce';
import { useDebouncedCallback } from '@tanstack/react-pacer';

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

type VirtualListProps<T extends object> = {
  data: T[];
  fixedItemHeight: number;
  scrollTopOffset?: number;
  itemContent: (item: VirtualItem, dataItem: T) => ReactNode;
  overscan?: number;
  onChange?: (instance: Virtualizer<HTMLDivElement, Element>, sync: boolean) => void;
  onDebouncedScroll?: (instance: Virtualizer<HTMLDivElement, Element>, sync: boolean) => void;
};

export const VirtualList = <T extends object>(props: VirtualListProps<T>) => {
  const {
    data,
    fixedItemHeight,
    itemContent,
    overscan = 25,
    onChange,
    onDebouncedScroll,
    scrollTopOffset = 0
  } = props;

  const handleDebouncedScroll = useDebouncedCallback(
    (instance: Virtualizer<HTMLDivElement, Element>, sync: boolean) => {
      if (onDebouncedScroll) {
        onDebouncedScroll(instance, sync);
      }
    },
    { wait: 500 }
  );

  const parentRef = useRef<HTMLDivElement | null>(null);
  const { getTotalSize, getVirtualItems, scrollToOffset } = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => fixedItemHeight,
    onChange: (instance, sync) => {
      if (onChange) onChange(instance, sync);
      handleDebouncedScroll(instance, sync);
    },
    overscan
  });

  useEffect(() => {
    if (scrollTopOffset) scrollToOffset(scrollTopOffset);
  }, [scrollTopOffset, scrollToOffset]);

  return (
    <div
      className="list-container appear-from-bottom h-full flex-1 overflow-auto delay-100"
      ref={parentRef}
    >
      {/* The scrollable element for your list */}
      {/* The large inner element to hold all of the items */}
      <div
        style={{
          height: `${getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Only the visible items in the virtualizer, manually positioned to be in view */}
        {getVirtualItems().map((virtualItem) => {
          const index = virtualItem.index;
          const item = itemContent(virtualItem, data[index]);

          return (
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
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const List = <T extends object>(props: Props<T>, ref) => {
  const { updateCurrentlyActivePageData } = useContext(AppUpdateContext);

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
