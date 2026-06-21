import type { DificuldadeSolo } from '@/games/solo/types';

import { CONFIG_DIFICULDADE_CS } from './types';
import type { CorCS, EstadoCS, TentativaCS } from './types';

// ─── Geração da senha ───────────────────────────────────────────────────────────

function gerarSenha(numCores: number, numPosicoes: number): CorCS[] {
  return Array.from({ length: numPosicoes }, () =>
    Math.floor(Math.random() * numCores),
  );
}

export function criarEstadoInicial(dificuldade: DificuldadeSolo): EstadoCS {
  const config = CONFIG_DIFICULDADE_CS[dificuldade];
  return {
    dificuldade,
    numCores: config.numCores,
    numPosicoes: config.numPosicoes,
    maxTentativas: config.maxTentativas,
    senha: gerarSenha(config.numCores, config.numPosicoes),
    tentativas: [],
    concluido: false,
    venceu: false,
  };
}

export function reiniciarEstado(estado: EstadoCS): EstadoCS {
  return criarEstadoInicial(estado.dificuldade);
}

// ─── Avaliação do palpite (lógica clássica do Mastermind) ──────────────────────

/**
 * Compara um palpite com a senha secreta.
 * `corretasPosicao` — cor certa na posição certa.
 * `corretasCor` — cor certa, mas na posição errada (sem contar as já certas).
 */
export function avaliarPalpite(
  senha: CorCS[],
  palpite: CorCS[],
): { corretasPosicao: number; corretasCor: number } {
  const n = senha.length;
  let corretasPosicao = 0;
  const senhaRestante: CorCS[] = [];
  const palpiteRestante: CorCS[] = [];

  for (let i = 0; i < n; i++) {
    if (senha[i] === palpite[i]) {
      corretasPosicao++;
    } else {
      senhaRestante.push(senha[i]);
      palpiteRestante.push(palpite[i]);
    }
  }

  const contagemSenha = new Map<CorCS, number>();
  for (const c of senhaRestante) {
    contagemSenha.set(c, (contagemSenha.get(c) ?? 0) + 1);
  }

  let corretasCor = 0;
  for (const c of palpiteRestante) {
    const restante = contagemSenha.get(c) ?? 0;
    if (restante > 0) {
      corretasCor++;
      contagemSenha.set(c, restante - 1);
    }
  }

  return { corretasPosicao, corretasCor };
}

export function registrarTentativa(estado: EstadoCS, palpite: CorCS[]): EstadoCS {
  if (estado.concluido) return estado;
  if (palpite.length !== estado.numPosicoes) return estado;

  const { corretasPosicao, corretasCor } = avaliarPalpite(estado.senha, palpite);
  const tentativa: TentativaCS = { palpite, corretasPosicao, corretasCor };
  const tentativas = [...estado.tentativas, tentativa];

  const venceu = corretasPosicao === estado.numPosicoes;
  const esgotouTentativas = tentativas.length >= estado.maxTentativas;

  return {
    ...estado,
    tentativas,
    concluido: venceu || esgotouTentativas,
    venceu,
  };
}

export function tentativasRestantes(estado: EstadoCS): number {
  return estado.maxTentativas - estado.tentativas.length;
}
