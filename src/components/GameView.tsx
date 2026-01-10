import { useState, useEffect, useMemo } from 'react';
import { Box, useInput } from 'ink';
import ChessBoard from './ChessBoard.js';
import PlayerInfo from './PlayerInfo.js';
import MoveHistory from './MoveHistory.js';
import GameListSidebar from './GameListSidebar.js';
import StockfishEval from './StockfishEval.js';
import { Game } from '../types/index.js';
import HelpBar from './HelpBar.js';

type FocusArea = 'board' | 'sidebar';

interface GameViewProps {
  game: Game;
  games: Game[];
  onBack: () => void;
  onGameSelect: (game: Game) => void;
}

export default function GameView({ game, games, onBack, onGameSelect }: GameViewProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(
    game.currentMoveIndex ?? 0
  );
  const [focus, setFocus] = useState<FocusArea>('board');
  const [sidebarSelectedIndex, setSidebarSelectedIndex] = useState(0);

  const viewedGameIndex = games.findIndex(g => g.id === game.id);

  useEffect(() => {
    setSidebarSelectedIndex(viewedGameIndex);
  }, [viewedGameIndex]);

  useEffect(() => {
    setCurrentMoveIndex(game.currentMoveIndex ?? 0);
  }, [game.id]);

  const whitePlayer = useMemo(() => game.players[0], [game.players]);
  const blackPlayer = useMemo(() => game.players[1], [game.players]);

  const currentFEN = useMemo(
    () => game.fenHistory?.[currentMoveIndex] ?? game.fen ?? undefined,
    [game.fenHistory, game.fen, currentMoveIndex]
  );

  const canGoNext = useMemo(
    () => game.fenHistory ? currentMoveIndex < game.fenHistory.length - 1 : false,
    [game.fenHistory, currentMoveIndex]
  );
  const canGoPrevious = currentMoveIndex > 0;

  const lastMoveFrom = game.lastMove?.substring(0, 2);
  const lastMoveTo = game.lastMove?.substring(2, 4);
  const lastMove = useMemo(
    () => lastMoveFrom && lastMoveTo ? { from: lastMoveFrom, to: lastMoveTo } : undefined,
    [lastMoveFrom, lastMoveTo]
  );

  useInput((input, key) => {
    if (input === 'q') {
      onBack();
    } else if (input === 'n' || (key.rightArrow)) {
      if (focus === 'board' && canGoNext) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      }
    } else if (input === 'p' || (key.leftArrow)) {
      if (focus === 'board' && canGoPrevious) {
        setCurrentMoveIndex(currentMoveIndex - 1);
      }
    } else if (key.tab) {
      setFocus(prev => prev === 'board' ? 'sidebar' : 'board');
    } else if (focus === 'sidebar') {
      if (key.upArrow || input === 'k') {
        setSidebarSelectedIndex(i => Math.max(0, i - 1));
      } else if (key.downArrow || input === 'j') {
        setSidebarSelectedIndex(i => Math.min(games.length - 1, i + 1));
      } else if (key.return) {
        const selectedGame = games[sidebarSelectedIndex];
        if (selectedGame) {
          onGameSelect(selectedGame);
        }
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>

        <Box flexDirection="row">
          <GameListSidebar
            games={games}
            selectedIndex={sidebarSelectedIndex}
            viewedGameIndex={viewedGameIndex}
            hasFocus={focus === 'sidebar'}
          />

          <Box
            flexDirection="column"
            borderStyle="single"
            borderColor={focus === 'board' ? 'cyan' : 'gray'}
            paddingX={2}
            marginX={1}
          >
            {currentFEN && (
              <ChessBoard fen={currentFEN} lastMove={lastMove} />
            )}
          </Box>

          <Box flexDirection="column" width={45}>
            <Box flexDirection='column' flexGrow={1} marginTop={1}>
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
            </Box>

            <Box marginTop={1} flexGrow={1}>
              <MoveHistory moves={game.moves} currentMoveIndex={currentMoveIndex} />
            </Box>

            <StockfishEval fen={currentFEN} />
          </Box>
        </Box>
      </Box>

      <HelpBar shortcuts={
        focus === 'board'
          ? "[n/→] Next move | [p/←] Prev move | [Tab] Sidebar | [q] Return"
          : "[↑/k] Up | [↓/j] Down | [Enter] Select | [Tab] Board | [q] Return"
      } />
    </Box>
  );
}
