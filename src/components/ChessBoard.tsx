import { useMemo, memo, useRef } from 'react';
import { Box, Text } from 'ink';
import { getPieceSymbol, renderPixelArtPiece, PieceSize } from '../lib/pieces.js';
import { rgbToInkColor, defaultTheme } from '../lib/themes.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

const CELL_WIDTH = 8;
const PIXEL_ART_CELL_WIDTH = 18;
const SMALL_CELL_WIDTH = 3;

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string };
  flipped?: boolean;
  cursorSquare?: string;
  selectedSquare?: string;
}

interface Square {
  position: string;
  piece: { color: 'white' | 'black'; type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn' } | null;
}

interface CompactSquareProps {
  square: Square;
  isWhiteSquare: boolean;
  isLastMove: boolean;
  isCursor: boolean;
  isSelected: boolean;
}

interface SmallSquareProps {
  square: Square;
  isWhiteSquare: boolean;
  isLastMove: boolean;
  isCursor: boolean;
  isSelected: boolean;
}

interface PixelArtSquareProps {
  square: Square;
  isWhiteSquare: boolean;
  isLastMove: boolean;
  pixelRow: number;
}

const PixelArtSquare = memo(function PixelArtSquare({ square, isWhiteSquare, isLastMove, pixelRow }: PixelArtSquareProps) {
  const PIECE_HEIGHT = 8;
  const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
  const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;

  const pixelRows = square.piece
    ? renderPixelArtPiece(square.piece.color, square.piece.type).split('\n')
    : Array(PIECE_HEIGHT).fill('              ');

  return (
    <Box
      width={PIXEL_ART_CELL_WIDTH}
      justifyContent="flex-start"
      backgroundColor={isLastMove ? defaultTheme.highlight : bgColor}
    >
      <Text color={pieceColor}>{pixelRows[pixelRow]}</Text>
    </Box>
  );
}, (prev, next) => {
  if (prev.pixelRow !== next.pixelRow) return false;
  if (prev.isLastMove !== next.isLastMove) return false;
  if (prev.square.piece?.color !== next.square.piece?.color) return false;
  if (prev.square.piece?.type !== next.square.piece?.type) return false;
  return true;
});

const SmallSquare = memo(function SmallSquare({ square, isWhiteSquare, isLastMove, isCursor, isSelected }: SmallSquareProps) {
  const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
  const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;
  
  let content = ' ';
  if (square.piece) {
    content = getPieceSymbol(square.piece.color, square.piece.type, 'small');
  }

  let effectiveBgColor = bgColor;
  if (isSelected) {
    effectiveBgColor = 'blue';
  } else if (isCursor) {
    effectiveBgColor = 'cyan';
  } else if (isLastMove) {
    effectiveBgColor = defaultTheme.highlight;
  }

  return (
    <Box width={SMALL_CELL_WIDTH} backgroundColor={effectiveBgColor}>
      <Text color={pieceColor}>{content}</Text>
    </Box>
  );
}, (prev, next) => {
  if (prev.isCursor !== next.isCursor) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isLastMove !== next.isLastMove) return false;
  if (prev.square.piece?.color !== next.square.piece?.color) return false;
  if (prev.square.piece?.type !== next.square.piece?.type) return false;
  return true;
});

const CompactSquare = memo(function CompactSquare({ square, isWhiteSquare, isLastMove, isCursor, isSelected }: CompactSquareProps) {
  const bgColor = isWhiteSquare ? rgbToInkColor(defaultTheme.boardWhite) : rgbToInkColor(defaultTheme.boardBlack);
  const pieceColor = square.piece?.color === 'white' ? defaultTheme.pieceWhite : defaultTheme.pieceBlack;
  const symbol = square.piece
    ? getPieceSymbol(square.piece.color, square.piece.type, 'compact')
    : '\n       \n        ';

  let effectiveBgColor = bgColor;
  if (isSelected) {
    effectiveBgColor = 'blue';
  } else if (isCursor) {
    effectiveBgColor = 'cyan';
  } else if (isLastMove) {
    effectiveBgColor = defaultTheme.highlight;
  }

  return (
    <Box
      width={CELL_WIDTH}
      justifyContent="center"
      backgroundColor={effectiveBgColor}
    >
      <Text color={pieceColor}>
        {symbol}
      </Text>
    </Box>
  );
}, (prev, next) => {
  if (prev.isCursor !== next.isCursor) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isLastMove !== next.isLastMove) return false;
  if (prev.square.piece?.color !== next.square.piece?.color) return false;
  if (prev.square.piece?.type !== next.square.piece?.type) return false;
  return true;
});

interface CompactBoardRowProps {
  row: Square[];
  rankIndex: number;
  lastMoveFrom?: string;
  lastMoveTo?: string;
  flipped?: boolean;
}

interface CompactBoardRowPropsWithCursor extends CompactBoardRowProps {
  cursorSquare?: string;
  selectedSquare?: string;
}

const CompactBoardRow = memo(function CompactBoardRow({ row, rankIndex, lastMoveFrom, lastMoveTo, flipped = false, cursorSquare, selectedSquare }: CompactBoardRowPropsWithCursor) {
  const rank = flipped ? rankIndex + 1 : 8 - rankIndex;
  return (
    <Box flexDirection="row">
      <Box width={1} justifyContent="center" paddingRight={1}>
        <Text color="gray">{rank}</Text>
      </Box>
      {row.map((square, fileIndex) => {
        const file = String.fromCharCode(97 + fileIndex);
        const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
        const isLastMove = lastMoveFrom === square.position || lastMoveTo === square.position;
        const isCursor = cursorSquare === square.position;
        const isSelected = selectedSquare === square.position;

        return (
          <CompactSquare
            key={`${file}${8 - rankIndex}`}
            square={square}
            isWhiteSquare={isWhiteSquare}
            isLastMove={isLastMove}
            isCursor={isCursor}
            isSelected={isSelected}
          />
        );
      })}
    </Box>
  );
}, (prev: CompactBoardRowPropsWithCursor, next: CompactBoardRowPropsWithCursor) => {
  if (prev.rankIndex !== next.rankIndex) return false;
  if (prev.cursorSquare !== next.cursorSquare) return false;
  if (prev.selectedSquare !== next.selectedSquare) return false;
  
  const rank = String(8 - prev.rankIndex);
  const prevAffectsRank = prev.lastMoveFrom?.[1] === rank || prev.lastMoveTo?.[1] === rank;
  const nextAffectsRank = next.lastMoveFrom?.[1] === rank || next.lastMoveTo?.[1] === rank;
  
  if (prevAffectsRank !== nextAffectsRank) return false;
  if (nextAffectsRank && (prev.lastMoveFrom !== next.lastMoveFrom || prev.lastMoveTo !== next.lastMoveTo)) return false;
  
  return prev.row.every((s, i) => {
    const ns = next.row[i];
    return s.piece?.color === ns?.piece?.color && s.piece?.type === ns?.piece?.type;
  });
});

interface SmallBoardRowProps {
  row: Square[];
  rankIndex: number;
  lastMoveFrom?: string;
  lastMoveTo?: string;
  flipped?: boolean;
  cursorSquare?: string;
  selectedSquare?: string;
}

const SmallBoardRow = memo(function SmallBoardRow({ row, rankIndex, lastMoveFrom, lastMoveTo, flipped = false, cursorSquare, selectedSquare }: SmallBoardRowProps) {
  const rank = flipped ? rankIndex + 1 : 8 - rankIndex;
  
  return (
    <Box flexDirection="row">
      <Box width={1} justifyContent="center" paddingRight={1}>
        <Text color="gray">{rank}</Text>
      </Box>
      {row.map((square, fileIndex) => {
        const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
        const isLastMove = lastMoveFrom === square.position || lastMoveTo === square.position;
        const isCursor = cursorSquare === square.position;
        const isSelected = selectedSquare === square.position;

        return (
          <SmallSquare
            key={square.position}
            square={square}
            isWhiteSquare={isWhiteSquare}
            isLastMove={isLastMove}
            isCursor={isCursor}
            isSelected={isSelected}
          />
        );
      })}
    </Box>
  );
}, (prev: SmallBoardRowProps, next: SmallBoardRowProps) => {
  if (prev.rankIndex !== next.rankIndex) return false;
  if (prev.cursorSquare !== next.cursorSquare) return false;
  if (prev.selectedSquare !== next.selectedSquare) return false;
  
  const rank = String(8 - prev.rankIndex);
  const prevAffectsRank = prev.lastMoveFrom?.[1] === rank || prev.lastMoveTo?.[1] === rank;
  const nextAffectsRank = next.lastMoveFrom?.[1] === rank || next.lastMoveTo?.[1] === rank;
  
  if (prevAffectsRank !== nextAffectsRank) return false;
  if (nextAffectsRank && (prev.lastMoveFrom !== next.lastMoveFrom || prev.lastMoveTo !== next.lastMoveTo)) return false;
  
  return prev.row.every((s, i) => {
    const ns = next.row[i];
    return s.piece?.color === ns?.piece?.color && s.piece?.type === ns?.piece?.type;
  });
});

interface PixelArtSquareRowProps {
  squares: Square[];
  pixelRow: number;
  rankIndex: number;
  lastMoveFrom?: string;
  lastMoveTo?: string;
}

const PixelArtSquareRow = memo(function PixelArtSquareRow({ squares, pixelRow, rankIndex, lastMoveFrom, lastMoveTo }: PixelArtSquareRowProps) {
  return (
    <Box flexDirection="row">
      {squares.map((square, fileIndex) => {
        const isWhiteSquare = (rankIndex + fileIndex) % 2 === 0;
        const isLastMove = lastMoveFrom === square.position || lastMoveTo === square.position;

        return (
          <PixelArtSquare
            key={`${square.position}-pixel-${pixelRow}`}
            square={square}
            isWhiteSquare={isWhiteSquare}
            isLastMove={isLastMove}
            pixelRow={pixelRow}
          />
        );
      })}
    </Box>
  );
}, (prev, next) => {
  if (prev.pixelRow !== next.pixelRow || prev.rankIndex !== next.rankIndex) {
    return false;
  }
  
  const prevRank = 8 - prev.rankIndex;
  const nextRank = 8 - next.rankIndex;
  
  const prevAffectsThisRank = prev.lastMoveFrom?.[1] === String(prevRank) || prev.lastMoveTo?.[1] === String(prevRank);
  const nextAffectsThisRank = next.lastMoveFrom?.[1] === String(nextRank) || next.lastMoveTo?.[1] === String(nextRank);
  
  if (prevAffectsThisRank !== nextAffectsThisRank) {
    return false;
  }
  
  if (nextAffectsThisRank) {
    if (prev.lastMoveFrom !== next.lastMoveFrom || prev.lastMoveTo !== next.lastMoveTo) {
      return false;
    }
  }
  
  return prev.squares.every((s, i) => {
    const ns = next.squares[i];
    return s.position === ns?.position &&
      s.piece?.color === ns?.piece?.color &&
      s.piece?.type === ns?.piece?.type;
  });
});

interface PixelArtBoardProps {
  squares: Square[][];
  lastMove?: { from: string; to: string };
  flipped?: boolean;
}

const PixelArtBoard = memo(function PixelArtBoard({ squares, lastMove, flipped = false }: PixelArtBoardProps) {
  const PIECE_HEIGHT = 8;
  const lastMoveFrom = lastMove?.from;
  const lastMoveTo = lastMove?.to;
  const fileLabels = flipped ? 'hgfedcba' : 'abcdefgh';

  return (
    <Box flexDirection="column">
      {squares.map((row, rankIndex) => {
        const rank = flipped ? rankIndex + 1 : 8 - rankIndex;

          return (
            <Box key={`rank-${rank}`} flexDirection="column">
              {Array.from({ length: PIECE_HEIGHT }).map((_, pixelRow) => (
                <Box key={`rank-${rank}-pixel-${pixelRow}`} flexDirection="row">
                  {pixelRow === 0 && (
                    <Box width={1} justifyContent="center" paddingRight={1}>
                      <Text color="gray">{rank}</Text>
                    </Box>
                  )}
                  {pixelRow > 0 && <Box width={2} />}
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
        {fileLabels.split('').map((file, i) => (
          <Box key={`${file}-${i}`} width={PIXEL_ART_CELL_WIDTH} justifyContent="center">
            <Text color="gray">{file}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

function ChessBoard({ fen, lastMove, flipped = false, cursorSquare, selectedSquare }: ChessBoardProps) {
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

  const displaySquaresRef = useRef<{ squares: Square[][]; flipped: boolean; result: Square[][] } | null>(null);
  const displaySquares = useMemo(() => {
    // Check if we can reuse cached result
    const cached = displaySquaresRef.current;
    if (cached && cached.squares === squares && cached.flipped === flipped) {
      return cached.result;
    }

    let result: Square[][];
    if (!flipped) {
      result = squares;
    } else {
      result = squares.map(row => [...row].reverse()).reverse();
    }

    displaySquaresRef.current = { squares, flipped, result };
    return result;
  }, [squares, flipped]);

  const fileLabels = flipped ? 'hgfedcba' : 'abcdefgh';

  if (pieceSize === 'pixel-art') {
    return <PixelArtBoard squares={displaySquares} lastMove={lastMove} flipped={flipped} />;
  }

  if (pieceSize === 'small') {
    const lastMoveFrom = lastMove?.from;
    const lastMoveTo = lastMove?.to;
    
    return (
      <Box flexDirection="column">
        {displaySquares.map((row, rankIndex) => {
          const rank = flipped ? rankIndex + 1 : 8 - rankIndex;
          return (
            <SmallBoardRow
              key={`rank-${rank}`}
              row={row}
              rankIndex={rankIndex}
              lastMoveFrom={lastMoveFrom}
              lastMoveTo={lastMoveTo}
              flipped={flipped}
              cursorSquare={cursorSquare}
              selectedSquare={selectedSquare}
            />
          );
        })}
        <Box flexDirection="row">
          <Box width={1} />
          {fileLabels.split('').map((file, i) => (
            <Box key={`${file}-${i}`} width={SMALL_CELL_WIDTH} justifyContent="center">
              <Text color="gray">{file}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  const lastMoveFrom = lastMove?.from;
  const lastMoveTo = lastMove?.to;

  return (
    <Box flexDirection="column">
      {displaySquares.map((row, rankIndex) => {
        const rank = flipped ? rankIndex + 1 : 8 - rankIndex;
        return (
          <CompactBoardRow
            key={`rank-${rank}`}
            row={row}
            rankIndex={rankIndex}
            lastMoveFrom={lastMoveFrom}
            lastMoveTo={lastMoveTo}
            flipped={flipped}
            cursorSquare={cursorSquare}
            selectedSquare={selectedSquare}
          />
        );
      })}
      <Box flexDirection="row">
        <Box width={1} />
        {fileLabels.split('').map((file, i) => (
          <Box key={`${file}-${i}`} width={CELL_WIDTH} justifyContent="center">
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

export default memo(ChessBoard, (prev, next) => {
  if (prev.fen !== next.fen) return false;
  if (prev.lastMove?.from !== next.lastMove?.from) return false;
  if (prev.lastMove?.to !== next.lastMove?.to) return false;
  if (prev.flipped !== next.flipped) return false;
  if (prev.cursorSquare !== next.cursorSquare) return false;
  if (prev.selectedSquare !== next.selectedSquare) return false;
  return true;
});
