/**
 * pacingTracker — Coleta e computa métricas de pacing em tempo real.
 *
 * Integração em TelaInquisicao:
 *   - Chamar iniciarSubFase() / finalizarSubFase() em cada mudança de subFase.
 *   - Chamar registrarEventoPublico() quando eventoAtivo muda.
 *   - Chamar registrarEventoPrivadoLido() em marcarEventoPrivadoLido().
 *   - Chamar registrarFinalizado() quando subFase === 'finalizado'.
 *   - Chamar registrarReplay() quando "nova partida" é pressionado.
 *
 * Métricas computadas automaticamente após cada update:
 *   tempoMedioDiscussaoMs, tempoMedioVotacaoMs, loopsAteTemperaturaQuente,
 *   pctEventosPrivadosLidos, loopMaisCaoticoVotacao.
 */

import { atualizarLoopSnapshot, atualizarMetrics, getDebugState } from './debugStore';

// ── Timestamps de início por chave "{subFase}_{loop}" ────────────────────────

const _subfaseInicio: Record<string, number> = {};

function chave(subFase: string, loop: number): string {
  return `${subFase}_${loop}`;
}

// ── API pública ───────────────────────────────────────────────────────────────

/** Registrar início de uma sub-fase. */
export function iniciarSubFase(subFase: string, loop: number): void {
  if (!__DEV__) return;
  _subfaseInicio[chave(subFase, loop)] = Date.now();

  // Inicializar snapshot do loop na primeira sub-fase dele
  if (subFase === 'conversa') {
    atualizarLoopSnapshot({ loop, iniciadoEm: Date.now() });
  }
}

/** Registrar fim de uma sub-fase e persistir duração no snapshot. */
export function finalizarSubFase(subFase: string, loop: number): void {
  if (!__DEV__) return;
  const inicio = _subfaseInicio[chave(subFase, loop)];
  if (inicio === undefined) return;

  const duracao = Date.now() - inicio;

  if (subFase === 'conversa') {
    atualizarLoopSnapshot({ loop, duracaoDiscussaoMs: duracao });
  } else if (subFase === 'votando') {
    atualizarLoopSnapshot({ loop, duracaoVotacaoMs: duracao });
  }

  _computarMetrics();
}

/** Registrar exibição de um evento público. */
export function registrarEventoPublico(loop: number): void {
  if (!__DEV__) return;
  const snap = getDebugState().loopSnapshots.find((s) => s.loop === loop);
  atualizarLoopSnapshot({
    loop,
    eventosPublicosExibidos: (snap?.eventosPublicosExibidos ?? 0) + 1,
  });
}

/** Registrar que o jogador leu seu evento privado. */
export function registrarEventoPrivadoLido(loop: number): void {
  if (!__DEV__) return;
  const snap = getDebugState().loopSnapshots.find((s) => s.loop === loop);
  atualizarLoopSnapshot({
    loop,
    eventosPrivadosLidos: (snap?.eventosPrivadosLidos ?? 0) + 1,
  });
  _computarMetrics();
}

/** Registrar que o loop finalizou (eliminação processada). */
export function registrarFimDeLoop(
  loop: number,
  eliminadoId: string | null,
  eliminadoPapel: string | null,
): void {
  if (!__DEV__) return;
  atualizarLoopSnapshot({
    loop,
    finalizadoEm: Date.now(),
    eliminadoId,
    eliminadoPapel: eliminadoPapel as any,
  });
  _computarMetrics();
}

/** Registrar distribuição de votos de um loop. */
export function registrarDistribuicaoVotos(loop: number, votos: Record<string, string>): void {
  if (!__DEV__) return;
  const contagem: Record<string, number> = {};
  Object.values(votos).forEach((alvoId) => {
    contagem[alvoId] = (contagem[alvoId] ?? 0) + 1;
  });
  atualizarLoopSnapshot({ loop, distribuicaoVotos: contagem });
}

/** Registrar ação noturna de um jogador. */
export function registrarAcaoNoturna(
  loop: number,
  jogadorId: string,
  acao: string,
  alvo: string,
): void {
  if (!__DEV__) return;
  atualizarLoopSnapshot({
    loop,
    acaoNoturna: { jogadorId, acao, alvo } as any,
  });
}

/** Registrar que o jogo finalizou — marca timestamp. */
export function registrarJogoFinalizado(): void {
  if (!__DEV__) return;
  (window as any).__debugFinalizadoEm = Date.now();
}

/**
 * Registrar se replay foi imediato (<15s após finalizado).
 * Chamar quando "nova partida" é pressionado.
 */
export function registrarReplay(): void {
  if (!__DEV__) return;
  const finalizadoEm = (window as any).__debugFinalizadoEm as number | undefined;
  if (!finalizadoEm) return;
  const deltaMs = Date.now() - finalizadoEm;
  atualizarMetrics({ replayImediato: deltaMs < 15_000 });
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export function resetPacingTracker(): void {
  Object.keys(_subfaseInicio).forEach((k) => delete _subfaseInicio[k]);
  (window as any).__debugFinalizadoEm = undefined;
}

// ── Cálculo interno ───────────────────────────────────────────────────────────

function _computarMetrics(): void {
  const { loopSnapshots, emocionalLogs } = getDebugState();

  // Média de discussão
  const comDiscussao = loopSnapshots.filter((s) => s.duracaoDiscussaoMs !== null);
  const tempoMedioDiscussaoMs = comDiscussao.length > 0
    ? Math.round(
        comDiscussao.reduce((acc, s) => acc + s.duracaoDiscussaoMs!, 0) / comDiscussao.length,
      )
    : null;

  // Média de votação
  const comVotacao = loopSnapshots.filter((s) => s.duracaoVotacaoMs !== null);
  const tempoMedioVotacaoMs = comVotacao.length > 0
    ? Math.round(
        comVotacao.reduce((acc, s) => acc + s.duracaoVotacaoMs!, 0) / comVotacao.length,
      )
    : null;

  // Loops até temperatura quente — primeiro log emocional com quente/colapso
  const primeiroQuente = [...emocionalLogs]
    .reverse()
    .find((l) => l.temperatura === 'quente' || l.temperatura === 'colapso');

  let loopsAteTemperaturaQuente: number | null = null;
  if (primeiroQuente) {
    const loopNoMomento = loopSnapshots.find(
      (s) =>
        s.iniciadoEm <= primeiroQuente.timestamp &&
        (s.finalizadoEm === null || s.finalizadoEm >= primeiroQuente.timestamp),
    );
    loopsAteTemperaturaQuente = loopNoMomento?.loop ?? null;
  }

  // % eventos privados lidos
  const totalPrivados = loopSnapshots.reduce((acc, s) => acc + s.eventosPrivadosTotais, 0);
  const totalLidos = loopSnapshots.reduce((acc, s) => acc + s.eventosPrivadosLidos, 0);
  const pctEventosPrivadosLidos =
    totalPrivados > 0 ? Math.round((totalLidos / totalPrivados) * 100) : null;

  // Loop mais caótico (max dispersão de votos)
  let loopMaisCaoticoVotacao: number | null = null;
  let maxDispersao = 0;
  for (const snap of loopSnapshots) {
    const votos = Object.values(snap.distribuicaoVotos);
    if (votos.length < 2) continue;
    const dispersao = Math.max(...votos) - Math.min(...votos);
    if (dispersao > maxDispersao) {
      maxDispersao = dispersao;
      loopMaisCaoticoVotacao = snap.loop;
    }
  }

  atualizarMetrics({
    totalLoops: loopSnapshots.length,
    tempoMedioDiscussaoMs,
    tempoMedioVotacaoMs,
    loopsAteTemperaturaQuente,
    pctEventosPrivadosLidos,
    loopMaisCaoticoVotacao,
  });
}
