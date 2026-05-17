import type { GameAction, GameState, Player } from '@/engine/types';
import { mrWhiteEngine } from '@/games/mr-white';
import type {
  MrWhiteAction,
  MrWhitePrivateState,
  MrWhitePublicState,
  OpcoesMrWhite,
} from '@/games/mr-white/types';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

let estadoAtual: EstadoMrWhite | null = null;
let jogadoresLocais: Player[] = [];
let opcoesAtuais: OpcoesMrWhite | null = null;
const ouvintes = new Set<(estado: EstadoMrWhite | null) => void>();

function notificar(): void {
  for (const cb of ouvintes) cb(estadoAtual);
}

export function inicializarJogoLocal(
  jogadores: Player[],
  opcoes: OpcoesMrWhite,
): void {
  if (jogadores.length === 0) return;
  jogadoresLocais = [...jogadores];
  opcoesAtuais = opcoes;
  estadoAtual = mrWhiteEngine.criarEstadoInicial(
    jogadores,
    jogadores[0]!.id,
    opcoes,
  ) as EstadoMrWhite;
  notificar();
}

export function reiniciarPartidaLocal(): void {
  if (!opcoesAtuais || jogadoresLocais.length === 0) return;
  estadoAtual = mrWhiteEngine.criarEstadoInicial(
    jogadoresLocais,
    jogadoresLocais[0]!.id,
    opcoesAtuais,
  ) as EstadoMrWhite;
  notificar();
}

export function despacharAcaoLocal(acao: GameAction): void {
  if (!estadoAtual) return;
  estadoAtual = mrWhiteEngine.processarAcao(
    estadoAtual,
    acao as MrWhiteAction,
  ) as EstadoMrWhite;
  notificar();
}

export function observarEstadoLocal(
  cb: (estado: EstadoMrWhite | null) => void,
): () => void {
  ouvintes.add(cb);
  cb(estadoAtual);
  return () => {
    ouvintes.delete(cb);
  };
}

export function getEstadoLocal(): EstadoMrWhite | null {
  return estadoAtual;
}

export function getJogadoresLocais(): Player[] {
  return jogadoresLocais;
}

export function resetarJogoLocal(): void {
  estadoAtual = null;
  jogadoresLocais = [];
  opcoesAtuais = null;
  notificar();
}

/**
 * Limpa o estado da partida atual mas mantém a lista de jogadores
 * cadastrada — usado pelo "jogar de novo com o mesmo grupo" pra
 * reabrir a tela de configuração com os mesmos nomes.
 */
export function limparEstadoMantendoJogadores(): void {
  estadoAtual = null;
  opcoesAtuais = null;
  notificar();
}
