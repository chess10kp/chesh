export interface StockfishEvaluation {
  score: number;
  isMate: boolean;
  mateIn?: number;
  depth: number;
  bestMove: string;
  pv: string[];
  isAnalyzing: boolean;
}

export interface StockfishState {
  evaluation: StockfishEvaluation | null;
  isReady: boolean;
  error: string | null;
}
