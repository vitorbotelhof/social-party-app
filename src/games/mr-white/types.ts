import type { GameAction, PlayerId } from '@/engine/types';

export type CategoriaId =
  | 'comidas'
  | 'lugares'
  | 'animais'
  | 'esportes'
  | 'filmes'
  | 'festas'
  | 'bebidas'
  | 'celebridades'
  | 'musicas'
  | 'memes'
  | 'profissoes'
  | 'objetos'
  | 'sentimentos'
  | 'aplicativos'
  | 'relacionamentos'
  | 'dating'
  | 'vida_adulta'
  | 'internet'
  | 'caos_social'
  | 'psicologia_social';

/**
 * Dificuldade intrínseca do par de palavras.
 * Determina o quão próximas semanticamente são as palavras e o quanto
 * as descrições dos civis e do Mr White se sobrepõem.
 *
 * leve   — pares claramente distintos; Mr White tem trabalho duro
 * media  — proximidade conceitual moderada; descrições ambíguas possíveis
 * hard   — pares muito próximos; leitura social necessária para distinguir
 * insana — limiar quase imperceptível; o grupo entra em paranoia total
 */
export type DificuldadeParPalavras = 'leve' | 'media' | 'hard' | 'insana';

export interface ParPalavras {
  /** Palavra entregue à maioria dos jogadores (os civis). */
  civis: string;
  /**
   * Palavra alternativa entregue ao Mr White na variante "com palavra similar".
   * No modo clássico o Mr White não recebe palavra — este campo é ignorado.
   * Na variante futura, o Mr White recebe esta palavra e deve blefar
   * descrevendo um conceito levemente diferente.
   */
  undercover: string;
  /** Dificuldade intrínseca do par. Usado para filtragem futura por modo/deck. */
  dificuldade?: DificuldadeParPalavras;
  /** Tags semânticas para curadoria, decks temáticos e discovery futuro. */
  tags?: string[];
}

export interface Categoria {
  id: CategoriaId;
  nome: string;
  emoji: string;
  descricao: string;
  palavras: ParPalavras[];
}

export type Dificuldade = 'facil' | 'medio' | 'dificil';

/** Opções de configuração que o anfitrião escolhe antes de iniciar. */
export interface OpcoesMrWhite {
  categoriaId: CategoriaId;
  dificuldade: Dificuldade;
  numeroMrWhites: number;
  /** Tempo de cada turno de dica em segundos. `0` = sem limite. */
  duracaoTurnoSegundos: number;
}

/**
 * Sub-fase interna do Mr White, mais granular que `GamePhase`.
 * GameScreen usa este campo para rotear a sub-tela correta.
 */
export type SubFaseMrWhite =
  | 'revelando'
  | 'dando_dicas'
  | 'votando'
  | 'palpite_final'
  | 'finalizado';

export type ResultadoFinal = 'civis' | 'mrwhite' | null;

export interface PistaDada {
  jogadorId: PlayerId;
  texto: string;
  rodada: number;
}

export interface MrWhitePublicState {
  subFase: SubFaseMrWhite;

  categoriaId: CategoriaId;
  dificuldade: Dificuldade;
  numeroMrWhites: number;

  /** Duração configurada de cada turno em segundos. `0` = sem limite. */
  duracaoTurnoSegundos: number;
  /** Timestamp Unix (ms) de quando o turno atual termina. `null` se sem limite ou fora de turno. */
  prazoTurnoEm: number | null;

  /** Ordem fixa dos turnos de dicas, definida no início. */
  ordemJogadores: PlayerId[];

  /** IDs ordenados por antiguidade (entrouEm asc). Usado pra desempate na votação. */
  idsPorAntiguidade: PlayerId[];

  /** Quem já viu a própria palavra (fase revelando). */
  jogadoresQueViram: PlayerId[];

  /** Posição atual em `ordemJogadores` durante a fase de dicas. */
  indiceTurno: number;
  pistas: PistaDada[];

  /** Mapa eleitor → alvo (fase votando). */
  votos: Record<PlayerId, PlayerId>;

  /** Quem foi eliminado pelo voto. */
  eliminadosIds: PlayerId[];

  /** Mr White que precisa adivinhar (se foi descoberto). */
  jogadorAdivinhandoId: PlayerId | null;
  palpiteFinal: string | null;
  palpiteCorreto: boolean | null;

  /** Revelado apenas quando a partida termina. */
  vencedor: ResultadoFinal;
  palavraRevelada: string | null;
  mrWhiteIdsRevelados: PlayerId[];
}

export interface MrWhitePrivateState {
  palavraSecreta: string | null;
  ehMrWhite: boolean;
}

export type MrWhiteAction =
  | (GameAction<Record<string, never>> & { tipo: 'jogador_viu_palavra' })
  | (GameAction<{ texto: string }> & { tipo: 'enviar_pista' })
  | (GameAction<{ alvoId: PlayerId }> & { tipo: 'votar' })
  | (GameAction<{ palavra: string }> & { tipo: 'palpite_final' })
  | (GameAction<Record<string, never>> & { tipo: 'forcar_resolucao_votacao' });
