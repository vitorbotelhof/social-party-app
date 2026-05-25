/**
 * DUVIDO — ENGINE LOCAL (React)
 *
 * Hook `useDuviidoLocal` — camada React sobre o engine puro.
 *
 * Responsabilidades:
 *   1. Estado React via useState (wrappando processarEvento)
 *   2. Progressão entre múltiplos rankings na mesma sessão
 *   3. Rastreamento de stats por ranking e por sessão
 *   4. Disparo dos 4 callbacks de sessão (DuvidoCallbacks)
 *
 * Separação de responsabilidades:
 *   engine.ts     — lógica pura, sem React, sem efeitos colaterais
 *   localEngine.ts — estado React + callbacks + progressão de sessão
 *   adapter.ts    — tradução dos callbacks para sinais do SessionStore
 *
 * Regra de encapsulamento:
 *   O ranking completo (com itens) é mantido APENAS neste hook.
 *   O estado público (EstadoDuvido) nunca expõe `itens` antes de reveal_final.
 */

import { useState, useRef, useCallback, type MutableRefObject } from 'react';
import type {
  DuvidoCallbacks,
  EstadoDuvido,
  EventoDuvido,
  JogoFinalizadoParams,
  PlayerId,
  RankingDuvido,
  RankingFinalizadoParams,
} from '../types';
import { processarEvento, criarEstadoInicial } from '../engine';
import type { ConfiguracaoDuvido } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stats acumulados por ranking — zerados ao iniciar cada novo ranking.
 * Mantidos em ref (não causam re-render).
 */
interface StatsRanking {
  /** Quantos itens cada jogador disse neste ranking. */
  itensDitosPorJogador: Record<PlayerId, number>;

  /** Duvidou e estava certo (item inválido). */
  dubidasCertasPorJogador: Record<PlayerId, number>;

  /** Duvidou de item válido — pagou o preço. */
  dubidasErradasPorJogador: Record<PlayerId, number>;

  /** Ordem de eliminação — IDs em sequência. */
  ordemEliminacao: PlayerId[];

  /** Total de confrontos de "duvido" neste ranking. */
  totalDuvidas: number;
}

/**
 * Stats acumulados na sessão inteira — não zerados entre rankings.
 */
interface StatsSession {
  /** Rankings vencidos por cada jogador. */
  rankingsVencidosPorJogador: Record<PlayerId, number>;

  /** Dúvidas certas por jogador na sessão toda. */
  dubidasCertasTotaisPorJogador: Record<PlayerId, number>;

  /** Itens aceitos sem dúvida por jogador (para detectar bluffadores). */
  itensAceitosSemDuvidaPorJogador: Record<PlayerId, number>;

  /** Total de "duvido" na sessão. */
  totalDuvidas: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE PÚBLICA DO HOOK
// ─────────────────────────────────────────────────────────────────────────────

export interface UseDuviidoLocalConfig {
  configuracao: ConfiguracaoDuvido;

  /**
   * Rankings selecionados para esta sessão, em ordem de jogo.
   * Gerados por `selecionarRankings()` em rankingSelection.ts.
   * Tamanho deve ser igual a `configuracao.numeroDeRankings`.
   */
  rankingsSelecionados: RankingDuvido[];

  /** Callbacks disparados em eventos-chave — opcionais. */
  callbacks?: DuvidoCallbacks;
}

export interface UseDuviidoLocalReturn {
  /** Estado público atual — consumido pela UI sem restrição. */
  estado: EstadoDuvido;

  /**
   * Ranking completo atual (com itens).
   * Exposto para utilitários da UI que precisam verificar itens localmente
   * (ex: verificarItem, itemJaFoiDito) sem enviar evento ao engine.
   */
  rankingAtualCompleto: RankingDuvido;

  /**
   * Despacha um evento ao engine.
   * Idempotente — eventos inválidos para a fase atual são ignorados.
   */
  despachar: (evento: EventoDuvido) => void;

  /**
   * Avança para o próximo ranking após a fase `finalizado`.
   *
   * Comportamento:
   *   - Se há mais rankings: cria estado inicial para o próximo e reinicia.
   *   - Se era o último: dispara onJogoFinalizado e seta jogoEncerrado = true.
   *
   * Chamado pela UI após o host confirmar que o grupo está pronto.
   */
  iniciarProximoRanking: () => void;

  /**
   * true após todos os rankings serem jogados.
   * A UI deve navegar para a tela de resultados da sessão.
   */
  jogoEncerrado: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE STATS
// ─────────────────────────────────────────────────────────────────────────────

function criarStatsRanking(): StatsRanking {
  return {
    itensDitosPorJogador: {},
    dubidasCertasPorJogador: {},
    dubidasErradasPorJogador: {},
    ordemEliminacao: [],
    totalDuvidas: 0,
  };
}

function criarStatsSession(jogadores: string[]): StatsSession {
  const ids = jogadores.map((_, i) => `jogador-${i}`);
  const zerado = Object.fromEntries(ids.map((id) => [id, 0]));
  return {
    rankingsVencidosPorJogador: { ...zerado },
    dubidasCertasTotaisPorJogador: { ...zerado },
    itensAceitosSemDuvidaPorJogador: { ...zerado },
    totalDuvidas: 0,
  };
}

function incrementar(
  record: Record<PlayerId, number>,
  id: PlayerId,
  delta = 1,
): Record<PlayerId, number> {
  return { ...record, [id]: (record[id] ?? 0) + delta };
}

/**
 * Calcula temperatura emocional da sessão com base nos stats.
 *
 * - 'caótico'     → muitas dúvidas em relação ao nº de rankings
 * - 'competitivo' → um jogador dominou (≥60% das vitórias)
 * - 'equilibrado' → nenhum extremo
 */
function calcularTemperatura(
  stats: StatsSession,
  totalRankings: number,
): JogoFinalizadoParams['temperatura'] {
  const dubidasPorRanking = stats.totalDuvidas / Math.max(totalRankings, 1);
  if (dubidasPorRanking >= 4) return 'caótico';

  const vitorias = Object.values(stats.rankingsVencidosPorJogador);
  const maximo = Math.max(...vitorias, 0);
  if (maximo >= totalRankings * 0.6 && totalRankings >= 2) return 'competitivo';

  return 'equilibrado';
}

/**
 * Encontra o jogador com mais dúvidas certas (melhor leitor de bluff).
 * Retorna null em empate ou se nenhum duvidou.
 */
function encontrarMelhorLeitor(
  dubidasCertas: Record<PlayerId, number>,
): PlayerId | null {
  let melhorId: PlayerId | null = null;
  let melhorCount = 0;
  let empate = false;

  for (const [id, count] of Object.entries(dubidasCertas)) {
    if (count > melhorCount) {
      melhorId = id;
      melhorCount = count;
      empate = false;
    } else if (count === melhorCount && melhorCount > 0) {
      empate = true;
    }
  }

  return empate ? null : melhorId;
}

/**
 * Encontra o maior bluffador — quem mais teve itens aceitos sem ser duvidado.
 * Retorna null em empate ou se ninguém bluffou.
 */
function encontrarMaiorBluffer(
  itensAceitos: Record<PlayerId, number>,
): PlayerId | null {
  let melhorId: PlayerId | null = null;
  let melhorCount = 0;
  let empate = false;

  for (const [id, count] of Object.entries(itensAceitos)) {
    if (count > melhorCount) {
      melhorId = id;
      melhorCount = count;
      empate = false;
    } else if (count === melhorCount && melhorCount > 0) {
      empate = true;
    }
  }

  return empate ? null : melhorId;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPARO DE CALLBACKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta a transição entre dois estados e dispara o callback correto.
 *
 * Chamada após cada despacho, com o estado anterior e o novo estado.
 * Não muta nenhum dos estados.
 *
 * @param estadoAnterior Estado antes do evento
 * @param novoEstado     Estado após o evento
 * @param ranking        Ranking completo atual (com itens)
 * @param callbacks      Callbacks registrados pelo adapter
 * @param statsRankRef   Ref das stats do ranking atual (mutado aqui)
 * @param statsSessionRef Ref das stats de sessão (mutado aqui)
 */
function processarTransicao(
  estadoAnterior: EstadoDuvido,
  novoEstado: EstadoDuvido,
  ranking: RankingDuvido,
  callbacks: DuvidoCallbacks,
  statsRankRef: MutableRefObject<StatsRanking>,
  statsSessionRef: MutableRefObject<StatsSession>,
): void {
  const faseDe = estadoAnterior.fase;
  const fasePara = novoEstado.fase;

  // ── Item aceito sem dúvida ────────────────────────────────────────────────
  // Transição: aguardando_decisao → aguardando_resposta (via Aceito)
  if (faseDe === 'aguardando_decisao' && fasePara === 'aguardando_resposta') {
    const item = estadoAnterior.ultimoItemDito ?? '';
    const quemDisse = estadoAnterior.jogadorAtivoId;

    // Stats ranking
    statsRankRef.current.itensDitosPorJogador = incrementar(
      statsRankRef.current.itensDitosPorJogador,
      quemDisse,
    );

    // Stats sessão — item aceito sem dúvida conta como "bluff potencial"
    statsSessionRef.current.itensAceitosSemDuvidaPorJogador = incrementar(
      statsSessionRef.current.itensAceitosSemDuvidaPorJogador,
      quemDisse,
    );

    callbacks.onItemAceito?.({
      rankingId: ranking.id,
      rankingAtual: novoEstado.rankingAtual,
      jogadorAtivoId: novoEstado.jogadorAtivoId,
      proximoJogadorId: novoEstado.proximoJogadorId,
      item,
      totalItensDitos: novoEstado.itensDitos.length,
    });
  }

  // ── Item aceito com ranking esgotado ─────────────────────────────────────
  // Transição: aguardando_decisao → reveal_final (via Aceito com ranking cheio)
  if (faseDe === 'aguardando_decisao' && fasePara === 'reveal_final') {
    const item = estadoAnterior.ultimoItemDito ?? '';
    const quemDisse = estadoAnterior.jogadorAtivoId;

    statsRankRef.current.itensDitosPorJogador = incrementar(
      statsRankRef.current.itensDitosPorJogador,
      quemDisse,
    );

    statsSessionRef.current.itensAceitosSemDuvidaPorJogador = incrementar(
      statsSessionRef.current.itensAceitosSemDuvidaPorJogador,
      quemDisse,
    );

    callbacks.onItemAceito?.({
      rankingId: ranking.id,
      rankingAtual: novoEstado.rankingAtual,
      jogadorAtivoId: estadoAnterior.jogadorAtivoId,
      proximoJogadorId: estadoAnterior.proximoJogadorId,
      item,
      totalItensDitos: novoEstado.itensDitos.length,
    });
  }

  // ── Dúvida revelada ───────────────────────────────────────────────────────
  // Transição: aguardando_decisao → revelando (via Duvidado)
  if (faseDe === 'aguardando_decisao' && fasePara === 'revelando') {
    const resultado = novoEstado.resultadoDuvida;
    if (!resultado) return;

    const respondeuId = estadoAnterior.jogadorAtivoId;
    const duvidouId = estadoAnterior.proximoJogadorId;

    statsRankRef.current.totalDuvidas += 1;
    statsSessionRef.current.totalDuvidas += 1;

    // Stats de quem disse o item
    statsRankRef.current.itensDitosPorJogador = incrementar(
      statsRankRef.current.itensDitosPorJogador,
      respondeuId,
    );

    if (resultado.valido) {
      // Duvidador errou — apostou em item válido
      statsRankRef.current.dubidasErradasPorJogador = incrementar(
        statsRankRef.current.dubidasErradasPorJogador,
        duvidouId,
      );
    } else {
      // Duvidador acertou — leu o bluff
      statsRankRef.current.dubidasCertasPorJogador = incrementar(
        statsRankRef.current.dubidasCertasPorJogador,
        duvidouId,
      );
      statsSessionRef.current.dubidasCertasTotaisPorJogador = incrementar(
        statsSessionRef.current.dubidasCertasTotaisPorJogador,
        duvidouId,
      );
    }

    callbacks.onDuvidaResolvida?.({
      rankingId: ranking.id,
      rankingAtual: novoEstado.rankingAtual,
      respondeuId,
      duvidouId,
      item: resultado.itemDito,
      valido: resultado.valido,
      eliminadoId: resultado.eliminadoId,
      tipoMomento: resultado.valido ? 'aposta_errada' : 'leitura_perfeita',
      totalAtivos: novoEstado.jogadoresAtivos.length,
    });
  }

  // ── Eliminação confirmada com novo ativo ─────────────────────────────────
  // Transição: revelando → aguardando_resposta (via ConfirmarEliminacao)
  if (faseDe === 'revelando' && fasePara === 'aguardando_resposta') {
    const resultado = estadoAnterior.resultadoDuvida;
    if (resultado) {
      statsRankRef.current.ordemEliminacao.push(resultado.eliminadoId);
    }
  }

  // ── Revelando → reveal_final (via ConfirmarEliminacao, último sobrevivente) ─
  if (faseDe === 'revelando' && fasePara === 'reveal_final') {
    const resultado = estadoAnterior.resultadoDuvida;
    if (resultado) {
      statsRankRef.current.ordemEliminacao.push(resultado.eliminadoId);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export function useDuviidoLocal({
  configuracao,
  rankingsSelecionados,
  callbacks = {},
}: UseDuviidoLocalConfig): UseDuviidoLocalReturn {
  // ── Validação inicial ─────────────────────────────────────────────────────
  if (rankingsSelecionados.length === 0) {
    throw new Error('[useDuviidoLocal] rankingsSelecionados não pode estar vazio.');
  }

  // ── Estado React ──────────────────────────────────────────────────────────
  const [estado, setEstado] = useState<EstadoDuvido>(() =>
    criarEstadoInicial(configuracao, rankingsSelecionados[0]!, 0, rankingsSelecionados.length),
  );

  const [jogoEncerrado, setJogoEncerrado] = useState(false);

  // ── Refs (não causam re-render) ───────────────────────────────────────────

  // Estado atual em ref para acesso síncrono dentro de callbacks
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  // Rankings disponíveis na sessão
  const rankingsRef = useRef(rankingsSelecionados);
  rankingsRef.current = rankingsSelecionados;

  // Ranking atual completo (com itens)
  const rankingAtualCompletoRef = useRef<RankingDuvido>(rankingsSelecionados[0]!);

  // Callbacks em ref — evita stale closure sem precisar de useCallback externo
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Stats do ranking atual — zerados ao iniciar novo ranking
  const statsRankRef = useRef<StatsRanking>(criarStatsRanking());

  // Stats da sessão inteira — acumulam durante toda a partida
  const statsSessionRef = useRef<StatsSession>(
    criarStatsSession(configuracao.jogadores),
  );

  // ── Despacho de eventos ───────────────────────────────────────────────────

  const despachar = useCallback((evento: EventoDuvido) => {
    const estadoAtual = estadoRef.current;
    const rankingCompleto = rankingAtualCompletoRef.current;

    const novoEstado = processarEvento(estadoAtual, evento, rankingCompleto);

    // Nenhuma mudança — evento ignorado pelo engine
    if (novoEstado === estadoAtual) return;

    // Detectar transição e disparar callbacks
    processarTransicao(
      estadoAtual,
      novoEstado,
      rankingCompleto,
      callbacksRef.current,
      statsRankRef,
      statsSessionRef,
    );

    estadoRef.current = novoEstado;
    setEstado(novoEstado);
  }, []);

  // ── Progressão para o próximo ranking ────────────────────────────────────

  const iniciarProximoRanking = useCallback(() => {
    const estadoAtual = estadoRef.current;

    // Só pode avançar a partir de 'finalizado'
    if (estadoAtual.fase !== 'finalizado') return;

    const rankings = rankingsRef.current;
    const proxIndice = estadoAtual.rankingAtual + 1;

    // Atualizar stats de sessão com vencedor do ranking que acabou
    if (estadoAtual.vencedorId) {
      statsSessionRef.current.rankingsVencidosPorJogador = incrementar(
        statsSessionRef.current.rankingsVencidosPorJogador,
        estadoAtual.vencedorId,
      );
    }

    // Disparar onRankingFinalizado com stats completas
    const statsRank = statsRankRef.current;
    const rankingFinalizado = rankingAtualCompletoRef.current;

    const statsPorJogador: RankingFinalizadoParams['statsPorJogador'] =
      Object.fromEntries(
        estadoAtual.jogadores.map((j) => [
          j.id,
          {
            itensDitos: statsRank.itensDitosPorJogador[j.id] ?? 0,
            dubidasCertas: statsRank.dubidasCertasPorJogador[j.id] ?? 0,
            dubidasErradas: statsRank.dubidasErradasPorJogador[j.id] ?? 0,
            sobreviveu: j.id === estadoAtual.vencedorId,
            posicaoEliminacao: statsRank.ordemEliminacao.includes(j.id)
              ? statsRank.ordemEliminacao.indexOf(j.id) + 1
              : null,
          },
        ]),
      );

    callbacksRef.current.onRankingFinalizado?.({
      rankingId: rankingFinalizado.id,
      rankingAtual: estadoAtual.rankingAtual,
      totalRankings: estadoAtual.totalRankings,
      vencedorId: estadoAtual.vencedorId ?? '',
      totalEliminacoes: estadoAtual.jogadores.filter((j) => !j.ativo).length,
      totalItensDitos: estadoAtual.itensDitos.length,
      statsPorJogador,
    });

    // Último ranking → encerrar sessão
    if (proxIndice >= rankings.length) {
      const statsSession = statsSessionRef.current;
      const temperatura = calcularTemperatura(statsSession, estadoAtual.totalRankings);

      callbacksRef.current.onJogoFinalizado?.({
        totalRankings: estadoAtual.totalRankings,
        totalJogadores: estadoAtual.jogadores.length,
        rankingsVencidosPorJogador: statsSession.rankingsVencidosPorJogador,
        melhorLeitorId: encontrarMelhorLeitor(
          statsSession.dubidasCertasTotaisPorJogador,
        ),
        maiorBlufferSemPunicaoId: encontrarMaiorBluffer(
          statsSession.itensAceitosSemDuvidaPorJogador,
        ),
        totalDuvidas: statsSession.totalDuvidas,
        temperatura,
      });

      setJogoEncerrado(true);
      return;
    }

    // Avançar para o próximo ranking
    const proximoRanking = rankings[proxIndice]!;
    rankingAtualCompletoRef.current = proximoRanking;

    // Zerar stats do ranking (manter stats de sessão)
    statsRankRef.current = criarStatsRanking();

    const novoEstado = criarEstadoInicial(
      configuracao,
      proximoRanking,
      proxIndice,
      rankings.length,
      estadoAtual.historicoPorRanking,
    );

    estadoRef.current = novoEstado;
    setEstado(novoEstado);
  }, [configuracao]);

  // ── Retorno ───────────────────────────────────────────────────────────────

  return {
    estado,
    rankingAtualCompleto: rankingAtualCompletoRef.current,
    despachar,
    iniciarProximoRanking,
    jogoEncerrado,
  };
}
