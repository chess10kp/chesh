import { useMemo, memo } from 'react';
import { Box, Text } from 'ink';
import { PIECE_SYMBOLS, PieceColor, PieceType } from '../lib/pieces.js';
import { rgbToInkColor, defaultTheme } from '../lib/themes.js';

interface MiniBoardProps {
  fen: string;
  showLabels?: boolean;
}

interface Square {
  position: string;
  piece: { color: PieceColor; type: PieceType } | null;
}

function parseFenToSquares(fen: string): Square[][] {
  const fenParts = fen.split(' ');
  const boardState = fenParts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  const rows = boardState.split('/');

  return rows.map((row, rowIndex) => {
    const squares: Square[] = [];
    let fileIndex = 0;

    for (const char of row) {
      if (/\d/.test(char)) {
        const emptyCount = parseInt(char);
        for (let i = 0; i < emptyCount; i++) {
          const pos = `${String.fromCharCode(97 + fileIndex)}${8 - rowIndex}`;
          squares.push({ position: pos, piece: null });
          fileIndex++;
        }
      } else {
        const pos = `${String.fromCharCode(97 + fileIndex)}${8 - rowIndex}`;
        const piece = parsePieceChar(char);
        squares.push({ position: pos, piece });
        fileIndex++;
      }
    }
    return squares;
  });
}

function parsePieceChar(char: string): { color: PieceColor; type: PieceType } {
  const color: PieceColor = char === char.toUpperCase() ? 'white' : 'black';
  const pieceChar = char.toLowerCase();
  const typeMap: Record<string, PieceType> = {
    'k': 'king',
    'q': 'queen',
    'r': 'rook',
    'b': 'bishop',
    'n': 'knight',
    'p': 'pawn',
  };
  const type = typeMap[pieceChar] || 'pawn';
  return { color, type };
}

function MiniBoard({ fen, showLabels = false }: MiniBoardProps) {
  const effectiveFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  const squares = useMemo(() => parseFenToSquares(effectiveFen), [effectiveFen]);

  return (
    <Box flexDirection="column">
      {squares.map((row, rankIndex) => {
        const rank = 8 - rankIndex;
        return (
          <Box key={`rank-${rank}`} flexDirection="row">
            {showLabels && (
              <Box width={1}>
                <Text color="gray" dimColor>{rank}</Text>
              </Box>
            )}
            {row.map((square, fileIndex) => {
              const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
              const bgColor = isWhiteSquare 
                ? rgbToInkColor(defaultTheme.boardWhite) 
                : rgbToInkColor(defaultTheme.boardBlack);
              
              let content = ' ';
              if (square.piece) {
                content = PIECE_SYMBOLS[square.piece.color][square.piece.type];
              }
              
              const pieceColor = square.piece?.color === 'white' 
                ? defaultTheme.pieceWhite 
                : defaultTheme.pieceBlack;

              return (
                <Box key={square.position} width={3} backgroundColor={bgColor}>
                  <Text color={pieceColor}>{content}</Text>
                </Box>
              );
            })}
          </Box>
        );
      })}
      {showLabels && (
        <Box flexDirection="row">
          <Box width={1} />
          {'abcdefgh'.split('').map(file => (
            <Box key={file} width={3}>
              <Text color="gray" dimColor>{file}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default memo(MiniBoard, (prev, current) => {
  return prev.fen === current.fen && prev.showLabels === current.showLabels;
});
