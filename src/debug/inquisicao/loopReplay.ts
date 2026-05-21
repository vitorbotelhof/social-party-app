/**
 * loopReplay — Captura snapshots de estado por loop para revisão pós-partida.
 *
 * Integração:
 *   processarEstadoParaReplay(estadoPublico) — chamar a cada update de Firebase.
 *
 * O módulo detecta automaticamente:
 *   - Início de novo loop (estado.loop aumenta)
 *   - Eliminação (eliminados.length aumenta)
 *   - Distribuição de votos (subFase === 'apurando')
 *   - Finalização de loop (subFase muda de 'apurando' para 'noite' ou 'finalizado')
 *
 * exportarReplay() retorna JSON completo para análise offline.
 */

import type { EstadoFirebaseInquisicao } from '@/games/inquisicao/types';
import { atualizarLoopSnapshot, getDebugState } from './debugStore';

// ── Estado interno ────────────────────────────────────────────────────────────

let _estadoAnterior: EstadoFirebaseInquisicao | null = null;

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Chamar a cada mudança de estadoPublico em TelaInquisicao.
 * Faz diff automático para capturar eventos relevantes.
 */
export function processarEstadoParaReplay(estado: EstadoFirebaseInquisicao): void {
  if (!__DEV__) return;

  const anterior = _estadoAnterior;
  _estadoAnterior = estado;

  if (!anterior) {
    // Primeiro estado — inicializar snapshot do loop atual
    atualizarLoopSnapshot({ loop: estado.loop });
    return;
  }

  // ── Novo loop ──────────────────────────────────────────────────────────────
  if (estado.loop > anterior.loop) {
    atualizarLoopSnapshot({ loop: estado.loop });
  }

  // ── Capturar distribuição de votos na apuração ─────────────────────────────
  if (
    estado.subFase === 'apurando' &&
    anterior.subFase === 'votando' &&
    estado.votacaoAtual !== null
  ) {
    const votacao = estado.votacaoAtual as any;
    const votos: Record<string, string> = votacao?.votos ?? {};
    const contagem: Record<string, number> = {};
    Object.values(votos).forEach((alvoId) => {
      const id = alvoId as string;
      contagem[id] = (contagem[id] ?? 0) + 1;
    });
    atualizarLoopSnapshot({ loop: anterior.loop, distribuicaoVotos: contagem });
  }

  // ── Capturar eliminação ────────────────────────────────────────────────────
  if (estado.eliminados.length > anterior.eliminados.length) {
    const novoEliminado = estado.eliminados[estado.eliminados.length - 1];
    if (novoEliminado) {
      const papel =
        estado.revelacaoFinal?.papeisPorJogador[novoEliminado.jogadorId]?.papelOriginal ?? null;
      atualizarLoopSnapshot({
        loop: anterior.loop,
        eliminadoId: novoEliminado.jogadorId,
        eliminadoPapel: papel,
        finalizadoEm: Date.now(),
      });
    }
  }

  // ── Saída da fase noite — fim do loop ──────────────────────────────────────
  if (anterior.subFase === 'noite' && estado.subFase === 'conversa') {
    atualizarLoopSnapshot({ loop: anterior.loop, finalizadoEm: Date.now() });
  }
}

/**
 * Retorna JSON completo da sessão de debug para copiar/analisar.
 * Logado no console ao clicar "Exportar" no painel.
 */
export function exportarReplay(): string {
  const { loopSnapshots, faseLogs, emocionalLogs, metrics } = getDebugState();
  return JSON.stringify(
    {
      exportadoEm: new Date().toISOString(),
      metrics,
      loopSnapshots,
      faseLogs: faseLogs.slice(0, 50), // limitar tamanho do JSON exportado
      emocionalLogs,
    },
    null,
    2,
  );
}

/** Reseta o estado interno — chamar ao iniciar nova partida. */
export function resetLoopReplay(): void {
  _estadoAnterior = null;
}
