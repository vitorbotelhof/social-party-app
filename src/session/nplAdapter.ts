/**
 * NPL Adapter — traduz turnos e resultado de Na Ponta da Língua
 * em momentos e estatísticas que o sistema de sessão entende.
 *
 * Chamar em: turno finalizado + jogo finalizado.
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
import type { NPLSessaoStats } from './types';
import type { PlayerId } from '@/engine/types';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export interface TurnoNPL {
  rodada: number;
  jogadorId: PlayerId;
  /** Número de cartas acertadas neste turno. */
  acertos: number;
  /** Número de cartas erradas neste turno. */
  erros: number;
  /** Número de cartas puladas neste turno. */
  puladas: number;
  /** Total de cartas disponíveis no turno. */
  totalCartas: number;
}

export interface ResultadoNPL {
  totalTurnos: number;
  melhorStreak: number;
  jogadorMaisAcertos: PlayerId | null;
  taxaAcerto: number; // 0.0–1.0
}

// ─── Processamento de turno ───────────────────────────────────────────────────

export function processarTurnoNPL(turno: TurnoNPL): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const { jogadorId, acertos, erros, rodada } = turno;
  const atual = sessao.jogadores.find((j) => j.id === jogadorId);

  // Atualiza pontos do jogador
  atualizarJogadorSessao(jogadorId, {
    pontosTotais: (atual?.pontosTotais ?? 0) + acertos,
  });

  // Colapso: mais erros que acertos
  if (erros > acertos && (acertos + erros) >= 3) {
    atualizarJogadorSessao(jogadorId, {
      colapsos: (atual?.colapsos ?? 0) + 1,
    });

    registrarMomento({
      tipo: 'colapso_npl',
      jogoId: 'na-ponta-da-lingua',
      rodada,
      jogadoresIds: [jogadorId],
      dados: { acertos, erros, totalCartas: turno.totalCartas },
    });
  }

  // Perfeito: nenhum erro e pelo menos 4 cartas
  if (erros === 0 && acertos >= 4) {
    registrarMomento({
      tipo: 'perfeito',
      jogoId: 'na-ponta-da-lingua',
      rodada,
      jogadoresIds: [jogadorId],
      dados: { acertos, totalCartas: turno.totalCartas },
    });
  }
}

// ─── Processamento de resultado ───────────────────────────────────────────────

export function processarResultadoNPL(resultado: ResultadoNPL): void {
  const stats: NPLSessaoStats = {
    totalTurnos: resultado.totalTurnos,
    melhorStreak: resultado.melhorStreak,
    jogadorMaisAcertos: resultado.jogadorMaisAcertos,
    taxaAcerto: resultado.taxaAcerto,
  };

  registrarJogoFinalizado('na-ponta-da-lingua', { npl: stats });

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
