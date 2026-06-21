import type { DificuldadeSolo } from '@/games/solo/types';

export type { DificuldadeSolo };

// ─── Configuração por dificuldade ──────────────────────────────────────────────

export interface ConfigDificuldadeCS {
  numCores: number;
  numPosicoes: number;
  maxTentativas: number;
}

export const CONFIG_DIFICULDADE_CS: Record<DificuldadeSolo, ConfigDificuldadeCS> = {
  facil:   { numCores: 3, numPosicoes: 4, maxTentativas: 12 },
  medio:   { numCores: 4, numPosicoes: 5, maxTentativas: 10 },
  dificil: { numCores: 5, numPosicoes: 6, maxTentativas: 8 },
};

/** Paleta de cores disponível. O jogo usa os primeiros `numCores` índices. */
export const PALETA_CORES_CS: string[] = [
  '#EF4444', // vermelho
  '#3B82F6', // azul
  '#22C55E', // verde
  '#F59E0B', // âmbar
  '#A855F7', // roxo
];

/** Índice de cor dentro de PALETA_CORES_CS. */
export type CorCS = number;

// ─── Tentativas ────────────────────────────────────────────────────────────────

export interface TentativaCS {
  palpite: CorCS[];
  /** Cor certa, posição certa. */
  corretasPosicao: number;
  /** Cor certa, posição errada. */
  corretasCor: number;
}

// ─── Estado de jogo ────────────────────────────────────────────────────────────

export interface EstadoCS {
  dificuldade: DificuldadeSolo;
  numCores: number;
  numPosicoes: number;
  maxTentativas: number;
  /** Sequência secreta sorteada pelo app. Cores podem repetir. */
  senha: CorCS[];
  tentativas: TentativaCS[];
  /** Verdadeiro quando o jogo acabou (vitória ou tentativas esgotadas). */
  concluido: boolean;
  venceu: boolean;
}
