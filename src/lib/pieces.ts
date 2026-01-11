export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type PieceColor = 'white' | 'black';
export type PieceSize = 'small' | 'compact' | 'pixel-art';

const PIECE_PIXELS: Record<PieceType, number[]> = {
  pawn: [47, 57, 46, 56, 35, 45, 55, 65, 44, 54, 43, 53, 32, 42, 52, 62, 21, 31, 41, 51, 61, 71],
  rook: [21, 31, 41, 51, 61, 71, 22, 32, 42, 52, 62, 72, 33, 43, 53, 63, 34, 44, 54, 64, 35, 45, 55, 65, 26, 36, 46, 56, 66, 76, 27, 47, 57, 77],
  bishop: [47, 57, 46, 36, 35, 45, 55, 65, 44, 54, 43, 53, 32, 42, 52, 62, 21, 31, 41, 51, 61, 71],
  knight: [47, 57, 36, 46, 56, 66, 25, 35, 45, 55, 65, 24, 34, 44, 54, 64, 43, 53, 63, 32, 42, 52, 62, 21, 31, 41, 51, 61, 71],
  queen: [47, 57, 26, 46, 56, 76, 25, 35, 45, 55, 65, 75, 34, 44, 54, 64, 43, 53, 32, 42, 52, 62, 21, 31, 41, 51, 61, 71],
  king: [21, 31, 41, 51, 61, 71, 32, 42, 52, 62, 23, 33, 43, 53, 63, 73, 24, 34, 44, 54, 64, 74, 45, 55, 36, 46, 56, 66, 47, 57],
};

function pieceToGrid(type: PieceType): string[][] {
  const grid: string[][] = Array(8).fill(null).map(() => Array(7).fill('  '));
  const pixels = PIECE_PIXELS[type];

  for (const pixel of pixels) {
    const x = Math.floor(pixel / 10) - 1;
    const y = (pixel % 10) - 1;
    if (x >= 0 && x < 7 && y >= 0 && y < 8) {
      // Invert y-axis to render pieces right-side up
      const row = grid[7 - y];
      if (row) {
        row[x] = '██';
      }
    }
  }

  return grid;
}

export const PIECE_GRIDS: Record<PieceColor, Record<PieceType, string[][]>> = {
  white: {
    pawn: pieceToGrid('pawn'),
    rook: pieceToGrid('rook'),
    bishop: pieceToGrid('bishop'),
    knight: pieceToGrid('knight'),
    queen: pieceToGrid('queen'),
    king: pieceToGrid('king'),
  },
  black: {
    pawn: pieceToGrid('pawn'),
    rook: pieceToGrid('rook'),
    bishop: pieceToGrid('bishop'),
    knight: pieceToGrid('knight'),
    queen: pieceToGrid('queen'),
    king: pieceToGrid('king'),
  },
};

export const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '♔',
    queen: '♕',
    rook: '♖',
    bishop: '♗',
    knight: '♘',
    pawn: '♙',
  },
  black: {
    king: '♚',
    queen: '♛',
    rook: '♜',
    bishop: '♝',
    knight: '♞',
    pawn: '♟',
  },
};

export const COMPACT_PIECES: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: '\n    ✚   \n   ███  ',
    queen: '\n    Ψ   \n   ███  ',
    rook: '\n ▙█▟\n ███',
    bishop: '\n    ⭘   \n   ███  ',
    knight: '\n▞█▙\n ██',
    pawn: '\n ▟▙\n ██',
  },
  black: {
    king: '\n    ✚   \n   ███  ',
    queen: '\n    Ψ   \n   ███  ',
    rook: '\n ▙█▟\n ███',
    bishop: '\n    ⭘   \n   ███  ',
    knight: '\n▞█▙\n ██',
    pawn: '\n ▟▙\n ██',
  },
};

export function getPieceSymbol(color: PieceColor, type: PieceType, size: PieceSize = 'small'): string {
  if (size === 'small') {
    return PIECE_SYMBOLS[color][type];
  }
  return COMPACT_PIECES[color][type];
}

export function determinePieceSize(cellHeight: number): PieceSize {
  if (cellHeight < 3) return 'small';
  if (cellHeight < 8) return 'compact';
  return 'pixel-art';
}

export function renderPixelArtPiece(color: PieceColor, type: PieceType): string {
  const grid = PIECE_GRIDS[color][type];

  return grid.map(row =>
    row.map(cell => cell === '██' ? '██' : '  ').join('')
  ).join('\n');
}
