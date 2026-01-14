import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { Box, Text, useInput } from "ink";
import ChessBoard from "./ChessBoard.js";
import PlayerInfo from "./PlayerInfo.js";
import MoveHistory from "./MoveHistory.js";
import GameListSidebar from "./GameListSidebar.js";
import StockfishEval from "./StockfishEval.js";
import { Game, BroadcastPlayer } from "../types/index.js";
import HelpBar from "./HelpBar.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import { addFavorite } from "../lib/cache.js";
import { formatBroadcastGameUrl } from "../lib/open-url.js";
import { useAnalysisMode } from "../hooks/useAnalysisMode.js";

type FocusArea = "board" | "sidebar";

interface GameViewProps {
  game: Game;
  games: Game[];
  onBack: () => void;
  onGameSelect: (game: Game) => void;
  onOpen?: (url: string) => void;
  tournamentName?: string;
  roundSlug?: string;
}

// Memoized board container to prevent re-renders when only border color changes
const BoardContainer = memo(
  function BoardContainer({
    focus,
    currentFEN,
    lastMove,
    flipped,
    isAnalyzing,
    cursorSquare,
    selectedSquare,
  }: {
    focus: FocusArea;
    currentFEN: string | undefined;
    lastMove: { from: string; to: string } | undefined;
    flipped: boolean;
    isAnalyzing: boolean;
    cursorSquare?: string;
    selectedSquare?: string;
  }) {
    return (
      <Box
        flexDirection="column"
        borderStyle={focus === "board" ? "single" : "single"}
        borderColor={isAnalyzing ? "magenta" : focus === "board" ? "greenBright" : undefined}
        paddingX={2}
        marginX={1}
      >
        {isAnalyzing && (
          <Box justifyContent="center" marginBottom={1}>
            <Text color="magenta" bold>ANALYSIS MODE</Text>
          </Box>
        )}
        {currentFEN && (
          <ChessBoard 
            fen={currentFEN} 
            lastMove={lastMove} 
            flipped={flipped}
            cursorSquare={isAnalyzing ? cursorSquare : undefined}
            selectedSquare={isAnalyzing ? selectedSquare : undefined}
          />
        )}
      </Box>
    );
  },
  (prev: any, next: any) => {
    // Re-render if focus changes (border visibility)
    if (prev.focus !== next.focus) return false;
    // Also re-render if FEN or lastMove changes
    if (prev.currentFEN !== next.currentFEN) return false;
    if (prev.lastMove?.from !== next.lastMove?.from) return false;
    if (prev.lastMove?.to !== next.lastMove?.to) return false;
    if (prev.flipped !== next.flipped) return false;
    if (prev.isAnalyzing !== next.isAnalyzing) return false;
    if (prev.cursorSquare !== next.cursorSquare) return false;
    if (prev.selectedSquare !== next.selectedSquare) return false;
    return true;
  }
);

// Memoized right panel to prevent re-renders of PlayerInfo, MoveHistory, StockfishEval when focus changes
const RightPanelContainer = memo(
  function RightPanelContainer({
    whitePlayer,
    blackPlayer,
    moves,
    currentMoveIndex,
    game,
    currentFEN,
    flipped,
    analysisStartIndex,
  }: {
    whitePlayer: BroadcastPlayer | undefined;
    blackPlayer: BroadcastPlayer | undefined;
    moves: string | undefined;
    currentMoveIndex: number;
    game: Game;
    currentFEN: string | undefined;
    flipped: boolean;
    analysisStartIndex: number;
  }) {
    const topPlayer = flipped ? whitePlayer : blackPlayer;
    const bottomPlayer = flipped ? blackPlayer : whitePlayer;
    const topIsWhite = flipped;
    const bottomIsWhite = !flipped;

    return (
      <Box flexDirection="column" width={45}>
        <Box flexDirection="column" flexGrow={1} marginTop={1}>
          {topPlayer && (
            <PlayerInfo
              player={topPlayer}
              isWhite={topIsWhite}
              isActive={game.status === "playing"}
            />
          )}
        </Box>

        <Box marginTop={1} flexGrow={1}>
          <MoveHistory 
            moves={moves} 
            currentMoveIndex={currentMoveIndex}
            analysisStartIndex={analysisStartIndex}
          />
        </Box>
        <StockfishEval fen={currentFEN} />

        {bottomPlayer && (
          <PlayerInfo
            player={bottomPlayer}
            isWhite={bottomIsWhite}
            isActive={game.status === "playing"}
          />
        )}
      </Box>
    );
  },
  (prev: any, next: any) => {
    // Only re-render if the actual data changes, not when focus changes
    if (prev.whitePlayer?.name !== next.whitePlayer?.name) return false;
    if (prev.whitePlayer?.rating !== next.whitePlayer?.rating) return false;
    if (prev.whitePlayer?.clock !== next.whitePlayer?.clock) return false;
    if (prev.whitePlayer?.title !== next.whitePlayer?.title) return false;
    if (prev.blackPlayer?.name !== next.blackPlayer?.name) return false;
    if (prev.blackPlayer?.rating !== next.blackPlayer?.rating) return false;
    if (prev.blackPlayer?.clock !== next.blackPlayer?.clock) return false;
    if (prev.blackPlayer?.title !== next.blackPlayer?.title) return false;
    if (prev.moves !== next.moves) return false;
    if (prev.currentMoveIndex !== next.currentMoveIndex) return false;
    if (prev.currentFEN !== next.currentFEN) return false;
    if (prev.game.status !== next.game.status) return false;
    if (prev.flipped !== next.flipped) return false;
    if (prev.analysisStartIndex !== next.analysisStartIndex) return false;
    return true;
  }
);

export default function GameView({
  game,
  games,
  onBack,
  onGameSelect,
  onOpen,
  tournamentName,
  roundSlug,
}: GameViewProps) {
  const [focus, setFocus] = useState<FocusArea>("board");
  const [sidebarSelectedIndex, setSidebarSelectedIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "exists">(
    "idle"
  );
  const [flipped, setFlipped] = useState(false);
  const lastInputTime = useRef(0);
  const INPUT_DEBOUNCE_MS = 50;

  const { width: terminalWidth, height: terminalHeight } = useTerminalSize(150);
  const isCompactMode = useMemo(() => {
    const COMPACT_MIN_WIDTH = 75;
    const COMPACT_MIN_HEIGHT = 27;
    return (
      terminalWidth < COMPACT_MIN_WIDTH || terminalHeight < COMPACT_MIN_HEIGHT
    );
  }, [terminalWidth, terminalHeight]);

  const viewedGameIndex = useMemo(
    () => games.findIndex((g) => g.id === game.id),
    [games, game.id]
  );

  useEffect(() => {
    setSidebarSelectedIndex(viewedGameIndex);
  }, [viewedGameIndex]);

  const whitePlayer = useMemo(() => game.players[0], [game.players]);
  const blackPlayer = useMemo(() => game.players[1], [game.players]);

  // Analysis mode hook
  const analysis = useAnalysisMode({
    initialFenHistory: game.fenHistory ?? [],
    initialMoveHistory: game.moveHistory ?? [],
    initialMoveIndex: game.currentMoveIndex ?? 0,
    flipped,
  });

  // Reset analysis when game changes
  useEffect(() => {
    if (analysis.state.isAnalyzing) {
      analysis.exitAnalysis();
    }
    analysis.goToMove(game.currentMoveIndex ?? 0);
  }, [game.id]);

  const currentFEN = analysis.currentFen;
  const currentMoveIndex = analysis.state.currentMoveIndex;

  // Compute canGoNext and canGoPrevious based on analysis state
  const { isAnalyzing, analysisStartIndex, analysisMoves } = analysis.state;
  const canGoNext = useMemo(() => {
    if (isAnalyzing) {
      const maxIndex = analysisStartIndex + analysisMoves.length;
      return currentMoveIndex < maxIndex;
    }
    return game.fenHistory ? currentMoveIndex < game.fenHistory.length - 1 : false;
  }, [game.fenHistory, currentMoveIndex, isAnalyzing, analysisStartIndex, analysisMoves.length]);

  const canGoPrevious = currentMoveIndex > 0;

  // Memoize the shortcuts text to prevent HelpBar re-renders
  const boardShortcuts = useMemo(() => {
    if (isAnalyzing) {
      return `[Arrows] Move cursor | [Enter] Select | [n/p] Nav | [f] Flip | [Esc] Exit analysis`;
    }
    return `[a] Analyze | [n/→] Next | [p/←] Prev | [f] Flip | [s] Save | [o] Open | [Tab] Sidebar | [q] Return${
      saveStatus === "saved"
        ? " ✓ Saved!"
        : saveStatus === "exists"
        ? " (already saved)"
        : ""
    }`;
  }, [saveStatus, isAnalyzing]);

  const sidebarShortcuts =
    "[↑/k] Up | [↓/j] Down | [Enter] Select | [Tab] Board | [q] Return";

  const currentShortcuts = useMemo(
    () => (focus === "board" ? boardShortcuts : sidebarShortcuts),
    [focus, boardShortcuts, sidebarShortcuts]
  );

  const lastMoveRef = useRef<{ from: string; to: string } | undefined>(
    undefined
  );
  const lastMove = useMemo(() => {
    let newFrom: string | undefined;
    let newTo: string | undefined;

    // In analysis mode, use analysis moves if applicable
    if (isAnalyzing && currentMoveIndex > analysisStartIndex) {
      const analysisIdx = currentMoveIndex - analysisStartIndex - 1;
      const analysisMove = analysisMoves[analysisIdx];
      if (analysisMove) {
        newFrom = analysisMove.uci.substring(0, 2);
        newTo = analysisMove.uci.substring(2, 4);
      }
    }

    // If no analysis move, check game history
    if (!newFrom || !newTo) {
      const currentMoveStr = game.moveHistory?.[currentMoveIndex];
      if (currentMoveStr) {
        newFrom = currentMoveStr.substring(0, 2);
        newTo = currentMoveStr.substring(2, 4);
      }
    }

    // No move to show
    if (!newFrom || !newTo) {
      lastMoveRef.current = undefined;
      return undefined;
    }

    // Return cached object if values haven't changed
    if (
      lastMoveRef.current?.from === newFrom &&
      lastMoveRef.current?.to === newTo
    ) {
      return lastMoveRef.current;
    }

    // Create new object only when values actually change
    lastMoveRef.current = { from: newFrom, to: newTo };
    return lastMoveRef.current;
  }, [game.moveHistory, currentMoveIndex, isAnalyzing, analysisStartIndex, analysisMoves]);

  // Combined moves string for display
  const displayMoves = useMemo(() => {
    if (isAnalyzing && analysisMoves.length > 0) {
      return analysis.combinedMoves;
    }
    return game.moves;
  }, [game.moves, isAnalyzing, analysisMoves.length, analysis.combinedMoves]);

  const handleSave = useCallback(() => {
    addFavorite(game).then((added) => {
      setSaveStatus(added ? "saved" : "exists");
      setTimeout(() => setSaveStatus("idle"), 2000);
    });
  }, [game]);

  useInput((input, key) => {
    const now = Date.now();
    if (now - lastInputTime.current < INPUT_DEBOUNCE_MS) {
      return;
    }
    lastInputTime.current = now;

    // Analysis mode input handling
    if (analysis.state.isAnalyzing && focus === "board") {
      // Exit analysis with Escape
      if (key.escape) {
        analysis.exitAnalysis();
        return;
      }

      // Cursor movement with arrow keys
      if (key.upArrow) {
        analysis.moveCursor('up');
        return;
      }
      if (key.downArrow) {
        analysis.moveCursor('down');
        return;
      }
      if (key.leftArrow) {
        analysis.moveCursor('left');
        return;
      }
      if (key.rightArrow) {
        analysis.moveCursor('right');
        return;
      }

      // Select square with Enter
      if (key.return) {
        analysis.selectSquare();
        return;
      }

      // Navigate history with n/p
      if (input === 'n') {
        analysis.nextMove();
        return;
      }
      if (input === 'p') {
        analysis.prevMove();
        return;
      }

      // Flip board
      if (input === 'f') {
        setFlipped((prev) => !prev);
        return;
      }

      // Don't process other keys in analysis mode
      return;
    }

    // Normal mode input handling
    if (input === "q") {
      onBack();
    } else if (input === "a" && focus === "board") {
      // Enter analysis mode
      analysis.enterAnalysis();
    } else if (input === "n" || key.rightArrow) {
      if (focus === "board" && canGoNext) {
        analysis.nextMove();
      }
    } else if (input === "p" || key.leftArrow) {
      if (focus === "board" && canGoPrevious) {
        analysis.prevMove();
      }
    } else if (key.tab) {
      setFocus((prev) => (prev === "board" ? "sidebar" : "board"));
    } else if (input === "s" && focus === "board") {
      handleSave();
    } else if (input === "f" && focus === "board") {
      setFlipped((prev) => !prev);
    } else if ((input === "o" || input === "O") && onOpen) {
      if (game.id) {
        const url = tournamentName && roundSlug
          ? formatBroadcastGameUrl(tournamentName, roundSlug, game.id)
          : `https://lichess.org/${game.id}`;
        onOpen(url);
      }
    } else if (focus === "sidebar") {
      if (key.upArrow || input === "k") {
        setSidebarSelectedIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === "j") {
        setSidebarSelectedIndex((i) => Math.min(games.length - 1, i + 1));
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
        {isCompactMode ? (
          <Box flexDirection="column">
            {(flipped ? whitePlayer : blackPlayer) && (
              <PlayerInfo
                player={(flipped ? whitePlayer : blackPlayer)!}
                isWhite={flipped}
                isActive={game.status === "playing"}
              />
            )}
            <Box flexDirection="column" paddingX={2}>
              {analysis.state.isAnalyzing && (
                <Box justifyContent="center">
                  <Text color="magenta" bold>ANALYSIS MODE</Text>
                </Box>
              )}
              {currentFEN && (
                <ChessBoard 
                  fen={currentFEN} 
                  lastMove={lastMove} 
                  flipped={flipped}
                  cursorSquare={analysis.state.isAnalyzing ? analysis.state.cursorSquare : undefined}
                  selectedSquare={analysis.state.isAnalyzing ? analysis.state.selectedSquare ?? undefined : undefined}
                />
              )}
            </Box>
            {(flipped ? blackPlayer : whitePlayer) && (
              <PlayerInfo
                player={(flipped ? blackPlayer : whitePlayer)!}
                isWhite={!flipped}
                isActive={game.status === "playing"}
              />
            )}
          </Box>
        ) : (
          <Box flexDirection="row">
            <GameListSidebar
              games={games}
              selectedIndex={sidebarSelectedIndex}
              viewedGameIndex={viewedGameIndex}
              hasFocus={focus === "sidebar"}
            />

            <BoardContainer
              focus={focus}
              currentFEN={currentFEN}
              lastMove={lastMove}
              flipped={flipped}
              isAnalyzing={analysis.state.isAnalyzing}
              cursorSquare={analysis.state.isAnalyzing ? analysis.state.cursorSquare : undefined}
              selectedSquare={analysis.state.isAnalyzing ? analysis.state.selectedSquare ?? undefined : undefined}
            />

            <RightPanelContainer
              whitePlayer={whitePlayer}
              blackPlayer={blackPlayer}
              moves={displayMoves}
              currentMoveIndex={currentMoveIndex}
              game={game}
              currentFEN={currentFEN}
              flipped={flipped}
              analysisStartIndex={analysis.state.analysisStartIndex}
            />
          </Box>
        )}
      </Box>

      {!isCompactMode && <HelpBar shortcuts={currentShortcuts} />}
    </Box>
  );
}
