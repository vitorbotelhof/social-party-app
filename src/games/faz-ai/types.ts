import type { GameAction, PlayerId } from '@/engine/types';

export type CategoriaFazAiId =
  | 'classicos_de_mimica'
  | 'acoes_do_cotidiano'
  | 'profissoes_e_personagens'
  | 'vida_adulta_brasileira'
  | 'internet_brasileira'
  | 'corporate_chaos'
  | 'casal_moderno'
  | 'vergonhas_universais'
  | 'brainrot_brasileiro'
  | 'festa_e_role'
  | 'problemas_de_rico'
  | 'exposed_cancelamento'
  | 'situacoes_muito_especificas';

export type IntensidadeSocial = 'leve' | 'social' | 'caotica' | 'absurda';
export type DificuldadeAtuacao = 'facil' | 'media' | 'dificil' | 'surto';
export type EnergiaRodada = 'aquecimento' | 'ritmo' | 'gritaria' | 'colapso';
export type TipoCartaFazAi =
  | 'classica'
  | 'social_moderna'
  | 'internet'
  | 'absurda';
export type ModoAtuacaoFazAi =
  | 'gesto'
  | 'objeto'
  | 'personagem'
  | 'emocao'
  | 'situacao'
  | 'referencia';
export type AtuabilidadeFazAi = 'direta' | 'boa' | 'sutil' | 'complexa';

export interface CategoriaFazAi {
  id: CategoriaFazAiId;
  nome: string;
  descricao: string;
  intensidadePadrao: IntensidadeSocial;
  dificuldadePadrao: DificuldadeAtuacao;
  energiaPadrao: EnergiaRodada;
  tipoPadrao: TipoCartaFazAi;
  modoPadrao: ModoAtuacaoFazAi;
  atuabilidadePadrao: AtuabilidadeFazAi;
}

export interface CartaFazAi {
  id: string;
  texto: string;
  categoria: CategoriaFazAiId;
  ideiaCentral: string;
  intensidadeSocial: IntensidadeSocial;
  dificuldadeAtuacao: DificuldadeAtuacao;
  energiaRodada: EnergiaRodada;
  tipo: TipoCartaFazAi;
  modoAtuacao: ModoAtuacaoFazAi;
  atuabilidade: AtuabilidadeFazAi;
  respostasAceitas?: string[];
  tags?: string[];
}

export type FaseAdaptativaFazAi =
  | 'aquecimento'
  | 'crescendo'
  | 'pico'
  | 'colapso';
export type ResultadoCartaFazAi = 'acertou' | 'passou';
export type ResultadoTurnoFazAi = 'finalizado' | 'tempo_esgotado';

export type SubFaseFazAi =
  | 'preparando'
  | 'atuando'
  | 'resumo_turno'
  | 'entre_rodadas'
  | 'finalizado';

export interface HistoricoCartaFazAi {
  cartaId: string;
  texto: string;
  categoria: CategoriaFazAiId;
  ideiaCentral: string;
  intensidadeSocial: IntensidadeSocial;
  dificuldadeAtuacao: DificuldadeAtuacao;
  energiaRodada: EnergiaRodada;
  tipo: TipoCartaFazAi;
  modoAtuacao: ModoAtuacaoFazAi;
  atuabilidade: AtuabilidadeFazAi;
  respostasAceitas?: string[];
  resultado: ResultadoCartaFazAi;
  duracaoMs: number;
}

export interface HistoricoTurnoFazAi {
  rodada: number;
  jogadorId: PlayerId;
  resultado: ResultadoTurnoFazAi;
  iniciadoEm: number;
  finalizadoEm: number;
  acertos: number;
  passes: number;
  cartas: HistoricoCartaFazAi[];
  energiaMedia: number;
  vergonhaMedia: number;
}

export interface FazAiPublicState {
  subFase: SubFaseFazAi;
  anfitriaoId: PlayerId;

  duracaoSegundos: number;
  rodadasPorJogador: number;
  categorias: CategoriaFazAiId[] | 'todas';
  intensidade: IntensidadeSocial | 'todas';

  indiceTurno: number;
  ordemJogadores: PlayerId[];
  turnosJogados: number;
  totalTurnos: number;

  turnoIniciadoEm: number | null;
  prazoTurnoEm: number | null;
  cartaAtualIniciadaEm: number | null;

  acertosTurnoAtual: number;
  passesTurnoAtual: number;
  streakTurnoAtual: number;
  melhorStreak: number;

  pontos: Record<PlayerId, number>;
  historico: HistoricoTurnoFazAi[];
  historicoTurnoAtual: HistoricoCartaFazAi[];
  cartasUsadas: string[];
}

export interface FazAiPrivateState {
  carta: CartaFazAi | null;
}

export interface OpcoesFazAi {
  duracaoSegundos: 20 | 30 | 45;
  rodadasPorJogador: number;
  categorias: CategoriaFazAiId[] | 'todas';
  intensidade: IntensidadeSocial | 'todas';
}

export type FazAiAction =
  | (GameAction<Record<string, never>> & { tipo: 'comecar' })
  | (GameAction<Record<string, never>> & { tipo: 'acertou' })
  | (GameAction<Record<string, never>> & { tipo: 'passou' })
  | (GameAction<Record<string, never>> & { tipo: 'tempo_esgotado' })
  | (GameAction<Record<string, never>> & { tipo: 'avancar' });

export interface RodadaResolvidaFazAi {
  rodada: number;
  jogadorId: PlayerId;
  acertos: number;
  passes: number;
  cartas: HistoricoCartaFazAi[];
  energiaMedia: number;
  vergonhaMedia: number;
  duracaoMs: number;
}

export interface ResultadoFazAiFinalizado {
  totalTurnos: number;
  totalCartas: number;
  acertosPorJogador: Record<PlayerId, number>;
  passesPorJogador: Record<PlayerId, number>;
  jogadorMaisCaoticoId: PlayerId | null;
  quemMaisAcertaId: PlayerId | null;
  quemAtuaPiorId: PlayerId | null;
  energiaMediaGrupo: number;
  vergonhaColetiva: number;
  categoriasFavoritas: CategoriaFazAiId[];
}

export interface FazAiCallbacks {
  onTurnoResolvido?: (turno: RodadaResolvidaFazAi) => void;
  onJogoFinalizado?: (resultado: ResultadoFazAiFinalizado) => void;
}
