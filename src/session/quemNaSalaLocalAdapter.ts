import type { PlayerId } from '@/engine/types';
import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import {
  atualizarJogadorSessao,
  getSessaoAtual,
  registrarJogoFinalizado,
  registrarMomento,
} from './sessionStore';
import type { QuemNaSalaSessaoStats } from './types';
import { detectarVibe } from './vibeEngine';

export interface RodadaQuemNaSala {
  numero: number;
  vencedorId: PlayerId | null;
  empate: boolean;
  totalVotos: number;
  maiorQuantidadeVotos: number;
}

export interface ResultadoQuemNaSala {
  totalRodadas: number;
  jogadorMaisVotadoId: PlayerId | null;
  totalEmpates: number;
  perguntasPuladas: number;
  categorias: string[];
  duracaoMs: number;
  duracaoMediaRodadaMs: number;
}

export function processarRodadaQuemNaSala(rodada: RodadaQuemNaSala): void {
  if (rodada.vencedorId) {
    const jogador = getSessaoAtual()?.jogadores.find(
      (item) => item.id === rodada.vencedorId,
    );
    atualizarJogadorSessao(rodada.vencedorId, {
      vezesJulgado: (jogador?.vezesJulgado ?? 0) + 1,
    });
  }
  if (rodada.empate) {
    registrarMomento({
      tipo: 'paranoia_total',
      jogoId: 'quem-na-sala',
      rodada: rodada.numero,
      jogadoresIds: [],
      dados: { totalVotos: rodada.totalVotos },
    });
  } else if (
    rodada.totalVotos > 2 &&
    rodada.maiorQuantidadeVotos >= rodada.totalVotos - 1
  ) {
    registrarMomento({
      tipo: 'unanimidade',
      jogoId: 'quem-na-sala',
      rodada: rodada.numero,
      jogadoresIds: rodada.vencedorId ? [rodada.vencedorId] : [],
      dados: { totalVotos: rodada.totalVotos },
    });
  }
}

export function processarResultadoQuemNaSala(
  resultado: ResultadoQuemNaSala,
): void {
  const stats: QuemNaSalaSessaoStats = { ...resultado };
  registrarJogoFinalizado('quem-na-sala', { quemNaSala: stats });
  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
