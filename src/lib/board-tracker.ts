import { PgnMove } from '@mliebelt/pgn-types';

interface Piece {
  color: 'w' | 'b';
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
}

export class BoardTracker {
  private board: (Piece | null)[][];

  constructor() {
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
  }

  resetToStartingPosition() {
    const pieceOrder: Piece['type'][] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const boardRow = this.board[row];
        if (!boardRow) continue;

        if (row === 0) {
          boardRow[col] = { color: 'b', type: pieceOrder[col] as Piece['type'] };
        } else if (row === 1) {
          boardRow[col] = { color: 'b', type: 'p' };
        } else if (row === 6) {
          boardRow[col] = { color: 'w', type: 'p' };
        } else if (row === 7) {
          boardRow[col] = { color: 'w', type: pieceOrder[col] as Piece['type'] };
        } else {
          boardRow[col] = null;
        }
      }
    }
  }

  toFEN(): string {
    let fen = '';

    for (let row = 0; row < 8; row++) {
      const boardRow = this.board[row];
      if (!boardRow) continue;

      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = boardRow[col];
        if (piece === null) {
          emptyCount++;
        } else if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }
          const pieceChar = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
          fen += pieceChar;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount.toString();
      }
      if (row < 7) {
        fen += '/';
      }
    }

    fen += ' w KQkq - 0 1';

    return fen;
  }

  applyMove(move: PgnMove, turn: 'w' | 'b'): boolean {
    const { notation } = move;
    const { col, row } = notation;

    if (!col || !row) return false;

    const colIndex = col.charCodeAt(0) - 'a'.charCodeAt(0);
    const rowIndex = 8 - parseInt(row, 10);

    if (colIndex < 0 || colIndex > 7 || rowIndex < 0 || rowIndex > 7) return false;

    const piece: Piece = {
      color: turn,
      type: (notation.fig || 'p').toLowerCase() as Piece['type'],
    };

    for (let r = 0; r < 8; r++) {
      const boardRow = this.board[r];
      if (!boardRow) continue;

      for (let c = 0; c < 8; c++) {
        const boardPiece = boardRow[c];
        if (boardPiece && boardPiece.color === turn && boardPiece.type === piece.type) {
          const targetRow = this.board[rowIndex];
          if (!targetRow) continue;

          boardRow[c] = null;
          targetRow[colIndex] = piece;
          return true;
        }
      }
    }

    const targetRow = this.board[rowIndex];
    if (targetRow) {
      targetRow[colIndex] = piece;
    }
    return true;
  }
}

export function generateFENFromMoves(moves: PgnMove[]): string {
  const tracker = new BoardTracker();
  tracker.resetToStartingPosition();

  for (const move of moves) {
    tracker.applyMove(move, move.turn);
  }

  return tracker.toFEN();
}
