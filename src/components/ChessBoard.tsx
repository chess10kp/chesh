import { useMemo, memo } from 'react';
import { Box, Text } from 'ink';
import { getPieceSymbol, renderPixelArtPiece, PieceSize } from '../lib/pieces.js';
import { rgbToInkColor, defaultTheme } from '../lib/themes.js';

const CELL_WIDTH = 8;
const PIXEL_ART_CELL_WIDTH = 18;

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}

interface PixelArtBoardProps {
  squares: Square[][];
  lastMove?: { from: string; to: string };
}

function PixelArtBoard({ squares, lastMove }: PixelArtBoardProps) {
  const PIECE_HEIGHT = 8;

  return (
    <Box flexDirection="column">
      {squares.map((row, rankIndex) => {
        const rank = 8 - rankIndex;

        return (
          <Box key={`rank-${rank}`} flexDirection="column">
            {Array.from({ length: PIECE_HEIGHT }).map((_, pixelRow) => (
              <Box key={`rank-${rank}-pixel-${pixelRow}`} flexDirection="row">
                {pixelRow === 0 && (
                  <Box width={1} justifyContent="center">
                    <Text color="gray">{rank}</Text>
                  </Box>
                )}
                {pixelRow > 0 && <Box width={1} />}
                {row.map((square, fileIndex) => {
                  const file = String.fromCharCode(97 + fileIndex);
                  const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
                  const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
                  const isLastMove = lastMove && (lastMove.from === square.position || lastMove.to === square.position);

                  const pixelRows = square.piece
                    ? renderPixelArtPiece(square.piece.color, square.piece.type).split('\n')
                    : Array(PIECE_HEIGHT).fill('              ');

                  const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;

                  return (
                    <Box
                      key={`${file}${rank}`}
                      width={PIXEL_ART_CELL_WIDTH}
                      justifyContent="flex-start"
                      backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
                    >
                      <Text color={pieceColor}>{pixelRows[pixelRow]}</Text>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        );
      })}
      <Box flexDirection="row">
        <Box width={1} />
        {'abcdefgh'.split('').map(file => (
          <Box key={file} width={PIXEL_ART_CELL_WIDTH} justifyContent="center">
            <Text color="gray">{file}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const terminalHeight = process.stdout.rows || 24;
  const terminalWidth = process.stdout.columns || 80;

  const pieceSize = useMemo((): PieceSize => {
    // Medium (compact) board minimum: 75 columns, 27 rows
    // - 1 char rank label + 8 squares × 8 chars = 65 columns, plus padding
    // - 8 ranks × 3 lines per rank (compact pieces) + 3 file label rows = 27 lines
    const COMPACT_MIN_WIDTH = 75;
    const COMPACT_MIN_HEIGHT = 27;

    // Large (pixel-art) board minimum: 155 columns, 64 rows
    // - 1 char rank label + 8 squares × 18 chars = 145 columns, plus padding
    // - 8 ranks × 8 lines per rank (pixel art) + 2 file label rows = 66 lines
    const PIXEL_ART_MIN_WIDTH = 155;
    const PIXEL_ART_MIN_HEIGHT = 64;

    // Check if terminal is large enough for pixel-art board
    if (terminalWidth >= PIXEL_ART_MIN_WIDTH && terminalHeight >= PIXEL_ART_MIN_HEIGHT) {
      return 'pixel-art';
    }

    // Check if terminal is large enough for compact board
    if (terminalWidth >= COMPACT_MIN_WIDTH && terminalHeight >= COMPACT_MIN_HEIGHT) {
      return 'compact';
    }

    // Default to small with normal Unicode pieces
    return 'small';
  }, [terminalHeight, terminalWidth]);

  const effectiveFen = fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const squares = useMemo(() => parseFenToSquares(effectiveFen), [effectiveFen]);

  if (pieceSize === 'pixel-art') {
    return <PixelArtBoard squares={squares} lastMove={lastMove} />;
  }

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
              symbol = pieceSize === 'compact' ? '\n       \n        ' : '';
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
  const fenParts = fen.split(' ');
  const boardState = fenParts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
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
  const color: 'white' | 'black' = char === char.toUpperCase() ? 'white' : 'black';
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

export default memo(ChessBoard);
