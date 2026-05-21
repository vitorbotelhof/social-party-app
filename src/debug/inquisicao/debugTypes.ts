/**
 * debugTypes — Contratos de dados do sistema de playtesting do Inquisição.
 *
 * Todos os tipos usados por: debugStore, phaseLogger, pacingTracker,
 * loopReplay, forceActions, DebugPanelInquisicao.
 *
 * Nenhum desses tipos deve vazar para o código de produção.
 */

import type { PlayerId } from '@/engine/types';
import type { PapelInquisicao, TipoAcaoNoturna } from '@/games/inquisicao/types';
import type { TemperaturaEmocional, TipoMomento } from '@/session/types';

// ── Navegação de abas do painel ───────────────────────────────────────────────

export type AbaDebug = 'acoes' | 'logs' | 'metricas' | 'replay';

// ── Logs de fase ──────────────────────────────────────────────────────────────

export interface FaseLog {
  /** ID único para React key */
  id: string;
  subFase: string;
  loop: number;
  /** Unix ms */
  timestamp: number;
  /** ms desde o log anterior — null no primeiro log */
  duracaoAnteriorMs: number | null;
}

// ── Logs emocionais ───────────────────────────────────────────────────────────

export interface EmocionalLog {
  timestamp: number;
  temperatura: TemperaturaEmocional;
  /** Momento que disparou a mudança, se conhecido */
  momento: TipoMomento | null;
}

// ── Snapshots de loop para replay ─────────────────────────────────────────────

export interface LoopSnapshot {
  loop: number;
  iniciadoEm: number;
  finalizadoEm: number | null;
  /** ms em subFase 'conversa' */
  duracaoDiscussaoMs: number | null;
  /** ms desde início de 'votando' até último voto registrado */
  duracaoVotacaoMs: number | null;
  eliminadoId: PlayerId | null;
  eliminadoPapel: PapelInquisicao | null;
  /** alvoId → votos recebidos */
  distribuicaoVotos: Record<string, number>;
  acaoNoturna: {
    jogadorId: PlayerId;
    acao: TipoAcaoNoturna;
    alvo: PlayerId;
  } | null;
  eventosPublicosExibidos: number;
  eventosPrivadosLidos: number;
  eventosPrivadosTotais: number;
}

// ── Métricas de pacing ────────────────────────────────────────────────────────

export interface PacingMetrics {
  totalLoops: number;
  /** null = sem dados ainda */
  tempoMedioDiscussaoMs: number | null;
  tempoMedioVotacaoMs: number | null;
  /** Em qual loop a temperatura chegou a 'quente' pela primeira vez */
  loopsAteTemperaturaQuente: number | null;
  /** 0–100 — null = sem eventos privados na sessão */
  pctEventosPrivadosLidos: number | null;
  /** Loop com maior dispersão de votos (candidato com mais votos − menos votos) */
  loopMaisCaoticoVotacao: number | null;
  /**
   * true  = "nova partida" pressionado em <15s após finalizado
   * false = pressão tardia
   * null  = jogo ainda não terminou
   */
  replayImediato: boolean | null;
}

// ── Configuração do debug ─────────────────────────────────────────────────────

export interface DebugConfig {
  /**
   * Multiplicador cosmético do timer no display de TelaDia.
   * Não afeta o Firebase — use "Avançar Fase" para realmente pular.
   */
  timerMultiplier: number;
  /** Loga cada evento no console.log além do painel */
  verboseLogging: boolean;
}

// ── Estado global do debug ────────────────────────────────────────────────────

export interface DebugState {
  config: DebugConfig;
  painelAberto: boolean;
  abaAtiva: AbaDebug;
  faseLogs: FaseLog[];
  emocionalLogs: EmocionalLog[];
  loopSnapshots: LoopSnapshot[];
  loopSelecionadoReplay: number | null;
  metrics: PacingMetrics;
}
