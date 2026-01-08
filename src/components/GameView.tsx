import { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import ChessBoard from './ChessBoard.js';
import PlayerInfo from './PlayerInfo.js';
import MoveHistory from './MoveHistory.js';
import { Game } from '../types/index.js';
import { defaultTheme } from '../lib/themes.js';
import HelpBar from './HelpBar.js';

interface GameViewProps {
  game: Game;
  onBack: () => void;
}

export default function GameView({ game, onBack }: GameViewProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(
    game.currentMoveIndex ?? 0
  );

  const whitePlayer = game.players[0];
  const blackPlayer = game.players[1];

  const currentFEN = game.fenHistory?.[currentMoveIndex] ?? game.fen ?? undefined;

  const canGoNext = game.fenHistory ? currentMoveIndex < game.fenHistory.length - 1 : false;
  const canGoPrevious = currentMoveIndex > 0;
  const totalMoves = game.fenHistory ? game.fenHistory.length - 1 : 0;

  const currentMoveNotation = useMemo(() => {
    if (!game.moves) return undefined;
    const moveArray = game.moves.split(' ').filter(m => m);
    return moveArray[currentMoveIndex - 1];
  }, [game.moves, currentMoveIndex]);

  useInput((input, key) => {
    if (input === 'q') {
      onBack();
    } else if (input === 'n' || (key.rightArrow)) {
      if (canGoNext) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      }
    } else if (input === 'p' || (key.leftArrow)) {
      if (canGoPrevious) {
        setCurrentMoveIndex(currentMoveIndex - 1);
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Box borderStyle="single" paddingX={1} marginBottom={1}>
          <Text bold color={defaultTheme.accent}>{game.name}</Text>
          {totalMoves > 0 && (
            <Text color="gray"> - Move {currentMoveIndex} of {totalMoves}</Text>
          )}
        </Box>

        <Box flexDirection="row">
          <Box flexDirection="column" alignItems="flex-end">
            {currentFEN && (
              <ChessBoard fen={currentFEN} lastMove={game.lastMove ? { from: game.lastMove.substring(0, 2), to: game.lastMove.substring(2, 4) } : undefined} />
            )}
          </Box>

          <Box flexDirection="column" width={45} marginLeft={1}>
            {whitePlayer && (
              <PlayerInfo
                player={whitePlayer}
                isWhite={true}
                isActive={game.status === 'playing'}
              />
            )}
            {blackPlayer && (
              <PlayerInfo
                player={blackPlayer}
                isWhite={false}
                isActive={game.status === 'playing'}
              />
            )}

            {currentMoveNotation && (
              <Box marginTop={1} borderStyle="single" paddingX={1}>
                <Text color="gray">Last move: </Text>
                <Text bold color={defaultTheme.accent}>{currentMoveNotation}</Text>
              </Box>
            )}

            <Box marginTop={1} flexGrow={1}>
              <MoveHistory moves={game.moves} currentMoveIndex={currentMoveIndex} />
            </Box>
          </Box>
        </Box>
      </Box>

      <HelpBar shortcuts="[n/→] Next move | [p/←] Prev move | [q] Return" />
    </Box>
  );
}
