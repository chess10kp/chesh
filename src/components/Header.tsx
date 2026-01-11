import { memo } from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  loading?: boolean;
  loadingGames?: boolean;
  loadingRounds?: boolean;
}

function Header({ loading, loadingGames, loadingRounds }: HeaderProps) {
  return (
    <Box borderStyle="single" borderColor="cyan" marginBottom={1} paddingX={1}>
      <Box flexGrow={1}>
        <Text bold color="cyan">Check.sh</Text>
      </Box>
      <Box width={25} height={1}>
        <Text color="yellow" dimColor={!(loading || loadingGames || loadingRounds)}>
          {(loading || loadingGames || loadingRounds)
            ? (loadingGames ? 'Loading games from PGN...' : loadingRounds ? 'Loading rounds...' : 'Loading...')
            : ' '}
        </Text>
      </Box>
    </Box>
  );
}

export default memo(Header);
