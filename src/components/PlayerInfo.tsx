import { memo } from 'react';
import { Box, Text } from 'ink';
import { BroadcastPlayer } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';

interface PlayerInfoProps {
  player: BroadcastPlayer;
  isWhite: boolean;
  isActive: boolean;
}

function PlayerInfo({ player, isWhite, isActive }: PlayerInfoProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="row">
        <Text color={defaultTheme.pieceWhite}>
          {isWhite ? '⬜' : '⬛'}{' '}
        </Text>
        {player.title && (
          <Text color="yellow" bold>{player.title} </Text>
        )}
        <Text color={defaultTheme.pieceWhite}>{player.name}</Text>
        <Text color="gray"> ({player.rating})</Text>
      </Box>
      {player.clock !== undefined && (
        <Box paddingLeft={2}>
          <Text color={isActive ? 'yellow' : 'gray'}>
            ⏱️ {formatClock(player.clock)}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function formatClock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default memo(PlayerInfo);
