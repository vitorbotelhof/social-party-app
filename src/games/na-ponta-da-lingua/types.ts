import type { GameAction, PlayerId } from '@/engine/types';

export type CategoriaIdNPL =
  | 'internet_br'
  | 'cotidiano'
  | 'comida'
  | 'cultura_pop'
  | 'objetos'
  | 'profissoes'
  | 'festas'
  | 'relacionamentos'
  | 'lugares'
  | 'brasil'
  | 'traumas_millennials'
  | 'memes_br'
  | 'vida_adulta'
  | 'date_ruim'
  | 'escritorio'
  | 'universidade'
  | 'carnaval'
  | 'reality_shows'
  | 'celebridades_br';

export type DificuldadeNPL = 'facil' | 'medio' | 'dificil';

export interface Carta {
  id: string;
  palavra: string;
  /** Exactly 5 forbidden words — the most obvious ones. */
  proibidas: [string, string, string, string, string];
  categoria: CategoriaIdNPL;
  dificuldade: DificuldadeNPL;
}

export interface OpoesNPL {
  duracaoSegundos: 45 | 60 | 90;
  rodadasPorJogador: number;
  dificuldade: DificuldadeNPL | 'todas';
  categorias: CategoriaIdNPL[] | 'todas';
}

/**
 * Visual intensity level — computed purely client-side from remaining time %.
 * NOT stored in engine state. Drives all visual escalation.
 *
 * Thresholds:
 *   calmo    → 100%–60%  — clean, controlled
 *   pressao  → 60%–30%  — subtle warmth, timer pulses
 *   panico   → 30%–10%  — shake starts, vignette, heavy pulse
 *   colapso  → 10%–0%   — maximum — shake, dark vignette, flicker
 */
export type IntensidadeVisual = 'calmo' | 'pressao' | 'panico' | 'colapso';

export function calcularIntensidade(pct: number): IntensidadeVisual {
  if (pct > 0.6) return 'calmo';
  if (pct > 0.3) return 'pressao';
  if (pct > 0.1) return 'panico';
  return 'colapso';
}

export type ResultadoRodada = 'acertou' | 'passou' | 'tempo_esgotado';

export type SubFaseNPL =
  | 'preparando'    // current player about to start; others face away
  | 'jogando'       // timer running; player cycling through multiple words
  | 'resumo_turno'  // timer ended; full-turn summary (all words shown)
  | 'entre_rodadas' // cumulative scoreboard; next player preps
  | 'finalizado';   // all turns complete

/** One word outcome within a single continuous turn. */
export interface HistoricoTurnoItem {
  palavra: string;
  resultado: 'acertou' | 'passou';
}

export interface HistoricoRodada {
  rodada: number;
  jogadorId: PlayerId;
  carta: { palavra: string; proibidas: string[] };
  resultado: ResultadoRodada;
  duracaoMs: number;
}

export interface NPLPublicState {
  subFase: SubFaseNPL;
  anfitriaoId: PlayerId;

  duracaoSegundos: number;
  rodadasPorJogador: number;

  /** Stored so card-selection can use the right pool at action time. */
  dificuldade: DificuldadeNPL | 'todas';
  categorias: CategoriaIdNPL[] | 'todas';

  /** Current index into ordemJogadores */
  indiceTurno: number;
  /** Shuffled order; cycles through for each round per player */
  ordemJogadores: PlayerId[];
  /** Total turns played so far */
  turnosJogados: number;
  /** Total turns in the session: ordemJogadores.length × rodadasPorJogador */
  totalTurnos: number;

  /** Unix ms when current turn started */
  turnoIniciadoEm: number | null;
  /** Unix ms when current turn expires */
  prazoTurnoEm: number | null;

  /** Accumulated correct-guess counts per player across all turns */
  pontos: Record<PlayerId, number>;

  historico: HistoricoRodada[];
  cartasUsadas: string[];

  // ── Per-turn tracking — reset at the start of every new turn ──────────
  acertosTurnoAtual: number;
  passousTurnoAtual: number;
  streakTurnoAtual: number;
  melhorStreakTurnoAtual: number;
  historicoTurnoAtual: HistoricoTurnoItem[];
}

/**
 * Private: only the current describer receives the carta.
 * All other players get `{ carta: null }`.
 */
export interface NPLPrivateState {
  carta: Carta | null;
}

export type NPLAction =
  | (GameAction<Record<string, never>> & { tipo: 'pronto' })
  | (GameAction<Record<string, never>> & { tipo: 'acertou' })
  | (GameAction<Record<string, never>> & { tipo: 'passou' })
  | (GameAction<Record<string, never>> & { tipo: 'tempo_esgotado' })
  | (GameAction<Record<string, never>> & { tipo: 'avancar' });
