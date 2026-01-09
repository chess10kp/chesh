import React, { useEffect, useRef } from 'react';
import { Box, Text, measureElement } from 'ink';
import { appendFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const logFile = join(homedir(), '.check.sh', 'logs', 'scrollview.log');

function log(msg: string) {
  appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

interface ScrollViewProps {
  children: React.ReactNode;
  height?: number;
  width?: number;
  selectedIndex?: number;
}

type ScrollState = {
  height: number;
  innerHeight: number;
  scrollTop: number;
};

type ScrollAction =
  | { type: 'SET_INNER_HEIGHT'; innerHeight: number }
  | { type: 'SCROLL_DOWN' }
  | { type: 'SCROLL_UP' }
  | { type: 'JUMP_TO_INDEX'; index: number; itemCount: number; rowsPerItem: number };

function reducer(state: ScrollState, action: ScrollAction): ScrollState {
  switch (action.type) {
    case 'SET_INNER_HEIGHT':
      return {
        ...state,
        innerHeight: action.innerHeight
      };

    case 'SCROLL_DOWN':
      return {
        ...state,
        scrollTop: Math.min(
          state.innerHeight - state.height,
          state.scrollTop + 1
        )
      };

    case 'SCROLL_UP':
      return {
        ...state,
        scrollTop: Math.max(0, state.scrollTop - 1)
      };

    case 'JUMP_TO_INDEX': {
      const { index, itemCount, rowsPerItem } = action;
      const totalRows = itemCount * rowsPerItem;
      const indexRow = index * rowsPerItem;
      
      log(`JUMP_TO_INDEX: index=${index}, itemCount=${itemCount}, rowsPerItem=${rowsPerItem}, totalRows=${totalRows}, indexRow=${indexRow}, state.height=${state.height}, state.scrollTop=${state.scrollTop}, state.innerHeight=${state.innerHeight}`);
      
      if (index < 0 || index >= itemCount) {
        log(`  -> OUT OF BOUNDS, returning unchanged state`);
        return state;
      }
      
      const maxScrollTop = Math.max(0, totalRows - state.height);
      let newScrollTop = state.scrollTop;

      const canScrollUp = newScrollTop > 0;
      const canScrollDown = newScrollTop + state.height < totalRows;
      const visibleHeight = state.height - (canScrollUp ? 1 : 0) - (canScrollDown ? 1 : 0);

      log(`  -> maxScrollTop=${maxScrollTop}, canScrollUp=${canScrollUp}, canScrollDown=${canScrollDown}, visibleHeight=${visibleHeight}`);

      if (indexRow < newScrollTop) {
        newScrollTop = indexRow;
        log(`  -> scrolling UP: newScrollTop=${newScrollTop}`);
      } else if (indexRow + rowsPerItem > newScrollTop + visibleHeight) {
        const newCanScrollUp = true;
        const newCanScrollDown = index < itemCount - 1;
        const newVisibleHeight = state.height - (newCanScrollUp ? 1 : 0) - (newCanScrollDown ? 1 : 0);
        newScrollTop = indexRow + rowsPerItem - newVisibleHeight;
        log(`  -> scrolling DOWN: newCanScrollDown=${newCanScrollDown}, newVisibleHeight=${newVisibleHeight}, newScrollTop=${newScrollTop}`);
      } else {
        log(`  -> indexRow ${indexRow} is visible (scrollTop=${newScrollTop}, visibleHeight=${visibleHeight}), no scroll needed`);
      }

      const finalScrollTop = Math.min(Math.max(0, newScrollTop), maxScrollTop);
      log(`  -> final scrollTop=${finalScrollTop}`);

      return {
        ...state,
        scrollTop: finalScrollTop
      };
    }

    default:
      return state;
  }
}

export default function ScrollView({
  children,
  height = 20,
  width,
  selectedIndex,
}: ScrollViewProps) {
  const [state, dispatch] = React.useReducer(reducer, {
    height,
    innerHeight: 0,
    scrollTop: 0
  });

  const innerRef = useRef<React.ElementRef<typeof Box>>(null);

  useEffect(() => {
    if (innerRef.current) {
      const dimensions = measureElement(innerRef.current);
      dispatch({
        type: 'SET_INNER_HEIGHT',
        innerHeight: dimensions.height
      });
    }
  }, [children]);

  const itemCount = React.Children.count(children);
  const rowsPerItem = itemCount > 0 ? Math.ceil(state.innerHeight / itemCount) : 1;

  useEffect(() => {
    if (selectedIndex !== undefined && state.innerHeight > 0) {
      dispatch({
        type: 'JUMP_TO_INDEX',
        index: selectedIndex,
        itemCount,
        rowsPerItem
      });
    }
  }, [selectedIndex, itemCount, state.innerHeight, rowsPerItem]);

  const canScrollUp = state.scrollTop > 0;
  const canScrollDown = state.scrollTop + state.height < state.innerHeight;

  return (
    <Box flexDirection="column" height={height} width={width}>
      {canScrollUp && (
        <Box>
          <Text dimColor>↑</Text>
        </Box>
      )}

      <Box
        height={state.height - (canScrollUp ? 1 : 0) - (canScrollDown ? 1 : 0)}
        flexDirection="column"
        overflow="hidden"
      >
        <Box
          ref={innerRef}
          flexShrink={0}
          flexDirection="column"
          marginTop={-state.scrollTop}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<any>, {
                ...(typeof child.props === 'object' && child.props !== null && {
                  isSelected: index === selectedIndex,
                }),
              });
            }
            return child;
          })}
        </Box>
      </Box>

      {canScrollDown && (
        <Box>
          <Text dimColor>↓</Text>
        </Box>
      )}
    </Box>
  );
}

export function truncateText(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;
  return text.slice(0, maxWidth - 1) + '…';
}
