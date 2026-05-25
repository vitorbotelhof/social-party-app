import type { RankingDuvido } from '../types';

/**
 * Rankings de futebol — 6 no total.
 * Fontes: FIFA, UEFA, CBF, France Football, Transfermarkt.
 *
 * ⚠️ Rankings marcados com VERIFICAR devem ser checados na fonte
 *    antes de entrar em produção. Dados de transferência e artilharia
 *    da Champions mudam a cada janela/temporada.
 */
export const rankingsFutebol: RankingDuvido[] = [
  // ─── F01 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'futebol-artilheiros-copa-mundo',
    titulo: 'Top 5 artilheiros das Copas do Mundo',
    fonte: 'FIFA',
    tamanho: 5,
    categoria: 'futebol',
    dificuldade: 1,
    expiresAt: null,
    itens: [
      'Miroslav Klose',
      'Ronaldo Fenômeno',
      'Gerd Müller',
      'Just Fontaine',
      'Pelé',
    ],
    variantes: {
      'Miroslav Klose': ['klose', 'miroslav', 'miroslav klose'],
      'Ronaldo Fenômeno': ['ronaldo', 'r9', 'ronaldo fenomeno', 'ronaldo nazario'],
      'Gerd Müller': ['muller', 'gerd muller', 'gerd müller', 'der bomber'],
      'Just Fontaine': ['fontaine', 'just fontaine'],
      'Pelé': ['pele', 'edson arantes', 'edson arantes do nascimento'],
    },
  },

  // ─── F02 — FÁCIL ────────────────────────────────────────────────────────
  {
    id: 'futebol-champions-titulos-clubes',
    titulo: 'Top 5 clubes com mais títulos da Champions League',
    fonte: 'UEFA, 2024',
    tamanho: 5,
    categoria: 'futebol',
    dificuldade: 1,
    expiresAt: '2027-06-01',
    itens: [
      'Real Madrid',
      'AC Milan',
      'Bayern Munich',
      'Liverpool',
      'Barcelona',
    ],
    variantes: {
      'Real Madrid': ['real', 'madrid', 'merengue', 'real madrid'],
      'AC Milan': ['milan', 'ac milan', 'rossoneri'],
      'Bayern Munich': ['bayern', 'munich', 'munique', 'fc bayern', 'bayern munique'],
      'Liverpool': ['liverpool', 'reds', 'the reds'],
      'Barcelona': ['barça', 'barca', 'barcelona', 'fcb', 'blaugrana'],
    },
  },

  // ─── F03 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'futebol-artilheiros-selecao-brasileira',
    titulo: 'Top 10 artilheiros da história da Seleção Brasileira',
    fonte: 'CBF',
    tamanho: 10,
    categoria: 'futebol',
    dificuldade: 2,
    expiresAt: '2027-01-01',
    itens: [
      'Neymar Jr',     // 79 gols
      'Pelé',          // 77 gols
      'Ronaldo',       // 62 gols (Fenômeno)
      'Romário',       // 55 gols
      'Zico',          // 52 gols
      'Bebeto',        // 39 gols
      'Rivaldo',       // 35 gols
      'Jairzinho',     // 33 gols
      'Ademir',        // ⚠️ VERIFICAR posição 9 — Ademir de Menezes (~32 gols)
      'Tostão',        // ⚠️ VERIFICAR posição 10 — Tostão (~32 gols)
    ],
    variantes: {
      'Neymar Jr': ['neymar', 'ney', 'neymar junior', 'neymar jr'],
      'Pelé': ['pele', 'edson arantes', 'rei pele'],
      'Ronaldo': ['ronaldo fenomeno', 'ronaldo fenômeno', 'r9', 'ronaldo nazario'],
      'Romário': ['romario', 'baixinho'],
      'Zico': ['zico', 'arthur coimbra', 'galinho'],
      'Bebeto': ['bebeto', 'jose roberto gama'],
      'Rivaldo': ['rivaldo', 'rivaldo ferreira'],
      'Jairzinho': ['jairzinho', 'jair ventura', 'furacão'],
      'Ademir': ['ademir', 'ademir de menezes', 'queixada'],
      'Tostão': ['tostao', 'tostão', 'eduardo goncalves', 'eduardo gonçalves'],
    },
  },

  // ─── F04 — MÉDIO ────────────────────────────────────────────────────────
  {
    id: 'futebol-bolas-de-ouro-historico',
    titulo: 'Top 5 jogadores com mais Bolas de Ouro',
    fonte: 'France Football / Ballon d\'Or, 2024',
    tamanho: 5,
    categoria: 'futebol',
    dificuldade: 2,
    expiresAt: '2025-12-01',
    itens: [
      'Lionel Messi',     // 8 Bolas de Ouro
      'Cristiano Ronaldo', // 5 Bolas de Ouro
      'Michel Platini',   // 3 Bolas de Ouro (empate)
      'Johan Cruyff',     // 3 Bolas de Ouro (empate)
      'Marco van Basten', // 3 Bolas de Ouro (empate)
    ],
    variantes: {
      'Lionel Messi': ['messi', 'leo', 'leo messi', 'la pulga'],
      'Cristiano Ronaldo': ['cr7', 'cristiano', 'ronaldo', 'cr 7'],
      'Michel Platini': ['platini', 'michel platini'],
      'Johan Cruyff': ['cruyff', 'cruijff', 'johan cruyff'],
      'Marco van Basten': ['van basten', 'marco van basten'],
    },
  },

  // ─── F05 — DIFÍCIL ──────────────────────────────────────────────────────
  {
    id: 'futebol-maiores-transferencias-historia',
    titulo: 'Top 10 maiores transferências do futebol',
    fonte: 'Transfermarkt, 2024',
    tamanho: 10,
    categoria: 'futebol',
    dificuldade: 3,
    expiresAt: '2026-07-01',
    // ⚠️ VERIFICAR: posições 2-10 podem ter mudado com janelas recentes.
    // Neymar como #1 (€222m) é estável. O restante depende da janela 2024.
    itens: [
      'Neymar',            // PSG, 2017 — €222m (confirmado #1)
      'Philippe Coutinho', // Barcelona, 2018 — ~€145m ⚠️ VERIFICAR posição
      'João Félix',        // Atlético Madrid, 2019 — ~€126m
      'Enzo Fernández',    // Chelsea, 2023 — ~€121m
      'Antoine Griezmann', // Barcelona, 2019 — ~€120m
      'Jack Grealish',     // Man City, 2021 — ~€117m
      'Romelu Lukaku',     // Chelsea, 2021 — ~€115m
      'Moises Caicedo',    // Chelsea, 2023 — ~€115m ⚠️ VERIFICAR posição vs Grealish/Lukaku
      'Ousmane Dembélé',   // Barcelona, 2017 — ~€105m
      'Declan Rice',       // Arsenal, 2023 — ~€105m ⚠️ VERIFICAR se está no top 10
    ],
    variantes: {
      'Neymar': ['neymar', 'neymar jr', 'ney', 'neymar junior'],
      'Philippe Coutinho': ['coutinho', 'philippe coutinho', 'the magician'],
      'João Félix': ['joao felix', 'joão félix', 'felix'],
      'Enzo Fernández': ['enzo', 'enzo fernandez', 'enzo fernández'],
      'Antoine Griezmann': ['griezmann', 'antoine griezmann', 'grizou'],
      'Jack Grealish': ['grealish', 'jack grealish'],
      'Romelu Lukaku': ['lukaku', 'romelu', 'romelu lukaku'],
      'Moises Caicedo': ['caicedo', 'moises caicedo', 'moisés caicedo'],
      'Ousmane Dembélé': ['dembele', 'dembélé', 'ousmane dembele'],
      'Declan Rice': ['rice', 'declan', 'declan rice'],
    },
  },

  // ─── F06 — DIFÍCIL ──────────────────────────────────────────────────────
  {
    id: 'futebol-artilheiros-champions-historia',
    titulo: 'Top 10 artilheiros da história da Champions League',
    fonte: 'UEFA, 2024',
    tamanho: 10,
    categoria: 'futebol',
    dificuldade: 3,
    expiresAt: '2027-06-01',
    // ⚠️ VERIFICAR: posições 3-10 mudam a cada temporada.
    // CR7 como #1 e Messi como #2 são estáveis. O restante precisa de
    // verificação no site oficial da UEFA antes de publicar.
    itens: [
      'Cristiano Ronaldo', // #1 (~140 gols) — confirmado
      'Lionel Messi',      // #2 (~129 gols) — confirmado
      'Robert Lewandowski',// ⚠️ VERIFICAR posição exata (~91 gols)
      'Karim Benzema',     // ⚠️ VERIFICAR posição exata (~88 gols)
      'Raúl',              // 71 gols — ex-recordista, posição aproximada
      'Ruud van Nistelrooy',// ~56 gols — ⚠️ VERIFICAR
      'Thomas Müller',     // ⚠️ VERIFICAR posição exata
      'Andriy Shevchenko', // ⚠️ VERIFICAR posição exata
      'Filippo Inzaghi',   // ⚠️ VERIFICAR posição exata
      'Eusébio',           // ⚠️ VERIFICAR se ainda está no top 10
    ],
    variantes: {
      'Cristiano Ronaldo': ['cr7', 'cristiano', 'ronaldo', 'cr 7'],
      'Lionel Messi': ['messi', 'leo', 'leo messi'],
      'Robert Lewandowski': ['lewandowski', 'lewa', 'robert lewandowski'],
      'Karim Benzema': ['benzema', 'karim', 'karim benzema', 'benz'],
      'Raúl': ['raul', 'raúl', 'raul gonzalez', 'raúl gonzález'],
      'Ruud van Nistelrooy': ['van nistelrooy', 'nistelrooy', 'ruud'],
      'Thomas Müller': ['muller', 'thomas muller', 'thomas müller', 'raumdeuter'],
      'Andriy Shevchenko': ['shevchenko', 'andriy', 'sheva'],
      'Filippo Inzaghi': ['inzaghi', 'filippo inzaghi', 'pippo inzaghi'],
      'Eusébio': ['eusebio', 'eusébio', 'a pantera negra'],
    },
  },
];
