/**
 * MLT Adapter — traduz rodadas e resultado de Most Likely To
 * em momentos e estatísticas que o sistema de sessão entende.
 *
 * Chamar em: rodada finalizada + jogo finalizado.
 */

import {
  registrarJogoFinalizado,
  registrarMomento,
  atualizarJogadorSessao,
  getSessaoAtual,
} from './sessionStore';
import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { detectarVibe } from './vibeEngine';
import type { MLTSessaoStats } from './types';
import type { PlayerId } from '@/engine/types';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export interface RodadaMLT {
  rodada: number;
  promptId: string;
  /** Mapa de jogador → votos recebidos nesta rodada. */
  votos: Record<PlayerId, number>;
  totalJogadores: number;
}

export interface ResultadoMLT {
  totalRodadas: number;
  unanimidades: number;
  julgadoMaisVezes: PlayerId | null;
  rodadasComEmpate: number;
}

// ─── Processamento de rodada ──────────────────────────────────────────────────

export function processarRodadaMLT(rodada: RodadaMLT): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const { votos, totalJogadores } = rodada;
  const entradas = Object.entries(votos) as [PlayerId, number][];

  if (entradas.length === 0) return;

  const totalVotos = entradas.reduce((acc, [, v]) => acc + v, 0);
  const maxVotos = Math.max(...entradas.map(([, v]) => v));
  const alvosComVoto = entradas.filter(([, v]) => v > 0);

  // Atualiza vezesJulgado do mais votado
  const maisVotado = entradas.find(([, v]) => v === maxVotos);
  if (maisVotado) {
    const [jogadorId] = maisVotado;
    const atual = sessao.jogadores.find((j) => j.id === jogadorId);
    atualizarJogadorSessao(jogadorId, {
      vezesJulgado: (atual?.vezesJulgado ?? 0) + 1,
    });
  }

  // Momento: unanimidade (todos votaram na mesma pessoa)
  if (alvosComVoto.length === 1 && totalVotos >= 3) {
    const [alvoId] = alvosComVoto[0];
    registrarMomento({
      tipo: 'unanimidade',
      jogoId: 'most-likely-to',
      rodada: rodada.rodada,
      jogadoresIds: [alvoId],
      dados: { totalVotos, promptId: rodada.promptId },
    });
  }

  // Momento: julgamento (maioria clara + prompt relevante)
  const maioria = Math.ceil(totalJogadores / 2);
  if (maxVotos >= maioria && alvosComVoto.length === 1 && totalVotos >= 3) {
    const [alvoId] = alvosComVoto[0];
    registrarMomento({
      tipo: 'julgamento',
      jogoId: 'most-likely-to',
      rodada: rodada.rodada,
      jogadoresIds: [alvoId],
      dados: { maxVotos, totalJogadores, promptId: rodada.promptId },
    });
  }

  // Momento: paranoia total (votos muito espalhados)
  if (alvosComVoto.length >= 3 && maxVotos <= 2) {
    registrarMomento({
      tipo: 'paranoia_total',
      jogoId: 'most-likely-to',
      rodada: rodada.rodada,
      jogadoresIds: [],
      dados: { votos, totalJogadores },
    });
  }
}

// ─── Processamento de resultado ───────────────────────────────────────────────

export function processarResultadoMLT(resultado: ResultadoMLT): void {
  const stats: MLTSessaoStats = {
    totalRodadas: resultado.totalRodadas,
    unanimidades: resultado.unanimidades,
    julgadoMaisVezes: resultado.julgadoMaisVezes,
    rodadasComEmpate: resultado.rodadasComEmpate,
  };

  registrarJogoFinalizado('most-likely-to', { mlt: stats });

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
