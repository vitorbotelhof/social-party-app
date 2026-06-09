/**
 * Arquivos Logger — observabilidade estruturada para sessões de campo.
 *
 * Objetivo de Sprint 14:
 *   Tornar bugs ocorridos em sessões reais rastreáveis post-mortem.
 *   Logs ficam em memória e podem ser exportados (console ou futuramente
 *   para um endpoint de coleta).
 *
 * Regras críticas:
 *   - NUNCA incluir conteúdo privado (arquivos, segredos, objetivos).
 *   - Apenas metadados: roomCode, playerId, phase, eventType, timestamps.
 *   - Logs são agrupados por sessão (roomCode) e descartados ao sair.
 */

export type ArquivosLogLevel = 'info' | 'warn' | 'error';

export interface ArquivosLogEntry {
  readonly level: ArquivosLogLevel;
  readonly timestamp: number;
  readonly roomCode: string;
  readonly event: string;
  readonly dados?: Record<string, string | number | boolean | null>;
}

// Buffer em memória — descartado quando o componente desmonta ou o app fecha.
const buffer: ArquivosLogEntry[] = [];
const MAX_BUFFER = 200;

/**
 * Registra um evento de campo.
 *
 * Não inclua conteúdo privado nos `dados`. Apenas IDs, fases e booleanos.
 */
export function logArquivos(
  level: ArquivosLogLevel,
  roomCode: string,
  event: string,
  dados?: Record<string, string | number | boolean | null>,
): void {
  const entry: ArquivosLogEntry = {
    level,
    timestamp: Date.now(),
    roomCode,
    event,
    dados,
  };

  // Rotação simples para evitar crescimento ilimitado.
  if (buffer.length >= MAX_BUFFER) {
    buffer.splice(0, Math.floor(MAX_BUFFER / 4));
  }
  buffer.push(entry);

  // Saída no console em desenvolvimento para diagnóstico imediato.
  if (__DEV__) {
    const prefixo = `[arquivos:${level.toUpperCase()}]`;
    const dadosStr = dados ? ` | ${JSON.stringify(dados)}` : '';
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${prefixo} [${roomCode}] ${event}${dadosStr}`,
    );
  }
}

/** Atalhos de nível */
export const logInfo = (
  roomCode: string,
  event: string,
  dados?: ArquivosLogEntry['dados'],
) => logArquivos('info', roomCode, event, dados);

export const logWarn = (
  roomCode: string,
  event: string,
  dados?: ArquivosLogEntry['dados'],
) => logArquivos('warn', roomCode, event, dados);

export const logError = (
  roomCode: string,
  event: string,
  dados?: ArquivosLogEntry['dados'],
) => logArquivos('error', roomCode, event, dados);

/**
 * Retorna uma cópia do buffer filtrada por sala.
 *
 * Útil para depuração e futuro export de playtest.
 */
export function exportarLogsArquivos(
  roomCode?: string,
): readonly ArquivosLogEntry[] {
  if (!roomCode) return [...buffer];
  return buffer.filter((entry) => entry.roomCode === roomCode);
}

/**
 * Limpa o buffer de uma sala específica (chamar ao sair da sala).
 */
export function limparLogsArquivos(roomCode: string): void {
  const inicio = buffer.findIndex((entry) => entry.roomCode === roomCode);
  if (inicio < 0) return;
  // Remove entradas da sala preservando outras sessões no buffer.
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (buffer[i]?.roomCode === roomCode) {
      buffer.splice(i, 1);
    }
  }
}
