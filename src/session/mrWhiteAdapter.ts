/**
 * Mr White Adapter — traduz o resultado de uma partida de Mr White
 * em momentos e estatísticas que o sistema de sessão entende.
 *
 * Chamar em: TelaResultado, após o jogo terminar.
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
import type { MrWhiteSessaoStats } from './types';
import type { PlayerId } from '@/engine/types';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export interface ResultadoMrWhite {
  /** IDs dos jogadores que eram Mr White nesta partida. */
  mrWhiteIds: PlayerId[];
  /** Quem venceu. */
  vencedor: 'civis' | 'mrwhite';
  /** Número de rodadas de votação até eliminar (ou tentar eliminar) o Mr White. */
  rodadasVotacao: number;
  /** Se o Mr White tentou adivinhar a palavra. */
  palpiteCorreto: boolean | null;
  /** Total de jogadores na partida. */
  totalJogadores: number;
  /** Rodada final. */
  rodadaFinal: number;
  /**
   * Mapa de jogador → número de votos recebidos na última rodada de votação.
   * Usado para detectar unanimidade e paranoia.
   */
  votosFinais: Record<PlayerId, number>;
}

// ─── Processamento ────────────────────────────────────────────────────────────

export function processarResultadoMrWhite(resultado: ResultadoMrWhite): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const {
    mrWhiteIds,
    vencedor,
    rodadasVotacao,
    palpiteCorreto,
    totalJogadores,
    rodadaFinal,
    votosFinais,
  } = resultado;

  // ── Estatísticas do jogo ──────────────────────────────────────────────────

  const stats: MrWhiteSessaoStats = {
    mrWhiteIds,
    vencedor,
    rodadasVotacao,
    palpiteCorreto,
    totalJogadores,
  };

  registrarJogoFinalizado('mr-white', { mrWhite: stats });

  // ── Atualizar jogadores ───────────────────────────────────────────────────

  // Contabiliza votos recebidos
  for (const [jogadorId, votos] of Object.entries(votosFinais)) {
    if (votos > 0) {
      const atual = sessao.jogadores.find((j) => j.id === jogadorId);
      atualizarJogadorSessao(jogadorId as PlayerId, {
        vezesVotado: (atual?.vezesVotado ?? 0) + votos,
      });
    }
  }

  // Clutch: Mr White adivinhou a palavra
  if (palpiteCorreto === true && mrWhiteIds.length > 0) {
    for (const id of mrWhiteIds) {
      const atual = sessao.jogadores.find((j) => j.id === id);
      atualizarJogadorSessao(id, {
        clutchsMrWhite: (atual?.clutchsMrWhite ?? 0) + 1,
      });
    }
  }

  // ── Momentos ──────────────────────────────────────────────────────────────

  // Clutch: Mr White venceu adivinhando a palavra
  if (vencedor === 'mrwhite' && palpiteCorreto === true && mrWhiteIds.length > 0) {
    registrarMomento({
      tipo: 'clutch',
      jogoId: 'mr-white',
      rodada: rodadaFinal,
      jogadoresIds: mrWhiteIds,
      dados: { palpiteCorreto, rodadasVotacao },
    });
  }

  // Sobrevivente: Mr White sobreviveu mais de 2 rodadas de votação
  if (rodadasVotacao >= 3 && mrWhiteIds.length > 0) {
    registrarMomento({
      tipo: 'sobrevivente',
      jogoId: 'mr-white',
      rodada: rodadaFinal,
      jogadoresIds: mrWhiteIds,
      dados: { rodadasVotacao },
    });
  }

  // Virada: Mr White venceu (qualquer forma)
  if (vencedor === 'mrwhite') {
    registrarMomento({
      tipo: 'virada',
      jogoId: 'mr-white',
      rodada: rodadaFinal,
      jogadoresIds: mrWhiteIds,
      dados: { palpiteCorreto },
    });
  }

  // Unanimidade: todos votaram na mesma pessoa
  const votos = Object.entries(votosFinais);
  if (votos.length > 0) {
    const totalVotos = votos.reduce((acc, [, v]) => acc + v, 0);
    const maxVotos = Math.max(...votos.map(([, v]) => v));
    const alvosUnicos = votos.filter(([, v]) => v > 0).length;

    if (alvosUnicos === 1 && totalVotos >= 3) {
      const alvoId = votos.find(([, v]) => v === maxVotos)?.[0] as PlayerId;
      registrarMomento({
        tipo: 'unanimidade',
        jogoId: 'mr-white',
        rodada: rodadaFinal,
        jogadoresIds: alvoId ? [alvoId] : [],
        dados: { totalVotos },
      });
    }

    // Paranoia total: votos espalhados por 3+ pessoas sem maioria
    const maioria = Math.ceil(totalJogadores / 2);
    if (maxVotos < maioria && alvosUnicos >= 3) {
      registrarMomento({
        tipo: 'paranoia_total',
        jogoId: 'mr-white',
        rodada: rodadaFinal,
        jogadoresIds: [],
        dados: { votosFinais, totalJogadores },
      });
    }
  }

  // ── Reavaliação do estado da sessão ──────────────────────────────────────

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
