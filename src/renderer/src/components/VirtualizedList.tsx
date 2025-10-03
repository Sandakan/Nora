import { type CSSProperties, type ReactNode, forwardRef } from 'react';
import { Virtuoso, type Components, type ListRange, type VirtuosoHandle } from 'react-virtuoso';
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
  onChange?: (range: ListRange) => void;
  onDebouncedScroll?: (range: ListRange) => void;
};

// TODO: Tanstack Virtual cannot be implemented right now due to issues with react 19 compatibility as well as having scrolling and stuttering issues in both dev and production builds.
// type VirtualListProps<T extends object> = {
//   data: T[];
//   fixedItemHeight: number;
//   scrollTopOffset?: number;
//   itemContent: (item: VirtualItem, dataItem: T) => ReactNode;
//   overscan?: number;
//   onChange?: (instance: Virtualizer<HTMLDivElement, Element>, sync: boolean) => void;
//   onDebouncedScroll?: (instance: Virtualizer<HTMLDivElement, Element>, sync: boolean) => void;
// };

// export const VirtualList = <T extends object>(props: VirtualListProps<T>) => {
//   const {
//     data,
//     fixedItemHeight,
//     itemContent,
//     overscan = 25,
//     onChange,
//     onDebouncedScroll,
//     scrollTopOffset = 0
//   } = props;

//   const handleDebouncedScroll = useDebouncedCallback(
//     (instance: Virtualizer<HTMLDivElement, Element>, sync: boolean) => {
//       if (onDebouncedScroll) {
//         onDebouncedScroll(instance, sync);
//       }
//     },
//     { wait: 500 }
//   );

//   const parentRef = useRef<HTMLDivElement | null>(null);
//   const { getTotalSize, getVirtualItems, scrollToOffset } = useVirtualizer({
//     count: data.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => fixedItemHeight,
//     onChange: (instance, sync) => {
//       if (onChange) onChange(instance, sync);
//       handleDebouncedScroll(instance, sync);
//     },
//     overscan
//   });

//   useEffect(() => {
//     if (scrollTopOffset) scrollToOffset(scrollTopOffset);
//   }, [scrollTopOffset, scrollToOffset]);

//   return (
//     <div
//       className="list-container appear-from-bottom h-full flex-1 overflow-auto delay-100"
//       ref={parentRef}
//     >
//       {/* The scrollable element for your list */}
//       {/* The large inner element to hold all of the items */}
//       <div
//         style={{
//           height: `${getTotalSize()}px`,
//           width: '100%',
//           position: 'relative'
//         }}
//       >
//         {/* Only the visible items in the virtualizer, manually positioned to be in view */}
//         {getVirtualItems().map((virtualItem) => {
//           const index = virtualItem.index;
//           const item = itemContent(virtualItem, data[index]);

//           return (
//             <div
//               key={virtualItem.key}
//               style={{
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 width: '100%',
//                 height: `${virtualItem.size}px`,
//                 transform: `translateY(${virtualItem.start}px)`
//               }}
//             >
//               {item}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// const ScrollSeekPlaceholder = ({ height, index }) => (
//   <div
//     style={{
//       height,
//       padding: '8px',
//       boxSizing: 'border-box',
//       overflow: 'hidden'
//     }}
//   >
//     <div
//       style={{
//         background: index % 2 ? '#ccc' : '#eee'
//       }}
//     ></div>
//   </div>
// );

const PRELOADED_ITEM_THROUGH_VIEWPORT_COUNT = 5;
const List = <T extends object>(props: Props<T>, ref) => {
  const {
    data,
    fixedItemHeight,
    scrollTopOffset,
    itemContent,
    components = {},
    scrollerRef,
    useWindowScroll = false,
    style,
    onChange,
    onDebouncedScroll
  } = props;

  const handleDebouncedScroll = useDebouncedCallback(
    (range: ListRange) => {
      if (onDebouncedScroll) {
        onDebouncedScroll(range);
      }
    },
    { wait: 2500 }
  );

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
      data={data}
      overscan={25}
      useWindowScroll={useWindowScroll}
      fixedItemHeight={fixedItemHeight}
      components={{
        // ScrollSeekPlaceholder,
        ...components
      }}
      ref={ref}
      initialTopMostItemIndex={scrollTopOffset}
      scrollerRef={scrollerRef}
      increaseViewportBy={{
        top: fixedItemHeight * PRELOADED_ITEM_THROUGH_VIEWPORT_COUNT,
        bottom: fixedItemHeight * PRELOADED_ITEM_THROUGH_VIEWPORT_COUNT
      }}
      rangeChanged={(range) => {
        // To fix the issue of sending incorrect startIndex due to viewport increase
        // range.startIndex = Math.max(0, range.startIndex);

        if (onChange) onChange(range);
        handleDebouncedScroll(range);
      }}
      itemContent={itemContent}
      skipAnimationFrameInResizeObserver={true}
      // scrollSeekConfiguration={{
      //   enter: (velocity) => Math.abs(velocity) > 1000,
      //   exit: (velocity) => {
      //     const shouldExit = Math.abs(velocity) < 200;
      //     return shouldExit;
      //   }
      // }}
    />
  );
};

const VirtualizedList = forwardRef(List) as <T extends object>(
  props: Props<T> & { ref?: React.ForwardedRef<VirtuosoHandle> }
) => ReturnType<typeof List>;

export default VirtualizedList;
