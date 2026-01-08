import { parse } from '@mliebelt/pgn-parser';
import { Chess } from 'chess.js';
import { Game, BroadcastPlayer } from '../types/index.js';

export function parsePGN(pgn: string): Game[] {
  try {
    const games: Game[] = [];
    const parsedGames = parse(pgn, { startRule: 'games' }) as { tags: any; moves: any[] }[];

    for (const parsedGame of parsedGames) {
      if (!parsedGame || !parsedGame.tags) continue;

      const game = parseSingleGame(parsedGame);
      if (game) {
        games.push(game);
      }
    }

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
      const chess = new Chess();
      fenHistory.push(chess.fen());

      for (const move of moves) {
        const moveNotation = move.notation?.notation;
        if (moveNotation) {
          const moveResult = chess.move(moveNotation);
          if (moveResult) {
            fenHistory.push(chess.fen());
          }
        }
      }

      fen = fenHistory[fenHistory.length - 1];

      if (chess.isCheckmate()) {
        status = 'mate';
      } else if (chess.isDraw()) {
        status = 'draw';
      } else if (chess.isStalemate()) {
        status = 'stalemate';
      } else if (chess.inCheck()) {
        status = 'playing';
      }

      const result = tags.Result;
      if (result === '1/2-1/2') {
        status = 'draw';
      } else if (result === '1-0' || result === '0-1') {
        status = 'resign';
      } else if (result === '*' && status === 'started') {
        status = 'playing';
      }
    }
  } catch (err) {
    console.error('[pgn-parser] Error processing game:', err);
  }

  const pgnText = formatTagsAsPGN(tags) + '\n\n' + formatMovesAsPGN(moves);
  const moveNotations = formatMovesAsPGN(moves);

  return {
    players,
    fen,
    status,
    pgn: pgnText,
    fenHistory,
    currentMoveIndex: fenHistory.length - 1,
    moves: moveNotations,
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

  const notations: string[] = [];
  for (const move of moves) {
    if (move.notation?.notation) {
      notations.push(move.notation.notation);
    }
  }

  return notations.join(' ');
}

export function parseSinglePGN(pgn: string): Game | null {
  const games = parsePGN(pgn);
  return games.length > 0 ? (games[0] ?? null) : null;
}
