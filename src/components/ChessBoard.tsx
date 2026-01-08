import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { getPieceSymbol } from '../lib/pieces';
import { rgbToInkColor, defaultTheme } from '../lib/themes';

const CELL_WIDTH = 8;

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}

export default function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const terminalHeight = process.stdout.rows || 24;

  const pieceSize = useMemo(() => {
    const SMALL_TERMINAL_THRESHOLD = 24;
    return terminalHeight < SMALL_TERMINAL_THRESHOLD ? 'small' : 'compact';
  }, [terminalHeight]);

  const effectiveFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const squares = parseFenToSquares(effectiveFen);

  return (
    <Box flexDirection="column">
      {squares.map((row, rankIndex) => {
        return (
          <Box key={`rank-${rankIndex}`} flexDirection="row">
            <Box width={1} justifyContent="center">
              <Text color="gray">{8 - rankIndex}</Text>
            </Box>
            {row.map((square, fileIndex) => {
            const file = String.fromCharCode(97 + fileIndex);
            const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
            const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
            const isLastMove = lastMove && (lastMove.from === square.position || lastMove.to === square.position);

            const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;
            let symbol: string;
            if (square.piece) {
              symbol = getPieceSymbol(square.piece.color, square.piece.type, pieceSize);
            } else {
              symbol = pieceSize === 'compact' ? '\n       \n        ' : ' ';
            }

            return (
              <Box
                key={`${file}${8 - rankIndex}`}
                width={CELL_WIDTH}
                justifyContent="center"
                backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
              >
                <Text color={pieceColor}>
                  {symbol}
                </Text>
              </Box>
            );
            })}
          </Box>
        );
      })}
      <Box flexDirection="row">
        <Box width={1} />
        {'abcdefgh'.split('').map(file => (
          <Box key={file} width={CELL_WIDTH} justifyContent="center">
            <Text color="gray">{file}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function parseFenToSquares(fen: string): Square[][] {
  const boardState = fen.split(' ')[0];
  const rows = boardState.split('/');

  const result = rows.map((row, rowIndex) => {
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

  return result;
}

function parsePieceChar(char: string) {
  const color = char === char.toUpperCase() ? 'white' : 'black';
  const pieceChar = char.toLowerCase();
  const typeMap: Record<string, 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'> = {
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

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}
