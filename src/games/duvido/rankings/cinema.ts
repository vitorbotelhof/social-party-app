import type { RankingDuvido } from '../types';

/**
 * Rankings de cinema — 4 no total.
 * Fontes: Box Office Mojo, The Numbers, Academy of Motion Picture Arts and Sciences.
 *
 * ⚠️ C19 e C20 têm empates históricos que precisam de critério de desempate definido.
 *    C18 depende de como "franquia" é delimitada (ex: Spider-Man vs MCU).
 */
export const rankingsCinema: RankingDuvido[] = [
  // ─── C17 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'cinema-maiores-bilheterias-historia',
    titulo: 'Top 5 filmes de maior bilheteria da história',
    fonte: 'Box Office Mojo',
    tamanho: 5,
    categoria: 'cinema',
    dificuldade: 1,
    expiresAt: '2026-12-01',
    // ⚠️ VERIFICAR: posição de Star Wars (Ep. 7) pode ter mudado após 2024.
    // Avatar como #1 e Avengers: Endgame como #2 são estáveis.
    itens: [
      'Avatar',                       // 2009 — ~$2,9 bilhões (com re-lançamentos)
      'Avengers: Endgame',            // 2019 — ~$2,8 bilhões
      'Avatar: The Way of Water',     // 2022 — ~$2,3 bilhões
      'Titanic',                      // 1997 — ~$2,2 bilhões (com re-lançamentos)
      'Star Wars: The Force Awakens', // 2015 — ~$2,1 bilhões
    ],
    variantes: {
      'Avatar': ['avatar', 'avatar 1', 'james cameron', 'avatar um', 'avatar pandora'],
      'Avengers: Endgame': ['endgame', 'avengers endgame', 'vingadores', 'vingadores ultimato', 'ultimato'],
      'Avatar: The Way of Water': ['avatar 2', 'avatar the way of water', 'avatar o caminho da agua', 'avatar caminho'],
      'Titanic': ['titanic', 'titanic 1997', 'jack e rose'],
      'Star Wars: The Force Awakens': ['the force awakens', 'star wars 7', 'star wars episode 7', 'o despertar da forca', 'o despertar da força'],
    },
  },

  // ─── C18 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'cinema-franquias-mais-lucrativas',
    titulo: 'Top 10 franquias de cinema mais lucrativas da história',
    fonte: 'Box Office Mojo / The Numbers',
    tamanho: 10,
    categoria: 'cinema',
    dificuldade: 2,
    expiresAt: '2026-12-01',
    // ⚠️ VERIFICAR: posições 6-10 variam entre fontes.
    // Definir explicitamente: Spider-Man conta separado do MCU?
    // MCU como #1 e Star Wars como #2 são estáveis.
    itens: [
      'Marvel Cinematic Universe',      // ~$30 bilhões+
      'Star Wars',                      // ~$10 bilhões+
      'Harry Potter / Wizarding World', // ~$9 bilhões
      'James Bond',                     // ~$7 bilhões
      'Velozes e Furiosos',             // ~$7 bilhões
      'Batman / DC Universe',           // ~$6 bilhões ⚠️ VERIFICAR escopo
      'Spider-Man',                     // ~$5 bilhões ⚠️ VERIFICAR se conta separado do MCU
      'O Senhor dos Anéis / O Hobbit',  // ~$5,8 bilhões ⚠️ VERIFICAR posição
      'Jurassic Park / World',          // ~$5 bilhões
      'Transformers',                   // ~$4,8 bilhões
    ],
    variantes: {
      'Marvel Cinematic Universe': ['mcu', 'marvel', 'avengers', 'marvel universe', 'universo marvel', 'universo cinematografico marvel'],
      'Star Wars': ['star wars', 'guerra nas estrelas', 'jedi', 'skywalker'],
      'Harry Potter / Wizarding World': ['harry potter', 'hogwarts', 'animais fantasticos', 'wizarding world', 'mundo bruxo'],
      'James Bond': ['james bond', '007', 'bond', 'agente 007'],
      'Velozes e Furiosos': ['velozes e furiosos', 'fast and furious', 'fast furious', 'ff', 'velocidade furiosa'],
      'Batman / DC Universe': ['batman', 'dc', 'dc universe', 'liga da justica', 'liga da justiça', 'universo dc'],
      'Spider-Man': ['homem aranha', 'spider man', 'spiderman', 'spider-man'],
      'O Senhor dos Anéis / O Hobbit': ['senhor dos aneis', 'hobbit', 'lotr', 'lord of the rings', 'senhor dos anéis', 'tolkien'],
      'Jurassic Park / World': ['jurassic park', 'jurassic world', 'jurassico', 'jurassic'],
      'Transformers': ['transformers', 'autobot'],
    },
  },

  // ─── C19 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'cinema-filmes-mais-indicacoes-oscar',
    titulo: 'Top 5 filmes com mais indicações ao Oscar',
    fonte: 'Academy of Motion Picture Arts and Sciences',
    tamanho: 5,
    categoria: 'cinema',
    dificuldade: 2,
    expiresAt: null,
    // ⚠️ VERIFICAR: posições 4-5 têm múltiplos empates com 12 indicações.
    // Definir critério de desempate (ex: ano de lançamento) antes de publicar.
    // Os 3 primeiros empatam com 14 indicações — aceitar qualquer um nessas posições.
    itens: [
      'All About Eve',  // 1950 — 14 indicações (empate)
      'Titanic',        // 1997 — 14 indicações (empate)
      'La La Land',     // 2016 — 14 indicações (empate)
      'Ben-Hur',        // 1959 — 12 indicações ⚠️ VERIFICAR posição 4
      'Chicago',        // 2002 — 13 indicações ⚠️ VERIFICAR se está em top 5
    ],
    variantes: {
      'All About Eve': ['all about eve', 'a malvada', 'all about eve 1950'],
      'Titanic': ['titanic', 'titanic oscar', 'titanic 1997'],
      'La La Land': ['la la land', 'la la land musical', 'lalaland'],
      'Ben-Hur': ['ben-hur', 'ben hur', 'benhur'],
      'Chicago': ['chicago', 'chicago musical', 'chicago 2002'],
    },
  },

  // ─── C20 — DIFÍCIL ──────────────────────────────────────────────────────
  {
    id: 'cinema-diretores-mais-oscars-direcao',
    titulo: 'Top 5 diretores com mais Oscars de Melhor Direção',
    fonte: 'Academy of Motion Picture Arts and Sciences',
    tamanho: 5,
    categoria: 'cinema',
    dificuldade: 3,
    expiresAt: null,
    // ⚠️ VERIFICAR: lista completa de múltiplos vencedores na Academy.
    // John Ford como #1 (4 Oscars) é estável.
    // Posições 2-5: candidatos com 3 Oscars: Frank Capra, William Wyler.
    // Posições 3-5 dependem de desempate — verificar lista oficial antes de publicar.
    itens: [
      'John Ford',       // 4 Oscars de Direção — confirmado #1
      'Frank Capra',     // 3 Oscars — ⚠️ VERIFICAR posição vs Wyler
      'William Wyler',   // 3 Oscars — ⚠️ VERIFICAR posição
      'Steven Spielberg',// 2 Oscars — ⚠️ VERIFICAR posição (pode ter mais após 2024)
      'Elia Kazan',      // 2 Oscars — ⚠️ VERIFICAR posição vs outros com 2
    ],
    variantes: {
      'John Ford': ['john ford', 'ford', 'john martin feeney'],
      'Frank Capra': ['frank capra', 'capra'],
      'William Wyler': ['william wyler', 'wyler', 'willy wyler'],
      'Steven Spielberg': ['spielberg', 'steven spielberg', 'steven'],
      'Elia Kazan': ['elia kazan', 'kazan'],
    },
  },
];
