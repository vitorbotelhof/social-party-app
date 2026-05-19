export type CategoriaEmocional =
  | 'tensao_misterio'
  | 'revelacoes_caos'
  | 'quem_voces_sao'
  | 'conversa_profunda'
  | 'casal_intimidade'
  | 'festa_barulho'
  | 'humor_absurdo'
  | 'votacao_exposicao';

export interface CategoriaMeta {
  id: CategoriaEmocional;
  label: string;
  sublabel: string;
}

export const CATEGORIAS_EMOCIONAIS: ReadonlyArray<CategoriaMeta> = [
  {
    id: 'tensao_misterio',
    label: 'quando ninguém confia em ninguém',
    sublabel: 'alguém está mentindo. ou não.',
  },
  {
    id: 'revelacoes_caos',
    label: 'quando alguém vai contar tudo',
    sublabel: 'sem filtro. sem volta.',
  },
  {
    id: 'quem_voces_sao',
    label: 'quando o grupo se vê como realmente é',
    sublabel: 'o que ninguém falou em voz alta.',
  },
  {
    id: 'conversa_profunda',
    label: 'quando a noite pede honestidade',
    sublabel: 'mais lento. mais real.',
  },
  {
    id: 'casal_intimidade',
    label: 'quando são só vocês dois',
    sublabel: 'intimidade que incomoda, do jeito bom.',
  },
  {
    id: 'festa_barulho',
    label: 'quando ninguém consegue ficar sério',
    sublabel: 'o grupo está entregue.',
  },
  {
    id: 'humor_absurdo',
    label: 'quando o absurdo já virou regra',
    sublabel: 'controle? nunca foi uma opção.',
  },
  {
    id: 'votacao_exposicao',
    label: 'quando alguém vai estar no centro',
    sublabel: 'o grupo decide. você aguenta.',
  },
];

export interface DefinicaoJogo {
  id: string;
  nome: string;
  slogan: string;
  descricao: string;
  cover: number;
  minJogadores: number;
  maxJogadores: number;
  tempoMedio: string;
  intensidade: 1 | 2 | 3;
  disponivel: boolean;
  supportsLocal: boolean;
  supportsRealtime: boolean;
  socialTags: string[];
  categorias: [CategoriaEmocional, ...CategoriaEmocional[]];
  destaque?: boolean;
  ordemNaCategoria?: number;
  instrucoes: {
    objetivo: string;
    passos: string[];
    dicas: string[];
  };
}

export const JOGOS: ReadonlyArray<DefinicaoJogo> = [
  {
    id: 'mrwhite',
    nome: 'Mr White',
    slogan: 'todo mundo tem a mesma palavra. menos um.',
    descricao:
      'Um jogo de blefe e dedução em grupo. Quase todo mundo recebe a mesma palavra secreta — exceto o Mr White, que precisa fingir que sabe do que estão falando até descobrir a verdade.',
    cover: require('../../assets/games/mr-white/cover.png'),
    minJogadores: 3,
    maxJogadores: 12,
    tempoMedio: '15-30 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: true,
    socialTags: ['tensão', 'bluff', 'impostor'],
    categorias: ['tensao_misterio'],
    destaque: true,
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Os civis precisam descobrir e eliminar o Mr White antes que ele descubra a palavra secreta. Já o Mr White precisa se passar por civil, observar as pistas e adivinhar a palavra para vencer no susto.',
      passos: [
        'Cada jogador recebe uma palavra secreta no celular — apenas o Mr White recebe uma tela em branco.',
        'Um por vez, todos descrevem a palavra com uma única frase. Sem dizer a palavra, sem rimar e sem ser óbvio demais.',
        'Após a rodada de descrições, o grupo debate quem está agindo estranho e quem parece estar chutando.',
        'Acontece a votação: o jogador mais votado é eliminado e seu papel é revelado.',
        'Se o Mr White for eliminado, ele tem uma última chance: adivinhar a palavra para virar o jogo.',
        'A partida continua em novas rodadas até o Mr White ser pego ou restarem poucos civis.',
      ],
      dicas: [
        'Se você é civil, não entregue a palavra de cara. Dê pistas que só quem realmente sabe vai entender.',
        'Se você é o Mr White, escute com atenção, repita o tom dos outros e jogue uma frase genérica que se encaixe em quase tudo.',
        'Desconfie de quem fala muito devagar, evita olhar nos olhos ou repete a ideia do jogador anterior.',
      ],
    },
  },
  {
    id: 'most-likely-to',
    nome: 'Most Likely To',
    slogan: 'Vote em quem do grupo tem mais chance de...',
    descricao:
      'Perguntas provocativas, divertidas e às vezes constrangedoras. Todo mundo aponta ao mesmo tempo para quem do grupo se encaixa melhor — e os resultados sempre surpreendem.',
    cover: require('../../assets/games/most-likely-to/cover.png'),
    minJogadores: 3,
    maxJogadores: 10,
    tempoMedio: '10-20 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: true,
    socialTags: ['party', 'revelações', 'caos'],
    categorias: ['quem_voces_sao'],
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Descobrir como o grupo realmente enxerga cada pessoa. Não há vencedor formal — o prêmio é a risada coletiva e as revelações inesperadas sobre os amigos.',
      passos: [
        'O app sorteia uma pergunta no estilo "Quem tem mais chance de...".',
        'Na contagem regressiva, todo mundo aponta ao mesmo tempo para a pessoa que melhor se encaixa na pergunta.',
        'O app conta os votos e mostra quem foi o "campeão" daquela rodada.',
        'O eleito ganha um ponto (ou uma dose, se vocês quiserem apimentar) e a partida segue para a próxima pergunta.',
        'Após o número de rodadas combinado, o app revela o ranking final com o mais votado do grupo.',
      ],
      dicas: [
        'Combinem antes se vale apontar para si mesmo — pode mudar bastante a vibe da partida.',
        'Não leve para o lado pessoal: é só uma piada interna do grupo e os votos são em clima de zoeira.',
        'Quanto mais o grupo se conhece, mais engraçado fica. Misture amigos antigos e novos para resultados imprevisíveis.',
      ],
    },
  },
  {
    id: 'eu-nunca',
    nome: 'Eu Nunca',
    slogan: 'Revelações, confissões e muita risada',
    descricao:
      'A versão digital do clássico jogo de confissões. Alguém solta um "eu nunca..." e quem já fez, paga a prenda. O app sorteia frases para você nunca mais ficar sem assunto.',
    cover: require('../../assets/games/eu-nunca/cover.png'),
    minJogadores: 3,
    maxJogadores: 15,
    tempoMedio: '20-40 min',
    intensidade: 3,
    disponivel: false,
    supportsLocal: true,
    supportsRealtime: true,
    socialTags: ['drinking', 'confissões', 'caos'],
    categorias: ['revelacoes_caos'],
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Conhecer melhor o grupo através das confissões. Não existe vencedor: o legal é descobrir histórias escondidas e segredos que ninguém imaginava — sempre com respeito a quem não quer responder.',
      passos: [
        'Todos se sentam em roda, com algo para beber ou uma prenda combinada (não precisa ser álcool).',
        'O app sorteia uma frase começando com "Eu nunca...".',
        'Quem já fez aquilo levanta a mão (ou paga a prenda combinada). Quem nunca fez, apenas observa.',
        'O grupo pode pedir detalhes para quem assumiu — vale rir, mas nada de julgar.',
        'A próxima frase é sorteada e o ciclo recomeça até o grupo decidir parar.',
      ],
      dicas: [
        'Combinem desde o começo que ninguém é obrigado a contar detalhes nem a responder verdade — passar a vez é sempre permitido.',
        'Escolha a categoria de perguntas de acordo com o clima e a intimidade do grupo: leve, picante ou caos total.',
        'Tenha água por perto e respeite o ritmo de cada um — o jogo é melhor quando todo mundo fica confortável.',
      ],
    },
  },
  {
    id: 'verdade-desafio',
    nome: 'Verdade ou Desafio',
    slogan: 'O clássico que nunca envelhece',
    descricao:
      'Verdade pesada ou desafio impossível? O app sorteia perguntas e missões na medida certa para qualquer rolê, do esquenta tranquilo ao caos da madrugada.',
    cover: require('../../assets/games/verdade-desafio/cover.png'),
    minJogadores: 2,
    maxJogadores: 10,
    tempoMedio: '20-40 min',
    intensidade: 3,
    disponivel: false,
    supportsLocal: true,
    supportsRealtime: false,
    socialTags: ['desafio', 'confissões', 'caos'],
    categorias: ['revelacoes_caos'],
    ordemNaCategoria: 2,
    instrucoes: {
      objetivo:
        'Quebrar o gelo e arrancar histórias e momentos memoráveis do grupo. Não há vencedor: a graça está em escolher entre se expor com a verdade ou topar o desafio.',
      passos: [
        'O app sorteia quem começa girando a garrafa virtual ou escolhendo aleatoriamente.',
        'O jogador da vez escolhe entre "Verdade" ou "Desafio".',
        'O app sorteia uma pergunta ou uma missão na intensidade combinada pelo grupo.',
        'O jogador responde com sinceridade ou cumpre o desafio na frente de todos.',
        'Se recusar, paga a prenda combinada antes da partida e passa a vez para o próximo.',
        'O próximo jogador no sentido horário continua a rodada.',
      ],
      dicas: [
        'Defina antes uma "regra de segurança": um gesto ou palavra que qualquer pessoa pode usar para pular sem pagar prenda.',
        'Escolha a intensidade do baralho de acordo com o grupo — começar leve e ir subindo costuma funcionar melhor.',
        'Tenha o celular carregado e espaço livre por perto: muitos desafios envolvem se mexer, gravar vídeo ou interagir com outras pessoas.',
      ],
    },
  },
  {
    id: 'quem-na-sala',
    nome: 'Quem na Sala?',
    slogan: 'Votação anônima. Alguém vai se surpreender.',
    descricao:
      'O app faz uma pergunta e todo mundo vota em segredo em alguém do grupo. Os votos só aparecem no final da rodada — e ninguém sabe quem votou em quem.',
    cover: require('../../assets/games/quem-na-sala/cover.png'),
    minJogadores: 4,
    maxJogadores: 15,
    tempoMedio: '10-20 min',
    intensidade: 2,
    disponivel: false,
    supportsLocal: false,
    supportsRealtime: true,
    socialTags: ['drama', 'tensão', 'votação'],
    categorias: ['votacao_exposicao'],
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Descobrir o que o grupo realmente pensa sem ninguém precisar se expor. As perguntas vão do elogio à zoeira pesada, e o resultado anônimo gera as melhores reações da noite.',
      passos: [
        'Todos os jogadores entram na sala pelo app usando o código compartilhado pelo anfitrião.',
        'O app exibe uma pergunta no estilo "Quem na sala...".',
        'Cada jogador escolhe, em segredo, o nome de outra pessoa do grupo no próprio celular.',
        'Quando todos votam, o app revela apenas o ranking de votos — sem mostrar quem votou em quem.',
        'O grupo comenta, ri, contesta e parte para a próxima pergunta.',
      ],
      dicas: [
        'O segredo do jogo é o anonimato: ninguém deve mostrar para quem está votando, nem mesmo de brincadeira.',
        'Misture perguntas de elogio com perguntas mais provocativas para equilibrar o clima da partida.',
        'Quanto mais íntimo o grupo, mais reveladoras as respostas. Ideal para amigos próximos, casais ou colegas de longa data.',
      ],
    },
  },
];

export function jogosPorCategoria(): Record<CategoriaEmocional, DefinicaoJogo[]> {
  const resultado = {} as Record<CategoriaEmocional, DefinicaoJogo[]>;

  for (const cat of CATEGORIAS_EMOCIONAIS) {
    resultado[cat.id] = [];
  }

  for (const jogo of JOGOS) {
    const primaria = jogo.categorias[0];
    resultado[primaria].push(jogo);
  }

  for (const cat of CATEGORIAS_EMOCIONAIS) {
    resultado[cat.id].sort(
      (a, b) => (a.ordemNaCategoria ?? 999) - (b.ordemNaCategoria ?? 999),
    );
  }

  return resultado;
}
