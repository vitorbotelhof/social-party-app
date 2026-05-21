/**
 * Inquisição Local Adapter — traduz os callbacks do engine local em
 * momentos, estatísticas e sinais que o sistema de sessão entende.
 *
 * Integração:
 *   processarLoopLocalInquisicao()      → chamar via engine.onLoopResolvido
 *   processarResultadoLocalInquisicao() → chamar via engine.onJogoFinalizado
 *
 * Diferenças em relação ao adapter realtime (inquisicaoAdapter.ts):
 *   - Sem votosFinais por jogador (votação local é física — apenas eliminado)
 *   - Usa PapelLocal em vez de PapelInquisicao (mesmos valores, tipo local)
 *   - ModoLocal mapeado para IntensidadeInquisicao (mesmos valores)
 *
 * Momento → temperatura (pesos do emotionalTracker):
 *   corrupcao_revelada  (peso 2) → inocente contaminado
 *   inversao            (peso 2) → corrompidos venceram
 *   paranoia_maxima     (peso 1) → nenhuma eliminação no loop
 *   colapso_inquisicao  (peso 2) → inocente eliminado por engano
 */

import {
  registrarJogoFinalizado,
  registrarMomento,
  atualizarJogadorSessao,
  getSessaoAtual,
} from '@/session/sessionStore';
import { atualizarEstadoEmocional } from '@/session/emotionalTracker';
import { reavaliarGrupo } from '@/session/groupProfile';
import { detectarVibe } from '@/session/vibeEngine';
import type { InquisicaoSessaoStats } from '@/session/types';
import type { LoopLocalResolvido, ResultadoLocalFinalizado } from './types';

// ─── Processamento por loop ───────────────────────────────────────────────────

/**
 * Processa o encerramento de um loop de Inquisição Local.
 *
 * Detecta e registra momentos:
 *   - paranoia_maxima       → nenhum eliminado por votação no loop
 *   - colapso_inquisicao    → inocente ou guardião eliminado por votação
 *   - corrupcao_revelada    → jogador contaminado (convertido neste loop)
 *
 * Chamar via engine.onLoopResolvido ao fim de cada loop.
 */
export function processarLoopLocalInquisicao(loop: LoopLocalResolvido): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const {
    loop: numLoop,
    eliminadoId,
    eliminadoEraPapel,
    totalAtivos,
    contaminados,
    eliminarAlvoId,
    eliminarBloqueado,
  } = loop;

  // ── Votação: nenhum eliminado ────────────────────────────────────────────────
  // Em modo local, nenhuma eliminação significa empate ou situação ambígua.
  // Registrar apenas se houve pelo menos 1 loop de discussão (loop > 1).

  if (eliminadoId === null && numLoop > 1) {
    registrarMomento({
      tipo: 'paranoia_maxima',
      jogoId: 'inquisicao',
      rodada: numLoop,
      jogadoresIds: [],
      dados: { totalAtivos, modoLocal: true },
    });
  }

  // ── Votação: falso positivo (inocente ou guardião eliminado) ─────────────────

  if (
    eliminadoId !== null &&
    eliminadoEraPapel !== null &&
    (eliminadoEraPapel === 'inocente' || eliminadoEraPapel === 'guardiao')
  ) {
    registrarMomento({
      tipo: 'colapso_inquisicao',
      jogoId: 'inquisicao',
      rodada: numLoop,
      jogadoresIds: [eliminadoId],
      dados: {
        papelOriginal: eliminadoEraPapel,
        totalAtivos,
        modoLocal: true,
      },
    });

    const jogador = sessao.jogadores.find((j) => j.id === eliminadoId);
    atualizarJogadorSessao(eliminadoId, {
      vezesEliminado: (jogador?.vezesEliminado ?? 0) + 1,
    });
  }

  // ── Votação: corrompido eliminado corretamente ────────────────────────────────
  // Sem unanimidade detectável em modo local — sem tracking de votos individuais.
  // Registrado apenas no resultado final (eliminadosCorrompidos).

  // ── Noite: contaminação ───────────────────────────────────────────────────────

  for (const jogadorId of contaminados) {
    registrarMomento({
      tipo: 'corrupcao_revelada',
      jogoId: 'inquisicao',
      rodada: numLoop,
      jogadoresIds: [jogadorId],
      dados: {
        eliminarBloqueado,
        eliminarAlvoId,
        modoLocal: true,
      },
    });

    const jogador = sessao.jogadores.find((j) => j.id === jogadorId);
    atualizarJogadorSessao(jogadorId, {
      vezesContaminado: (jogador?.vezesContaminado ?? 0) + 1,
    });
  }

  // ── Reavaliação parcial ───────────────────────────────────────────────────────

  atualizarEstadoEmocional();
  reavaliarGrupo();
}

// ─── Processamento de resultado final ────────────────────────────────────────

/**
 * Processa o encerramento de uma partida de Inquisição Local.
 *
 * Detecta e registra:
 *   - inversao   → corrompidos venceram
 *   - Estatísticas completas no JogoSessao
 *   - Ações corrompidas por jogador
 *
 * Chamar via engine.onJogoFinalizado uma única vez.
 */
export function processarResultadoLocalInquisicao(
  resultado: ResultadoLocalFinalizado,
  modo: string,
): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const {
    vencedor,
    totalLoops,
    totalJogadores,
    papeisPorJogador,
    eliminadosPorVotacao,
    acoesCorrompidas: acoesMap,
  } = resultado;

  // ── Estatísticas de contaminação ─────────────────────────────────────────────

  const totalContaminacoes = Object.values(papeisPorJogador).filter(
    (p) => p.convertidoNoLoop !== null,
  ).length;

  const eliminadosInocentes = eliminadosPorVotacao.filter(
    (e) => e.papelNoMomento === 'inocente' || e.papelNoMomento === 'guardiao',
  ).length;

  const eliminadosCorrompidos = eliminadosPorVotacao.filter(
    (e) => e.papelNoMomento === 'corrompido',
  ).length;

  // ── Registrar jogo finalizado ────────────────────────────────────────────────

  // ModoLocal ('leve' | 'padrao' | 'paranoia') é compatível com IntensidadeInquisicao.
  const stats: InquisicaoSessaoStats = {
    vencedor,
    totalLoops,
    intensidade: modo as InquisicaoSessaoStats['intensidade'],
    totalContaminacoes,
    eliminadosInocentes,
    eliminadosCorrompidos,
  };

  registrarJogoFinalizado('inquisicao', { inquisicao: stats });

  // ── Momento: inversão (corrompidos venceram) ─────────────────────────────────

  if (vencedor === 'corrompidos') {
    registrarMomento({
      tipo: 'inversao',
      jogoId: 'inquisicao',
      rodada: totalLoops,
      jogadoresIds: [],
      dados: {
        totalLoops,
        totalContaminacoes,
        eliminadosInocentes,
        totalJogadores,
        modoLocal: true,
      },
    });
  }

  // ── Ações corrompidas por jogador ────────────────────────────────────────────

  for (const [jogadorId, qtd] of Object.entries(acoesMap)) {
    if (qtd <= 0) continue;
    const jogador = sessao.jogadores.find((j) => j.id === jogadorId);
    if (!jogador) continue;
    atualizarJogadorSessao(jogadorId, {
      acoesCorrompidas: (jogador.acoesCorrompidas ?? 0) + qtd,
    });
  }

  // ── Reavaliação final ────────────────────────────────────────────────────────

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
