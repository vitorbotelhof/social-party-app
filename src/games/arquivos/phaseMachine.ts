import type { ArquivosPhase, ArquivosPhaseProgress } from './types';

export const ARQUIVOS_PHASE_ORDER: readonly ArquivosPhase[] = [
  'lobby',
  'apresentacao_caso',
  'leitura_privada',
  'investigacao_inicial',
  'nova_evidencia',
  'confronto',
  'veredito',
  'revelacao_resultados',
  'finalizado',
];

export function criarProgressoFase(
  totalExpected: number,
): ArquivosPhaseProgress {
  return {
    readyPlayerIds: [],
    totalExpected,
  };
}

export function marcarJogadorPronto(
  progresso: ArquivosPhaseProgress,
  playerId: string,
): ArquivosPhaseProgress {
  if (progresso.readyPlayerIds.includes(playerId)) return progresso;

  return {
    ...progresso,
    readyPlayerIds: [...progresso.readyPlayerIds, playerId],
  };
}

export function obterProximaFase(
  faseAtual: ArquivosPhase,
): ArquivosPhase | null {
  const indiceAtual = ARQUIVOS_PHASE_ORDER.indexOf(faseAtual);
  if (indiceAtual < 0) return null;
  return ARQUIVOS_PHASE_ORDER[indiceAtual + 1] ?? null;
}

export function podeAvancarParaFase(
  faseAtual: ArquivosPhase,
  faseAlvo: ArquivosPhase,
): boolean {
  // Só permite avançar para a fase imediatamente seguinte.
  // Não permite retroceder nem pular fases.
  // Não permite permanecer na fase atual (seria uma operação nula).
  return obterProximaFase(faseAtual) === faseAlvo;
}

export function fasePermiteVeredito(fase: ArquivosPhase): boolean {
  return fase === 'veredito';
}

export function faseExibeResultado(fase: ArquivosPhase): boolean {
  return fase === 'revelacao_resultados' || fase === 'finalizado';
}
