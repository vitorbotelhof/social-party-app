import type { DificuldadeSolo } from '@/games/solo/types';

export type { DificuldadeSolo };

// ─── Geometria ────────────────────────────────────────────────────────────────

/**
 * Retângulo definido por coordenadas inclusivas.
 * Sempre normalizado: linhaInicio ≤ linhaFim e colunaInicio ≤ colunaFim.
 */
export interface RetanguloShikaku {
  linhaInicio: number;
  colunaInicio: number;
  linhaFim: number;
  colunaFim: number;
}

/** Número-pista posicionado na grade. O valor é a área do retângulo dono. */
export interface PistaShikaku {
  linha: number;
  coluna: number;
  valor: number;
}

/**
 * Retângulo da solução, com a posição da sua pista.
 * É a fonte única de verdade de um puzzle — pistas e dimensões derivam daqui.
 */
export interface RetanguloComPista extends RetanguloShikaku {
  pistaLinha: number;
  pistaColuna: number;
}

// ─── Puzzle ───────────────────────────────────────────────────────────────────

export interface PuzzleShikaku {
  id: string;
  dificuldade: DificuldadeSolo;
  linhas: number;
  colunas: number;
  /** Partição correta da grade. Cada retângulo tem exatamente uma pista. */
  solucao: RetanguloComPista[];
}

// ─── Estado de jogo ───────────────────────────────────────────────────────────

export interface EstadoShikaku {
  puzzle: PuzzleShikaku;
  /** Retângulos desenhados pelo jogador (podem estar incompletos/errados). */
  retangulos: RetanguloShikaku[];
  /** Verdadeiro quando a grade está particionada corretamente. */
  concluido: boolean;
}
