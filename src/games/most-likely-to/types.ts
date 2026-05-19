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

/**
 * Categorias temáticas para curadoria, decks futuros e recommendation engine.
 * Ignoradas pelo engine — usadas apenas para discovery e editorial.
 */
export type CategoriaPrompt =
  | 'cotidiano'
  | 'digital_life'
  | 'brasil_contemporaneo'
  | 'relacionamentos'
  | 'dating'
  | 'vida_adulta'
  | 'psicologia_social'
  | 'caos_social'
  | 'viagem'
  | 'festa'
  | 'trabalho'
  | 'cinematografico';

export interface Prompt {
  id: string;
  texto: string;
  energia: EnergiaPrompt;

  /**
   * Tags semânticas para curadoria, decks temáticos e discovery futuro.
   * Exemplos: 'brasil', 'genz', 'dating', 'unanimidade', 'cinematografico'
   */
  tags?: string[];

  /**
   * Categoria temática principal — para decks curados e editorial.
   * Um prompt pode ser taggado em múltiplos temas, mas pertence a uma categoria.
   */
  categoria?: CategoriaPrompt;

  /**
   * 1–10. Potencial de gerar votação unânime ou quase.
   * 8+ = o grupo quase sempre converge em uma pessoa.
   * Usado para calibrar sequência e garantir pelo menos 1 momento de unanimidade por sessão.
   */
  potencialUnanimidade?: number;

  /**
   * 1–10. Grau de exposição emocional do nomeado.
   * 7+ = o reveal cria silêncio antes da risada.
   */
  vulnerabilidade?: number;

  /**
   * 1–10. Probabilidade de gerar debate coletivo, protestos, gritos.
   * 8+ = o grupo explode após o reveal.
   */
  caos?: number;

  /**
   * 1–10. Intensidade social geral do prompt.
   * Combina revelação + reação + identificação.
   */
  intensidadeSocial?: number;
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
