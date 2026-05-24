/**
 * ALIANCA — DIREÇÃO EDITORIAL
 *
 * O texto do jogo deve ser curto, político e humano.
 * O app não explica demais; ele só coloca pressão na conversa.
 */

export const MANIFESTO_ALIANCA = {
  nome: 'Aliança',
  fraseCentral: 'eu não sei mais em quem confiar.',
  promessa:
    'Um jogo de confiança temporária, defesa pública e sabotagem invisível.',
  naoE: [
    'RPG',
    'fantasia medieval',
    'boardgame pesado',
    'sistema de poderes',
    'dedução matemática',
  ],
  deveParecer: [
    'guerra política entre amigos',
    'conversa contínua',
    'alianças frágeis',
    'manipulação social',
    'confiança sendo negociada em voz alta',
  ],
} as const;

export const TEXTOS_ALIANCA = {
  distribuir: {
    leal: 'leal.',
    traidor: 'traidor.',
    aliados: 'vocês estão juntos.',
  },
  lider: {
    titulo: 'lidera agora.',
    subtitulo: 'monte uma equipe que o grupo aceite.',
  },
  debate: {
    titulo: 'defendam. acusem. convençam.',
    subtitulo: 'ninguém vai ter certeza.',
  },
  votacao: {
    titulo: 'aprovar essa equipe?',
    aprovar: 'aprovar',
    rejeitar: 'rejeitar',
  },
  missao: {
    leal: 'cumpra a missão.',
    traidor: 'ajudar ou sabotar?',
    ajudar: 'ajudar',
    sabotar: 'sabotar',
  },
  resultado: {
    sucesso: 'missão concluída.',
    sabotagem: 'houve sabotagem.',
    rejeitada: 'o grupo rejeitou.',
    aprovada: 'missão aprovada.',
  },
} as const;
