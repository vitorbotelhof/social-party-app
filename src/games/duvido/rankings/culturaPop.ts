import type { RankingDuvido } from '../types';

/**
 * Rankings de cultura pop — 2 no total.
 * Fontes: VGChartz / Guinness, Netflix Top 10.
 *
 * ⚠️ CP28 (videogames): critério de contagem de "venda" é crítico.
 *    Definir explicitamente (excluir bundled? incluir mobile?) antes de publicar.
 * ⚠️ CP29 (séries Netflix): dados mudam com cada nova temporada.
 *    Definir escopo (séries globais vs inglês? temporadas individuais vs série toda?)
 */
export const rankingsCulturaPop: RankingDuvido[] = [
  // ─── CP28 — MÉDIO ───────────────────────────────────────────────────────
  {
    id: 'cultpop-videogames-mais-vendidos',
    titulo: 'Top 10 videogames mais vendidos da história',
    fonte: 'VGChartz / Guinness, 2024',
    tamanho: 10,
    categoria: 'cultura_pop',
    dificuldade: 2,
    expiresAt: '2026-01-01',
    // ⚠️ VERIFICAR: posições 3-10 variam por método de contagem.
    // Minecraft como #1 e GTA V como #2 são estáveis.
    // Decisão editorial obrigatória: excluir versões bundled? Incluir mobile?
    itens: [
      'Minecraft',                // ~238 milhões de cópias — confirmado #1
      'Grand Theft Auto V',       // ~185 milhões — confirmado #2
      'Wii Sports',               // ~83 milhões (bundled — ⚠️ verificar critério)
      'Mario Kart 8 Deluxe',      // ~65 milhões — ⚠️ VERIFICAR posição
      'PUBG: Battlegrounds',      // ~75 milhões — ⚠️ VERIFICAR posição
      'Super Mario Bros.',        // ~40 milhões — ⚠️ VERIFICAR (qual versão?)
      'Red Dead Redemption 2',    // ~61 milhões — ⚠️ VERIFICAR posição
      'Pokémon Red / Blue',       // ~31 milhões — ⚠️ VERIFICAR posição
      'Tetris (Game Boy)',         // ~35 milhões — ⚠️ VERIFICAR vs outras versões
      'The Elder Scrolls V: Skyrim', // ~60 milhões — ⚠️ VERIFICAR posição
    ],
    variantes: {
      'Minecraft': ['minecraft', 'mine craft', 'mine'],
      'Grand Theft Auto V': ['gta v', 'gta 5', 'gta', 'grand theft auto', 'gta five'],
      'Wii Sports': ['wii sports', 'wii', 'nintendo wii sports'],
      'Mario Kart 8 Deluxe': ['mario kart', 'mario kart 8', 'mario kart deluxe', 'mk8'],
      'PUBG: Battlegrounds': ['pubg', 'playerunknown', 'battlegrounds', 'player unknown'],
      'Super Mario Bros.': ['super mario', 'mario bros', 'super mario bros', 'mario'],
      'Red Dead Redemption 2': ['red dead', 'red dead redemption', 'rdr2', 'red dead 2'],
      'Pokémon Red / Blue': ['pokemon', 'pokémon', 'pokemon red', 'pokemon blue', 'pokemon vermelho', 'pokemon azul'],
      'Tetris (Game Boy)': ['tetris', 'tetris game boy'],
      'The Elder Scrolls V: Skyrim': ['skyrim', 'elder scrolls', 'the elder scrolls'],
    },
  },

  // ─── CP29 — DIFÍCIL ─────────────────────────────────────────────────────
  {
    id: 'cultpop-series-netflix-global',
    titulo: 'Top 10 séries com mais horas assistidas na Netflix (primeiros 28 dias)',
    fonte: 'Netflix Top 10, 2024',
    tamanho: 10,
    categoria: 'cultura_pop',
    dificuldade: 3,
    expiresAt: '2025-12-01',
    // ⚠️ VERIFICAR: verificar top10.netflix.com na data de publicação.
    // Squid Game T1 como #1 é estável. As demais posições mudam a cada nova série.
    // Decisão editorial: séries globais ou só inglês? Temporadas individuais?
    itens: [
      'Squid Game',          // T1 — ~1,65 bilhões de horas ⚠️ VERIFICAR se T2 ultrapassou
      'Wednesday',           // T1 — ~1,24 bilhões de horas
      'Stranger Things',     // T4 — ~1,35 bilhões ⚠️ VERIFICAR posição
      'Dahmer',              // ~824 milhões de horas
      'The Night Agent',     // ⚠️ VERIFICAR posição
      'The Diplomat',        // ⚠️ VERIFICAR posição
      'You',                 // ⚠️ VERIFICAR temporada e posição
      'Virgin River',        // ⚠️ VERIFICAR posição
      'All of Us Are Dead',  // ⚠️ VERIFICAR posição (K-drama)
      'Bridgerton',          // ⚠️ VERIFICAR temporada e posição
    ],
    variantes: {
      'Squid Game': ['squid game', 'round 6', 'jogo da lula', 'squid'],
      'Wednesday': ['wednesday', 'wandinha', 'familia addams', 'wednesday addams'],
      'Stranger Things': ['stranger things', 'coisas estranhas', 'stranger'],
      'Dahmer': ['dahmer', 'monster', 'jeffrey dahmer', 'monstruo'],
      'The Night Agent': ['the night agent', 'night agent', 'agente noturno'],
      'The Diplomat': ['the diplomat', 'a diplomata', 'diplomata'],
      'You': ['you', 'você', 'penn badgley'],
      'Virgin River': ['virgin river', 'rio virgem'],
      'All of Us Are Dead': ['all of us are dead', 'agora somos mortos', 'zombie coreano'],
      'Bridgerton': ['bridgerton', 'bridgertone', 'regencia'],
    },
  },
];
