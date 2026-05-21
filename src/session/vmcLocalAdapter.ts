/**
 * VMC Local Adapter — traduz rodadas e resultado de Você Me Conhece?
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
import type { VMCSessaoStats } from './types';
import type { PlayerId } from '@/engine/types';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export interface RodadaVMC {
  numero: number;
  ranqueadorId: PlayerId;
  cartaoId: string;
  tipoEscolha: 'top1' | 'last';
  escolha: string;
  previsoes: Record<PlayerId, string>;
  acertos: PlayerId[];
  leitura: string;
}

export interface ResultadoVMC {
  totalRodadas: number;
  totalJogadores: number;
  acertosPorJogador: Record<PlayerId, number>;
  acertosComoRanqueador: Record<PlayerId, number>;
  melhorLeitorId: PlayerId | null;
  menosPrevistoId: PlayerId | null;
  leiturasPerfeitasTotal: number;
  desconhecidosTotal: number;
  categorias: string[];
}

// ─── Processamento de rodada ──────────────────────────────────────────────────

export function processarRodadaVMC(rodada: RodadaVMC): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const { acertos, leitura, ranqueadorId, previsoes } = rodada;
  const totalPrevisores = Object.keys(previsoes).length;

  // Atualiza acertosLeitura de quem acertou
  for (const jogadorId of acertos) {
    const atual = sessao.jogadores.find((j) => j.id === jogadorId);
    atualizarJogadorSessao(jogadorId, {
      acertosLeitura: (atual?.acertosLeitura ?? 0) + 1,
    });
  }

  // Momento: leitura_perfeita_vmc — todos acertaram
  if (leitura === 'leitura_perfeita' && totalPrevisores >= 2) {
    registrarMomento({
      tipo: 'leitura_perfeita_vmc',
      jogoId: 'voce-me-conhece',
      rodada: rodada.numero,
      jogadoresIds: [ranqueadorId],
      dados: { cartaoId: rodada.cartaoId, acertos },
    });
  }

  // Momento: desconhecido_vmc — ninguém acertou
  if (leitura === 'desconhecido' && totalPrevisores >= 2) {
    const atual = sessao.jogadores.find((j) => j.id === ranqueadorId);
    atualizarJogadorSessao(ranqueadorId, {
      vezesDesconhecido: (atual?.vezesDesconhecido ?? 0) + 1,
    });
    registrarMomento({
      tipo: 'desconhecido_vmc',
      jogoId: 'voce-me-conhece',
      rodada: rodada.numero,
      jogadoresIds: [ranqueadorId],
      dados: { cartaoId: rodada.cartaoId, escolha: rodada.escolha },
    });
  }
}

// ─── Processamento de resultado ───────────────────────────────────────────────

export function processarResultadoVMC(resultado: ResultadoVMC): void {
  const { totalRodadas, leiturasPerfeitasTotal } = resultado;

  // Momento: sinergia — mais de 70% das rodadas foram leitura_perfeita
  if (totalRodadas > 0 && leiturasPerfeitasTotal / totalRodadas > 0.7) {
    registrarMomento({
      tipo: 'sinergia_vmc',
      jogoId: 'voce-me-conhece',
      rodada: totalRodadas,
      jogadoresIds: resultado.melhorLeitorId ? [resultado.melhorLeitorId] : [],
      dados: { leiturasPerfeitasTotal, totalRodadas },
    });
  }

  const stats: VMCSessaoStats = {
    totalRodadas: resultado.totalRodadas,
    leiturasPerfeitasTotal: resultado.leiturasPerfeitasTotal,
    desconhecidosTotal: resultado.desconhecidosTotal,
    melhorLeitorId: resultado.melhorLeitorId,
    menosPrevistoId: resultado.menosPrevistoId,
    categorias: resultado.categorias,
  };

  registrarJogoFinalizado('voce-me-conhece', { vmc: stats });

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
