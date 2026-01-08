import { Box, Text } from 'ink';

interface MoveHistoryProps {
  moves?: string;
  currentMoveIndex?: number;
}

export default function MoveHistory({ moves, currentMoveIndex }: MoveHistoryProps) {
  if (!moves) {
    return (
      <Box flexDirection="column" borderStyle="single" paddingX={1}>
        <Text bold color="gray">Move History:</Text>
        <Text color="gray">No moves yet</Text>
      </Box>
    );
  }

  const movePairs = parsePGN(moves);

  return (
    <Box flexDirection="column" borderStyle="single" paddingX={1}>
      <Text bold color="gray">Move History:</Text>
      <Box flexDirection="column">
        {movePairs.map((pair, index) => {
          const whiteMoveNum = index * 2 + 1;
          const blackMoveNum = index * 2 + 2;
          const isWhiteActive = currentMoveIndex === whiteMoveNum;
          const isBlackActive = currentMoveIndex === blackMoveNum;

          return (
            <Box key={index} flexDirection="row" gap={2}>
              <Text color="white">
                {index + 1}.{' '}
                <Text backgroundColor={isWhiteActive ? 'yellow' : undefined}>
                  {pair.white || '...'}
                </Text>
              </Text>
              {pair.black && (
                <Text color="black">
                  <Text backgroundColor={isBlackActive ? 'yellow' : undefined}>
                    {pair.black}
                  </Text>
                </Text>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function parsePGN(moves: string): Array<{ white?: string; black?: string }> {
  const pairs: Array<{ white?: string; black?: string }> = [];
  const moveArray = moves.split(' ').filter(m => m);

  for (let i = 0; i < moveArray.length; i += 2) {
    pairs.push({
      white: moveArray[i],
      black: moveArray[i + 1],
    });
  }

  return pairs;
}
