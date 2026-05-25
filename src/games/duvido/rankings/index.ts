import { rankingsFutebol } from './futebol';
import { rankingsMusica } from './musica';
import { rankingsRecordes } from './recordes';
import { rankingsCinema } from './cinema';
import { rankingsBrasil } from './brasil';
import { rankingsGeografia } from './geografia';
import { rankingsCulturaPop } from './culturaPop';
import { rankingsMarcas } from './marcas';
import type { RankingDuvido } from '../types';

export {
  rankingsFutebol,
  rankingsMusica,
  rankingsRecordes,
  rankingsCinema,
  rankingsBrasil,
  rankingsGeografia,
  rankingsCulturaPop,
  rankingsMarcas,
};

/**
 * Todos os rankings disponíveis no MVP.
 * Total: 30 rankings — 8 fácil, 15 médio, 7 difícil.
 *
 * Usar TODOS_OS_RANKINGS como fonte para rankingSelection.ts.
 * NÃO usar diretamente em gameplay — passar sempre pelo seletor de rankings.
 */
export const TODOS_OS_RANKINGS: RankingDuvido[] = [
  ...rankingsFutebol,
  ...rankingsMusica,
  ...rankingsRecordes,
  ...rankingsCinema,
  ...rankingsBrasil,
  ...rankingsGeografia,
  ...rankingsCulturaPop,
  ...rankingsMarcas,
];
