import { useMemo, memo, useRef } from 'react';
import { Box, Text } from 'ink';
import { getPieceSymbol, renderPixelArtPiece, PieceSize } from '../lib/pieces.js';
import { rgbToInkColor, defaultTheme } from '../lib/themes.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

const CELL_WIDTH = 8;
const PIXEL_ART_CELL_WIDTH = 18;
const SMALL_CELL_HEIGHT = 3;

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}

interface CompactSquareProps {
  square: Square;
  isWhiteSquare: boolean;
  isLastMove: boolean;
}

const CompactSquare = memo(function CompactSquare({ square, isWhiteSquare, isLastMove }: CompactSquareProps) {
  const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
  console.log(`[CompactSquare] Render ${square.position}`, { piece: square.piece, isWhiteSquare, isLastMove });
  const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;
  const symbol = square.piece
    ? getPieceSymbol(square.piece.color, square.piece.type, 'compact')
    : '\n       \n        ';

  return (
    <Box
      width={CELL_WIDTH}
      justifyContent="center"
      backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
    >
      <Text color={pieceColor}>
        {symbol}
      </Text>
    </Box>
  );
}, (prev, next) => {
  return prev.isWhiteSquare === next.isWhiteSquare &&
    prev.isLastMove === next.isLastMove &&
    prev.square.piece?.color === next.square.piece?.color &&
    prev.square.piece?.type === next.square.piece?.type;
});

interface SmallSquareCellProps {
  square: Square;
  isWhiteSquare: boolean;
  isLastMove: boolean;
  cellRow: number;
}

const SmallSquareCell = memo(function SmallSquareCell({ square, isWhiteSquare, isLastMove, cellRow }: SmallSquareCellProps) {
  const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
  console.log(`[SmallSquareCell] Render ${square.position}`, { piece: square.piece, isWhiteSquare, isLastMove, cellRow });
  const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;
  const isMiddleRow = cellRow === Math.floor(SMALL_CELL_HEIGHT / 2);

  let content = ' '.repeat(CELL_WIDTH);
  if (isMiddleRow && square.piece) {
    const symbol = getPieceSymbol(square.piece.color, square.piece.type, 'small');
    const padding = Math.floor((CELL_WIDTH - 1) / 2);
    content = ' '.repeat(padding) + symbol + ' '.repeat(CELL_WIDTH - padding - 1);
  }

  return (
    <Box
      width={CELL_WIDTH}
      backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
    >
      <Text color={pieceColor}>{content}</Text>
    </Box>
  );
}, (prev, next) => {
  return prev.isWhiteSquare === next.isWhiteSquare &&
    prev.isLastMove === next.isLastMove &&
    prev.square.piece?.color === next.square.piece?.color &&
    prev.square.piece?.type === next.square.piece?.type &&
    prev.cellRow === next.cellRow;
});

interface PixelArtSquareRowProps {
  squares: Square[];
  pixelRow: number;
  rankIndex: number;
  lastMoveFrom?: string;
  lastMoveTo?: string;
}

const PixelArtSquareRow = memo(function PixelArtSquareRow({ squares, pixelRow, rankIndex, lastMoveFrom, lastMoveTo }: PixelArtSquareRowProps) {
  const PIECE_HEIGHT = 8;
  console.log(`[PixelArtSquareRow] Render rank=${8-rankIndex} pixelRow=${pixelRow}`, { squaresCount: squares.length, lastMoveFrom, lastMoveTo });
  return (
    <Box flexDirection="row">
      {squares.map((square, fileIndex) => {
        const file = String.fromCharCode(97 + fileIndex);
        const rank = 8 - rankIndex;
        const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
        const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
        const isLastMove = (lastMoveFrom === square.position || lastMoveTo === square.position);

        const pixelRows = square.piece
          ? renderPixelArtPiece(square.piece.color, square.piece.type).split('\n')
          : Array(PIECE_HEIGHT).fill('              ');

        const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;

        return (
          <Box
            key={`${file}${rank}-pixel-${pixelRow}`}
            width={PIXEL_ART_CELL_WIDTH}
            justifyContent="flex-start"
            backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
          >
            <Text color={pieceColor}>{pixelRows[pixelRow]}</Text>
          </Box>
        );
      })}
    </Box>
  );
}, (prev, next) => {
  return prev.pixelRow === next.pixelRow &&
    prev.rankIndex === next.rankIndex &&
    prev.lastMoveFrom === next.lastMoveFrom &&
    prev.lastMoveTo === next.lastMoveTo &&
    prev.squares.every((s, i) => {
      const ns = next.squares[i];
      return s.position === ns?.position &&
        s.piece?.color === ns?.piece?.color &&
        s.piece?.type === ns?.piece?.type;
    });
});

interface PixelArtBoardProps {
  squares: Square[][];
  lastMove?: { from: string; to: string };
}

const PixelArtBoard = memo(function PixelArtBoard({ squares, lastMove }: PixelArtBoardProps) {
  const PIECE_HEIGHT = 8;
  const lastMoveFrom = lastMove?.from;
  const lastMoveTo = lastMove?.to;

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
                <PixelArtSquareRow
                  key={`rank-${rank}-row-${pixelRow}`}
                  squares={row}
                  pixelRow={pixelRow}
                  rankIndex={rankIndex}
                  lastMoveFrom={lastMoveFrom}
                  lastMoveTo={lastMoveTo}
                />
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
});

function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  const { width: terminalWidth, height: terminalHeight } = useTerminalSize(150);

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
  const prevSquaresRef = useRef<Square[][]>([]);
  
  const squares = useMemo(() => {
    const newSquares = parseFenToSquares(effectiveFen);
    const prevSquares = prevSquaresRef.current;
    
    if (prevSquares.length === 0) {
      prevSquaresRef.current = newSquares;
      return newSquares;
    }
    
    let hasChanges = false;
    const result = newSquares.map((row, rankIndex) => {
      return row.map((square, fileIndex) => {
        const prev = prevSquares[rankIndex]?.[fileIndex];
        if (prev &&
            prev.position === square.position &&
            prev.piece?.color === square.piece?.color &&
            prev.piece?.type === square.piece?.type) {
          return prev;
        }
        hasChanges = true;
        return square;
      });
    });
    
    if (hasChanges) {
      prevSquaresRef.current = result;
    }
    return result;
  }, [effectiveFen]);

  if (pieceSize === 'pixel-art') {
    return <PixelArtBoard squares={squares} lastMove={lastMove} />;
  }

  if (pieceSize === 'small') {
    return (
      <Box flexDirection="column">
        {squares.map((row, rankIndex) => {
          const rank = 8 - rankIndex;
          return (
            <Box key={`rank-${rank}`} flexDirection="column">
              {Array.from({ length: SMALL_CELL_HEIGHT }).map((_, cellRow) => {
                const isMiddleRow = cellRow === Math.floor(SMALL_CELL_HEIGHT / 2);
                return (
                  <Box key={`rank-${rank}-row-${cellRow}`} flexDirection="row">
                    <Box width={1} justifyContent="center">
                      {isMiddleRow ? <Text color="gray">{rank}</Text> : <Text> </Text>}
                    </Box>
                    {row.map((square, fileIndex) => {
                      const file = String.fromCharCode(97 + fileIndex);
                      const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
                      const isLastMove = !!(lastMove && (lastMove.from === square.position || lastMove.to === square.position));

                      return (
                        <SmallSquareCell
                          key={`${file}${rank}-row-${cellRow}`}
                          square={square}
                          isWhiteSquare={isWhiteSquare}
                          isLastMove={isLastMove}
                          cellRow={cellRow}
                        />
                      );
                    })}
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
            const isLastMove = !!(lastMove && (lastMove.from === square.position || lastMove.to === square.position));

            return (
              <CompactSquare
                key={`${file}${8 - rankIndex}`}
                square={square}
                isWhiteSquare={isWhiteSquare}
                isLastMove={isLastMove}
              />
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
