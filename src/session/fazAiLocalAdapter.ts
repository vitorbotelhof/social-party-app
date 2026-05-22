/**
 * Faz Aí Local Adapter — traduz turnos e resultado em sinais de sessão.
 *
 * Chamar em: turno finalizado + jogo finalizado.
 */

import type {
  CategoriaFazAiId,
  ResultadoFazAiFinalizado,
  RodadaResolvidaFazAi,
} from '@/games/faz-ai/types';
import type { PlayerId } from '@/engine/types';
import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { detectarVibe } from './vibeEngine';
import {
  atualizarJogadorSessao,
  getSessaoAtual,
  registrarJogoFinalizado,
  registrarMomento,
} from './sessionStore';
import type { FazAiSessaoStats } from './types';

function incrementar(
  jogadorId: PlayerId,
  campo: 'acertosFazAi' | 'passesFazAi' | 'turnosCaoticosFazAi',
  quantidade = 1,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;
  const atual = sessao.jogadores.find((j) => j.id === jogadorId);
  atualizarJogadorSessao(jogadorId, {
    [campo]: ((atual?.[campo] as number | undefined) ?? 0) + quantidade,
  });
}

function categoriasDoTurno(turno: RodadaResolvidaFazAi): CategoriaFazAiId[] {
  return [...new Set(turno.cartas.map((carta) => carta.categoria))];
}

export function processarTurnoFazAi(turno: RodadaResolvidaFazAi): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  incrementar(turno.jogadorId, 'acertosFazAi', turno.acertos);
  incrementar(turno.jogadorId, 'passesFazAi', turno.passes);

  const cartasRapidas = turno.cartas.filter(
    (carta) =>
      carta.resultado === 'acertou' &&
      carta.duracaoMs <= 5000 &&
      (carta.intensidadeSocial === 'social' ||
        carta.intensidadeSocial === 'caotica' ||
        carta.intensidadeSocial === 'absurda'),
  );

  for (const carta of cartasRapidas.slice(0, 2)) {
    registrarMomento({
      tipo: 'identificacao_imediata',
      jogoId: 'faz-ai',
      rodada: turno.rodada,
      jogadoresIds: [turno.jogadorId],
      dados: {
        cartaId: carta.cartaId,
        categoria: carta.categoria,
        duracaoMs: carta.duracaoMs,
      },
    });
  }

  const acertouCaosRapido = turno.cartas.some(
    (carta) =>
      carta.resultado === 'acertou' &&
      carta.duracaoMs <= 8000 &&
      (carta.energiaRodada === 'colapso' ||
        carta.intensidadeSocial === 'absurda'),
  );

  if (acertouCaosRapido) {
    registrarMomento({
      tipo: 'surto_faz_ai',
      jogoId: 'faz-ai',
      rodada: turno.rodada,
      jogadoresIds: [turno.jogadorId],
      dados: {
        energiaMedia: turno.energiaMedia,
        vergonhaMedia: turno.vergonhaMedia,
        categorias: categoriasDoTurno(turno),
      },
    });
  }

  const turnoCaotico = turno.energiaMedia >= 3 || turno.vergonhaMedia >= 3;
  if (turnoCaotico) {
    incrementar(turno.jogadorId, 'turnosCaoticosFazAi');
  }

  if (turnoCaotico && turno.cartas.length >= 3) {
    registrarMomento({
      tipo: 'vergonha_coletiva',
      jogoId: 'faz-ai',
      rodada: turno.rodada,
      jogadoresIds: [turno.jogadorId],
      dados: {
        energiaMedia: turno.energiaMedia,
        vergonhaMedia: turno.vergonhaMedia,
        totalCartas: turno.cartas.length,
      },
    });
  }

  if (turno.passes > turno.acertos && turno.cartas.length >= 3) {
    registrarMomento({
      tipo: 'atuacao_duvidosa',
      jogoId: 'faz-ai',
      rodada: turno.rodada,
      jogadoresIds: [turno.jogadorId],
      dados: {
        acertos: turno.acertos,
        passes: turno.passes,
        categorias: categoriasDoTurno(turno),
      },
    });
  }
}

export function processarResultadoFazAi(
  resultado: ResultadoFazAiFinalizado,
): void {
  const stats: FazAiSessaoStats = {
    totalTurnos: resultado.totalTurnos,
    totalCartas: resultado.totalCartas,
    jogadorMaisCaoticoId: resultado.jogadorMaisCaoticoId,
    quemMaisAcertaId: resultado.quemMaisAcertaId,
    quemAtuaPiorId: resultado.quemAtuaPiorId,
    energiaMediaGrupo: resultado.energiaMediaGrupo,
    vergonhaColetiva: resultado.vergonhaColetiva,
    categoriasFavoritas: resultado.categoriasFavoritas,
  };

  registrarJogoFinalizado('faz-ai', { fazAi: stats });

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
