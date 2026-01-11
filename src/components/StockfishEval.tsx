import { memo } from 'react';
import { Box, Text } from 'ink';
import { useStockfish } from '../hooks/useStockfish.js';
import { defaultTheme } from '../lib/themes.js';

interface StockfishEvalProps {
  fen: string | undefined;
}

function formatScore(score: number, isMate: boolean, mateIn?: number): string {
  if (isMate && mateIn !== undefined) {
    return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
  }
  const sign = score >= 0 ? '+' : '';
  return `${sign}${score.toFixed(2)}`;
}

function formatMove(move: string): string {
  if (move.length < 4) return move;
  const from = move.substring(0, 2);
  const to = move.substring(2, 4);
  const promotion = move.length > 4 ? `=${move.charAt(4).toUpperCase()}` : '';
  return `${from}-${to}${promotion}`;
}

const EvalBar = memo(function EvalBar({ score, isMate }: { score: number; isMate: boolean }) {
  const barWidth = 20;
  
  let whitePercent: number;
  if (isMate) {
    whitePercent = score > 0 ? 100 : 0;
  } else {
    const clampedScore = Math.max(-10, Math.min(10, score));
    whitePercent = 50 + (clampedScore / 10) * 50;
  }
  
  const whiteBars = Math.round((whitePercent / 100) * barWidth);
  const blackBars = barWidth - whiteBars;
  
  return (
    <Box>
      <Text backgroundColor="white" color="black">
        {'█'.repeat(whiteBars)}
      </Text>
      <Text backgroundColor="gray" color="white">
        {'█'.repeat(blackBars)}
      </Text>
    </Box>
  );
});

const EVAL_HEIGHT = 6;

function StockfishEval({ fen }: StockfishEvalProps) {
  const state = useStockfish(fen, { depth: 20, multiPv: 3 });

  if (state.error) {
    return (
      <Box flexDirection="column" paddingX={1} marginTop={1} height={EVAL_HEIGHT}>
        <Text color="red">⚠ {state.error}</Text>
      </Box>
    );
  }

  if (!state.isReady) {
    return (
      <Box flexDirection="column" paddingX={1} marginTop={1} height={EVAL_HEIGHT}>
        <Text color="yellow">Starting Stockfish...</Text>
      </Box>
    );
  }

  if (!state.evaluation) {
    return (
      <Box flexDirection="column" paddingX={1} marginTop={1} height={EVAL_HEIGHT}>
        <Text color="gray">Analyzing...</Text>
      </Box>
    );
  }

  const { evaluation } = state;
  const scoreStr = formatScore(evaluation.score, evaluation.isMate, evaluation.mateIn);
  const scoreColor = evaluation.score > 0.3 ? 'green' : evaluation.score < -0.3 ? 'red' : 'yellow';

  return (
    <Box flexDirection="column" paddingX={1} marginTop={1} height={EVAL_HEIGHT}>
      <Box marginBottom={1}>
        <Text bold color={defaultTheme.accent}>Engine Evaluation</Text>
        {evaluation.isAnalyzing && <Text color="gray"> (analyzing...)</Text>}
      </Box>

      <Box>
        <EvalBar score={evaluation.score} isMate={evaluation.isMate} />
        <Text> </Text>
        <Text bold color={scoreColor}>{scoreStr}</Text>
        <Text color="gray"> @ depth {evaluation.depth}</Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Best move: </Text>
        <Text bold color="green">{formatMove(evaluation.bestMove)}</Text>
      </Box>
    </Box>
  );
}

export default memo(StockfishEval);
