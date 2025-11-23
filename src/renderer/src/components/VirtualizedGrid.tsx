import { type CSSProperties, type ForwardedRef, type ReactNode, forwardRef, useMemo } from 'react';
import {
  type GridComponents,
  VirtuosoGrid,
  type VirtuosoHandle,
  type ListRange
} from 'react-virtuoso';
import { useDebouncedCallback } from '@tanstack/react-pacer';

type Props<T extends object> = {
  data: T[];
  fixedItemHeight: number;
  fixedItemWidth: number;
  scrollTopOffset?: number;
  itemContent: (index: number, item: T) => ReactNode;
  components?: GridComponents<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scrollerRef?: any;
  useWindowScroll?: boolean;
  style?: CSSProperties;
  noRangeUpdates?: boolean;
  onChange?: (range: ListRange) => void;
  onDebouncedScroll?: (range: ListRange) => void;
};

const PRELOADED_ITEM_THROUGH_VIEWPORT_COUNT = 5;
const Grid = <T extends object>(props: Props<T>, ref) => {
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

  const gridComponents = useMemo(
    () => ({
      List: forwardRef<HTMLDivElement, { style?: CSSProperties; children?: ReactNode }>(
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
      Item: ({ children, ...props }: { children?: ReactNode }) => (
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
      overscan={25}
      useWindowScroll={useWindowScroll}
      components={{ ...gridComponents, ...components }}
      ref={ref}
      initialTopMostItemIndex={{ index: scrollTopOffset ?? 0 }}
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
    />
  );
};

const VirtualizedGrid = forwardRef(Grid) as <T extends object>(
  props: Props<T> & { ref?: ForwardedRef<VirtuosoHandle> }
) => ReturnType<typeof Grid>;

export default VirtualizedGrid;
