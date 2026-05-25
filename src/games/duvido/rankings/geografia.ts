import type { RankingDuvido } from '../types';

/**
 * Rankings de geografia — 3 no total.
 * Fontes: ONU, CIA World Factbook, National Geographic / Guinness.
 *
 * ⚠️ G25 (países mais populosos): Índia ultrapassou a China em 2023 —
 *    jogadores vão instintivamente responder China como #1. Excelente tensão.
 */
export const rankingsGeografia: RankingDuvido[] = [
  // ─── G25 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'geo-paises-mais-populosos',
    titulo: 'Top 5 países mais populosos do mundo',
    fonte: 'ONU, 2024',
    tamanho: 5,
    categoria: 'geografia',
    dificuldade: 1,
    expiresAt: '2027-01-01',
    // Índia ultrapassou a China em 2023 — mudança recente que muitos não sabem.
    itens: [
      'Índia',          // ~1,44 bilhão — ultrapassou China em 2023
      'China',          // ~1,42 bilhão
      'Estados Unidos', // ~340 milhões
      'Indonésia',      // ~280 milhões
      'Paquistão',      // ~240 milhões
    ],
    variantes: {
      'Índia': ['india', 'índia', 'hindustan', 'bharat'],
      'China': ['china', 'republica popular', 'republica popular da china', 'rpc'],
      'Estados Unidos': ['eua', 'usa', 'estados unidos', 'america', 'united states', 'norte america'],
      'Indonésia': ['indonesia', 'indonésia', 'java', 'bali'],
      'Paquistão': ['paquistao', 'paquistão', 'pakistan', 'paquistani'],
    },
  },

  // ─── G26 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'geo-paises-maior-territorio',
    titulo: 'Top 10 países com maior território',
    fonte: 'CIA World Factbook',
    tamanho: 10,
    categoria: 'geografia',
    dificuldade: 2,
    expiresAt: null,
    itens: [
      'Rússia',          // 17,1 milhões km²
      'Canadá',          // 10,0 milhões km²
      'Estados Unidos',  // 9,8 milhões km²
      'China',           // 9,6 milhões km²
      'Brasil',          // 8,5 milhões km²
      'Austrália',       // 7,7 milhões km²
      'Índia',           // 3,3 milhões km²
      'Argentina',       // 2,8 milhões km²
      'Cazaquistão',     // 2,7 milhões km²
      'Argélia',         // 2,4 milhões km²
    ],
    variantes: {
      'Rússia': ['russia', 'rússia', 'federacao russa'],
      'Canadá': ['canada', 'canadá'],
      'Estados Unidos': ['eua', 'usa', 'estados unidos', 'america', 'united states'],
      'China': ['china', 'republica popular da china'],
      'Brasil': ['brasil', 'brazil'],
      'Austrália': ['australia', 'austrália'],
      'Índia': ['india', 'índia', 'hindustan'],
      'Argentina': ['argentina', 'arg', 'albiceleste'],
      'Cazaquistão': ['cazaquistao', 'cazaquistão', 'kazakhstan', 'casaquistão', 'casaquistao'],
      'Argélia': ['argelia', 'argélia', 'algeria'],
    },
  },

  // ─── G27 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'geo-montanhas-mais-altas',
    titulo: 'Top 5 montanhas mais altas do mundo',
    fonte: 'National Geographic / Guinness',
    tamanho: 5,
    categoria: 'geografia',
    dificuldade: 2,
    expiresAt: null,
    // Everest como #1 é universalmente conhecida.
    // K2 como #2 é relativamente conhecida. Posições 3-5 são bluff puro.
    // Muitos vão tentar Aconcágua (6.962m) ou Mont Blanc (4.808m) — fora do top 5.
    itens: [
      'Everest',         // 8.849 metros (Nepal/China)
      'K2',              // 8.611 metros (Paquistão/China)
      'Kangchenjunga',   // 8.586 metros (Nepal/Índia)
      'Lhotse',          // 8.516 metros (Nepal/China)
      'Makalu',          // 8.485 metros (Nepal/China)
    ],
    variantes: {
      'Everest': ['everest', 'monte everest', 'chomolungma', 'sagarmatha'],
      'K2': ['k2', 'karakoram', 'chhogori', 'k 2'],
      'Kangchenjunga': ['kangchenjunga', 'kanchenjunga', 'terceira mais alta', 'kangchendzonga'],
      'Lhotse': ['lhotse'],
      'Makalu': ['makalu'],
    },
  },
];
