import { parse } from '@mliebelt/pgn-parser';
import { Game, BroadcastPlayer } from '../types/index.js';
import { BoardTracker } from './board-tracker.js';

export function parsePGN(pgn: string): Game[] {
  console.log('[pgn-parser] Parsing PGN, length:', pgn.length);

  try {
    const games: Game[] = [];
    const parsedGames = parse(pgn, { startRule: 'games' }) as { tags: any; moves: any[] }[];

    console.log('[pgn-parser] Split into', parsedGames.length, 'potential games');

    for (const parsedGame of parsedGames) {
      if (!parsedGame || !parsedGame.tags) continue;

      const game = parseSingleGame(parsedGame);
      if (game) {
        games.push(game);
      }
    }

    console.log('[pgn-parser] Successfully parsed', games.length, 'games');
    return games;
  } catch (err) {
    console.error('[pgn-parser] Failed to parse PGN:', err);
    return [];
  }
}

function parseSingleGame(parsedGame: { tags: any; moves: any[] }): Game | null {
  const { tags, moves } = parsedGame;
  if (!tags) return null;

  const whiteName = tags.White ?? 'Unknown';
  const blackName = tags.Black ?? 'Unknown';

  console.log('[pgn-parser] Players:', whiteName, 'vs', blackName);

  const whiteElo = parseInt(tags.WhiteElo ?? '0', 10);
  const blackElo = parseInt(tags.BlackElo ?? '0', 10);

  const players: BroadcastPlayer[] = [
    { name: whiteName, rating: whiteElo },
    { name: blackName, rating: blackElo },
  ];

  let fen: string | undefined;
  let status: 'started' | 'playing' | 'aborted' | 'mate' | 'draw' | 'resign' | 'stalemate' | 'timeout' | 'outoftime' = 'started';
  const fenHistory: string[] = [];

  try {
    if (moves && moves.length > 0) {
      const tracker = new BoardTracker();
      tracker.resetToStartingPosition();
      fenHistory.push(tracker.toFEN());

      for (const move of moves) {
        tracker.applyMove(move, move.turn);
        fenHistory.push(tracker.toFEN());
      }

      fen = fenHistory[fenHistory.length - 1];

      const lastMove = moves[moves.length - 1];
      if (lastMove?.notation?.check) {
        if (lastMove.notation.check === '#') {
          status = 'mate';
        } else if (lastMove.notation.check === '+') {
          status = 'playing';
        }
      }

      const result = tags.Result;
      if (result === '1/2-1/2') {
        status = 'draw';
      } else if (result === '1-0' || result === '0-1') {
        status = 'resign';
      } else if (result === '*') {
        status = 'playing';
      }
    }
  } catch (err) {
    console.error('[pgn-parser] Failed to generate FEN or detect status:', err);
  }

  const pgnText = formatTagsAsPGN(tags) + '\n\n' + formatMovesAsPGN(moves);

  return {
    players,
    fen,
    status,
    pgn: pgnText,
    fenHistory,
    currentMoveIndex: fenHistory.length - 1,
  };
}

function formatTagsAsPGN(tags: any): string {
  const tagKeys = Object.keys(tags);
  const tagLines = tagKeys
    .filter(key => key !== 'messages')
    .map(key => `[${key} "${tags[key]}"]`);

  return tagLines.join('\n');
}

function formatMovesAsPGN(moves: any[]): string {
  if (!moves || moves.length === 0) return '';

  let pgn = '';
  for (const move of moves) {
    if (move.moveNumber && move.turn === 'w') {
      pgn += move.moveNumber + '. ';
    }
    pgn += move.notation.notation + ' ';
  }

  return pgn.trim();
}

export function parseSinglePGN(pgn: string): Game | null {
  const games = parsePGN(pgn);
  return games.length > 0 ? (games[0] ?? null) : null;
}
