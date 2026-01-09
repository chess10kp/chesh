import { useState, useEffect, useRef, useCallback } from 'react';
import { spawn, ChildProcess } from 'child_process';
import { StockfishEvaluation, StockfishState } from '../types/stockfish.js';

interface UseStockfishOptions {
  depth?: number;
  multiPv?: number;
}

export function useStockfish(fen: string | undefined, options: UseStockfishOptions = {}) {
  const { depth = 20, multiPv = 3 } = options;

  const [state, setState] = useState<StockfishState>({
    evaluation: null,
    isReady: false,
    error: null,
  });

  const processRef = useRef<ChildProcess | null>(null);
  const currentFenRef = useRef<string | undefined>(undefined);

  const parseInfoLine = useCallback((line: string): Partial<StockfishEvaluation> | null => {
    if (!line.startsWith('info') || !line.includes('score')) {
      return null;
    }

    const depthMatch = line.match(/depth (\d+)/);
    const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
    const pvMatch = line.match(/pv (.+)$/);

    if (!scoreMatch || !scoreMatch[1] || !scoreMatch[2]) return null;

    const parsedDepth = depthMatch && depthMatch[1] ? parseInt(depthMatch[1], 10) : 0;
    const scoreType = scoreMatch[1];
    const scoreValue = parseInt(scoreMatch[2], 10);
    const pv = pvMatch && pvMatch[1] ? pvMatch[1].split(' ') : [];

    let score: number;
    let isMate = false;
    let mateIn: number | undefined;

    if (scoreType === 'mate') {
      isMate = true;
      mateIn = scoreValue;
      score = scoreValue > 0 ? 10000 : -10000;
    } else {
      score = scoreValue / 100;
    }

    return {
      score,
      isMate,
      mateIn,
      depth: parsedDepth,
      pv,
      bestMove: pv[0] || '',
    };
  }, []);

  const startAnalysis = useCallback((fenToAnalyze: string) => {
    if (!processRef.current) return;

    const proc = processRef.current;
    proc.stdin?.write('stop\n');
    proc.stdin?.write(`position fen ${fenToAnalyze}\n`);
    proc.stdin?.write(`setoption name MultiPV value ${multiPv}\n`);
    proc.stdin?.write(`go depth ${depth}\n`);

    setState(prev => ({
      ...prev,
      evaluation: prev.evaluation ? { ...prev.evaluation, isAnalyzing: true } : null,
    }));
  }, [depth, multiPv]);

  useEffect(() => {
    let proc: ChildProcess | null = null;

    try {
      proc = spawn('stockfish', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      processRef.current = proc;

      proc.on('error', (err) => {
        setState(prev => ({
          ...prev,
          error: `Failed to start Stockfish: ${err.message}`,
          isReady: false,
        }));
      });

      let buffer = '';

      proc.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('uciok')) {
            proc?.stdin?.write('isready\n');
          } else if (line.startsWith('readyok')) {
            setState(prev => ({ ...prev, isReady: true, error: null }));
          } else if (line.startsWith('info')) {
            const parsed = parseInfoLine(line);
            if (parsed && parsed.depth && parsed.pv && parsed.pv.length > 0) {
              setState(prev => ({
                ...prev,
                evaluation: {
                  score: parsed.score ?? 0,
                  isMate: parsed.isMate ?? false,
                  mateIn: parsed.mateIn,
                  depth: parsed.depth ?? 0,
                  bestMove: parsed.bestMove ?? '',
                  pv: parsed.pv ?? [],
                  isAnalyzing: true,
                },
              }));
            }
          } else if (line.startsWith('bestmove')) {
            const moveMatch = line.match(/bestmove (\S+)/);
            if (moveMatch && moveMatch[1]) {
              const bestMove = moveMatch[1];
              setState(prev => ({
                ...prev,
                evaluation: prev.evaluation
                  ? { ...prev.evaluation, bestMove, isAnalyzing: false }
                  : null,
              }));
            }
          }
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        setState(prev => ({
          ...prev,
          error: `Stockfish error: ${data.toString()}`,
        }));
      });

      proc.stdin?.write('uci\n');

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: `Failed to spawn Stockfish: ${err.message}`,
        isReady: false,
      }));
    }

    return () => {
      if (proc) {
        proc.stdin?.write('quit\n');
        proc.kill();
      }
      processRef.current = null;
    };
  }, [parseInfoLine]);

  useEffect(() => {
    if (state.isReady && fen && fen !== currentFenRef.current) {
      currentFenRef.current = fen;
      startAnalysis(fen);
    }
  }, [fen, state.isReady, startAnalysis]);

  return state;
}
