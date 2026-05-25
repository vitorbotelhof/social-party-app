import type { RankingDuvido } from '../types';

/**
 * Rankings de recordes — 5 no total.
 * Fontes: Guinness World Records, OMS, ONU, COI.
 *
 * ⚠️ R15 (medalhas olímpicas) precisa de verificação após Paris 2024.
 *    R13 (expectativa de vida) varia entre OMS e ONU — declarar fonte explicitamente.
 */
export const rankingsRecordes: RankingDuvido[] = [
  // ─── R12 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'recordes-animais-perigosos',
    titulo: 'Top 5 animais que mais matam humanos por ano',
    fonte: 'Guinness World Records',
    tamanho: 5,
    categoria: 'recordes',
    dificuldade: 1,
    expiresAt: null,
    itens: [
      'Mosquito',       // ~725.000 mortes/ano (malária, dengue, febre amarela)
      'Ser humano',     // ~400.000 mortes/ano (homicídios)
      'Cobra',          // ~100.000 mortes/ano
      'Cão',            // ~59.000 mortes/ano (raiva)
      'Mosca tsé-tsé',  // ~10.000 mortes/ano (doença do sono)
    ],
    variantes: {
      'Mosquito': ['mosquito', 'mosquitos', 'pernilongo', 'muriçoca'],
      'Ser humano': ['humano', 'ser humano', 'pessoa', 'pessoas', 'homem', 'gente', 'humanos'],
      'Cobra': ['cobra', 'serpente', 'cobras', 'serpentes', 'víbora', 'vibora'],
      'Cão': ['cachorro', 'cão', 'dog', 'cao', 'cachorros', 'cães'],
      'Mosca tsé-tsé': ['tse-tse', 'tsé-tsé', 'mosca tse-tse', 'mosca africana', 'mosca tsetse', 'tsetsé'],
    },
  },

  // ─── R13 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'recordes-paises-expectativa-vida',
    titulo: 'Top 5 países com maior expectativa de vida',
    fonte: 'OMS / ONU, 2023',
    tamanho: 5,
    categoria: 'recordes',
    dificuldade: 1,
    expiresAt: '2026-01-01',
    // ⚠️ VERIFICAR: posições 2-5 variam entre fontes (OMS vs ONU) e ano.
    // Japão como #1 é estável. O restante precisa de verificação na publicação.
    itens: [
      'Japão',         // ~84,3 anos — confirmado #1
      'Suíça',         // ~83,9 anos — ⚠️ VERIFICAR posição
      'Coreia do Sul', // ~83,7 anos — ⚠️ VERIFICAR
      'Espanha',       // ~83,5 anos — ⚠️ VERIFICAR
      'Austrália',     // ~83,4 anos — ⚠️ VERIFICAR
    ],
    variantes: {
      'Japão': ['japao', 'japan', 'japão'],
      'Suíça': ['suica', 'suíça', 'switzerland', 'helvetia'],
      'Coreia do Sul': ['coreia', 'coreia do sul', 'south korea', 'korea'],
      'Espanha': ['espanha', 'spain', 'espania'],
      'Austrália': ['australia', 'austrália'],
    },
  },

  // ─── R14 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'recordes-maiores-animais-peso',
    titulo: 'Top 5 maiores animais do mundo por peso',
    fonte: 'Guinness World Records',
    tamanho: 5,
    categoria: 'recordes',
    dificuldade: 2,
    expiresAt: null,
    // ⚠️ VERIFICAR: posições 4-5 (hipopótamo vs rinoceronte branco vs girafa).
    // Baleia-azul como #1 e Baleia-da-groenlândia como #2 são estáveis.
    itens: [
      'Baleia-azul',           // até 190 toneladas — confirmado #1
      'Baleia-da-groenlândia', // até 100 toneladas — ⚠️ VERIFICAR posição
      'Elefante africano',     // até 7 toneladas
      'Elefante asiático',     // até 5 toneladas
      'Hipopótamo',            // até 3 toneladas — ⚠️ VERIFICAR vs rinoceronte
    ],
    variantes: {
      'Baleia-azul': ['baleia azul', 'baleia-azul', 'blue whale', 'baleia azul gigante'],
      'Baleia-da-groenlândia': ['baleia groelandia', 'baleia da groenlandia', 'bowhead whale', 'baleia da gronelandia', 'groenlandia'],
      'Elefante africano': ['elefante', 'elefante africano', 'elefante da africa'],
      'Elefante asiático': ['elefante asiatico', 'elefante da asia', 'elefante asiático'],
      'Hipopótamo': ['hipopotamo', 'hipopótamo', 'hippo', 'hipopotamos'],
    },
  },

  // ─── R15 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'recordes-paises-medalhas-olimpiadas',
    titulo: 'Top 5 países com mais medalhas de ouro nas Olimpíadas de verão',
    fonte: 'Comitê Olímpico Internacional (COI)',
    tamanho: 5,
    categoria: 'recordes',
    dificuldade: 2,
    expiresAt: '2025-09-01',
    // ⚠️ VERIFICAR: posições 2-5 podem ter mudado após Paris 2024.
    // EUA como #1 (histórico acumulado) é estável.
    // Atenção: contagem inclui URSS separada da Rússia moderna.
    itens: [
      'Estados Unidos',  // ~1.000+ ouros — confirmado #1
      'União Soviética', // ~395 ouros (histórico encerrado) — ⚠️ VERIFICAR posição
      'Grã-Bretanha',    // ⚠️ VERIFICAR posição (disputa com China)
      'China',           // ⚠️ VERIFICAR posição
      'Alemanha',        // ⚠️ VERIFICAR (DDR + RFA histórico complexo)
    ],
    variantes: {
      'Estados Unidos': ['eua', 'usa', 'estados unidos', 'america', 'united states', 'norte america'],
      'União Soviética': ['urss', 'uniao sovietica', 'união soviética', 'soviet union', 'russia antiga', 'russia sovietica'],
      'Grã-Bretanha': ['gra bretanha', 'grã-bretanha', 'reino unido', 'uk', 'great britain', 'england', 'inglaterra'],
      'China': ['china', 'china olimpica', 'republica popular da china'],
      'Alemanha': ['alemanha', 'germany', 'alemanha ocidental', 'rfa', 'deutschland'],
    },
  },

  // ─── R16 — DIFÍCIL ──────────────────────────────────────────────────────
  {
    id: 'recordes-estruturas-mais-altas',
    titulo: 'Top 5 estruturas mais altas do mundo',
    fonte: 'Guinness World Records, 2024',
    tamanho: 5,
    categoria: 'recordes',
    dificuldade: 3,
    expiresAt: '2027-01-01',
    itens: [
      'Burj Khalifa',            // Dubai — 828 metros
      'Merdeka 118',             // Kuala Lumpur — 679 metros
      'Shanghai Tower',          // Shanghai — 632 metros
      'Abraj Al-Bait',           // Meca, Arábia Saudita — 601 metros
      'Ping An Finance Centre',  // Shenzhen — 599 metros
    ],
    variantes: {
      'Burj Khalifa': ['burj khalifa', 'dubai', 'burj', 'khalifa'],
      'Merdeka 118': ['merdeka', 'merdeka 118', 'kuala lumpur', 'malaysia', 'malásia'],
      'Shanghai Tower': ['shanghai tower', 'xangai', 'shanghai', 'torre de xangai'],
      'Abraj Al-Bait': ['abraj al-bait', 'meca', 'mecca', 'clock tower', 'torre meca', 'torre do relogio'],
      'Ping An Finance Centre': ['ping an', 'shenzhen', 'ping an finance', 'centro financeiro ping an'],
    },
  },
];
