import { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useBroadcasts } from '../hooks/useBroadcasts.js';
import { Broadcast } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';
import ScrollView, { truncateText } from './ScrollView.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface BroadcastListProps {
  onSelectBroadcast: (broadcast: Broadcast) => void;
  onSelectSavedGames?: () => void;
  setLoading?: (loading: boolean) => void;
  onQuit?: () => void;
  onOpen?: (url: string) => void;
}

export default function BroadcastList({ onSelectBroadcast, onSelectSavedGames, setLoading, onQuit, onOpen }: BroadcastListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { broadcasts, loading, error, refresh } = useBroadcasts();
  const { height: terminalHeight } = useTerminalSize(150);

  // Calculate dynamic height: terminal height - app header (4) - local header (1) - padding (2) - helpbar (3)
  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4; // border (2) + text (1) + marginBottom (1)
    const LOCAL_HEADER_HEIGHT = 1;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - LOCAL_HEADER_HEIGHT - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);

  useEffect(() => {
    if (setLoading) {
      setLoading(loading);
    }
  }, [loading, setLoading]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [broadcasts]);

  const totalItems = broadcasts.length + 1;

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(totalItems - 1, i + 1));
    } else if (key.return) {
      if (selectedIndex === 0) {
        onSelectSavedGames?.();
        return;
      }

      const broadcastIndex = selectedIndex - 1;
      const selected = broadcasts[broadcastIndex];
      if (selected) {
        onSelectBroadcast(selected);
      }
    } else if (key.escape) {
      onQuit?.();
    } else if (input === 'r') {
      refresh();
      if (setLoading) setLoading(true);
    } else if (input === 'q') {
      onQuit?.();
    } else if (input === 'o' && onOpen) {
      if (selectedIndex === 0) return;
      const broadcastIndex = selectedIndex - 1;
      const selected = broadcasts[broadcastIndex];
      if (selected) {
        onOpen(selected.tour.url);
      }
    }
  });

  if (error) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  const maxNameWidth = 50;

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>Available Broadcasts:</Text>
        <ScrollView
          height={scrollViewHeight}
          selectedIndex={selectedIndex}
        >
          <Box
            key="saved-games"
            backgroundColor={selectedIndex === 0 ? defaultTheme.highlight : undefined}
            paddingX={1}
          >
            <Text>
              {selectedIndex === 0 ? '▶ ' : '  '}
              <Text color="magenta" bold>Saved Games</Text>
            </Text>
          </Box>
          {broadcasts.map((broadcast, index) => {
            const itemIndex = index + 1;
            return (
              <Box
                key={broadcast.tour.id}
                backgroundColor={itemIndex === selectedIndex ? defaultTheme.highlight : undefined}
                paddingX={1}
              >
                <Text>
                  {itemIndex === selectedIndex ? '▶ ' : '  '}
                  {truncateText(broadcast.tour.name, maxNameWidth)}
                  {broadcast.rounds && broadcast.rounds[0] && (
                    <Text color="gray"> - {truncateText(broadcast.rounds[0].name, 20)}</Text>
                  )}
                </Text>
              </Box>
            );
          })}
        </ScrollView>
      </Box>
      <HelpBar shortcuts="[↑/k] Up  [↓/j] Down  [Enter] Select  [o] Open in Browser  [r] Refresh  [q/Esc] Quit" />
    </Box>
  );
}
