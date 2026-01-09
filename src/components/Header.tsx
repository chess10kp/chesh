import { memo } from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  loading?: boolean;
  loadingGames?: boolean;
}

function Header({ loading, loadingGames }: HeaderProps) {
  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1}>
      <Box flexGrow={1}>
        <Text bold color="cyan">Check.sh</Text>
      </Box>
      {(loading || loadingGames) && (
        <Text color="yellow">
          {loadingGames ? 'Loading games from PGN...' : 'Loading...'}
        </Text>
      )}
    </Box>
  );
}

export default memo(Header);
