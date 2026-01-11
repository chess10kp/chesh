import { memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import ScrollView, { truncateText } from './ScrollView.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface GameListSidebarProps {
  games: Game[];
  selectedIndex: number;
  viewedGameIndex: number;
  hasFocus: boolean;
}

function GameListSidebar({
  games,
  selectedIndex,
  viewedGameIndex,
  hasFocus,
}: GameListSidebarProps) {
  const { height: terminalHeight } = useTerminalSize(150);

  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4; // border (2) + text (1) + marginBottom (1)
    const SIDEBAR_HEADER_HEIGHT = 2;
    const BORDER = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 3;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - SIDEBAR_HEADER_HEIGHT - BORDER - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);
  const maxNameWidth = 35;

  return (
    <Box
      flexDirection="column"
      width={45}
      borderStyle="single"
      borderColor={hasFocus ? 'greenBright' : 'gray'}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color={hasFocus ? 'greenBright' : 'gray'}>
          Games ({games.length})
        </Text>
      </Box>

      <ScrollView
        height={scrollViewHeight}
        selectedIndex={selectedIndex}
      >
        {games.map((game, index) => {
          const white = game.players[0];
          const black = game.players[1];
          const gameTitle = `${white?.name || '?'} vs ${black?.name || '?'}`;
          const isViewed = index === viewedGameIndex;
          const isSelected = index === selectedIndex;

          return (
            <Box key={game.id || index}>
              <Box
                backgroundColor={isSelected ? defaultTheme.highlight : undefined}
                paddingX={1}
                width="100%"
              >
                <Text bold={isViewed}>
                  {truncateText(gameTitle, maxNameWidth)}
                  {game.status && (
                    <Text color="gray"> ({game.status})</Text>
                  )}
                </Text>
              </Box>
            </Box>
          );
        })}
      </ScrollView>
    </Box>
  );
}

export default memo(GameListSidebar);
