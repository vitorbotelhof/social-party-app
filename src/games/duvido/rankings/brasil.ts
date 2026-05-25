import type { RankingDuvido } from '../types';

/**
 * Rankings sobre o Brasil — 4 no total.
 * Fontes: IBGE Censo 2022, MDIC / Comex Stat.
 *
 * ⚠️ B23 (PIB estadual) e B24 (exportações) variam anualmente.
 *    Verificar com a fonte antes de publicar e declarar o ano base explicitamente.
 */
export const rankingsBrasil: RankingDuvido[] = [
  // ─── B21 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'brasil-estados-mais-populosos',
    titulo: 'Top 5 estados mais populosos do Brasil',
    fonte: 'IBGE, Censo 2022',
    tamanho: 5,
    categoria: 'brasil',
    dificuldade: 1,
    expiresAt: '2033-01-01',
    // ⚠️ VERIFICAR: margem entre PR (#5) e RS (#6) é pequena (~100 mil hab).
    // Confirmar que PR está claramente acima de RS no Censo 2022 definitivo.
    itens: [
      'São Paulo',      // ~44,4 milhões
      'Minas Gerais',   // ~21,3 milhões
      'Rio de Janeiro', // ~16,1 milhões
      'Bahia',          // ~14,1 milhões
      'Paraná',         // ~11,4 milhões
    ],
    variantes: {
      'São Paulo': ['sao paulo', 'sp', 'são paulo', 'sampa', 'estado de sao paulo'],
      'Minas Gerais': ['minas', 'minas gerais', 'mg', 'estado de minas'],
      'Rio de Janeiro': ['rio', 'rio de janeiro', 'rj', 'estado do rio'],
      'Bahia': ['bahia', 'ba', 'estado da bahia'],
      'Paraná': ['parana', 'paraná', 'pr', 'estado do parana'],
    },
  },

  // ─── B22 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'brasil-cidades-mais-populosas',
    titulo: 'Top 10 cidades mais populosas do Brasil',
    fonte: 'IBGE, Censo 2022',
    tamanho: 10,
    categoria: 'brasil',
    dificuldade: 2,
    expiresAt: '2033-01-01',
    itens: [
      'São Paulo',      // ~12,3 milhões
      'Rio de Janeiro', // ~6,7 milhões
      'Brasília',       // ~3,1 milhões
      'Salvador',       // ~2,9 milhões
      'Fortaleza',      // ~2,7 milhões
      'Belo Horizonte', // ~2,5 milhões
      'Manaus',         // ~2,2 milhões
      'Curitiba',       // ~1,9 milhões
      'Recife',         // ~1,6 milhões
      'Goiânia',        // ~1,5 milhões
    ],
    variantes: {
      'São Paulo': ['sao paulo', 'sampa', 'sp', 'são paulo', 'paulistano'],
      'Rio de Janeiro': ['rio', 'rio de janeiro', 'rj', 'cidade maravilhosa'],
      'Brasília': ['brasilia', 'brasília', 'distrito federal', 'df', 'capital federal'],
      'Salvador': ['salvador', 'salvador da bahia', 'soteropolitano'],
      'Fortaleza': ['fortaleza', 'ceara', 'cearense', 'forte'],
      'Belo Horizonte': ['belo horizonte', 'bh', 'beagá', 'beaga'],
      'Manaus': ['manaus', 'amazonas', 'capital do amazonas'],
      'Curitiba': ['curitiba', 'cwb', 'capital do parana', 'capital paranaense'],
      'Recife': ['recife', 'pernambuco', 'capital de pernambuco', 'veneza brasileira'],
      'Goiânia': ['goiania', 'goiânia', 'goias', 'capital de goias'],
    },
  },

  // ─── B23 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'brasil-estados-maior-pib',
    titulo: 'Top 5 estados com maior PIB do Brasil',
    fonte: 'IBGE',
    tamanho: 5,
    categoria: 'brasil',
    dificuldade: 2,
    expiresAt: '2026-01-01',
    // ⚠️ VERIFICAR: posições 4-5 (RS vs PR) alternaram nos últimos anos.
    // SP como #1, RJ como #2 e MG como #3 são estáveis.
    itens: [
      'São Paulo',          // #1 incontestável
      'Rio de Janeiro',     // #2 estável
      'Minas Gerais',       // #3 estável
      'Rio Grande do Sul',  // ⚠️ VERIFICAR posição vs Paraná
      'Paraná',             // ⚠️ VERIFICAR posição
    ],
    variantes: {
      'São Paulo': ['sao paulo', 'sp', 'são paulo'],
      'Rio de Janeiro': ['rio', 'rj', 'rio de janeiro'],
      'Minas Gerais': ['minas', 'mg', 'minas gerais'],
      'Rio Grande do Sul': ['rio grande do sul', 'rs', 'gaucho', 'gaúcho', 'rio grande', 'gauchao'],
      'Paraná': ['parana', 'pr', 'paraná'],
    },
  },

  // ─── B24 — DIFÍCIL ──────────────────────────────────────────────────────
  {
    id: 'brasil-produtos-mais-exportados',
    titulo: 'Top 5 produtos mais exportados pelo Brasil',
    fonte: 'MDIC / Comex Stat, 2023',
    tamanho: 5,
    categoria: 'brasil',
    dificuldade: 3,
    expiresAt: '2025-12-01',
    // ⚠️ VERIFICAR: posições 4-5 variam significativamente por período.
    // Verificar Comex Stat (comexstat.mdic.gov.br) para o ano base declarado.
    // Café fora do top 5 é o maior fato surpresa deste ranking.
    itens: [
      'Soja',            // #1 histórico estável
      'Petróleo bruto',  // #2 — crescimento recente ⚠️ VERIFICAR posição
      'Minério de ferro',// posição estável ⚠️ VERIFICAR se ainda #3
      'Carne bovina',    // ⚠️ VERIFICAR posição exata
      'Açúcar',          // ⚠️ VERIFICAR posição vs milho e café
    ],
    variantes: {
      'Soja': ['soja', 'soy', 'graos de soja', 'farelo de soja', 'complexo soja'],
      'Petróleo bruto': ['petroleo', 'petróleo', 'petroleo bruto', 'crude oil', 'oleo bruto'],
      'Minério de ferro': ['minerio de ferro', 'minério de ferro', 'ferro', 'minerio'],
      'Carne bovina': ['carne bovina', 'carne', 'beef', 'boi gordo', 'carne de boi'],
      'Açúcar': ['acucar', 'açúcar', 'sugar', 'cana de acucar'],
    },
  },
];
