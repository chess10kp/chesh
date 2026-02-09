import { memo } from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  loading?: boolean;
  loadingGames?: boolean;
  loadingRounds?: boolean;
  noGamesFound?: boolean;
}

function Header({ loading, loadingGames, loadingRounds, noGamesFound }: HeaderProps) {
  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1}>
      <Box flexGrow={1}>
        <Text bold color="cyan">Chesh</Text>
      </Box>
      <Box width={25} height={1}>
        <Text color="yellow" dimColor={!(loading || loadingGames || loadingRounds || noGamesFound)}>
          {(loading || loadingGames || loadingRounds)
            ? (loadingGames ? 'Loading games from PGN...' : loadingRounds ? 'Loading rounds...' : 'Loading...')
            : noGamesFound
              ? 'No games found'
              : ' '}
        </Text>
      </Box>
    </Box>
  );
}

export default memo(Header);
