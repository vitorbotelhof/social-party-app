/**
 * debugStore — Estado central do sistema de playtesting.
 *
 * Singleton pub/sub sem dependência externa (sem Zustand, sem Context).
 * Qualquer componente pode observar via useDebugStore().
 * Qualquer módulo pode escrever via as funções exportadas.
 *
 * Máximo de logs retidos: 100 fases, 50 emocionais (evita leak de memória
 * durante sessões longas de playtesting).
 */

import { useEffect, useState } from 'react';
import type {
  AbaDebug,
  DebugState,
  EmocionalLog,
  FaseLog,
  LoopSnapshot,
  PacingMetrics,
} from './debugTypes';

// ── Estado inicial ────────────────────────────────────────────────────────────

const ESTADO_INICIAL: DebugState = {
  config: { timerMultiplier: 1, verboseLogging: false },
  painelAberto: false,
  abaAtiva: 'acoes',
  faseLogs: [],
  emocionalLogs: [],
  loopSnapshots: [],
  loopSelecionadoReplay: null,
  metrics: {
    totalLoops: 0,
    tempoMedioDiscussaoMs: null,
    tempoMedioVotacaoMs: null,
    loopsAteTemperaturaQuente: null,
    pctEventosPrivadosLidos: null,
    loopMaisCaoticoVotacao: null,
    replayImediato: null,
  },
};

// ── Pub/Sub interno ───────────────────────────────────────────────────────────

type Listener = () => void;
let _state: DebugState = { ...ESTADO_INICIAL };
const _listeners = new Set<Listener>();

function _notify(): void {
  _listeners.forEach((l) => l());
}

function _patch(patch: Partial<DebugState>): void {
  _state = { ..._state, ...patch };
  _notify();
}

// ── Leitura ───────────────────────────────────────────────────────────────────

export function getDebugState(): DebugState {
  return _state;
}

// ── Hook React ────────────────────────────────────────────────────────────────

export function useDebugStore(): DebugState {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  return _state;
}

// ── Painel UI ─────────────────────────────────────────────────────────────────

export function togglePainel(): void {
  _patch({ painelAberto: !_state.painelAberto });
}

export function setAba(aba: AbaDebug): void {
  _patch({ abaAtiva: aba });
}

export function setLoopSelecionado(loop: number | null): void {
  _patch({ loopSelecionadoReplay: loop });
}

// ── Config ────────────────────────────────────────────────────────────────────

export function setTimerMultiplier(multiplier: number): void {
  _patch({ config: { ..._state.config, timerMultiplier: multiplier } });
}

export function setVerboseLogging(v: boolean): void {
  _patch({ config: { ..._state.config, verboseLogging: v } });
}

// ── Logs de fase ──────────────────────────────────────────────────────────────

export function adicionarFaseLog(log: FaseLog): void {
  // Mais recente primeiro — melhor UX no painel
  const faseLogs = [log, ..._state.faseLogs].slice(0, 100);
  _patch({ faseLogs });

  if (_state.config.verboseLogging) {
    const durStr = log.duracaoAnteriorMs !== null
      ? ` (+${(log.duracaoAnteriorMs / 1000).toFixed(1)}s)`
      : '';
    console.log(`[Inquisição Debug] ${log.subFase} loop=${log.loop}${durStr}`);
  }
}

export function limparFaseLogs(): void {
  _patch({ faseLogs: [] });
}

// ── Logs emocionais ───────────────────────────────────────────────────────────

export function adicionarEmocionalLog(log: EmocionalLog): void {
  const emocionalLogs = [log, ..._state.emocionalLogs].slice(0, 50);
  _patch({ emocionalLogs });

  if (_state.config.verboseLogging) {
    console.log(`[Inquisição Debug] 🌡 ${log.temperatura}${log.momento ? ` ← ${log.momento}` : ''}`);
  }
}

// ── Loop snapshots ────────────────────────────────────────────────────────────

export function atualizarLoopSnapshot(patch: Partial<LoopSnapshot> & { loop: number }): void {
  const existing = _state.loopSnapshots.find((s) => s.loop === patch.loop);
  let loopSnapshots: LoopSnapshot[];

  if (existing) {
    loopSnapshots = _state.loopSnapshots.map((s) =>
      s.loop === patch.loop ? { ...s, ...patch } : s,
    );
  } else {
    const defaults: LoopSnapshot = {
      loop: patch.loop,
      iniciadoEm: Date.now(),
      finalizadoEm: null,
      duracaoDiscussaoMs: null,
      duracaoVotacaoMs: null,
      eliminadoId: null,
      eliminadoPapel: null,
      distribuicaoVotos: {},
      acaoNoturna: null,
      eventosPublicosExibidos: 0,
      eventosPrivadosLidos: 0,
      eventosPrivadosTotais: 0,
    };
    const novo: LoopSnapshot = { ...defaults, ...patch };
    loopSnapshots = [..._state.loopSnapshots, novo].sort((a, b) => a.loop - b.loop);
  }

  _patch({ loopSnapshots });
}

// ── Métricas ──────────────────────────────────────────────────────────────────

export function atualizarMetrics(patch: Partial<PacingMetrics>): void {
  _patch({ metrics: { ..._state.metrics, ...patch } });
}

// ── Reset ─────────────────────────────────────────────────────────────────────

/** Limpa dados de sessão mas mantém config (multiplier, verbose). */
export function resetDebugSession(): void {
  _patch({
    faseLogs: [],
    emocionalLogs: [],
    loopSnapshots: [],
    loopSelecionadoReplay: null,
    metrics: { ...ESTADO_INICIAL.metrics },
    painelAberto: false,
  });
}
