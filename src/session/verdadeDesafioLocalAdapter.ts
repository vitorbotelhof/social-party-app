import type { PlayerId } from '@/engine/types';
import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { registrarJogoFinalizado } from './sessionStore';
import type { VerdadeDesafioSessaoStats } from './types';
import { detectarVibe } from './vibeEngine';

export interface TurnoVerdadeDesafio {
  jogadorId: PlayerId;
  tipo: 'verdade' | 'desafio';
  resultado: 'cumpriu' | 'passou';
}

export interface ResultadoVerdadeDesafio {
  totalTurnos: number;
  verdadesEscolhidas: number;
  desafiosEscolhidos: number;
  desafiosCumpridos: number;
  cartasPassadas: number;
  jogadorMaisCorajosoId: PlayerId | null;
  categorias: string[];
  duracaoMs: number;
  duracaoMediaTurnoMs: number;
}

export function processarTurnoVerdadeDesafio(
  _turno: TurnoVerdadeDesafio,
): void {
  // O histórico agregado é fechado no resultado; o hook permite eventos futuros.
}

export function processarResultadoVerdadeDesafio(
  resultado: ResultadoVerdadeDesafio,
): void {
  const stats: VerdadeDesafioSessaoStats = { ...resultado };
  registrarJogoFinalizado('verdade-desafio', { verdadeDesafio: stats });
  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
