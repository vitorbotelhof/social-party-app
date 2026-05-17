import { obterJogo } from '@/engine/registry';
import type { GameAction, GameId, GameState, Player } from '@/engine/types';

let jogoIdAtual: GameId | null = null;
let estadoAtual: GameState | null = null;
let jogadoresLocais: Player[] = [];
let opcoesAtuais: unknown = null;
const ouvintes = new Set<(estado: GameState | null) => void>();

function notificar(): void {
  for (const cb of ouvintes) cb(estadoAtual);
}

export function inicializarJogoLocal(
  jogoId: GameId,
  jogadores: Player[],
  opcoes: unknown,
): void {
  const engine = obterJogo(jogoId);
  if (!engine || jogadores.length === 0) return;
  jogoIdAtual = jogoId;
  jogadoresLocais = [...jogadores];
  opcoesAtuais = opcoes;
  estadoAtual = engine.criarEstadoInicial(jogadores, jogadores[0]!.id, opcoes);
  notificar();
}

export function reiniciarPartidaLocal(): void {
  if (!jogoIdAtual || jogadoresLocais.length === 0) return;
  const engine = obterJogo(jogoIdAtual);
  if (!engine) return;
  estadoAtual = engine.criarEstadoInicial(
    jogadoresLocais,
    jogadoresLocais[0]!.id,
    opcoesAtuais,
  );
  notificar();
}

export function despacharAcaoLocal(acao: GameAction): void {
  if (!estadoAtual || !jogoIdAtual) return;
  const engine = obterJogo(jogoIdAtual);
  if (!engine) return;
  estadoAtual = engine.processarAcao(estadoAtual, acao);
  notificar();
}

export function observarEstadoLocal(
  cb: (estado: GameState | null) => void,
): () => void {
  ouvintes.add(cb);
  cb(estadoAtual);
  return () => {
    ouvintes.delete(cb);
  };
}

export function getEstadoLocal(): GameState | null {
  return estadoAtual;
}

export function getJogadoresLocais(): Player[] {
  return jogadoresLocais;
}

export function resetarJogoLocal(): void {
  jogoIdAtual = null;
  estadoAtual = null;
  jogadoresLocais = [];
  opcoesAtuais = null;
  notificar();
}

export function limparEstadoMantendoJogadores(): void {
  estadoAtual = null;
  opcoesAtuais = null;
  notificar();
}
