import type { RankingDuvido } from '../types';

/**
 * Rankings de música — 5 no total.
 * Fontes: IFPI, Spotify, YouTube, Instagram/HypeAuditor.
 *
 * ⚠️ Rankings de streaming (M08, M09, M11) têm alta rotatividade.
 *    Verificar e congelar dados na data de publicação.
 */
export const rankingsMusica: RankingDuvido[] = [
  // ─── M07 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'musica-albuns-mais-vendidos-historia',
    titulo: 'Top 10 álbuns mais vendidos da história',
    fonte: 'IFPI',
    tamanho: 10,
    categoria: 'musica',
    dificuldade: 1,
    expiresAt: null,
    // ⚠️ VERIFICAR: posições 7-10 têm dados conflitantes entre fontes.
    // Thriller como #1 e Back in Black como #2 são estáveis.
    itens: [
      'Thriller',                         // Michael Jackson — ~70 mi
      'Back in Black',                    // AC/DC — ~50 mi
      'The Dark Side of the Moon',        // Pink Floyd — ~45 mi
      'The Bodyguard',                    // Whitney Houston — ~45 mi ⚠️ VERIFICAR posição vs Dark Side
      'Their Greatest Hits (1971-1975)',  // Eagles — ~42 mi
      'Come On Over',                     // Shania Twain — ~40 mi
      'Rumours',                          // Fleetwood Mac — ~40 mi
      'Led Zeppelin IV',                  // Led Zeppelin — ~37 mi
      'Bat Out of Hell',                  // Meat Loaf — ~28 mi
      'Their Greatest Hits Vol. 2',       // Eagles / ⚠️ VERIFICAR posição 10
    ],
    variantes: {
      'Thriller': ['thriller', 'michael jackson', 'mj'],
      'Back in Black': ['back in black', 'ac dc', 'acdc', 'ac/dc'],
      'The Dark Side of the Moon': ['dark side of the moon', 'pink floyd', 'the dark side', 'dark side'],
      'The Bodyguard': ['the bodyguard', 'whitney houston', 'bodyguard', 'whitney'],
      'Their Greatest Hits (1971-1975)': ['eagles', 'eagles greatest hits', 'greatest hits eagles'],
      'Come On Over': ['come on over', 'shania twain', 'shania'],
      'Rumours': ['rumours', 'rumors', 'fleetwood mac'],
      'Led Zeppelin IV': ['led zeppelin iv', 'led zeppelin 4', 'led zeppelin', 'stairway to heaven', 'zeppelin iv'],
      'Bat Out of Hell': ['bat out of hell', 'meat loaf', 'meatloaf'],
      'Their Greatest Hits Vol. 2': ['eagles vol 2', 'eagles greatest hits vol 2', 'saturday night fever', 'bee gees'],
    },
  },

  // ─── M08 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'musica-mais-tocadas-spotify-historico',
    titulo: 'Top 5 músicas com mais streams no Spotify de todos os tempos',
    fonte: 'Spotify, 2024',
    tamanho: 5,
    categoria: 'musica',
    dificuldade: 2,
    expiresAt: '2026-01-01',
    // ⚠️ VERIFICAR: lista muda com o tempo. Verificar Spotify Newsroom
    // (newsroom.spotify.com) na data de publicação e congelar os dados.
    itens: [
      'Blinding Lights',    // The Weeknd — ⚠️ VERIFICAR posição exata
      'Shape of You',       // Ed Sheeran — ⚠️ VERIFICAR
      'As It Was',          // Harry Styles — ⚠️ VERIFICAR posição vs Someone You Loved
      'Dance Monkey',       // Tones and I — ⚠️ VERIFICAR
      'Sunflower',          // Post Malone & Swae Lee — ⚠️ VERIFICAR
    ],
    variantes: {
      'Blinding Lights': ['blinding lights', 'the weeknd', 'weeknd', 'blinding light'],
      'Shape of You': ['shape of you', 'ed sheeran', 'shape'],
      'As It Was': ['as it was', 'harry styles', 'harry', 'as it was harry'],
      'Dance Monkey': ['dance monkey', 'tones and i', 'tones and i dance monkey', 'tones'],
      'Sunflower': ['sunflower', 'post malone', 'swae lee', 'post malone sunflower'],
    },
  },

  // ─── M09 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'musica-artistas-spotify-global',
    titulo: 'Top 10 artistas com mais ouvintes mensais no Spotify',
    fonte: 'Spotify, 2024',
    tamanho: 10,
    categoria: 'musica',
    dificuldade: 2,
    expiresAt: '2025-06-01',
    // ⚠️ VERIFICAR: esta lista muda semanalmente. Capturar e congelar
    // dados de uma data específica em spotifycharts.com antes de publicar.
    // Candidatos frequentes ao top 10 (verificar ordem):
    itens: [
      'Taylor Swift',    // ⚠️ VERIFICAR posição
      'The Weeknd',     // ⚠️ VERIFICAR
      'Bad Bunny',      // ⚠️ VERIFICAR
      'Drake',          // ⚠️ VERIFICAR
      'Ed Sheeran',     // ⚠️ VERIFICAR
      'Billie Eilish',  // ⚠️ VERIFICAR
      'Ariana Grande',  // ⚠️ VERIFICAR
      'Post Malone',    // ⚠️ VERIFICAR
      'Justin Bieber',  // ⚠️ VERIFICAR
      'Dua Lipa',       // ⚠️ VERIFICAR
    ],
    variantes: {
      'Taylor Swift': ['taylor swift', 'taylor', 'swift'],
      'The Weeknd': ['the weeknd', 'weeknd', 'abel'],
      'Bad Bunny': ['bad bunny', 'benito', 'el conejo malo'],
      'Drake': ['drake', 'drizzy', 'champagne papi'],
      'Ed Sheeran': ['ed sheeran', 'ed', 'sheeran'],
      'Billie Eilish': ['billie eilish', 'billie', 'eilish'],
      'Ariana Grande': ['ariana grande', 'ariana', 'ari'],
      'Post Malone': ['post malone', 'post', 'posty'],
      'Justin Bieber': ['justin bieber', 'bieber', 'justin'],
      'Dua Lipa': ['dua lipa', 'dua', 'lipa'],
    },
  },

  // ─── M10 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'musica-videos-mais-views-youtube',
    titulo: 'Top 10 vídeos com mais views no YouTube de todos os tempos',
    fonte: 'YouTube, 2024',
    tamanho: 10,
    categoria: 'musica',
    dificuldade: 2,
    expiresAt: '2026-01-01',
    // ⚠️ VERIFICAR: posições 7-10 podem ter mudado. Baby Shark como #1
    // e Despacito como #2 são estáveis. Verificar YouTube "Most viewed" antes de publicar.
    itens: [
      'Baby Shark Dance',     // Pinkfong — ~14 bilhões de views
      'Despacito',            // Luis Fonsi ft. Daddy Yankee — ~8,4 bilhões
      'Shape of You',         // Ed Sheeran — ~6,3 bilhões
      'See You Again',        // Wiz Khalifa ft. Charlie Puth — ~6,2 bilhões
      'Uptown Funk',          // Mark Ronson ft. Bruno Mars — ~5,3 bilhões
      'Gangnam Style',        // PSY — ~5,3 bilhões
      'Counting Stars',       // OneRepublic — ⚠️ VERIFICAR posição
      'Roar',                 // Katy Perry — ⚠️ VERIFICAR posição
      'Sugar',                // Maroon 5 — ⚠️ VERIFICAR posição
      'Thinking Out Loud',    // Ed Sheeran — ⚠️ VERIFICAR posição
    ],
    variantes: {
      'Baby Shark Dance': ['baby shark', 'pinkfong', 'baby shark dance', 'baby shark doo doo'],
      'Despacito': ['despacito', 'luis fonsi', 'daddy yankee', 'luis fonsi despacito'],
      'Shape of You': ['shape of you', 'ed sheeran', 'shape'],
      'See You Again': ['see you again', 'wiz khalifa', 'charlie puth', 'fast and furious', 'velozes e furiosos'],
      'Uptown Funk': ['uptown funk', 'mark ronson', 'bruno mars', 'uptown'],
      'Gangnam Style': ['gangnam style', 'psy', 'gangnam', 'oppa gangnam'],
      'Counting Stars': ['counting stars', 'onerepublic', 'one republic'],
      'Roar': ['roar', 'katy perry'],
      'Sugar': ['sugar', 'maroon 5', 'maroon5'],
      'Thinking Out Loud': ['thinking out loud', 'ed sheeran thinking'],
    },
  },

  // ─── M11 — DIFÍCIL ──────────────────────────────────────────────────────
  {
    id: 'musica-cantores-brasileiros-instagram',
    titulo: 'Top 5 cantores brasileiros com mais seguidores no Instagram',
    fonte: 'Instagram / HypeAuditor, 2024',
    tamanho: 5,
    categoria: 'musica',
    dificuldade: 3,
    expiresAt: '2025-06-01',
    // ⚠️ VERIFICAR: contagens mudam mensalmente. Verificar dados na data de
    // publicação. Anitta como #1 (~65 mi) é estável. Posições 2-5 disputadas
    // entre sertanejo, funk e pop.
    itens: [
      'Anitta',          // ~65 milhões — ⚠️ VERIFICAR total atualizado
      'Gustavo Lima',    // ⚠️ VERIFICAR posição
      'Ivete Sangalo',   // ⚠️ VERIFICAR posição
      'Wesley Safadão',  // ⚠️ VERIFICAR posição
      'Luan Santana',    // ⚠️ VERIFICAR posição vs Ludmilla/Ferrugem
    ],
    variantes: {
      'Anitta': ['anitta', 'larissa macedo', 'mc anitta', 'larissa de macedo machado'],
      'Gustavo Lima': ['gustavo lima', 'gustavo', 'buteco do gustavo'],
      'Ivete Sangalo': ['ivete', 'ivete sangalo', 'veveta'],
      'Wesley Safadão': ['safadão', 'wesley safadão', 'wesley safadao', 'whindersson'],
      'Luan Santana': ['luan santana', 'luan', 'santana'],
    },
  },
];
