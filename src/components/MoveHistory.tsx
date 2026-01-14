import { memo } from 'react';
import { Box, Text } from 'ink';

interface MoveHistoryProps {
  moves?: string;
  currentMoveIndex?: number;
  analysisStartIndex?: number;
  height?: number;
}

const MAX_DISPLAY_MOVES = 12;

function MoveHistory({ moves, currentMoveIndex = 0, analysisStartIndex = -1, height = 16 }: MoveHistoryProps) {
  if (!moves) {
    return null;
  }

  const movePairs = parsePGN(moves);

  const displayPairs = getDisplayPairs(movePairs, currentMoveIndex);

  return (
      <Box flexDirection="column" borderStyle="single" paddingX={1} paddingY={1} height={height}>
        <Box flexDirection="column">
          {displayPairs.map((pair) => {
            const actualIndex = pair.actualIndex;
            const whiteMoveNum = actualIndex * 2 + 1;
            const blackMoveNum = actualIndex * 2 + 2;
            const isWhiteActive = currentMoveIndex === whiteMoveNum;
            const isBlackActive = currentMoveIndex === blackMoveNum;

            // Determine if moves are analysis moves
            const isWhiteAnalysis = analysisStartIndex >= 0 && whiteMoveNum > analysisStartIndex;
            const isBlackAnalysis = analysisStartIndex >= 0 && blackMoveNum > analysisStartIndex;

            return (
              <Box key={actualIndex} flexDirection="row" gap={2}>
                <Text color="white">
                  {actualIndex + 1}.{' '}
                  <Text
                    backgroundColor={isWhiteActive ? 'yellow' : undefined}
                    color={isWhiteAnalysis ? 'magenta' : undefined}
                    italic={isWhiteAnalysis}
                  >
                    {pair.white || '...'}
                  </Text>
                </Text>
                {pair.black && (
                  <Text color="white">
                    <Text
                      backgroundColor={isBlackActive ? 'yellow' : undefined}
                      color={isBlackAnalysis ? 'magenta' : undefined}
                      italic={isBlackAnalysis}
                    >
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

function getDisplayPairs(
  movePairs: Array<{ white?: string; black?: string }>,
  currentMoveIndex: number
): Array<{ white?: string; black?: string; actualIndex: number }> {
  const pairsWithIndex = movePairs.map((pair, index) => ({ ...pair, actualIndex: index }));

  if (movePairs.length <= MAX_DISPLAY_MOVES) {
    return pairsWithIndex;
  }

  const currentPairIndex = Math.floor((currentMoveIndex - 1) / 2);
  const halfWindow = Math.floor(MAX_DISPLAY_MOVES / 2);

  let startIndex = Math.max(0, currentPairIndex - halfWindow);
  let endIndex = startIndex + MAX_DISPLAY_MOVES;

  if (endIndex > movePairs.length) {
    endIndex = movePairs.length;
    startIndex = Math.max(0, endIndex - MAX_DISPLAY_MOVES);
  }

  return pairsWithIndex.slice(startIndex, endIndex);
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

export default memo(MoveHistory);
