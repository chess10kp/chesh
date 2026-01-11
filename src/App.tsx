import { useState, useEffect } from 'react';
import { Box, useApp, useInput } from 'ink';
import BroadcastList from './components/BroadcastList.js';
import RoundsList from './components/RoundsList.js';
import GamesList from './components/GamesList.js';
import GameView from './components/GameView.js';
import Header from './components/Header.js';
import { ViewState, Broadcast, Game } from './types/index.js';
import { streamRoundPGN } from './lib/lichess-api.js';
import { parsePGN } from './lib/pgn-parser.js';
import { getRoundPGNCache, setRoundPGNCache } from './lib/cache.js';
import { BroadcastRound } from './types/index.js';

export default function App() {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' && key.ctrl) {
      exit();
    }
  });

  const [viewState, setViewState] = useState<ViewState>('broadcast-list');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [roundName, setRoundName] = useState<string>('');
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    const resizeTimeoutRef = { current: null as NodeJS.Timeout | null };
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        process.stdout.write('\x1B[2J\x1B[H');
        setResizeKey(prev => prev + 1);
      }, 100);
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    resizeKey;
  }, [resizeKey]);

  const handleBackToList = () => {
    setSelectedGame(null);
    setSelectedBroadcast(null);
    setViewState('broadcast-list');
  };

  const handleSelectBroadcast = (broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setViewState('rounds-list');
  };

  const handleBackToRounds = () => {
    setSelectedGame(null);
    setGames([]);
    setViewState('rounds-list');
  };

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setViewState('game-view');
  };

  const handleGameSelectInView = (game: Game) => {
    setSelectedGame(game);
  };

  const handleSelectRound = async (round: BroadcastRound) => {
    setLoadingGames(true);
    setRoundName(round.name);

    try {
      let fullPgn = '';

      if (round.finished) {
        const cached = await getRoundPGNCache(round.id);
        if (cached) {
          fullPgn = cached.pgn;
        }
      }

      if (!fullPgn) {
        const allPgnData: string[] = [];

        await streamRoundPGN(round.id, (pgn: string) => {
          allPgnData.push(pgn);
        }, undefined, 4000);

        fullPgn = allPgnData.join('\n\n');

        if (round.finished && fullPgn.length > 0 && selectedBroadcast) {
          await setRoundPGNCache({
            roundId: round.id,
            roundName: round.name,
            broadcastId: selectedBroadcast.tour.id,
            broadcastName: selectedBroadcast.tour.name,
            pgn: fullPgn,
            finishedAt: Date.now(),
          });
        }
      }

      if (fullPgn.length === 0) {
        setGames([]);
        setLoadingGames(false);
        return;
      }

      const parsedGames = parsePGN(fullPgn);

      if (parsedGames.length > 0) {
        setGames(parsedGames);
        setViewState('games-list');
      } else {
        setGames([]);
      }
    } catch (err: any) {
      setGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Header loading={loading} loadingGames={loadingGames} loadingRounds={loadingRounds} />

      {viewState === 'broadcast-list' ? (
        <BroadcastList
          onSelectBroadcast={handleSelectBroadcast}
          setLoading={setLoading}
          onQuit={exit}
        />
      ) : viewState === 'rounds-list' && selectedBroadcast ? (
        <RoundsList
          broadcastId={selectedBroadcast.tour.id}
          broadcastName={selectedBroadcast.tour.name}
          onSelectRound={handleSelectRound}
          onBack={handleBackToList}
          setLoadingRounds={setLoadingRounds}
        />
      ) : viewState === 'games-list' ? (
        <GamesList
          games={games}
          roundName={roundName}
          onSelectGame={handleSelectGame}
          onBack={handleBackToRounds}
        />
      ) : selectedGame ? (
        <GameView game={selectedGame} games={games} onBack={handleBackToRounds} onGameSelect={handleGameSelectInView} />
      ) : null}
    </Box>
  );
}
