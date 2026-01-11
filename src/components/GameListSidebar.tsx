import { memo } from 'react';
import { Box, Text } from 'ink';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import ScrollView, { truncateText } from './ScrollView.js';

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
        height={18}
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
