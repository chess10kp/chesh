import { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { BroadcastRound } from '../types/index.js';
import { fetchBroadcastRounds } from '../lib/lichess-api.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';

interface RoundsListProps {
  broadcastId: string;
  broadcastName: string;
  onSelectRound: (round: BroadcastRound) => void;
  onBack: () => void;
  token?: string;
}

export default function RoundsList({
  broadcastId,
  broadcastName,
  onSelectRound,
  onBack,
  token,
}: RoundsListProps) {
  const [rounds, setRounds] = useState<BroadcastRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const data = await fetchBroadcastRounds(broadcastId, token);
        setRounds(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchRounds();
  }, [broadcastId, token]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [rounds]);

  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(rounds.length - 1, i + 1));
    } else if (key.return) {
      if (rounds.length === 0) {
        return;
      }
      const selected = rounds[selectedIndex];
      if (selected) {
        onSelectRound(selected);
      }
    } else if (key.escape || input === 'q') {
      onBack();
    } else if (input === 'r') {
      setLoading(true);
      setError(null);
      fetchBroadcastRounds(broadcastId, token)
        .then(data => {
          setRounds(data);
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message);
          setLoading(false);
        });
    }
  });

  if (error) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>
          {broadcastName}
        </Text>
        <Box marginBottom={1}>
          <Text color="gray">
            Select a round:
          </Text>
        </Box>
        {loading ? (
          <Box padding={1} minWidth={40}>
            <Text color="yellow">Loading rounds...</Text>
          </Box>
        ) : rounds.length === 0 ? (
          <Box padding={1} minWidth={40}>
            <Text color="gray">No rounds available</Text>
          </Box>
        ) : (
          rounds.map((round, index) => (
            <Box key={round.id}>
              <Box
                backgroundColor={index === selectedIndex ? defaultTheme.highlight : undefined}
                paddingX={1}
              >
                <Text>
                  {index === selectedIndex ? '▶ ' : '  '}
                  {round.name}
                  {round.finished !== undefined && (
                    <Text color={round.finished ? 'green' : 'yellow'}>
                      {' '}{round.finished ? '(Finished)' : '(Live)'}
                    </Text>
                  )}
                </Text>
              </Box>
            </Box>
          ))
        )}
      </Box>
      <HelpBar shortcuts="[↑/k] Up  [↓/j] Down  [Enter] Select Round  [r] Refresh  [q/Esc] Back" />
    </Box>
  );
}
