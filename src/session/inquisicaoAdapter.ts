/**
 * Inquisição Adapter — traduz loops e resultado de Inquisição
 * em momentos, estatísticas e sinais que o sistema de sessão entende.
 *
 * Integração:
 *   processarLoopInquisicao()     → chamar ao fim de cada loop (apurando → noite/finalizado)
 *   processarResultadoInquisicao() → chamar quando subFase === 'finalizado'
 *
 * Momento → temperatura:
 *   corrupcao_revelada  (peso 2) → corrupção aquece fortemente
 *   inversao            (peso 2) → vitória corrompidos aquece muito
 *   paranoia_maxima     (peso 1) → empate caótico
 *   colapso_inquisicao  (peso 2) → falso positivo — eliminação de inocente
 *
 * Grupo paranoico evolui mais rápido (thresholds -1 no emotionalTracker).
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
import type { InquisicaoSessaoStats } from './types';
import type { PlayerId } from '@/engine/types';
import type {
  IntensidadeInquisicao,
  PapelInquisicao,
} from '@/games/inquisicao/types';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

/**
 * Dados de um único loop de Inquisição.
 * Fornece sinais para detecção de momentos por loop.
 */
export interface LoopInquisicao {
  /** Número do loop atual (começa em 1). */
  loop: number;

  // ── Votação ────────────────────────────────────────────────────────────────

  /** Votos recebidos por cada jogador neste loop. */
  votosFinais: Record<PlayerId, number>;
  /** Jogador eliminado por votação. null = empate, ninguém eliminado. */
  eliminadoId: PlayerId | null;
  /** Papel original do eliminado — para detectar falso positivo. */
  eliminadoEraPapel: PapelInquisicao | null;
  /** Total de jogadores no loop (incluindo o eliminado, antes da remoção). */
  totalAtivos: number;

  // ── Noite ──────────────────────────────────────────────────────────────────

  /** IDs de jogadores convertidos para corrompidos neste loop. */
  contaminados: PlayerId[];
  /** ID do alvo da ação de eliminar (antes de qualquer bloqueio). null = sem ação. */
  eliminarAlvoId: PlayerId | null;
  /** Guardião bloqueou a ação de eliminar neste loop. */
  eliminarBloqueado: boolean;
}

/**
 * Dados finais de uma partida de Inquisição.
 * Fornece a visão completa para estatísticas e dossiê.
 */
export interface ResultadoInquisicao {
  /** Facção vencedora. */
  vencedor: 'inocentes' | 'corrompidos';
  /** Número total de loops jogados. */
  totalLoops: number;
  /** Intensidade configurada antes da partida. */
  intensidade: IntensidadeInquisicao;
  /** Total de jogadores na partida. */
  totalJogadores: number;

  /**
   * Papel original e loop de conversão por jogador.
   * Fonte: revelacaoFinal.papeisPorJogador do EstadoFirebaseInquisicao.
   */
  papeisPorJogador: Record<PlayerId, {
    papelOriginal: PapelInquisicao;
    convertidoNoLoop: number | null;
  }>;

  /**
   * Jogadores eliminados por votação, em ordem cronológica.
   * Inclui o papel original para diferenciar acertos de falsos positivos.
   */
  eliminadosPorVotacao: Array<{
    jogadorId: PlayerId;
    loop: number;
    papelOriginal: PapelInquisicao;
  }>;

  /**
   * Jogadores que executaram ações noturnas como corrompidos.
   * Mapa: jogadorId → número de ações executadas.
   */
  acoesCorrompidas: Record<PlayerId, number>;
}

// ─── Processamento por loop ───────────────────────────────────────────────────

/**
 * Processa o encerramento de um loop de Inquisição.
 *
 * Detecta e registra momentos:
 *   - paranoia_maxima       → empate na votação (eliminadoId === null)
 *   - colapso_inquisicao    → votação eliminou um inocente ou guardião
 *   - corrupcao_revelada    → inocente foi contaminado e se tornou corrompido
 *
 * Chamar ao fim do processamento de cada loop — quando subFase transita
 * de 'apurando' para 'noite' ou 'finalizado'.
 */
export function processarLoopInquisicao(loop: LoopInquisicao): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const {
    loop: numLoop,
    votosFinais,
    eliminadoId,
    eliminadoEraPapel,
    totalAtivos,
    contaminados,
    eliminarAlvoId,
    eliminarBloqueado,
  } = loop;

  // ── Votação: empate / nenhuma maioria ────────────────────────────────────────

  if (eliminadoId === null) {
    const entradas = Object.entries(votosFinais);
    const maxVotos = entradas.reduce((acc, [, v]) => Math.max(acc, v), 0);
    const alvosComVoto = entradas.filter(([, v]) => v > 0).length;

    // Empate ou votos muito dispersos sem maioria clara
    if (alvosComVoto >= 2 && maxVotos < Math.ceil(totalAtivos / 2)) {
      registrarMomento({
        tipo: 'paranoia_maxima',
        jogoId: 'inquisicao',
        rodada: numLoop,
        jogadoresIds: [],
        dados: { votosFinais, totalAtivos, maxVotos, alvosComVoto },
      });
    }
  }

  // ── Votação: falso positivo (inocente eliminado) ──────────────────────────────

  if (
    eliminadoId !== null &&
    eliminadoEraPapel !== null &&
    (eliminadoEraPapel === 'inocente' || eliminadoEraPapel === 'guardiao')
  ) {
    // Verificar se houve unanimidade ou maioria clara → colapso mais dramático
    const totalVotos = Object.values(votosFinais).reduce((a, v) => a + v, 0);
    const votosNoEliminado = votosFinais[eliminadoId] ?? 0;
    const maioria = votosNoEliminado >= Math.ceil(totalAtivos / 2);

    registrarMomento({
      tipo: 'colapso_inquisicao',
      jogoId: 'inquisicao',
      rodada: numLoop,
      jogadoresIds: [eliminadoId],
      dados: {
        papelOriginal: eliminadoEraPapel,
        votosRecebidos: votosNoEliminado,
        totalVotos,
        maioria,
      },
    });

    // Atualiza contador de eliminados do jogador
    const jogador = sessao.jogadores.find((j) => j.id === eliminadoId);
    atualizarJogadorSessao(eliminadoId, {
      vezesEliminado: (jogador?.vezesEliminado ?? 0) + 1,
    });
  }

  // ── Votação: corrompido eliminado corretamente ────────────────────────────────

  if (eliminadoId !== null && eliminadoEraPapel === 'corrompido') {
    // Verifica unanimidade (todos concordaram no corrompido)
    const totalVotos = Object.values(votosFinais).reduce((a, v) => a + v, 0);
    const alvosComVoto = Object.values(votosFinais).filter((v) => v > 0).length;
    if (alvosComVoto === 1 && totalVotos >= 3) {
      registrarMomento({
        tipo: 'unanimidade',
        jogoId: 'inquisicao',
        rodada: numLoop,
        jogadoresIds: [eliminadoId],
        dados: { totalVotos, corrompidoElimindado: true },
      });
    }
  }

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
      },
    });

    const jogador = sessao.jogadores.find((j) => j.id === jogadorId);
    atualizarJogadorSessao(jogadorId, {
      vezesContaminado: (jogador?.vezesContaminado ?? 0) + 1,
    });
  }

  // ── Reavaliação parcial do estado emocional ───────────────────────────────────
  // Após cada loop, o tracker recalcula a temperatura com base nos novos momentos.
  // O grupo paranoico (detectado aqui) terá thresholds reduzidos no próximo cálculo.

  atualizarEstadoEmocional();
  reavaliarGrupo();
}

// ─── Processamento de resultado final ────────────────────────────────────────

/**
 * Processa o encerramento de uma partida de Inquisição.
 *
 * Detecta e registra:
 *   - inversao   → corrompidos venceram (impacto emocional forte)
 *   - Estatísticas completas no JogoSessao
 *   - Sinais de ações corrompidas por jogador
 *
 * Chamar quando subFase === 'finalizado' — uma única vez.
 */
export function processarResultadoInquisicao(resultado: ResultadoInquisicao): void {
  const sessao = getSessaoAtual();
  if (!sessao) return;

  const {
    vencedor,
    totalLoops,
    intensidade,
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
    (e) => e.papelOriginal === 'inocente' || e.papelOriginal === 'guardiao',
  ).length;

  const eliminadosCorrompidos = eliminadosPorVotacao.filter(
    (e) => e.papelOriginal === 'corrompido',
  ).length;

  // ── Registrar jogo finalizado ────────────────────────────────────────────────

  const stats: InquisicaoSessaoStats = {
    vencedor,
    totalLoops,
    intensidade,
    totalContaminacoes,
    eliminadosInocentes,
    eliminadosCorrompidos,
  };

  registrarJogoFinalizado('inquisicao', { inquisicao: stats });

  // ── Momento: inversão (corrompidos venceram) ─────────────────────────────────
  //
  // Peso 2 no tracker → aquece fortemente. Se a sessão estava morna, vai para
  // quente. Se estava quente com mais caos, pode ir para colapso.

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
        intensidade,
        totalJogadores,
      },
    });
  }

  // ── Atualizar sinais de ações corrompidas por jogador ────────────────────────
  //
  // Alimenta o destaque "o agente da corrupção" no dossiê.

  for (const [jogadorId, qtd] of Object.entries(acoesMap) as [PlayerId, number][]) {
    if (qtd <= 0) continue;
    const jogador = sessao.jogadores.find((j) => j.id === jogadorId);
    if (!jogador) continue;
    atualizarJogadorSessao(jogadorId, {
      acoesCorrompidas: (jogador.acoesCorrompidas ?? 0) + qtd,
    });
  }

  // ── Reavaliação final da sessão ──────────────────────────────────────────────

  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}

// ─── Helpers para integração com TelaInquisicao ───────────────────────────────

/**
 * Extrai os dados de LoopInquisicao a partir do estado público do Firebase.
 * Convenience wrapper — evita que a tela faça a transformação manualmente.
 *
 * @param estadoPublico  EstadoFirebaseInquisicao após resolução do loop
 * @param loop           Número do loop atual
 * @param eliminadoEraPapel  Papel do eliminado (do estado privado do host)
 * @param contaminados   Lista de jogadores contaminados neste loop (do host)
 * @param acoesNoturnas  Mapa de jogadorId → ação executada na noite
 */
export function construirLoopInquisicao(
  estadoPublico: {
    votacaoAtual: {
      votantesConfirmados: Record<PlayerId, boolean>;
      alvoId?: PlayerId | null;
      resolvida?: boolean;
    } | null;
    eliminados: Array<{ jogadorId: PlayerId }>;
    jogadoresAtivos: PlayerId[];
    loop: number;
  },
  loop: number,
  eliminadoEraPapel: PapelInquisicao | null,
  contaminados: PlayerId[],
  eliminarAlvoId: PlayerId | null,
  eliminarBloqueado: boolean,
): LoopInquisicao {
  // Reconstrói mapa de votos a partir dos votantes confirmados
  // Nota: votos individuais são privados. Aqui só temos o alvoId do resultado.
  // Usamos o alvoId da votação resolvida como proxy do voto majoritário.
  const eliminadoId =
    estadoPublico.votacaoAtual?.alvoId ??
    (estadoPublico.eliminados.length > 0
      ? estadoPublico.eliminados[estadoPublico.eliminados.length - 1]?.jogadorId ?? null
      : null);

  const totalAtivos = estadoPublico.jogadoresAtivos.length;

  // Reconstrói votosFinais como proxy — concentrado no alvo se houve eliminação
  const votosFinais: Record<PlayerId, number> = {};
  if (eliminadoId) {
    const totalVotantes = Object.values(estadoPublico.votacaoAtual?.votantesConfirmados ?? {}).filter(Boolean).length;
    votosFinais[eliminadoId] = totalVotantes;
  }

  return {
    loop,
    votosFinais,
    eliminadoId: eliminadoId ?? null,
    eliminadoEraPapel,
    totalAtivos,
    contaminados,
    eliminarAlvoId,
    eliminarBloqueado,
  };
}
