import { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { BroadcastRound, LeaderboardPlayer } from '../types/index.js';
import { fetchBroadcastRounds, fetchBroadcastLeaderboard } from '../lib/lichess-api.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';
import ScrollView from './ScrollView.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface RoundsListProps {
  broadcastId: string;
  broadcastName: string;
  onSelectRound: (round: BroadcastRound) => void;
  onBack: () => void;
  token?: string;
  setLoadingRounds?: (loading: boolean) => void;
}

export default function RoundsList({
  broadcastId,
  broadcastName,
  onSelectRound,
  onBack,
  token,
  setLoadingRounds,
}: RoundsListProps) {
  const [rounds, setRounds] = useState<BroadcastRound[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const { height: terminalHeight, width: terminalWidth } = useTerminalSize(150);

  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4;
    const LOCAL_HEADER_HEIGHT = 1;
    const SUBHEADER_HEIGHT = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(5, terminalHeight - APP_HEADER_HEIGHT - LOCAL_HEADER_HEIGHT - SUBHEADER_HEIGHT - PADDING - HELPBAR_HEIGHT);
  }, [terminalHeight]);

  const leaderboardHeight = useMemo(() => {
    return Math.max(5, scrollViewHeight - 2);
  }, [scrollViewHeight]);

  useEffect(() => {
    setLoadingRounds?.(loading);
  }, [loading, setLoadingRounds]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roundsData, leaderboardData] = await Promise.all([
          fetchBroadcastRounds(broadcastId, token),
          fetchBroadcastLeaderboard(broadcastId, token),
        ]);
        setRounds(roundsData);
        setLeaderboard(leaderboardData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [broadcastId, token]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [rounds]);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roundsData, leaderboardData] = await Promise.all([
        fetchBroadcastRounds(broadcastId, token),
        fetchBroadcastLeaderboard(broadcastId, token),
      ]);
      setRounds(roundsData);
      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

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
      refreshData();
    } else if (input === 'l') {
      setShowLeaderboard(s => !s);
    }
  });

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => b.score - a.score);
  }, [leaderboard]);

  const formatScore = (score: number): string => {
    if (Number.isInteger(score)) {
      return score.toString();
    }
    return score.toFixed(1);
  };

  const formatRatingDiff = (diff?: number): string => {
    if (diff === undefined) return '';
    if (diff > 0) return `+${diff}`;
    return diff.toString();
  };

  if (error) {
    return (
      <Box justifyContent="center" padding={2}>
        <Text color="red">❌ Error: {error}</Text>
      </Box>
    );
  }

  const hasLeaderboard = leaderboard.length > 0;
  const showLeaderboardPanel = showLeaderboard && hasLeaderboard && terminalWidth > 60;
  const roundsWidth = showLeaderboardPanel ? Math.floor(terminalWidth * 0.4) : terminalWidth - 4;
  const leaderboardWidth = showLeaderboardPanel ? Math.floor(terminalWidth * 0.55) : 0;

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>
          {broadcastName}
        </Text>
        <Box marginBottom={1}>
          <Text color="gray">
            Select a round:{hasLeaderboard && !showLeaderboardPanel && <Text dimColor> (press l to show leaderboard)</Text>}
          </Text>
        </Box>
        <Box flexDirection="row" height={scrollViewHeight}>
          <Box flexDirection="column" width={roundsWidth}>
            {loading ? null : rounds.length === 0 ? (
              <Box padding={1} minWidth={40}>
                <Text color="gray">No rounds available</Text>
              </Box>
            ) : (
              <ScrollView height={scrollViewHeight} selectedIndex={selectedIndex}>
                {rounds.map((round, index) => (
                  <Box
                    key={round.id}
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
                ))}
              </ScrollView>
            )}
          </Box>

          {showLeaderboardPanel && (
            <Box flexDirection="column" width={leaderboardWidth} marginLeft={2} borderStyle="single" borderColor="gray" paddingX={1}>
              <Text bold color={defaultTheme.accent}>Tournament Standings</Text>
              <Box marginTop={1} flexDirection="column">
                <Box>
                  <Text dimColor>
                    <Text>{' # '}</Text>
                    <Text>{'Player'.padEnd(22)}</Text>
                    <Text>{'Pts'.padStart(5)}</Text>
                    <Text>{'Elo'.padStart(6)}</Text>
                    <Text>{'±'.padStart(5)}</Text>
                  </Text>
                </Box>
                <ScrollView height={leaderboardHeight} selectedIndex={-1}>
                  {sortedLeaderboard.slice(0, 20).map((player, index) => (
                    <Box key={player.fideId || player.name}>
                      <Text>
                        <Text color="gray">{(index + 1).toString().padStart(2)}.</Text>
                        {' '}
                        {player.title && <Text color="yellow">{player.title} </Text>}
                        <Text>{player.name.slice(0, player.title ? 18 : 21).padEnd(player.title ? 18 : 21)}</Text>
                        <Text bold color="green">{formatScore(player.score).padStart(5)}</Text>
                        <Text color="cyan">{player.rating.toString().padStart(6)}</Text>
                        <Text color={player.ratingDiff && player.ratingDiff > 0 ? 'green' : player.ratingDiff && player.ratingDiff < 0 ? 'red' : 'gray'}>
                          {formatRatingDiff(player.ratingDiff).padStart(5)}
                        </Text>
                      </Text>
                    </Box>
                  ))}
                </ScrollView>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <HelpBar shortcuts={`[↑/k] Up  [↓/j] Down  [Enter] Select  [r] Refresh  ${hasLeaderboard ? '[l] Toggle Leaderboard  ' : ''}[q/Esc] Back`} />
    </Box>
  );
}
