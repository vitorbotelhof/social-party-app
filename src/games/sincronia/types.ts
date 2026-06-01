export interface ConfiguracaoSincronia {
  jogadores: { id: string; nome: string }[];
  duracaoSegundos: 60 | 90 | 120;
  voltasPorDupla: 1 | 2 | 3;
  skipsPorRodada: 3 | 5 | null; // null = sem limite
  incluirDificil: boolean;
}

export interface DuplaSincronia {
  id: string;
  jogador0: { id: string; nome: string };
  jogador1: { id: string; nome: string };
}

export type FaseSincronia =
  | 'vez_de'
  | 'contagem'
  | 'rodada_ativa'
  | 'resultado_rodada'
  | 'encerrado';

export type ResultadoPalavra = 'acerto' | 'infracao' | 'skip' | 'tempo';

export interface PalavraJogada {
  palavra: string;
  resultado: ResultadoPalavra;
}

export interface PlacarDupla {
  duplaId: string;
  pontos: number;
  acertos: number;
  infracoes: number;
  skips: number;
}

export interface ResultadoRodadaSincronia {
  acertos: number;
  infracoes: number;
  skips: number;
  pontosGanhos: number;
  palavrasJogadas: PalavraJogada[];
}

export interface EstadoJogoSincronia {
  config: ConfiguracaoSincronia;
  duplas: DuplaSincronia[];
  fase: FaseSincronia;

  // Tracking current position in the game
  duplaIndice: number; // which dupla is playing now (0-based)
  voltaAtual: number; // 1-based volta counter within the game

  // Per-rodada state
  palavraAtual: string | null;
  skipsUsados: number;
  acertosRodada: number;
  infracoesRodada: number;
  palavrasJogadas: PalavraJogada[];

  // Last round result (for resultado_rodada phase)
  ultimoResultado: ResultadoRodadaSincronia | null;

  // Scoreboard: duplaId → placar
  placar: Record<string, PlacarDupla>;

  // Pre-shuffled word deck and position
  baralho: string[];
  indicePalavra: number;

  // Countdown state (3-2-1)
  contagemAtual: number | null;
}
