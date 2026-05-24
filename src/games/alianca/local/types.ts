/**
 * ALIANCA LOCAL — TIPOS (modo 1 celular)
 *
 * Aliança é um jogo de confiança, manipulação e política social.
 * O modo local não usa Firebase; toda informação vive em memória no engine.
 *
 * Convenção:
 *   - EstadoAliancaPublico nunca expõe papéis, votos individuais ou sabotadores.
 *   - Consultas privadas existem apenas para o momento em que o celular está
 *     nas mãos do jogador correto.
 */

export type PlayerId = string;

export type PapelAlianca = 'leal' | 'traidor';

export type FaseAlianca =
  | 'distribuindo_papeis'
  | 'escolhendo_equipe'
  | 'debate'
  | 'votando_equipe'
  | 'resultado_votacao'
  | 'missao'
  | 'resultado_missao'
  | 'finalizado';

export type VotoEquipeAlianca = 'aprovar' | 'rejeitar';
export type AcaoMissaoAlianca = 'ajudar' | 'sabotar';
export type VencedorAlianca = 'leais' | 'traidores';

export interface JogadorAlianca {
  id: PlayerId;
  nome: string;
}

export interface ConfiguracaoAlianca {
  minJogadores: number;
  maxJogadores: number;
  totalMissoesParaVencer: number;
  maxRejeicoesSeguidas: number;
  duracaoDistribuicaoMs: number;
  numeroTraidores: number;
  tamanhosMissoes: number[];
}

export interface EstadoDistribuicaoAlianca {
  indiceAtual: number;
  jogadoresOrdem: PlayerId[];
}

export interface EstadoVotacaoEquipeAlianca {
  indiceAtual: number;
  jogadoresOrdem: PlayerId[];
  totalVotos: number;
}

export interface ResultadoVotacaoEquipeAlianca {
  aprovado: boolean;
  aprovacoes: number;
  rejeicoes: number;
  rejeicoesSeguidas: number;
}

export interface EstadoMissaoAlianca {
  indiceAtual: number;
  participantesOrdem: PlayerId[];
  totalAcoes: number;
}

export interface ResultadoMissaoAlianca {
  sucesso: boolean;
  sabotagens: number;
  rodada: number;
  equipe: PlayerId[];
}

export interface HistoricoMissaoAlianca {
  rodada: number;
  liderId: PlayerId;
  equipe: PlayerId[];
  aprovacoes: number;
  rejeicoes: number;
  aprovada: boolean;
  sabotagens: number;
  sucesso: boolean;
}

export interface RevelacaoFinalAlianca {
  papeisPorJogador: Record<PlayerId, PapelAlianca>;
  totalRodadas: number;
  historicoMissoes: HistoricoMissaoAlianca[];
}

export interface EstadoAliancaPublico {
  fase: FaseAlianca;
  rodada: number;
  indiceLider: number;
  liderId: PlayerId;
  jogadoresOrdem: PlayerId[];
  equipeProposta: PlayerId[];
  distribuicao: EstadoDistribuicaoAlianca | null;
  votacao: EstadoVotacaoEquipeAlianca | null;
  missao: EstadoMissaoAlianca | null;
  resultadoVotacao: ResultadoVotacaoEquipeAlianca | null;
  resultadoMissao: ResultadoMissaoAlianca | null;
  historicoMissoes: HistoricoMissaoAlianca[];
  sucessosLeais: number;
  sabotagensTraidores: number;
  rejeicoesSeguidas: number;
  vencedor: VencedorAlianca | null;
  revelacaoFinal: RevelacaoFinalAlianca | null;
  configuracao: ConfiguracaoAlianca;
  totalJogadores: number;
}

export interface PapelAtribuidoAlianca {
  papel: PapelAlianca;
  aliadosTraidores: PlayerId[];
}

export interface VotoEquipeRegistradoAlianca {
  jogadorId: PlayerId;
  voto: VotoEquipeAlianca;
}

export interface AcaoMissaoRegistradaAlianca {
  jogadorId: PlayerId;
  acao: AcaoMissaoAlianca;
}

export interface RodadaAliancaResolvida {
  rodada: number;
  liderId: PlayerId;
  equipe: PlayerId[];
  aprovacoes: number;
  rejeicoes: number;
  sabotagens: number;
  sucesso: boolean;
  sucessosLeais: number;
  sabotagensTraidores: number;
  rejeicoesSeguidasAntesDaMissao: number;
}

export interface EquipeAliancaRejeitada {
  rodada: number;
  liderId: PlayerId;
  equipe: PlayerId[];
  aprovacoes: number;
  rejeicoes: number;
  rejeicoesSeguidas: number;
}

export interface ResultadoAliancaFinalizado {
  vencedor: VencedorAlianca;
  totalRodadas: number;
  totalJogadores: number;
  sucessosLeais: number;
  sabotagensTraidores: number;
  rejeicoesSeguidas: number;
  papeisPorJogador: Record<PlayerId, PapelAlianca>;
  historicoMissoes: HistoricoMissaoAlianca[];
}

export interface AliancaCallbacks {
  onRodadaResolvida?: (rodada: RodadaAliancaResolvida) => void;
  onEquipeRejeitada?: (rejeicao: EquipeAliancaRejeitada) => void;
  onJogoFinalizado?: (resultado: ResultadoAliancaFinalizado) => void;
}

export function getNumeroTraidores(numJogadores: number): number {
  if (numJogadores <= 4) return 1;
  if (numJogadores <= 7) return 2;
  return 3;
}

export function getTamanhosMissoes(numJogadores: number): number[] {
  if (numJogadores <= 4) return [2, 2, 3, 3, 3];
  if (numJogadores === 5) return [2, 3, 2, 3, 3];
  if (numJogadores === 6) return [2, 3, 4, 3, 4];
  if (numJogadores === 7) return [2, 3, 3, 4, 4];
  return [3, 4, 4, 5, 5];
}

export function criarConfiguracaoAlianca(
  numJogadores: number,
): ConfiguracaoAlianca {
  return {
    minJogadores: 4,
    maxJogadores: 10,
    totalMissoesParaVencer: 3,
    maxRejeicoesSeguidas: 5,
    duracaoDistribuicaoMs: 3_500,
    numeroTraidores: getNumeroTraidores(numJogadores),
    tamanhosMissoes: getTamanhosMissoes(numJogadores),
  };
}
