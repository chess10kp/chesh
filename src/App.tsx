import { useState, useCallback } from 'react';
import { Box, useApp, useInput } from 'ink';
import BroadcastList from './components/BroadcastList.js';
import RoundsList from './components/RoundsList.js';
import MultiBoardView from './components/MultiBoardView.js';
import GameView from './components/GameView.js';
import SavedGamesView from './components/SavedGamesView.js';
import Header from './components/Header.js';
import { ViewState, Broadcast, Game } from './types/index.js';
import { streamRoundPGN } from './lib/lichess-api.js';
import { parsePGN } from './lib/pgn-parser.js';
import { getRoundPGNCache, setRoundPGNCache, FavoriteGame } from './lib/cache.js';
import { BroadcastRound } from './types/index.js';
import { openUrl } from './lib/open-url.js';

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
  const [roundSlug, setRoundSlug] = useState<string>('');
  const [roundId, setRoundId] = useState<string>('');
  const [noGamesFound, setNoGamesFound] = useState(false);

  const handleBackToList = useCallback(() => {
    setSelectedGame(null);
    setSelectedBroadcast(null);
    setViewState('broadcast-list');
  }, []);

  const handleSelectBroadcast = useCallback((broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setViewState('rounds-list');
  }, []);

  const handleSelectSavedGames = useCallback(() => {
    setViewState('saved-games');
  }, []);

  const handleBackFromSavedGames = useCallback(() => {
    setViewState('broadcast-list');
  }, []);

  const handleSelectSavedGame = useCallback((favorite: FavoriteGame) => {
    setSelectedGame(favorite.game);
    setGames([favorite.game]);
    setRoundSlug(favorite.roundSlug || '');
    setRoundId(favorite.roundId || '');
    setSelectedBroadcast(favorite.tournamentName ? { tour: { id: '', name: favorite.tournamentName, url: '', tier: 'low' }, rounds: [] } : null);
    setViewState('game-view');
  }, []);

  const handleBackFromSavedGameView = useCallback(() => {
    setSelectedGame(null);
    setGames([]);
    setViewState('saved-games');
  }, []);

  const handleBackToRounds = useCallback(() => {
    setSelectedGame(null);
    setGames([]);
    setViewState('rounds-list');
  }, []);

  const handleSelectGame = useCallback((game: Game) => {
    setSelectedGame(game);
    setViewState('game-view');
  }, []);

  const handleGameSelectInView = useCallback((game: Game) => {
    setSelectedGame(game);
  }, []);

  const handleSelectRound = async (round: BroadcastRound) => {
    setLoadingGames(true);
    setNoGamesFound(false);
    setRoundName(round.name);
    setRoundSlug(round.slug || round.name);
    setRoundId(round.id);

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
        setNoGamesFound(true);
        setLoadingGames(false);
        return;
      }

      const parsedGames = parsePGN(fullPgn);

      if (parsedGames.length > 0) {
        setGames(parsedGames);
        setNoGamesFound(false);
        setViewState('games-list');
      } else {
        setGames([]);
        setNoGamesFound(true);
      }
    } catch (err: any) {
      setGames([]);
      setNoGamesFound(true);
    } finally {
      setLoadingGames(false);
    }
  };

  return (
    <Box flexDirection="column">
      <Header loading={loading} loadingGames={loadingGames} loadingRounds={loadingRounds} noGamesFound={noGamesFound} />

      {viewState === 'broadcast-list' ? (
        <BroadcastList
          onSelectBroadcast={handleSelectBroadcast}
          onSelectSavedGames={handleSelectSavedGames}
          setLoading={setLoading}
          onQuit={exit}
          onOpen={(url: string) => openUrl(url)}
        />
      ) : viewState === 'saved-games' ? (
        <SavedGamesView
          onSelectGame={handleSelectSavedGame}
          onBack={handleBackFromSavedGames}
        />
      ) : viewState === 'rounds-list' && selectedBroadcast ? (
        <RoundsList
          broadcastId={selectedBroadcast.tour.id}
          broadcastName={selectedBroadcast.tour.name}
          broadcast={selectedBroadcast}
          onSelectRound={handleSelectRound}
          onBack={handleBackToList}
          setLoadingRounds={setLoadingRounds}
          onOpen={() => selectedBroadcast && openUrl(selectedBroadcast.tour.url)}
        />
      ) : viewState === 'games-list' ? (
        <MultiBoardView
          games={games}
          roundName={roundName}
          onSelectGame={handleSelectGame}
          onBack={handleBackToRounds}
          onOpen={openUrl}
          tournamentName={selectedBroadcast?.tour.name}
          roundSlug={roundSlug}
          roundId={roundId}
          broadcastId={selectedBroadcast?.tour.id}
        />
      ) : viewState === 'game-view' && selectedGame ? (
        <GameView
          game={selectedGame}
          games={games}
          onBack={selectedBroadcast ? handleBackToRounds : handleBackFromSavedGameView}
          onGameSelect={handleGameSelectInView}
          onOpen={openUrl}
          tournamentName={selectedBroadcast?.tour.name}
          roundSlug={roundSlug}
          roundId={roundId}
        />
      ) : null}
    </Box>
  );
}
