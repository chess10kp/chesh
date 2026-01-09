import { useState, useEffect } from 'react';
import { Box } from 'ink';
import BroadcastList from './components/BroadcastList.js';
import RoundsList from './components/RoundsList.js';
import GamesList from './components/GamesList.js';
import GameView from './components/GameView.js';
import Header from './components/Header.js';
import { ViewState, Broadcast, Game } from './types/index.js';
import { streamRoundPGN } from './lib/lichess-api.js';
import { parsePGN } from './lib/pgn-parser.js';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('broadcast-list');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [roundName, setRoundName] = useState<string>('');
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      process.stdout.write('\x1B[2J\x1B[H');
      setResizeKey(prev => prev + 1);
    };

    process.stdout.on('resize', handleResize);

    return () => {
      process.stdout.off('resize', handleResize);
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

  const handleSelectRound = async (round: any) => {
    setLoadingGames(true);
    setRoundName(round.name);

    try {
      const allPgnData: string[] = [];

      await streamRoundPGN(round.id, (pgn: string) => {
        allPgnData.push(pgn);
      }, undefined, 4000);

      const fullPgn = allPgnData.join('\n\n');

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
      <Header loading={loading} loadingGames={loadingGames} />

      {viewState === 'broadcast-list' ? (
        <BroadcastList
          onSelectBroadcast={handleSelectBroadcast}
          setLoading={setLoading}
        />
      ) : viewState === 'rounds-list' && selectedBroadcast ? (
        <RoundsList
          broadcastId={selectedBroadcast.tour.id}
          broadcastName={selectedBroadcast.tour.name}
          onSelectRound={handleSelectRound}
          onBack={handleBackToList}
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
