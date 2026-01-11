import { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';
import ScrollView, { truncateText } from './ScrollView.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface GamesListProps {
  games: Game[];
  roundName: string;
  onSelectGame: (game: Game) => void;
  onBack: () => void;
}

export default function GamesList({
  games,
  roundName,
  onSelectGame,
  onBack,
}: GamesListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { height: terminalHeight } = useTerminalSize(150);

  // Calculate dynamic height: terminal height - app header (4) - local header (1) - subheader (2) - padding (2) - helpbar (3)
  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4; // border (2) + text (1) + marginBottom (1)
    const LOCAL_HEADER_HEIGHT = 1;
    const SUBHEADER_HEIGHT = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - LOCAL_HEADER_HEIGHT - SUBHEADER_HEIGHT - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(games.length - 1, i + 1));
    } else if (key.return) {
      if (games.length === 0) {
        return;
      }
      const selectedGame = games[selectedIndex];
      if (selectedGame) {
        onSelectGame(selectedGame);
      }
    } else if (key.escape || input === 'q') {
      onBack();
    }
  });

  const maxNameWidth = 40;

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>
          {roundName}
        </Text>
        <Box marginBottom={1}>
          <Text color="gray">
            Select a game ({games.length} available):
          </Text>
        </Box>
        {games.length === 0 ? (
          <Box padding={1}>
            <Text color="yellow">No games found in PGN</Text>
            <Text color="gray">Press q to return to rounds</Text>
          </Box>
        ) : (
          <ScrollView
            height={scrollViewHeight}
            selectedIndex={selectedIndex}
          >
            {games.map((game, index) => {
              const white = game.players[0];
              const black = game.players[1];
              const gameTitle = truncateText(
                `${white?.name || '?'} vs ${black?.name || '?'}`,
                maxNameWidth
              );

              return (
                <Box
                  key={game.id || index}
                  backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
                  paddingX={1}
                >
                  <Text>
                    {index === selectedIndex ? '▶ ' : '  '}
                    {gameTitle}
                    {game.status && (
                      <Text color="gray"> ({game.status})</Text>
                    )}
                    {game.fen && (
                      <Text color="gray" dimColor> ✓</Text>
                    )}
                  </Text>
                </Box>
              );
            })}
          </ScrollView>
        )}
      </Box>
      <HelpBar shortcuts="[↑/k] Up  [↓/j] Down  [Enter] Select Game  [q/Esc] Back" />
    </Box>
  );
}
