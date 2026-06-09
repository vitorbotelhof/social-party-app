/* eslint-disable @typescript-eslint/no-require-imports */

import type {
  CategoriaPrincipalId,
  ContextoSocialId,
  PerfilDescobertaJogo,
  TagSocialId,
} from '@/games/taxonomia';
import {
  ARQUIVOS_DISPONIVEL,
  ARQUIVOS_MAX_JOGADORES,
  ARQUIVOS_MIN_JOGADORES,
} from '@/games/arquivos/releaseFlags';

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
  label: string; // vibe statement — frase longa, usada no header do bloco
  sublabel: string; // contexto curto e pontiagudo
  labelCurto: string; // etiqueta do chip — 2-4 palavras
}

export const CATEGORIAS_EMOCIONAIS: ReadonlyArray<CategoriaMeta> = [
  {
    id: 'tensao_misterio',
    label: 'quando ninguém confia em ninguém',
    sublabel: 'alguém está mentindo. ou não.',
    labelCurto: 'ninguém confia',
  },
  {
    id: 'votacao_exposicao',
    label: 'quando alguém vai estar no centro',
    sublabel: 'o grupo decide. você aguenta.',
    labelCurto: 'você no centro',
  },
  {
    id: 'quem_voces_sao',
    label: 'quando o grupo se vê como realmente é',
    sublabel: 'o que ninguém falou em voz alta.',
    labelCurto: 'quem vocês são',
  },
  {
    id: 'revelacoes_caos',
    label: 'quando alguém vai contar tudo',
    sublabel: 'sem filtro. sem volta.',
    labelCurto: 'contar tudo',
  },
  {
    id: 'festa_barulho',
    label: 'quando ninguém consegue ficar sério',
    sublabel: 'o grupo está entregue.',
    labelCurto: 'pura bagunça',
  },
  {
    id: 'conversa_profunda',
    label: 'quando a noite pede honestidade',
    sublabel: 'mais lento. mais real.',
    labelCurto: 'conversa real',
  },
  {
    id: 'humor_absurdo',
    label: 'quando o absurdo já virou regra',
    sublabel: 'controle? nunca foi uma opção.',
    labelCurto: 'absurdo total',
  },
  {
    id: 'casal_intimidade',
    label: 'quando são só vocês dois',
    sublabel: 'intimidade que incomoda, do jeito bom.',
    labelCurto: 'só vocês dois',
  },
];

export interface DefinicaoJogo {
  id: string;
  nome: string;
  slogan: string;
  descricao: string;
  cover: number;
  banner?: number;
  minJogadores: number;
  maxJogadores: number;
  tempoMedio: string;
  intensidade: 1 | 2 | 3;
  disponivel: boolean;
  supportsLocal: boolean;
  supportsRealtime: boolean;
  categoriasPrincipais: [CategoriaPrincipalId, ...CategoriaPrincipalId[]];
  tagsSociais: TagSocialId[];
  contextos: ContextoSocialId[];
  descoberta: PerfilDescobertaJogo;
  /** @deprecated usar tagsSociais/contextos. Mantido para compatibilidade visual. */
  socialTags: string[];
  /** @deprecated curadoria emocional antiga. Mantida até a Sprint 2. */
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
    id: 'arquivos',
    nome: 'Arquivos',
    slogan: 'cada pessoa tem uma parte da verdade.',
    descricao:
      'Um caso social de investigação cooperativa com segredos individuais. O grupo precisa reconstruir o que aconteceu, mas ninguém tem a história inteira.',
    cover: require('../../assets/games/arquivos/cover.png'),
    banner: require('../../assets/games/arquivos/banner.png'),
    minJogadores: ARQUIVOS_MIN_JOGADORES,
    maxJogadores: ARQUIVOS_MAX_JOGADORES,
    tempoMedio: '35-45 min',
    intensidade: 2,
    disponivel: ARQUIVOS_DISPONIVEL,
    supportsLocal: false,
    supportsRealtime: true,
    categoriasPrincipais: [
      'blefe_deducao',
      'confissoes_revelacoes',
      'conhecimento_grupo',
    ],
    tagsSociais: ['deducao', 'segredo', 'conversa', 'paranoia'],
    contextos: ['ninguem_confia', 'pra_gerar_historia', 'grupo_intimo'],
    descoberta: {
      mecanicaPrincipal: 'deducao',
      intencaoSocial: 'gerar_historia',
      ritmo: 2,
      exposicao: 3,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 4,
      intimidade: 3,
      toleranciaVergonha: 2,
    },
    socialTags: ['investigação', 'segredos', 'dedução'],
    categorias: ['tensao_misterio', 'revelacoes_caos'],
    destaque: true,
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Reconstruir a verdade de um caso usando arquivos privados, conversa e dedução. Cada pessoa recebe um personagem, pistas e um objetivo individual que pode entrar em conflito com a investigação.',
      passos: [
        'Cada jogador entra na sala pelo próprio celular e recebe um personagem com arquivos privados.',
        'O grupo lê o caso inicial e conversa para montar a primeira teoria.',
        'Cada pessoa decide o que revelar, resumir ou esconder, porque alguns arquivos também prejudicam sua reputação.',
        'No meio da partida, o app libera uma nova evidência que muda a leitura do caso.',
        'Alguns jogadores recebem ações secretas leves que podem destravar informações extras.',
        'No final, o grupo registra o veredito e o app revela a verdade completa.',
      ],
      dicas: [
        'Não leia tudo em voz alta. Transforme seus arquivos em perguntas para o grupo.',
        'Segredo não significa culpa. Às vezes a pessoa está escondendo outra coisa.',
        'Quando uma teoria parecer perfeita cedo demais, procure o detalhe que não encaixa.',
      ],
    },
  },
  {
    id: 'na-ponta-da-lingua',
    nome: 'Na Ponta da Língua',
    slogan: 'a palavra está ali. as proibidas não deixam sair.',
    descricao:
      'Você precisa fazer o grupo adivinhar uma palavra — mas as mais óbvias para explicá-la estão proibidas. O tempo corre. O improviso começa. O grupo observa.',
    cover: require('../../assets/games/na-ponta-da-lingua/cover.png'),
    banner: require('../../assets/games/na-ponta-da-lingua/banner.png'),
    minJogadores: 2,
    maxJogadores: 10,
    tempoMedio: '20-40 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: true,
    categoriasPrincipais: ['improviso_performance', 'rapidos_para_esquentar'],
    tagsSociais: [
      'improviso',
      'competitivo',
      'gritaria',
      'baixo_texto',
      'rapido',
    ],
    contextos: ['pra_comecar', 'pra_subir_energia', 'grupo_sem_vergonha'],
    descoberta: {
      mecanicaPrincipal: 'palavra',
      intencaoSocial: 'aquecer',
      ritmo: 5,
      exposicao: 2,
      energiaFisica: 2,
      conversaPosRodada: 2,
      complexidade: 3,
      intimidade: 1,
      toleranciaVergonha: 2,
    },
    socialTags: ['pressão', 'improviso', 'caos'],
    categorias: ['tensao_misterio'],
    destaque: true,
    ordemNaCategoria: 2,
    instrucoes: {
      objetivo:
        'Fazer o grupo adivinhar a palavra secreta sem usar nenhuma das cinco palavras proibidas. O tempo está sempre correndo — e o improviso é o único caminho.',
      passos: [
        'Na sua vez, pegue o celular e veja a palavra secreta com as cinco proibidas. Não mostre para ninguém.',
        'Quando estiver pronto, inicie o timer e comece a descrever a palavra — qualquer coisa, menos as proibidas.',
        'O grupo tenta adivinhar enquanto você explica. Se alguém acertar, o ponto é seu.',
        'Se usar uma palavra proibida, o grupo pode gritar "proibida!" — a rodada termina sem ponto.',
        'Se o tempo esgotar antes de acertarem, a rodada passa sem ponto.',
        'Após todos jogarem a mesma quantidade de rodadas, o placar é revelado.',
      ],
      dicas: [
        'Evite sinônimos óbvios — o grupo conhece as armadilhas tão bem quanto você.',
        'Quanto menos tempo restar, mais tende a sair o que não deveria. Respire.',
        'Metáforas, sons, gestos, histórias — qualquer coisa funciona menos as proibidas.',
      ],
    },
  },
  {
    id: 'mrwhite',
    nome: 'Mr White',
    slogan: 'todo mundo tem a mesma palavra. menos um.',
    descricao:
      'Um jogo de blefe e dedução em grupo. Quase todo mundo recebe a mesma palavra secreta — exceto o Mr White, que precisa fingir que sabe do que estão falando até descobrir a verdade.',
    cover: require('../../assets/games/mr-white/cover.png'),
    banner: require('../../assets/games/mr-white/banner.png'),
    minJogadores: 3,
    maxJogadores: 12,
    tempoMedio: '15-30 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: true,
    categoriasPrincipais: ['blefe_deducao'],
    tagsSociais: ['blefe', 'deducao', 'segredo', 'paranoia', 'conversa'],
    contextos: ['ninguem_confia', 'pra_gerar_historia', 'grupo_intimo'],
    descoberta: {
      mecanicaPrincipal: 'blefe',
      intencaoSocial: 'provocar',
      ritmo: 3,
      exposicao: 3,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 3,
      intimidade: 2,
      toleranciaVergonha: 3,
    },
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
    banner: require('../../assets/games/most-likely-to/banner.png'),
    minJogadores: 3,
    maxJogadores: 10,
    tempoMedio: '10-20 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: true,
    categoriasPrincipais: ['votacao_exposicao', 'conhecimento_grupo'],
    tagsSociais: [
      'votacao',
      'exposicao',
      'conversa',
      'vergonha_leve',
      'rapido',
    ],
    contextos: ['pra_descobrir_o_grupo', 'amigos_novos', 'pra_comecar'],
    descoberta: {
      mecanicaPrincipal: 'votacao',
      intencaoSocial: 'expor',
      ritmo: 4,
      exposicao: 4,
      energiaFisica: 1,
      conversaPosRodada: 4,
      complexidade: 1,
      intimidade: 3,
      toleranciaVergonha: 3,
    },
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
    id: 'inquisicao',
    nome: 'Inquisição',
    slogan: 'alguém entre vocês não é o que parece.',
    descricao:
      'Um jogo de dedução e traição em tempo real. A maioria é inocente — mas corrompidos agem na escuridão. A cada loop, o grupo vota para eliminar quem parece suspeito. A cada noite, os corrompidos crescem. Confiar é o único caminho. E a maior armadilha.',
    cover: require('../../assets/games/inquisicao/cover.png'),
    banner: require('../../assets/games/inquisicao/banner.png'),
    minJogadores: 4,
    maxJogadores: 10,
    tempoMedio: '25-45 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: true,
    categoriasPrincipais: ['blefe_deducao', 'votacao_exposicao'],
    tagsSociais: ['deducao', 'segredo', 'paranoia', 'votacao', 'conversa'],
    contextos: ['ninguem_confia', 'noite_quente', 'grupo_intimo'],
    descoberta: {
      mecanicaPrincipal: 'deducao',
      intencaoSocial: 'provocar',
      ritmo: 2,
      exposicao: 4,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 5,
      intimidade: 3,
      toleranciaVergonha: 4,
    },
    socialTags: ['traição', 'dedução', 'paranoia'],
    categorias: ['tensao_misterio', 'quem_voces_sao'],
    destaque: true,
    ordemNaCategoria: 3,
    instrucoes: {
      objetivo:
        'Os inocentes precisam identificar e eliminar os corrompidos antes de serem superados em número. Os corrompidos precisam sobreviver, contaminar e dominar — sem que ninguém perceba.',
      passos: [
        'Cada jogador recebe seu papel em segredo no celular: inocente, corrompido ou guardião. Apenas os corrompidos sabem quem são seus aliados.',
        'Durante a fase de conversa, todos interagem livremente. Não existe script — a paranoia vem naturalmente.',
        'Na votação, todos escolhem quem eliminar ao mesmo tempo. O mais votado sai. Seu papel é revelado.',
        'Durante a noite, corrompidos agem: eliminam ou contaminam outro jogador. O guardião pode proteger alguém.',
        'O loop recomeça. Se a corrupção atingir maioria, os corrompidos vencem. Se todos os corrompidos forem eliminados, os inocentes vencem.',
      ],
      dicas: [
        'Inocentes que falam demais parecem nervosos. Inocentes que falam de menos parecem suspeitos. Não tem resposta certa.',
        'Corrompidos: coordenem votos sem parecer coordenados. Uma unanimidade suspeita destrói a cobertura.',
        'Guardião: proteja quem parece alvo. Mas não deixe ninguém perceber que você tem essa função.',
      ],
    },
  },
  {
    id: 'voce-me-conhece',
    nome: 'Você Me Conhece?',
    slogan: 'prioridades revelam identidade.',
    descricao:
      'Um jogo de leitura humana. O ranqueador escolhe em segredo o que colocaria primeiro — ou por último — entre 4 opções. O grupo tenta prever. O valor não está em acertar: está em discutir.',
    // TODO fase 2: criar cover próprio
    cover: require('../../assets/games/voce-me-conhece/cover.png'),
    banner: require('../../assets/games/voce-me-conhece/banner.png'),
    minJogadores: 3,
    maxJogadores: 10,
    tempoMedio: '20-40 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['conhecimento_grupo', 'casal_intimidade'],
    tagsSociais: ['conversa', 'grupo_intimo', 'segredo', 'vergonha_leve'],
    contextos: ['pra_descobrir_o_grupo', 'grupo_intimo', 'casal'],
    descoberta: {
      mecanicaPrincipal: 'leitura',
      intencaoSocial: 'conectar',
      ritmo: 3,
      exposicao: 3,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 2,
      intimidade: 4,
      toleranciaVergonha: 2,
    },
    socialTags: ['intimidade', 'leitura', 'conversa'],
    categorias: ['quem_voces_sao'],
    ordemNaCategoria: 2,
    instrucoes: {
      objetivo:
        'Ler o grupo — e descobrir quem te lê de volta. Não é sobre acertar: é sobre entender como as pessoas priorizam o que importa.',
      passos: [
        'O ranqueador recebe 4 opções no celular e escolhe em segredo: a que colocaria PRIMEIRO, ou a que deixaria por ÚLTIMO.',
        'O grupo debate e tenta prever a escolha do ranqueador.',
        'Cada jogador registra sua previsão no celular, em segredo.',
        'O reveal acontece: a escolha aparece. Quem acertou aparece em destaque.',
        'A discussão começa — o que a escolha revela sobre a pessoa?',
        'O celular passa para o próximo ranqueador.',
      ],
      dicas: [
        'O jogo é sobre a conversa após o reveal, não sobre o placar.',
        'Categorias leves para começar — intensidade vai crescendo naturalmente.',
        'Se alguém sempre surpreende o grupo, pergunte o porquê.',
      ],
    },
  },
  {
    id: 'alianca',
    nome: 'Aliança',
    slogan: 'confie em alguém. talvez seja isso que querem.',
    descricao:
      'Um jogo de confiança, manipulação e política social. Um líder propõe uma equipe, o grupo aprova ou rejeita em segredo, e a missão pode ser sabotada sem revelar quem traiu.',
    cover: require('../../assets/games/alianca/cover.png'),
    banner: require('../../assets/games/alianca/banner.png'),
    minJogadores: 4,
    maxJogadores: 10,
    tempoMedio: '15-25 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['blefe_deducao', 'conhecimento_grupo'],
    tagsSociais: [
      'blefe',
      'deducao',
      'segredo',
      'paranoia',
      'conversa',
      'votacao',
      'competitivo',
    ],
    contextos: ['ninguem_confia', 'pra_gerar_historia', 'grupo_intimo'],
    descoberta: {
      mecanicaPrincipal: 'blefe',
      intencaoSocial: 'provocar',
      ritmo: 3,
      exposicao: 3,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 4,
      intimidade: 3,
      toleranciaVergonha: 3,
    },
    socialTags: ['aliança', 'manipulação', 'política'],
    categorias: ['tensao_misterio', 'quem_voces_sao'],
    destaque: true,
    ordemNaCategoria: 4,
    instrucoes: {
      objetivo:
        'Leais precisam completar missões. Traidores precisam sabotar sem serem descobertos. O grupo nunca vê quem sabotou — só o estrago.',
      passos: [
        'Cada jogador recebe em segredo se é leal ou traidor. Traidores descobrem quem está do mesmo lado.',
        'A cada rodada, um líder escolhe quem vai para a missão.',
        'O grupo debate a equipe proposta: quem está forçando, quem está defendendo demais, quem ficou quieto.',
        'Todos votam em segredo para aprovar ou rejeitar a equipe. Se rejeitarem cinco vezes seguidas, os traidores vencem.',
        'Se a equipe for aprovada, apenas os escolhidos fazem a missão em segredo.',
        'O grupo vê se a missão deu certo ou se houve sabotagem — mas nunca quem sabotou.',
      ],
      dicas: [
        'Leais: observem quem protege quem. Defesa emocional também é informação.',
        'Traidores: nem toda missão precisa ser sabotada. Confiança falsa vale muito.',
        'Se o grupo rejeita tudo, alguém está ganhando tempo. Ou todo mundo perdeu a cabeça.',
      ],
    },
  },
  {
    id: 'faz-ai',
    nome: 'Faz Aí',
    slogan: 'atua logo. o grupo grita.',
    descricao:
      'Um jogo de atuação social moderna. Você recebe uma situação extremamente reconhecível, tenta representar com o corpo, e o grupo precisa descobrir antes do tempo acabar.',
    cover: require('../../assets/games/faz-ai/cover.png'),
    banner: require('../../assets/games/faz-ai/banner.png'),
    minJogadores: 3,
    maxJogadores: 12,
    tempoMedio: '10-25 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['improviso_performance', 'rapidos_para_esquentar'],
    tagsSociais: [
      'improviso',
      'fisico',
      'gritaria',
      'sem_vergonha',
      'rapido',
      'baixo_texto',
    ],
    contextos: [
      'pra_comecar',
      'pra_subir_energia',
      'grupo_sem_vergonha',
      'noite_quente',
    ],
    descoberta: {
      mecanicaPrincipal: 'atuacao',
      intencaoSocial: 'gerar_historia',
      ritmo: 5,
      exposicao: 4,
      energiaFisica: 5,
      conversaPosRodada: 3,
      complexidade: 1,
      intimidade: 2,
      toleranciaVergonha: 4,
    },
    socialTags: ['atuação', 'improviso', 'vergonha'],
    categorias: ['festa_barulho', 'humor_absurdo', 'votacao_exposicao'],
    destaque: true,
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Fazer o grupo reconhecer uma situação social moderna só pela sua atuação. Não é teatro. É vergonha física, improviso ruim e identificação imediata.',
      passos: [
        'Na sua vez, pegue o celular e veja a situação em segredo.',
        'Comece a atuar rápido. Sem explicar, sem ler a carta, sem dar aula.',
        'O grupo grita respostas tentando descobrir qual situação você está representando.',
        'Se acertarem, marque acerto e a próxima carta aparece na hora.',
        'Se travar, passe. O ritmo vale mais que a dignidade.',
        'Quando o tempo acabar, o celular vai para a próxima pessoa.',
      ],
      dicas: [
        'Atuar mal é parte do jogo. Quanto mais específico o gesto, melhor.',
        'Use corpo, cara, silêncio, vergonha e exagero. Só não explique demais.',
        'O jogo fica melhor quando o grupo reconhece alguém da vida real na cena.',
      ],
    },
  },
  {
    id: 'duvido',
    nome: 'Duvido',
    slogan: 'você sabe ou está bluffando?',
    descricao:
      'Um ranking secreto é revelado item a item — mas ninguém vê a lista. Você diz o que acredita ser verdade. Bluffa quando não sabe. E duvida quando percebe que o outro inventou. Quem sobrar é o campeão do ranking.',
    cover: require('../../assets/games/duvido/cover.png'),
    banner: require('../../assets/games/duvido/banner.png'),
    minJogadores: 3,
    maxJogadores: 12,
    tempoMedio: '20-40 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['blefe_deducao', 'conhecimento_grupo'],
    tagsSociais: ['blefe', 'competitivo', 'conversa', 'deducao'],
    contextos: ['ninguem_confia', 'pra_subir_energia', 'pra_gerar_historia'],
    descoberta: {
      mecanicaPrincipal: 'ranking',
      intencaoSocial: 'competir',
      ritmo: 4,
      exposicao: 3,
      energiaFisica: 1,
      conversaPosRodada: 3,
      complexidade: 2,
      intimidade: 2,
      toleranciaVergonha: 2,
    },
    socialTags: ['ranking', 'bluff', 'conhecimento'],
    categorias: ['tensao_misterio'],
    destaque: true,
    ordemNaCategoria: 5,
    instrucoes: {
      objetivo:
        'Sobreviver como o último ativo em cada ranking — dizendo itens verdadeiros quando sabe, bluffando quando não sabe, e duvidando quando perceber que o outro inventou.',
      passos: [
        'O app sorteia um ranking secreto — os maiores artilheiros, os países mais populosos, as marcas mais valiosas. Ninguém vê a lista.',
        'O primeiro jogador diz um item que acredita pertencer ao ranking. Pode ser verdade ou bluff — o grupo não sabe.',
        'O próximo jogador escolhe: aceita a vez e diz outro item, ou grita "duvido!".',
        'Se duvidou e o item era inválido: o respondedor é eliminado. Se o item era válido: quem duvidou é eliminado.',
        'Quem for eliminado sai da rodada. O último sobrevivente vence o ranking.',
        'No final o ranking real é revelado — o grupo descobre quem sabia de verdade e quem estava bluffando do começo ao fim.',
      ],
      dicas: [
        'Bluffar com convicção é metade do jogo. Se você hesitar, vira alvo na hora.',
        'Duvidar cedo custa caro. Espere o grupo mostrar quem está inseguro antes de apostar.',
        'Conhecimento real engana mais do que qualquer bluff — ninguém duvida de quem parece saber.',
      ],
    },
  },
  {
    id: 'eu-nunca',
    nome: 'Eu Nunca',
    slogan: 'confissões que ninguém esperava.',
    descricao:
      'O app sorteia um "eu nunca..." e quem já fez levanta a mão. Revelações, surpresas e histórias que ninguém imaginava — o grupo decide quando parar.',
    cover: require('../../assets/games/eu-nunca/cover.png'),
    banner: require('../../assets/games/eu-nunca/banner.png'),
    minJogadores: 3,
    maxJogadores: 15,
    tempoMedio: '20-40 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['confissoes_revelacoes', 'casal_intimidade'],
    tagsSociais: ['bebida_opcional', 'conversa', 'exposicao', 'grupo_intimo'],
    contextos: ['grupo_intimo', 'noite_quente', 'pra_gerar_historia'],
    descoberta: {
      mecanicaPrincipal: 'confissao',
      intencaoSocial: 'revelar',
      ritmo: 3,
      exposicao: 5,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 1,
      intimidade: 5,
      toleranciaVergonha: 5,
    },
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
    slogan: 'confissão ou missão. você decide.',
    descricao:
      'O app sorteia perguntas e desafios na intensidade certa pra qualquer grupo. Cada jogador escolhe: responde com honestidade ou topa a missão.',
    cover: require('../../assets/games/verdade-desafio/cover.png'),
    banner: require('../../assets/games/verdade-desafio/banner.png'),
    minJogadores: 2,
    maxJogadores: 10,
    tempoMedio: '20-40 min',
    intensidade: 3,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['confissoes_revelacoes', 'casal_intimidade'],
    tagsSociais: [
      'bebida_opcional',
      'exposicao',
      'fisico',
      'grupo_intimo',
      'sem_vergonha',
    ],
    contextos: ['grupo_sem_vergonha', 'noite_quente', 'casal'],
    descoberta: {
      mecanicaPrincipal: 'desafio',
      intencaoSocial: 'provocar',
      ritmo: 3,
      exposicao: 5,
      energiaFisica: 4,
      conversaPosRodada: 4,
      complexidade: 2,
      intimidade: 5,
      toleranciaVergonha: 5,
    },
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
        'Se não quiser responder ou cumprir, passa sem penalidade e o jogo segue.',
        'O próximo jogador no sentido horário continua a rodada.',
      ],
      dicas: [
        'Defina antes uma "regra de segurança": um gesto ou palavra que qualquer pessoa pode usar para pular sem pagar prenda.',
        'Escolha a intensidade do baralho de acordo com o grupo — começar leve e ir subindo costuma funcionar melhor.',
        'Os desafios acontecem na roda: não exponham celulares, terceiros ou contato físico sem consentimento.',
      ],
    },
  },
  {
    id: 'entrelinhas',
    nome: 'Entrelinhas',
    slogan: 'o contexto é real. a conclusão está errada.',
    descricao:
      'Uma situação é lida em voz alta. Algo não fecha. O grupo faz perguntas de sim ou não até descobrir o que realmente aconteceu — e perceber que estava interpretando tudo errado desde o começo.',
    cover: require('../../assets/games/entrelinhas/cover.png'),
    banner: require('../../assets/games/entrelinhas/banner.png'),
    minJogadores: 2,
    maxJogadores: 12,
    tempoMedio: '15-40 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['blefe_deducao'],
    tagsSociais: ['deducao', 'conversa', 'baixo_texto', 'grupo_intimo'],
    contextos: ['pra_gerar_historia', 'ninguem_confia', 'grupo_intimo'],
    descoberta: {
      mecanicaPrincipal: 'deducao',
      intencaoSocial: 'conectar',
      ritmo: 2,
      exposicao: 1,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 3,
      intimidade: 2,
      toleranciaVergonha: 1,
    },
    socialTags: ['mistério', 'lateral', 'dedução'],
    categorias: ['tensao_misterio'],
    ordemNaCategoria: 5,
    instrucoes: {
      objetivo:
        'Descobrir o que realmente aconteceu na história — fazendo perguntas de sim ou não até que a conclusão óbvia desmorone e a verdade apareça.',
      passos: [
        'Um narrador pega o celular e lê o contexto em voz alta para o grupo. A solução fica escondida.',
        'O grupo faz perguntas — o narrador responde só sim, não ou irrelevante.',
        'Quando alguém descobrir o que aconteceu, o narrador toca "revelar" e a solução aparece para todos.',
        'O grupo discute, ri e parte para a próxima história.',
        'Se o grupo travar, pode pedir uma dica ou decidir desistir — sem penalidade.',
      ],
      dicas: [
        'Perguntas abertas não funcionam aqui — vá no sim ou não. "A pessoa estava sozinha?" é melhor que "por que ela fez isso?".',
        'Quando uma resposta não fizer sentido com sua hipótese, descarte a hipótese inteira — não a resposta.',
        'As histórias mais difíceis exigem reinterpretar uma palavra que você assumiu ter o significado óbvio.',
      ],
    },
  },
  {
    id: 'quem-na-sala',
    nome: 'Quem na Sala?',
    slogan: 'todo mundo vota. ninguém sabe quem votou.',
    descricao:
      'O app faz uma pergunta e todo mundo vota em segredo em alguém do grupo. Os votos só aparecem no final da rodada — e ninguém sabe quem votou em quem. Passem o celular na roda.',
    cover: require('../../assets/games/quem-na-sala/cover.png'),
    banner: require('../../assets/games/quem-na-sala/banner.png'),
    minJogadores: 4,
    maxJogadores: 8,
    tempoMedio: '10-20 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['votacao_exposicao', 'conhecimento_grupo'],
    tagsSociais: [
      'votacao',
      'segredo',
      'exposicao',
      'conversa',
      'grupo_intimo',
    ],
    contextos: ['pra_descobrir_o_grupo', 'grupo_intimo', 'pra_gerar_historia'],
    descoberta: {
      mecanicaPrincipal: 'votacao',
      intencaoSocial: 'expor',
      ritmo: 4,
      exposicao: 4,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 2,
      intimidade: 4,
      toleranciaVergonha: 4,
    },
    socialTags: ['drama', 'tensão', 'votação'],
    categorias: ['votacao_exposicao'],
    ordemNaCategoria: 1,
    instrucoes: {
      objetivo:
        'Descobrir o que o grupo realmente pensa sem ninguém precisar se expor. As perguntas vão do elogio à zoeira pesada, e o resultado anônimo gera as melhores reações da noite.',
      passos: [
        'Uma pessoa configura o grupo e inicia a partida no celular que vai circular pela roda.',
        'O app exibe uma pergunta no estilo "Quem na sala...".',
        'A cada votação, o celular passa de mão em mão e cada jogador escolhe em segredo o nome de outra pessoa.',
        'Quando todos votam, o app revela apenas o ranking de votos — sem mostrar quem votou em quem.',
        'O grupo comenta, ri, contesta e parte para a próxima pergunta.',
      ],
      dicas: [
        'O segredo do jogo é o anonimato: ninguém deve mostrar para quem está votando, nem mesmo de brincadeira.',
        'Se uma pergunta pesar para o grupo, pule antes que os votos comecem.',
        'Misture perguntas de elogio com perguntas mais provocativas para equilibrar o clima da partida.',
        'Quanto mais íntimo o grupo, mais reveladoras as respostas. Ideal para amigos próximos, casais ou colegas de longa data.',
      ],
    },
  },
  {
    id: 'sincronia',
    nome: 'Sincronia',
    slogan: 'uma palavra. duas cabeças. zero desculpas.',
    descricao:
      'Duas pessoas, um timer e uma palavra. Uma dá dicas, a outra adivinha — sem gestos, sem sons, só palavras. O grupo torce, ri e marca o ponto. Quanto mais acertos, mais pontos. Mas infrações custam caro.',
    cover: require('../../assets/games/sincronia/cover.png'),
    banner: require('../../assets/games/sincronia/banner.png'),
    minJogadores: 4,
    maxJogadores: 12,
    tempoMedio: '20-45 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['improviso_performance', 'rapidos_para_esquentar'],
    tagsSociais: [
      'competitivo',
      'improviso',
      'gritaria',
      'baixo_texto',
      'rapido',
    ],
    contextos: ['pra_comecar', 'pra_subir_energia', 'grupo_sem_vergonha'],
    descoberta: {
      mecanicaPrincipal: 'palavra',
      intencaoSocial: 'aquecer',
      ritmo: 5,
      exposicao: 2,
      energiaFisica: 1,
      conversaPosRodada: 2,
      complexidade: 2,
      intimidade: 1,
      toleranciaVergonha: 2,
    },
    socialTags: ['duplas', 'palavras', 'competição'],
    categorias: ['festa_barulho'],
    destaque: false,
    ordemNaCategoria: 3,
    instrucoes: {
      objetivo:
        'Fazer o parceiro adivinhar o maior número de palavras possível dentro do tempo — sem gestos, sem sons, só com palavras. Cada acerto vale 2 pontos. Cada infração desconta 1.',
      passos: [
        'Os jogadores são divididos em duplas. Uma pessoa dá dicas, a outra adivinha.',
        'O timer começa. A pessoa que dá dicas vê uma palavra e descreve com outras palavras.',
        'O parceiro tenta adivinhar. Se acertar, a próxima palavra aparece.',
        'Gestos, sons e traduções são infrações — o grupo pode gritar "infração!".',
        'Quando o tempo acabar, a rodada fecha e os pontos são contabilizados.',
        'Os papéis se invertem na próxima volta. A dupla com mais pontos no final vence.',
      ],
      dicas: [
        'Evite dizer partes da palavra ou palavras da mesma família.',
        'Dicas curtas e diretas costumam funcionar melhor do que explicações longas.',
        'Se travar, pule. Não desperdice tempo com palavras que não saem.',
      ],
    },
  },
  {
    id: 'na-mesma-pagina',
    nome: 'Na Mesma Página',
    slogan: 'uma pista. dois times. uma grade para decifrar.',
    descricao:
      'Um jogo de associação e leitura coletiva em times. O Mestre do time ativo vê o mapa secreto e dá uma pista para guiar a equipe. O time discute e escolhe as palavras — mas uma delas encerra o jogo na hora.',
    cover: require('../../assets/games/na mesma pagina/cover.png'),
    banner: require('../../assets/games/na mesma pagina/banner.png'),
    minJogadores: 4,
    maxJogadores: 12,
    tempoMedio: '20-35 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['blefe_deducao', 'rapidos_para_esquentar'],
    tagsSociais: ['deducao', 'competitivo', 'conversa', 'baixo_texto'],
    contextos: ['pra_comecar', 'pra_subir_energia', 'pra_descobrir_o_grupo'],
    descoberta: {
      mecanicaPrincipal: 'deducao',
      intencaoSocial: 'competir',
      ritmo: 4,
      exposicao: 2,
      energiaFisica: 1,
      conversaPosRodada: 4,
      complexidade: 3,
      intimidade: 1,
      toleranciaVergonha: 1,
    },
    socialTags: ['times', 'associação', 'pista'],
    categorias: ['tensao_misterio'],
    destaque: false,
    ordemNaCategoria: 6,
    instrucoes: {
      objetivo:
        'Encontrar todas as palavras do seu time na grade antes do adversário. O Mestre sabe quais são as suas — e precisa dar pistas sem revelar demais. Uma palavra encerra o jogo na hora.',
      passos: [
        'Os jogadores se dividem em dois times. Cada time escolhe um Mestre.',
        'O Mestre do time ativo toca "Ver Mapa" e vê em segredo quais palavras pertencem a cada time.',
        'O Mestre diz uma pista — uma palavra e um número — para ajudar o time a encontrar as suas palavras.',
        'O time discute e toca nas palavras da grade. O app revela se é do time, do adversário, neutra ou perigosa.',
        'Se o time acertar todas as palavras da pista, pode tentar mais uma. Se errar, o turno passa.',
        'O primeiro time a revelar todas as suas palavras vence. Se algum time tocar na perigosa, perde na hora.',
      ],
      dicas: [
        'Uma pista com número alto pode cobrir mais palavras — mas o risco de erro também cresce.',
        'Quando o time não tiver certeza, passar o turno é sempre melhor do que apostar.',
        'O Mestre não pode dar dicas extras depois de anunciar a pista. A comunicação acaba aí.',
      ],
    },
  },
  {
    id: 'de-0-a-10',
    nome: 'De 0 a 10',
    slogan: 'qual é a sua nota? o grupo vai descobrir.',
    descricao:
      'Você recebe uma nota secreta e responde a categorias de acordo com ela. Sem certo ou errado — só a coerência emocional das suas escolhas. O grupo lê o padrão e tenta descobrir o número.',
    cover: require('../../assets/games/de 0 a 10/cover.png'),
    banner: require('../../assets/games/de 0 a 10/banner.png'),
    minJogadores: 2,
    maxJogadores: 12,
    tempoMedio: '15-30 min',
    intensidade: 2,
    disponivel: true,
    supportsLocal: true,
    supportsRealtime: false,
    categoriasPrincipais: ['conhecimento_grupo', 'votacao_exposicao'],
    tagsSociais: [
      'conversa',
      'exposicao',
      'grupo_intimo',
      'baixo_texto',
      'vergonha_leve',
    ],
    contextos: ['pra_descobrir_o_grupo', 'grupo_intimo', 'casal'],
    descoberta: {
      mecanicaPrincipal: 'leitura',
      intencaoSocial: 'revelar',
      ritmo: 3,
      exposicao: 3,
      energiaFisica: 1,
      conversaPosRodada: 5,
      complexidade: 2,
      intimidade: 4,
      toleranciaVergonha: 2,
    },
    socialTags: ['leitura', 'personalidade', 'debate'],
    categorias: ['quem_voces_sao'],
    ordemNaCategoria: 3,
    instrucoes: {
      objetivo:
        'Ler a intensidade emocional das respostas de alguém e descobrir qual nota secreta elas representam. Não existe certo ou errado — existe coerência, padrão e a leitura do grupo.',
      passos: [
        'O app sorteia uma nota secreta (de 1 a 9) para o jogador da vez. Só ele vê.',
        'Três categorias aparecem na tela: filme, animal, profissão, e por aí vai.',
        'O jogador responde cada categoria de acordo com a sua nota — sem explicar a lógica.',
        'O grupo lê as respostas juntos, debate e tenta calibrar a frequência emocional implícita.',
        'Cada pessoa submete seu palpite em segredo. Os palpites aparecem simultaneamente.',
        'A nota real é revelada. Quem chegou mais perto? Por que errou?',
      ],
      dicas: [
        'Responda com a primeira associação que vier. Quanto mais você pensa, menos honesta fica a resposta.',
        'O jogo é sobre coerência, não sobre exagero. Nota 8 não precisa ser dramático — precisa ser consistente.',
        'Depois do reveal, sempre pergunte a lógica do jogador. É aí que o jogo realmente acontece.',
      ],
    },
  },
];

export function jogosPorCategoria(): Record<
  CategoriaEmocional,
  DefinicaoJogo[]
> {
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
