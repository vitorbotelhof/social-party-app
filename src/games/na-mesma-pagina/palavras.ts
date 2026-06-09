import type { NomeDeck } from './types';

// ─── Deck: Cotidiano ──────────────────────────────────────────────────────────
// Palavras comuns, alta polissemia, conhecidas pelo público brasileiro geral.
// Critério: substantivos com múltiplas associações, sem nicho técnico.

export const DECK_COTIDIANO: string[] = [
  // Natureza e elementos
  'praia', 'mar', 'rio', 'lago', 'floresta', 'montanha', 'pedra', 'areia',
  'chuva', 'vento', 'fogo', 'gelo', 'neve', 'sol', 'lua', 'estrela',
  'nuvem', 'trovão', 'onda', 'maré',

  // Corpo e saúde
  'mão', 'olho', 'boca', 'coração', 'cabeça', 'pé', 'dente', 'osso',
  'sangue', 'nervo', 'pele', 'cabelo', 'nariz', 'orelha', 'pescoço',

  // Casa e espaços
  'porta', 'janela', 'teto', 'chão', 'parede', 'escada', 'corredor',
  'sala', 'quarto', 'cozinha', 'banheiro', 'quintal', 'telhado', 'cofre',
  'armário', 'gaveta', 'chave',

  // Objetos do dia a dia
  'copo', 'prato', 'faca', 'garfo', 'mesa', 'cadeira', 'cama', 'espelho',
  'relógio', 'telefone', 'tela', 'botão', 'fio', 'cabo', 'caixa',
  'saco', 'mala', 'bolsa', 'carteira', 'anel', 'corrente',

  // Transporte e movimento
  'carro', 'barco', 'avião', 'trem', 'ônibus', 'moto', 'bicicleta',
  'roda', 'motor', 'freio', 'volante', 'ponte', 'túnel', 'trilho',

  // Alimentação
  'pão', 'leite', 'carne', 'frango', 'peixe', 'arroz', 'feijão', 'ovo',
  'mel', 'sal', 'açúcar', 'café', 'água', 'suco', 'vinho', 'cerveja',
  'bolo', 'torta', 'queijo', 'manteiga',

  // Animais
  'cobra', 'leão', 'lobo', 'urso', 'gato', 'cachorro', 'cavalo', 'pássaro',
  'peixe', 'abelha', 'mosca', 'formiga', 'borboleta', 'tubarão', 'corvo',
  'raposa', 'elefante', 'macaco', 'tartaruga', 'sapo',

  // Profissões e papéis
  'rei', 'rainha', 'juiz', 'médico', 'piloto', 'soldado', 'espião',
  'detetive', 'professor', 'chef', 'artista', 'músico',

  // Conceitos e abstrações
  'tempo', 'sorte', 'poder', 'segredo', 'perigo', 'sombra', 'voz',
  'silêncio', 'cor', 'luz', 'escuridão', 'vida', 'morte', 'sonho',
  'medo', 'raiva', 'alegria', 'amor', 'ódio', 'paz', 'guerra',
  'verdade', 'mentira', 'memória', 'futuro', 'passado',

  // Lugares e construções
  'castelo', 'torre', 'banco', 'escola', 'hospital', 'prisão', 'mercado',
  'palco', 'arena', 'templo', 'biblioteca', 'porto', 'aeroporto', 'fronteira',

  // Outros substantivos de alta polissemia
  'carta', 'jogo', 'regra', 'ponto', 'campo', 'folha', 'raiz', 'fruto',
  'flor', 'espinho', 'coroa', 'escudo', 'lança', 'arco', 'flecha',
  'máscara', 'véu', 'véu', 'rede', 'armadilha', 'tesouro', 'mapa',
  'código', 'sinal', 'marca', 'rastro', 'pista', 'trilha', 'caminho',
  'cruzamento', 'virada', 'queda', 'voo', 'mergulho', 'salto',
  'âncora', 'bússola', 'lanterna', 'espada', 'chama', 'fumaça',
];

// ─── Deck: Brasil ─────────────────────────────────────────────────────────────

export const DECK_BRASIL: string[] = [
  'carnaval', 'samba', 'favela', 'baianinha', 'litoral', 'sertão',
  'pantanal', 'amazônia', 'Bahia', 'Nordeste', 'gaúcho', 'carioca',
  'paulistano', 'capoeira', 'frevo', 'forró', 'funk', 'axé',
  'brigadeiro', 'coxinha', 'tapioca', 'açaí', 'caipirinha', 'churrasco',
  'Pelé', 'Neymar', 'Ayrton', 'Xuxa', 'Pelé', 'Lula', 'Bolsonaro',
  'futebol', 'Flamengo', 'Corinthians', 'Palmeiras', 'Grêmio',
  'Copa', 'Maracanã', 'Olimpíadas', 'Carnaval', 'Reveillon',
  'Real', 'mototaxi', 'calçada', 'calor', 'chuva', 'jogo do bicho',
  'novela', 'Globo', 'SBT', 'Faustão', 'Domingão',
  'presidente', 'Congresso', 'imposto', 'greve', 'manifestação',
  'Rio', 'São Paulo', 'Brasília', 'Salvador', 'Fortaleza', 'Recife',
  'Manaus', 'Belém', 'Curitiba', 'Porto Alegre',
];

// ─── Deck: Cultura Pop ────────────────────────────────────────────────────────

export const DECK_CULTURA_POP: string[] = [
  'Batman', 'Superman', 'Homem-Aranha', 'Mulher Maravilha', 'Coringa',
  'Harry Potter', 'Hermione', 'Voldemort', 'Hogwarts', 'Dumbledore',
  'Star Wars', 'Jedi', 'Darth Vader', 'Yoda', 'Skywalker',
  'Vingadores', 'Thanos', 'Iron Man', 'Thor', 'Capitão América',
  'Netflix', 'Stranger Things', 'La Casa de Papel', 'Round 6',
  'Breaking Bad', 'Game of Thrones', 'Friends', 'The Office',
  'Disney', 'Pixar', 'Marvel', 'DC', 'Netflix',
  'Taylor Swift', 'Beyoncé', 'BTS', 'Anitta', 'Mc Hariel',
  'iPhone', 'TikTok', 'Instagram', 'YouTube', 'Spotify',
  'Minecraft', 'Fortnite', 'GTA', 'FIFA', 'Call of Duty',
  'Oscar', 'Grammy', 'MTV', 'Billboard',
  'meme', 'trend', 'viral', 'cancelamento', 'fandom',
];

// ─── Deck: Internet ───────────────────────────────────────────────────────────

export const DECK_INTERNET: string[] = [
  // Conteúdo
  'meme', 'thread', 'post', 'story', 'reel', 'live', 'stream',
  'clip', 'print', 'printscreen', 'feed', 'timeline', 'trending',
  // Interações
  'like', 'share', 'repost', 'seguidor', 'influencer', 'creator',
  'comentário', 'reply', 'dm', 'stalkear', 'ghostar', 'unfollow',
  // Cultura
  'cancelado', 'viral', 'trend', 'hype', 'cringe', 'based', 'ratio',
  'finsta', 'subtweet', 'breadcrumbing', 'FOMO', 'doom scroll',
  'detox digital', 'bolha', 'echo chamber', 'fake news', 'deepfake',
  // Plataformas e tecnologia
  'discord', 'twitch', 'reddit', 'tiktok', 'instagram', 'youtube',
  'whatsapp', 'telegram', 'orkut', 'msn', 'bluetooth', 'wi-fi',
  'algoritmo', 'hacker', 'spam', 'bot', 'phishing', 'dark web',
  // Expressões visuais
  'emoji', 'gif', 'sticker', 'figurinha', 'reaction', 'filter',
  'avatar', 'perfil', 'bio', 'link na bio', 'status',
];

// ─── Deck: Futebol ────────────────────────────────────────────────────────────

export const DECK_FUTEBOL: string[] = [
  // Ações no campo
  'gol', 'chute', 'cabeçada', 'passe', 'drible', 'falta', 'pênalti',
  'escanteio', 'impedimento', 'cartão', 'expulsão', 'bicicleta',
  'chapéu', 'lançamento', 'cobrança', 'defesa', 'interceptação',
  // Posições e papéis
  'goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante',
  'centroavante', 'artilheiro', 'capitão', 'técnico', 'árbitro',
  'bandeirinha', 'reserva', 'titular',
  // Tecnologia e regras
  'VAR', 'offside', 'funil', 'pressão', 'contragolpe',
  // Ídolos
  'Pelé', 'Ronaldo', 'Ronaldinho', 'Neymar', 'Messi', 'Mbappé',
  'Zidane', 'Romário', 'Bebeto', 'Rivaldo', 'Cafu', 'Lúcio',
  // Times
  'Flamengo', 'Corinthians', 'Palmeiras', 'São Paulo', 'Santos',
  'Grêmio', 'Internacional', 'Atlético', 'Cruzeiro', 'Botafogo',
  'Fluminense', 'Vasco', 'Sport', 'Fortaleza', 'Bahia',
  // Competições
  'Copa do Mundo', 'Champions', 'Libertadores', 'Brasileirão',
  'clássico', 'derby', 'final', 'campeão', 'rebaixado', 'título',
  // Ambiente
  'torcida', 'estádio', 'Maracanã', 'vestiário', 'gramado',
  'chuteira', 'bola', 'rede', 'trave', 'travessão',
];

// ─── Deck: Sentimentos ────────────────────────────────────────────────────────

export const DECK_SENTIMENTOS: string[] = [
  // Básicos
  'alegria', 'tristeza', 'raiva', 'medo', 'surpresa', 'nojo', 'vergonha',
  'culpa', 'orgulho', 'ciúme', 'inveja', 'gratidão', 'amor', 'ódio',
  // Complexos
  'saudade', 'nostalgia', 'solidão', 'euforia', 'ansiedade', 'pânico',
  'melancolia', 'ressentimento', 'amargura', 'serenidade', 'êxtase',
  'decepção', 'alívio', 'constrangimento', 'humilhação', 'vaidade',
  // Cognitivos e relacionais
  'calma', 'paz', 'esperança', 'desesperança', 'frustração',
  'confusão', 'clareza', 'dúvida', 'certeza', 'curiosidade', 'tédio',
  'empolgação', 'entusiasmo', 'apatia', 'indiferença',
  // Interpessoais
  'compaixão', 'empatia', 'frieza', 'carinho', 'desprezo', 'admiração',
  'repulsa', 'intimidação', 'vulnerabilidade', 'coragem', 'covardia',
  'pertencimento', 'rejeição', 'aceitação', 'julgamento', 'desconfiança',
  'cumplicidade', 'ciúme', 'abandono', 'proteção', 'dependência',
  // Estados físico-emocionais
  'tensão', 'relaxamento', 'exaustão', 'leveza', 'peso', 'vazio',
];

// ─── Funções utilitárias ──────────────────────────────────────────────────────

/** Fisher-Yates in-place shuffle */
function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function obterDeck(deck: NomeDeck): string[] {
  switch (deck) {
    case 'cotidiano':    return DECK_COTIDIANO;
    case 'brasil':       return DECK_BRASIL;
    case 'cultura_pop':  return DECK_CULTURA_POP;
    case 'internet':     return DECK_INTERNET;
    case 'futebol':      return DECK_FUTEBOL;
    case 'sentimentos':  return DECK_SENTIMENTOS;
    case 'surpresa': {
      const todos = [
        ...DECK_COTIDIANO,
        ...DECK_BRASIL,
        ...DECK_CULTURA_POP,
        ...DECK_INTERNET,
        ...DECK_FUTEBOL,
        ...DECK_SENTIMENTOS,
      ];
      return [...new Set(todos)]; // remove duplicatas
    }
  }
}

/**
 * Sorteia `quantidade` palavras únicas do deck escolhido, embaralhadas.
 * Se o deck tiver menos palavras que o necessário, lança erro descritivo.
 */
export function sortearPalavras(deck: NomeDeck, quantidade: number): string[] {
  const fonte = obterDeck(deck);
  const unicas = [...new Set(fonte)];
  if (unicas.length < quantidade) {
    throw new Error(
      `Deck "${deck}" tem apenas ${unicas.length} palavras únicas, ` +
      `mas são necessárias ${quantidade}.`
    );
  }
  return embaralhar(unicas).slice(0, quantidade);
}
