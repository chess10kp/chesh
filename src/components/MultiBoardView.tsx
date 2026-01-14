import { useState, useMemo, useEffect, memo } from "react";
import { Box, Text, useInput } from "ink";
import { Game, LeaderboardPlayer } from "../types/index.js";
import { defaultTheme } from "../lib/themes.js";
import { useTerminalSize } from "../hooks/useTerminalSize.js";
import MiniBoard from "./MiniBoard.js";
import HelpBar from "./HelpBar.js";
import ScrollView, { truncateText } from "./ScrollView.js";
import { formatBroadcastGameUrl } from "../lib/open-url.js";
import { fetchBroadcastLeaderboard } from "../lib/lichess-api.js";

interface MultiBoardViewProps {
  games: Game[];
  roundName: string;
  onSelectGame: (game: Game) => void;
  onBack: () => void;
  onOpen?: (url: string) => void;
  tournamentName?: string;
  roundSlug?: string;
  broadcastId?: string;
}

const MINI_BOARD_WIDTH = 25;
const BOARD_PADDING = 2;
const MIN_WIDTH_FOR_MULTI_BOARD = 60;
const MIN_HEIGHT_FOR_MULTI_BOARD = 20;

const GameCardContent = memo(
  ({
    game,
    maxNameWidth,
  }: {
    game: Game;
    maxNameWidth: number;
  }) => {
    const white = game.players[0];
    const black = game.players[1];

    const whiteName = truncateText(
      `${white?.title ? white.title + " " : ""}${white?.name || "?"}`,
      maxNameWidth
    );
    const blackName = truncateText(
      `${black?.title ? black.title + " " : ""}${black?.name || "?"}`,
      maxNameWidth
    );

    const resultText =
      game.status === "mate" || game.status === "resign"
        ? game.winner === "white"
          ? "1-0"
          : "0-1"
        : game.status === "draw" || game.status === "stalemate"
        ? "½-½"
        : game.status === "playing" || game.status === "started"
        ? "..."
        : "";

    return (
      <>
        <Box flexDirection="row" justifyContent="space-between">
          <Text color={defaultTheme.text} bold>
            {whiteName}
          </Text>
          <Text color="gray">{white?.rating || ""}</Text>
        </Box>

        <MiniBoard
          fen={game.fen || "rnbqkbnr/pppppppp/8/8/8/PPPPPPPP/RNBQKBNR"}
        />

        <Box flexDirection="row" justifyContent="space-between">
          <Text color={defaultTheme.text} bold>
            {blackName}
          </Text>
          <Text color="gray">{black?.rating || ""}</Text>
        </Box>

        {resultText && (
          <Box justifyContent="center">
            <Text color={defaultTheme.accent}>{resultText}</Text>
          </Box>
        )}
      </>
    );
  },
  (prev, current) => {
    return prev.game.id === current.game.id;
  }
);

function GameCard({
  game,
  isSelected,
  maxNameWidth,
}: {
  game: Game;
  isSelected: boolean;
  maxNameWidth: number;
}) {
  return (
    <Box
      flexDirection="column"
      borderStyle={isSelected ? "bold" : "single"}
      borderColor={isSelected ? defaultTheme.accent : "gray"}
      paddingX={1}
    >
      <GameCardContent game={game} maxNameWidth={maxNameWidth} />
    </Box>
  );
}

function ListView({
  games,
  selectedIndex,
  scrollViewHeight,
  maxNameWidth,
}: {
  games: Game[];
  selectedIndex: number;
  scrollViewHeight: number;
  maxNameWidth: number;
}) {
  return (
    <ScrollView height={scrollViewHeight} selectedIndex={selectedIndex}>
      {games.map((game, index) => {
        const white = game.players[0];
        const black = game.players[1];
        const gameTitle = truncateText(
          `${white?.name || "?"} vs ${black?.name || "?"}`,
          maxNameWidth
        );

        return (
          <Box
            key={game.id || index}
            backgroundColor={
              index === selectedIndex ? defaultTheme.highlight : undefined
            }
            paddingX={1}
          >
            <Text>
              {index === selectedIndex ? "▶ " : "  "}
              {gameTitle}
              {game.status && <Text color="gray"> ({game.status})</Text>}
              {game.fen && (
                <Text color="gray" dimColor>
                  {" "}
                  ✓
                </Text>
              )}
            </Text>
          </Box>
        );
      })}
    </ScrollView>
  );
}

function StandingsView({
  leaderboard,
  scrollViewHeight,
}: {
  leaderboard: LeaderboardPlayer[];
  scrollViewHeight: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const sortedLeaderboard = useMemo(() => {
    return [...leaderboard].sort((a, b) => b.score - a.score);
  }, [leaderboard]);

  const visibleCount = scrollViewHeight - 2;
  const visiblePlayers = sortedLeaderboard.slice(
    scrollTop,
    scrollTop + visibleCount
  );
  const canScrollUp = scrollTop > 0;
  const canScrollDown = scrollTop + visibleCount < sortedLeaderboard.length;

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setScrollTop(Math.max(0, scrollTop - 1));
    } else if (key.downArrow || input === "j") {
      setScrollTop(
        Math.max(
          0,
          Math.min(sortedLeaderboard.length - visibleCount, scrollTop + 1)
        )
      );
    }
  });

  const formatScore = (score: number): string => {
    if (Number.isInteger(score)) {
      return score.toString();
    }
    return score.toFixed(1);
  };

  return (
    <Box flexDirection="column" height={scrollViewHeight}>
      <Box>
        <Text dimColor>
          <Text>{" # "}</Text>
          <Text>{"Player".padEnd(18)}</Text>
          <Text>{"Pts".padStart(4)}</Text>
          <Text>{"Elo".padStart(5)}</Text>
        </Text>
      </Box>
      {canScrollUp && (
        <Box>
          <Text dimColor>↑</Text>
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {visiblePlayers.map((player, idx) => (
          <Box key={player.fideId || player.name}>
            <Text>
              <Text color="gray">
                {(scrollTop + idx + 1).toString().padStart(2)}.
              </Text>
              <Text> </Text>
              {player.title && <Text color="yellow">{player.title} </Text>}
              <Text>
                {player.name
                  .slice(0, player.title ? 14 : 17)
                  .padEnd(player.title ? 14 : 17)}
              </Text>
              <Text bold color="green">
                {formatScore(player.score).padStart(4)}
              </Text>
              <Text color="cyan">{player.rating.toString().padStart(5)}</Text>
            </Text>
          </Box>
        ))}
      </Box>
      {canScrollDown && (
        <Box>
          <Text dimColor>↓</Text>
        </Box>
      )}
    </Box>
  );
}

function MultiBoardView({
  games,
  roundName,
  onSelectGame,
  onBack,
  onOpen,
  tournamentName,
  roundSlug,
  broadcastId,
}: MultiBoardViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [forceListView, setForceListView] = useState(false);
  const [focusedPanel, setFocusedPanel] = useState<"games" | "standings">(
    "games"
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize(150);

  const canUseMultiBoardLayout = useMemo(() => {
    return (
      terminalWidth >= MIN_WIDTH_FOR_MULTI_BOARD &&
      terminalHeight >= MIN_HEIGHT_FOR_MULTI_BOARD
    );
  }, [terminalWidth, terminalHeight]);

  useEffect(() => {
    if (!forceListView && canUseMultiBoardLayout) {
      setSelectedIndex(0);
    }
  }, [forceListView, canUseMultiBoardLayout]);

  useEffect(() => {
    if (broadcastId) {
      fetchBroadcastLeaderboard(broadcastId)
        .then(setLeaderboard)
        .catch(() => setLeaderboard([]));
    }
  }, [broadcastId]);

  const useMultiBoardLayout = canUseMultiBoardLayout && !forceListView;

  const boardsPerRow = useMemo(() => {
    if (!useMultiBoardLayout) return 1;
    const availableWidth = terminalWidth - 4;
    return Math.max(
      1,
      Math.floor(availableWidth / (MINI_BOARD_WIDTH + BOARD_PADDING))
    );
  }, [terminalWidth, useMultiBoardLayout]);

  const scrollViewHeight = useMemo(() => {
    const APP_HEADER_HEIGHT = 4;
    const LOCAL_HEADER_HEIGHT = 1;
    const SUBHEADER_HEIGHT = 2;
    const PADDING = 2;
    const HELPBAR_HEIGHT = 1;
    return Math.max(
      5,
      terminalHeight -
        APP_HEADER_HEIGHT -
        LOCAL_HEADER_HEIGHT -
        SUBHEADER_HEIGHT -
        PADDING -
        HELPBAR_HEIGHT
    );
  }, [terminalHeight]);

  const firstRowGames = useMemo(() => {
    if (!useMultiBoardLayout) return [];
    return games.slice(0, boardsPerRow);
  }, [games, boardsPerRow, useMultiBoardLayout]);

  const hasMoreGames = games.length > boardsPerRow;

  const showStandings = focusedPanel === "standings" && leaderboard.length > 0;

  useInput((input, key) => {
    if (key.tab || input === "\t") {
      if (leaderboard.length > 0) {
        setFocusedPanel((prev) => (prev === "games" ? "standings" : "games"));
      }
      return;
    }

    if (showStandings) {
      if (key.escape || input === "q") {
        onBack();
      }
      return;
    }

    if (useMultiBoardLayout) {
      if (key.leftArrow || input === "h") {
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
      } else if (key.rightArrow || input === "l") {
        if (selectedIndex < firstRowGames.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        }
      } else if (input === "t") {
        setForceListView((v) => !v);
      } else if (key.return) {
        const selectedGame = firstRowGames[selectedIndex];
        if (selectedGame) {
          onSelectGame(selectedGame);
        }
      } else if (key.escape || input === "q") {
        onBack();
      } else if ((input === "o" || input === "O") && onOpen) {
        const selectedGame = firstRowGames[selectedIndex];
        if (selectedGame?.id) {
          const url =
            tournamentName && roundSlug
              ? formatBroadcastGameUrl(
                  tournamentName,
                  roundSlug,
                  selectedGame.id
                )
              : `https://lichess.org/${selectedGame.id}`;
          onOpen(url);
        }
      }
    } else {
      if (key.upArrow || input === "k") {
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow || input === "j") {
        setSelectedIndex((i) => Math.min(games.length - 1, i + 1));
      } else if (input === "t" && canUseMultiBoardLayout) {
        setForceListView((v) => !v);
      } else if (key.return) {
        const selectedGame = games[selectedIndex];
        if (selectedGame) {
          onSelectGame(selectedGame);
        }
      } else if (key.escape || input === "q") {
        onBack();
      } else if ((input === "o" || input === "O") && onOpen) {
        const selectedGame = games[selectedIndex];
        if (selectedGame?.id) {
          const url =
            tournamentName && roundSlug
              ? formatBroadcastGameUrl(
                  tournamentName,
                  roundSlug,
                  selectedGame.id
                )
              : `https://lichess.org/${selectedGame.id}`;
          onOpen(url);
        }
      }
    }
  });

  const maxNameWidth = useMultiBoardLayout ? 12 : 40;

  if (games.length === 0) {
    return (
      <Box flexDirection="column" height="100%" padding={1}>
        <Text bold color={defaultTheme.accent}>
          {roundName}
        </Text>
        <Box padding={1}>
          <Text color="yellow">No games found in PGN</Text>
        </Box>
        <Text color="gray">Press q to return to rounds</Text>
        <HelpBar shortcuts="[q/Esc] Back" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      <Box flexDirection="column" flexGrow={1}>
        <Text bold color={defaultTheme.accent}>
          {roundName}
        </Text>
        <Box marginBottom={1}>
          <Text color="gray">
            {games.length} game{games.length !== 1 ? "s" : ""}
          </Text>
        </Box>

        {showStandings ? (
          <Box flexDirection="column" overflow="hidden">
            <Box marginBottom={1}>
              <Text bold color={defaultTheme.accent}>
                Tournament Standings
              </Text>
            </Box>
            <StandingsView
              leaderboard={leaderboard}
              scrollViewHeight={scrollViewHeight}
            />
          </Box>
        ) : useMultiBoardLayout ? (
          <Box flexDirection="column" overflow="hidden">
            <Box flexDirection="row" gap={1}>
              {firstRowGames.map((game, index) => (
                <GameCard
                  key={game.id || index}
                  game={game}
                  isSelected={index === selectedIndex}
                  maxNameWidth={maxNameWidth}
                />
              ))}
            </Box>
            {hasMoreGames && (
              <Box marginTop={1}>
                <Text color="gray">
                  Showing {firstRowGames.length} of {games.length} games. Press
                  [t] for all games.
                </Text>
              </Box>
            )}
          </Box>
        ) : (
          <ListView
            games={games}
            selectedIndex={selectedIndex}
            scrollViewHeight={scrollViewHeight}
            maxNameWidth={maxNameWidth}
          />
        )}
      </Box>
      <HelpBar
        shortcuts={
          showStandings
            ? "[↑/k] Scroll  [↓/j] Scroll  [Tab] Games  [q/Esc] Back"
            : useMultiBoardLayout
            ? `[←/h] [→/l] Navigate  [Enter] Select  [o] Open  [t] List View  ${
                leaderboard.length > 0 ? "[Tab] Standings  " : ""
              }[q/Esc] Back`
            : `[↑/k] Up  [↓/j] Down  [Enter] Select  [o] Open  ${
                canUseMultiBoardLayout ? "[t] Board View  " : ""
              }${leaderboard.length > 0 ? "[Tab] Standings  " : ""}[q/Esc] Back`
        }
      />
    </Box>
  );
}

export default memo(MultiBoardView, (prev, current) => {
  return (
    prev.games.length === current.games.length &&
    prev.roundName === current.roundName &&
    prev.tournamentName === current.tournamentName &&
    prev.roundSlug === current.roundSlug &&
    prev.broadcastId === current.broadcastId
  );
});
