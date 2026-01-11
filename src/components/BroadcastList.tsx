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
  setLoading?: (loading: boolean) => void;
  onQuit?: () => void;
}

export default function BroadcastList({ onSelectBroadcast, setLoading, onQuit }: BroadcastListProps) {
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

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(broadcasts.length - 1, i + 1));
    } else if (key.return) {
      if (broadcasts.length === 0) {
        return;
      }

      const selected = broadcasts[selectedIndex];
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
    }
  });

  if (error) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="red">❌ Error: {error}</Text>
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
          {broadcasts.map((broadcast, index) => (
            <Box
              key={broadcast.tour.id}
              backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
              paddingX={1}
            >
              <Text>
                {index === selectedIndex ? '▶ ' : '  '}
                {truncateText(broadcast.tour.name, maxNameWidth)}
                {broadcast.rounds && broadcast.rounds[0] && (
                  <Text color="gray"> - {truncateText(broadcast.rounds[0].name, 20)}</Text>
                )}
              </Text>
            </Box>
          ))}
        </ScrollView>
      </Box>
      <HelpBar shortcuts="[↑/k] Up  [↓/j] Down  [Enter] Select Broadcast  [r] Refresh  [q/Esc] Quit" />
    </Box>
  );
}
