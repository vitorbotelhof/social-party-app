import type { GameAction, PlayerId } from '@/engine/types';

/**
 * Sub-fases do Most Likely To, mais granulares que GamePhase.
 *
 * - votando    → coletando votos simultâneos (UI aplica delay de 3s via rodadaIniciadaEm)
 * - reveal     → todos votaram ou timer esgotou; resultado exibido; app em silêncio
 * - finalizado → todas as rodadas concluídas; retrato social exibido
 */
export type SubFaseMostLikely = 'votando' | 'reveal' | 'finalizado';

export type ModoMostLikely = 'classico' | 'sincero';

export type EnergiaPrompt = 'leve' | 'medio' | 'intenso';

export interface Prompt {
  id: string;
  texto: string;
  energia: EnergiaPrompt;
}

export interface OpcoesMostLikely {
  totalRodadas: number;
  modo: ModoMostLikely;
}

/** Arquivo de uma rodada concluída, guardado para o retrato social final. */
export interface ResultadoRodada {
  rodada: number;
  prompt: string;
  vencedorId: PlayerId;
  totalVotosVencedor: number;
  /** Mapa eleitor → alvo desta rodada. */
  votos: Record<PlayerId, PlayerId>;
  foiEmpate: boolean;
}

export interface MostLikelyPublicState {
  subFase: SubFaseMostLikely;
  anfitriaoId: PlayerId;

  totalRodadas: number;
  modo: ModoMostLikely;
  /** Ordem dos jogadores fixada no início da sessão. */
  ordemJogadores: PlayerId[];

  // Rodada atual
  promptAtual: string;
  /** Timestamp Unix (ms) de início da rodada. UI usa para calcular o delay de 3s. */
  rodadaIniciadaEm: number;
  /** Mapa eleitor → alvo da rodada corrente. */
  votos: Record<PlayerId, PlayerId>;
  vencedorRodadaAtual: PlayerId | null;
  foiEmpate: boolean;

  // Histórico
  resultados: ResultadoRodada[];
  /** Índices de prompts já usados na sessão — evita repetição. */
  indicesPromptUsados: number[];
}

/** Most Likely To não tem estado privado — tudo é público. */
export type MostLikelyPrivateState = Record<string, never>;

export type MostLikelyAction =
  | (GameAction<{ alvoId: PlayerId }> & { tipo: 'votar' })
  | (GameAction<Record<string, never>> & { tipo: 'avancar_rodada' })
  | (GameAction<Record<string, never>> & { tipo: 'forcar_reveal' });
