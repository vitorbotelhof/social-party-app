import { atualizarEstadoEmocional } from './emotionalTracker';
import { reavaliarGrupo } from './groupProfile';
import { registrarJogoFinalizado } from './sessionStore';
import type { EuNuncaSessaoStats } from './types';
import { detectarVibe } from './vibeEngine';

export interface ResultadoEuNunca {
  totalCartas: number;
  cartasPuladas: number;
  categorias: string[];
  intensidadeMaxima: string | null;
  encerradaVoluntariamente: boolean;
  duracaoMs: number;
}

export function processarResultadoEuNunca(resultado: ResultadoEuNunca): void {
  const stats: EuNuncaSessaoStats = { ...resultado };
  registrarJogoFinalizado('eu-nunca', { euNunca: stats });
  atualizarEstadoEmocional();
  reavaliarGrupo();
  detectarVibe();
}
