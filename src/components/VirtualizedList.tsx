import React, { ReactNode, useCallback, useState, useEffect, useRef } from 'react';
import { Box, useTheme, List, ListItem, Divider, Skeleton, Typography } from '@mui/material';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { debounce } from 'lodash';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style?: React.CSSProperties) => ReactNode;
  height?: number | string;
  itemHeight?: number;
  emptyMessage?: ReactNode;
  loadingCount?: number;
  isLoading?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  overscanCount?: number;
  withDividers?: boolean;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  virtualize?: boolean;
  itemKey?: (index: number, data: T[]) => string | number;
  onItemsRendered?: (info: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => void;
}

/**
 * VirtualizedList - Efficiently renders large lists with virtualization
 * Automatically switches between virtualized and regular rendering for smaller lists
 */
function VirtualizedList<T>({
  items,
  renderItem,
  height = '100%',
  itemHeight = 72,
  emptyMessage = 'No items to display',
  loadingCount = 5,
  isLoading = false,
  onEndReached,
  endReachedThreshold = 200,
  overscanCount = 5,
  withDividers = false,
  className,
  id,
  style,
  virtualize = true,
  itemKey,
  onItemsRendered,
}: VirtualizedListProps<T>) {
  const theme = useTheme();
  const [isNearBottom, setIsNearBottom] = useState(false);
  const listRef = useRef<FixedSizeList<T[]>>(null);
  
  // Default itemKey function uses index as key
  const getItemKey = itemKey || ((index: number) => index);
  
  // Handle scroll events for detecting when we're near the bottom
  const handleScroll = useCallback(
    debounce(({ scrollOffset, scrollDirection, scrollUpdateWasRequested }: any) => {
      if (!scrollUpdateWasRequested && scrollDirection === 'forward' && onEndReached) {
        const listElement = listRef.current;
        if (listElement) {
          const { outerRef } = listElement;
          const list = outerRef.current as HTMLDivElement;
          const nearBottom = list.scrollHeight - scrollOffset - list.clientHeight < endReachedThreshold;
          
          if (nearBottom && !isNearBottom) {
            setIsNearBottom(true);
            onEndReached();
          } else if (!nearBottom && isNearBottom) {
            setIsNearBottom(false);
          }
        }
      }
    }, 100),
    [isNearBottom, onEndReached, endReachedThreshold]
  );
  
  // Reset nearBottom state when items change
  useEffect(() => {
    setIsNearBottom(false);
  }, [items.length]);
  
  // Render item for virtualized list
  const Row = useCallback(
    ({ index, style, data }: ListChildComponentProps<T[]>) => {
      const item = data[index];
      const content = renderItem(item, index, style);
      
      return (
        <>
          {content}
          {withDividers && index < data.length - 1 && <Divider component="li" />}
        </>
      );
    },
    [renderItem, withDividers]
  );
  
  // Render items while loading
  const renderLoadingItems = () => {
    return Array.from({ length: loadingCount }).map((_, i) => (
      <React.Fragment key={`loading-${i}`}>
        <ListItem sx={{ py: 1.5 }}>
          <Box width="100%">
            <Skeleton variant="rectangular" width="70%" height={24} />
            <Skeleton variant="rectangular" width="40%" height={20} sx={{ mt: 1 }} />
          </Box>
        </ListItem>
        {withDividers && i < loadingCount - 1 && <Divider component="li" />}
      </React.Fragment>
    ));
  };
  
  // Render empty state
  const renderEmpty = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          height: '100%',
          minHeight: 200,
        }}
      >
        {typeof emptyMessage === 'string' ? (
          <Typography color="text.secondary" align="center">
            {emptyMessage}
          </Typography>
        ) : (
          emptyMessage
        )}
      </Box>
    );
  };
  
  // Render regular list without virtualization
  const renderRegularList = () => {
    return (
      <List
        sx={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          p: 0,
          ...style,
        }}
        className={className}
        id={id}
      >
        {items.map((item, index) => (
          <React.Fragment key={getItemKey(index, items as any)}>
            {renderItem(item, index)}
            {withDividers && index < items.length - 1 && <Divider component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  // Render virtualized list with AutoSizer
  const renderVirtualizedList = () => {
    return (
      <AutoSizer disableHeight={typeof height === 'number'}>
        {({ width, height: autoHeight }) => (
          <FixedSizeList
            ref={listRef}
            height={typeof height === 'number' ? height : autoHeight}
            width={width}
            itemSize={itemHeight}
            itemCount={items.length}
            itemData={items as any}
            overscanCount={overscanCount}
            onScroll={handleScroll}
            itemKey={(index, data) => getItemKey(index, data)}
            onItemsRendered={onItemsRendered}
            style={{
              ...style,
              scrollbarWidth: 'thin',
              scrollbarColor: `${theme.palette.divider} transparent`,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.divider,
                borderRadius: '3px',
              },
            }}
            className={className}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    );
  };
  
  if (isLoading) {
    return (
      <List
        sx={{
          width: '100%',
          height,
          overflow: 'hidden',
          p: 0,
          ...style,
        }}
        className={className}
        id={id}
      >
        {renderLoadingItems()}
      </List>
    );
  }
  
  if (!items.length) {
    return renderEmpty();
  }
  
  // Use virtualized list for large data sets, or regular list for smaller ones
  return (
    <Box
      sx={{
        width: '100%',
        height,
        overflow: 'hidden',
      }}
    >
      {virtualize && items.length > 20 ? renderVirtualizedList() : renderRegularList()}
    </Box>
  );
}

export default VirtualizedList;