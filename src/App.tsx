import { useState } from 'react';
import { Box, Text } from 'ink';
import BroadcastList from './components/BroadcastList.js';
import RoundsList from './components/RoundsList.js';
import GamesList from './components/GamesList.js';
import GameView from './components/GameView.js';
import { ViewState, Broadcast, Game } from './types/index.js';
import { streamRoundPGN } from './lib/lichess-api.js';
import { parsePGN } from './lib/pgn-parser.js';

export default function App() {
  const [viewState, setViewState] = useState<ViewState>('broadcast-list');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loadingGames, setLoadingGames] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [roundName, setRoundName] = useState<string>('');

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

  const handleSelectRound = async (round: any) => {
    console.log('[App] handleSelectRound START');
    console.log('[App] Setting loadingGames = true');
    setLoadingGames(true);
    setRoundName(round.name);
    console.log('[App] Selecting round:', { id: round.id, name: round.name });

    try {
      const allPgnData: string[] = [];
      console.log('[App] Calling streamRoundPGN with 10s timeout...');

      await streamRoundPGN(round.id, (pgn: string) => {
        allPgnData.push(pgn);
      }, undefined, 4000);

      console.log('[App] Stream complete. Total chunks:', allPgnData.length);

      const fullPgn = allPgnData.join('\n\n');
      console.log('[App] Full PGN length:', fullPgn.length, 'characters');

      if (fullPgn.length === 0) {
        console.error('[App] ERROR: Empty PGN received!');
        setGames([]);
        setLoadingGames(false);
        return;
      }

      console.log('[App] Calling parsePGN...');
      console.log(fullPgn);
      const parsedGames = parsePGN(fullPgn);
      console.log('[App] Parsed', parsedGames.length, 'games');

      if (parsedGames.length > 0) {
        const firstGame = parsedGames[0];
        if (firstGame) {
          console.log('[App] First game players:', firstGame.players.map(p => p.name));
        }
        console.log('[App] Setting games state...');
        setGames(parsedGames);
        console.log('[App] Setting viewState to games-list...');
        setViewState('games-list');
      } else {
        console.error('[App] ERROR: No games parsed!');
        console.error('[App] PGN preview:', fullPgn.substring(0, 300));
        setGames([]);
      }
    } catch (err: any) {
      console.error('[App] ERROR in handleSelectRound:', err.message);
      console.error('[App] Stack:', err.stack);
      setGames([]);
    } finally {
      console.log('[App] Finally: Setting loadingGames = false');
      setLoadingGames(false);
    }
    console.log('[App] handleSelectRound END');
  };

  console.log('[App] Render - viewState:', viewState, 'games:', games.length, 'loadingGames:', loadingGames);

  return (
    <Box flexDirection="column">
      <Box borderStyle="double" borderColor="cyan" paddingX={1}>
        <Text bold color="cyan">
          Check.sh
        </Text>
      </Box>

      {viewState === 'broadcast-list' ? (
        <BroadcastList
          onSelectBroadcast={handleSelectBroadcast}
          loadingGames={loadingGames}
        />
      ) : viewState === 'rounds-list' && selectedBroadcast ? (
        <RoundsList
          broadcastId={selectedBroadcast.tour.id}
          broadcastName={selectedBroadcast.tour.name}
          onSelectRound={handleSelectRound}
          onBack={handleBackToList}
          loadingGames={loadingGames}
        />
      ) : viewState === 'games-list' ? (
        <GamesList
          games={games}
          roundName={roundName}
          onSelectGame={handleSelectGame}
          onBack={handleBackToRounds}
        />
      ) : selectedGame ? (
        <GameView game={selectedGame} onBack={handleBackToRounds} />
      ) : null}
    </Box>
  );
}
