import type { RankingDuvido } from '../types';

/**
 * Rankings de marcas — 1 no total.
 * Fonte: Forbes Brand Value, 2024.
 *
 * ⚠️ Posições 6-10 variam anualmente. NVIDIA subiu muito em 2023-24.
 *    Verificar edição mais recente do Forbes na data de publicação.
 */
export const rankingsMarcas: RankingDuvido[] = [
  // ─── Ma30 — MÉDIO ───────────────────────────────────────────────────────
  {
    id: 'marcas-mais-valiosas-mundo',
    titulo: 'Top 10 marcas mais valiosas do mundo',
    fonte: 'Forbes, 2024',
    tamanho: 10,
    categoria: 'marcas',
    dificuldade: 2,
    expiresAt: '2026-01-01',
    // ⚠️ VERIFICAR: posições 6-10 variam por edição. Apple, Google e Microsoft
    // no top 3 são estáveis. NVIDIA pode ter subido para o top 5 em 2024.
    itens: [
      'Apple',         // #1 — estável
      'Google',        // #2 — estável
      'Microsoft',     // #3 — estável
      'Amazon',        // #4 — ⚠️ VERIFICAR posição vs Microsoft/NVIDIA
      'NVIDIA',        // ⚠️ VERIFICAR posição (subiu muito em 2023-24)
      'Meta',          // ⚠️ VERIFICAR posição
      'Samsung',       // ⚠️ VERIFICAR posição
      'Louis Vuitton', // ⚠️ VERIFICAR se conta como marca única (LVMH)
      'Tesla',         // ⚠️ VERIFICAR posição
      'Coca-Cola',     // ⚠️ VERIFICAR posição vs Walmart, McDonald's
    ],
    variantes: {
      'Apple': ['apple', 'apple inc', 'iphone', 'mac'],
      'Google': ['google', 'alphabet', 'google alphabet'],
      'Microsoft': ['microsoft', 'ms', 'windows', 'bill gates'],
      'Amazon': ['amazon', 'amazon.com', 'aws', 'amazon prime'],
      'NVIDIA': ['nvidia', 'nvda', 'nvidia corporation'],
      'Meta': ['meta', 'facebook', 'meta facebook', 'zuckerberg'],
      'Samsung': ['samsung', 'samsung electronics'],
      'Louis Vuitton': ['louis vuitton', 'lv', 'lvmh', 'vuitton', 'louis'],
      'Tesla': ['tesla', 'tesla motors', 'elon musk', 'tesla electric'],
      'Coca-Cola': ['coca cola', 'coca-cola', 'coke', 'coca'],
    },
  },
];
