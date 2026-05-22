import type {
  CategoriaFazAi,
  CategoriaFazAiId,
  CartaFazAi,
  DificuldadeAtuacao,
  EnergiaRodada,
  IntensidadeSocial,
} from '@/games/faz-ai/types';
import { FILMES_FAZ_AI } from '@/games/faz-ai/filmes';
import { CELEBRIDADES_FAZ_AI } from '@/games/faz-ai/celebridades';

type PerfilCategoria = Pick<
  CartaFazAi,
  | 'intensidadeSocial'
  | 'dificuldadeAtuacao'
  | 'energiaRodada'
  | 'tipo'
  | 'modoAtuacao'
  | 'atuabilidade'
>;

type AjusteCartaFazAi = Partial<
  Pick<
    CartaFazAi,
    | 'ideiaCentral'
    | 'intensidadeSocial'
    | 'dificuldadeAtuacao'
    | 'energiaRodada'
    | 'tipo'
    | 'modoAtuacao'
    | 'atuabilidade'
    | 'respostasAceitas'
    | 'tags'
  >
>;

type CartaSeedFazAi =
  | string
  | ({
      texto: string;
    } & AjusteCartaFazAi);

export const CATEGORIAS_FAZ_AI: readonly CategoriaFazAi[] = [
  {
    id: 'classicos_de_mimica',
    nome: 'Clássicos de Mímica',
    descricao: 'cartas diretas pra todo mundo entrar no corpo.',
    intensidadePadrao: 'leve',
    dificuldadePadrao: 'facil',
    energiaPadrao: 'aquecimento',
    tipoPadrao: 'classica',
    modoPadrao: 'gesto',
    atuabilidadePadrao: 'direta',
  },
  {
    id: 'acoes_do_cotidiano',
    nome: 'Ações do Cotidiano',
    descricao: 'coisas simples que viram cena em três segundos.',
    intensidadePadrao: 'leve',
    dificuldadePadrao: 'facil',
    energiaPadrao: 'aquecimento',
    tipoPadrao: 'classica',
    modoPadrao: 'objeto',
    atuabilidadePadrao: 'direta',
  },
  {
    id: 'profissoes_e_personagens',
    nome: 'Profissões e Personagens',
    descricao: 'papéis fáceis de reconhecer sem explicar nada.',
    intensidadePadrao: 'leve',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
    tipoPadrao: 'classica',
    modoPadrao: 'personagem',
    atuabilidadePadrao: 'boa',
  },
  {
    id: 'filmes',
    nome: 'Filmes',
    descricao: 'títulos famosos pra atuar pelo símbolo, cena ou personagem.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
    tipoPadrao: 'classica',
    modoPadrao: 'referencia',
    atuabilidadePadrao: 'boa',
  },
  {
    id: 'celebridades_personagens',
    nome: 'Celebridades',
    descricao: 'pessoas e personagens pra virar postura, voz e gesto.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
    tipoPadrao: 'classica',
    modoPadrao: 'personagem',
    atuabilidadePadrao: 'boa',
  },
  {
    id: 'vida_adulta_brasileira',
    nome: 'Vida Adulta Brasileira',
    descricao: 'boletos, entregas e pequenas falências emocionais.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'situacao',
    atuabilidadePadrao: 'boa',
  },
  {
    id: 'internet_brasileira',
    nome: 'Internet Brasileira',
    descricao: 'o corpo tentando explicar o que o print já disse.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'gritaria',
    tipoPadrao: 'internet',
    modoPadrao: 'situacao',
    atuabilidadePadrao: 'sutil',
  },
  {
    id: 'corporate_chaos',
    nome: 'Corporate Chaos',
    descricao: 'reunião, mute e sofrimento com planilha aberta.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'situacao',
    atuabilidadePadrao: 'boa',
  },
  {
    id: 'casal_moderno',
    nome: 'Casal Moderno',
    descricao: 'visualizado, indireta e maturidade performada.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'media',
    energiaPadrao: 'gritaria',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'emocao',
    atuabilidadePadrao: 'sutil',
  },
  {
    id: 'vergonhas_universais',
    nome: 'Vergonhas Universais',
    descricao: 'todo mundo já passou. ninguém superou.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'facil',
    energiaPadrao: 'gritaria',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'situacao',
    atuabilidadePadrao: 'direta',
  },
  {
    id: 'brainrot_brasileiro',
    nome: 'Brainrot Brasileiro',
    descricao: 'quando a internet ganhou do cérebro.',
    intensidadePadrao: 'absurda',
    dificuldadePadrao: 'surto',
    energiaPadrao: 'colapso',
    tipoPadrao: 'internet',
    modoPadrao: 'referencia',
    atuabilidadePadrao: 'complexa',
  },
  {
    id: 'festa_e_role',
    nome: 'Festa e Rolê',
    descricao: 'o grupo, o barulho e decisões questionáveis.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'facil',
    energiaPadrao: 'gritaria',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'situacao',
    atuabilidadePadrao: 'direta',
  },
  {
    id: 'problemas_de_rico',
    nome: 'Problemas de Rico',
    descricao: 'dramas caros com sofrimento realíssimo.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'personagem',
    atuabilidadePadrao: 'sutil',
  },
  {
    id: 'exposed_cancelamento',
    nome: 'Exposed & Cancelamento',
    descricao: 'print, indireta e tentativa de controle de danos.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'dificil',
    energiaPadrao: 'gritaria',
    tipoPadrao: 'social_moderna',
    modoPadrao: 'emocao',
    atuabilidadePadrao: 'sutil',
  },
  {
    id: 'situacoes_muito_especificas',
    nome: 'Situações Muito Específicas',
    descricao: 'ninguém sabe explicar por que reconheceu tão rápido.',
    intensidadePadrao: 'absurda',
    dificuldadePadrao: 'dificil',
    energiaPadrao: 'colapso',
    tipoPadrao: 'absurda',
    modoPadrao: 'situacao',
    atuabilidadePadrao: 'complexa',
  },
];

const PERFIS = Object.fromEntries(
  CATEGORIAS_FAZ_AI.map((categoria) => [
    categoria.id,
    {
      intensidadeSocial: categoria.intensidadePadrao,
      dificuldadeAtuacao: categoria.dificuldadePadrao,
      energiaRodada: categoria.energiaPadrao,
      tipo: categoria.tipoPadrao,
      modoAtuacao: categoria.modoPadrao,
      atuabilidade: categoria.atuabilidadePadrao,
    },
  ]),
) as Record<CategoriaFazAiId, PerfilCategoria>;

const CARTAS_BASE: Record<CategoriaFazAiId, readonly CartaSeedFazAi[]> = {
  classicos_de_mimica: [
    {
      texto: 'escovar os dentes',
      respostasAceitas: ['escovar dente', 'passar escova', 'higiene bucal'],
    },
    {
      texto: 'dirigir um carro',
      respostasAceitas: ['dirigir', 'motorista', 'volante'],
    },
    {
      texto: 'andar de bicicleta',
      respostasAceitas: ['bicicleta', 'pedalar', 'bike'],
    },
    {
      texto: 'tocar violão',
      respostasAceitas: ['violão', 'tocar guitarra', 'músico'],
    },
    {
      texto: 'jogar futebol',
      respostasAceitas: ['futebol', 'chutar bola', 'jogador'],
    },
    {
      texto: 'cozinhar macarrão',
      respostasAceitas: ['cozinhar', 'fazer comida', 'macarrão'],
    },
    {
      texto: 'tomar banho frio',
      respostasAceitas: ['banho frio', 'tomar banho', 'chuveiro gelado'],
    },
    { texto: 'pescar', respostasAceitas: ['pescaria', 'pescador', 'peixe'] },
    {
      texto: 'andar na chuva sem guarda-chuva',
      respostasAceitas: ['chuva', 'sem guarda-chuva', 'se molhando'],
    },
    {
      texto: 'levantar peso na academia',
      respostasAceitas: ['academia', 'musculação', 'levantando peso'],
    },
    {
      texto: 'tirar uma selfie',
      respostasAceitas: ['selfie', 'foto', 'tirando foto'],
    },
    {
      texto: 'dançar forró sem saber',
      respostasAceitas: ['dançar', 'forró', 'dança ruim'],
    },
    {
      texto: 'fazer alongamento',
      respostasAceitas: ['alongar', 'alongamento', 'esticar o corpo'],
    },
    { texto: 'nadar no mar', respostasAceitas: ['nadar', 'mar', 'praia'] },
    {
      texto: 'montar uma barraca',
      respostasAceitas: ['barraca', 'acampar', 'montando camping'],
    },
  ],
  acoes_do_cotidiano: [
    'procurando chave atrasado',
    'carregando sacola pesada',
    'tentando abrir pote travado',
    'esperando elevador com pressa',
    'limpando óculos na camiseta',
    'sentando em cadeira quebrada',
    'tentando matar mosquito',
    'pegando ônibus lotado',
    'fazendo café sem acordar direito',
    'passando roupa com pressa',
    'tentando fechar mala cheia',
    'comendo sopa quente demais',
    'colocando lençol de elástico',
    'lavando louça sem vontade',
    'procurando celular que está na mão',
  ],
  profissoes_e_personagens: [
    'garçom em restaurante cheio',
    'dentista fazendo procedimento',
    'professor chamando atenção da turma',
    'segurança de balada barrando alguém',
    'médico dando notícia séria',
    'motorista de aplicativo perdido',
    'DJ animando pista vazia',
    'personal trainer empolgado demais',
    'fotógrafo mandando fazer pose',
    'vendedor insistente de shopping',
    'juiz de futebol bravo',
    'apresentador de programa de auditório',
    'cabeleireiro cortando franja',
    'mágico fingindo mistério',
    'repórter no meio da confusão',
  ],
  filmes: FILMES_FAZ_AI,
  celebridades_personagens: CELEBRIDADES_FAZ_AI,
  vida_adulta_brasileira: [
    'tentando entender a fatura do cartão',
    'fingindo tranquilidade depois do PIX errado',
    'descobrindo o preço do azeite',
    'atendendo interfone sem saber quem é',
    'falando "vou ver e te aviso" sabendo que não vai',
    'esperando o motoboy olhando o mapa',
    'tentando cancelar plano pelo atendimento',
    'fingindo que sabe declarar imposto',
    'olhando boleto que venceu ontem',
    'tentando dividir conta de churrasco',
    'descobrindo taxa de entrega maior que comida',
    'recebendo áudio da mãe pedindo favor',
    'entrando no mercado só pra comprar uma coisa',
    'percebendo que esqueceu roupa na máquina',
    'tentando parecer adulto no banco',
  ],
  internet_brasileira: [
    'fingindo que não viu o story',
    'ouvindo áudio em 2x e fingindo que entendeu',
    'apagando mensagem e mandando "era nada"',
    'stalkeando e curtindo foto antiga sem querer',
    'mandando print no grupo errado',
    'tentando gravar story discreto',
    'vendo fofoca sem querer se envolver',
    'reagindo com emoji neutro pra não se comprometer',
    'fazendo unboxing de compra inútil',
    'respondendo "kkkk" sem rir',
    'fingindo que caiu a internet',
    'tentando parecer ocupado no WhatsApp',
    'descobrindo que foi removido do close friends',
    'lendo comentário passivo-agressivo',
    'fingindo naturalidade numa chamada de vídeo',
  ],
  corporate_chaos: [
    'fingindo que entendeu a explicação',
    'tentando falar no mute',
    'fingindo conexão ruim em reunião',
    'sorrindo no "vamos alinhar offline"',
    'recebendo "rapidinho?" às 17h59',
    'tentando parecer produtivo no home office',
    'respondendo "perfeito" discordando',
    'apresentando slide que nunca viu',
    'esperando alguém compartilhar tela',
    'fingindo que anotou o feedback',
    'tentando sair da call sem ser notado',
    'celebrando aniversário no Teams sem vontade',
    'dizendo "faz sentido" sem entender',
    'descobrindo reunião que podia ser email',
    'justificando atraso com "prioridades"',
  ],
  casal_moderno: [
    'mandando áudio chorando pro ex',
    'fingindo que não liga pro visualizado',
    'lendo "a gente precisa conversar"',
    'tentando escolher restaurante sem brigar',
    'fingindo maturidade vendo story do ex',
    'respondendo "tanto faz" querendo escolher',
    'perguntando "quem é essa pessoa?"',
    'stalkeando curtidas antigas',
    'tentando dormir bravo de costas',
    'mandando indireta e negando',
    'esperando pedido de desculpas',
    'fingindo que não decorou horário online',
    'recebendo "sonhei com você"',
    'tentando parecer desapegado no date',
    'vendo o ex feliz cedo demais',
  ],
  vergonhas_universais: [
    'dando tchau pra quem não estava dando tchau',
    'tropeçando e fingindo que virou dança',
    'falando "você também" pro garçom',
    'esquecendo nome de alguém no meio da frase',
    'rindo sem entender a piada',
    'entrando no lugar errado com confiança',
    'tentando abrir porta que é de puxar',
    'acenando de volta pra desconhecido',
    'fingindo que mensagem era pra outra pessoa',
    'errando letra de parabéns',
    'derrubando algo e culpando a mesa',
    'falando alto quando a música para',
    'cumprimentando com beijo e abraço errado',
    'repetindo piada sem ninguém rir',
    'percebendo comida no dente tarde demais',
  ],
  brainrot_brasileiro: [
    'explicando meme pra quem não usa internet',
    'repetindo áudio viral no momento errado',
    'dançando trend sem saber a coreografia',
    'falando bordão e se arrependendo',
    'tentando não rir de meme péssimo',
    'imitando influencer de review',
    'fazendo pose de NPC de live',
    'narrando a própria vida como vlog',
    'recebendo notícia séria e pensando em meme',
    'mandando figurinha como argumento',
    'usando filtro e esquecendo que está em reunião',
    'falando "literalmente eu" pra tudo',
    'tentando explicar lore de fofoca',
    'reagindo como se estivesse em live',
    'transformando qualquer coisa em trend',
  ],
  festa_e_role: [
    'tentando sair da festa sem se despedir',
    'fingindo sobriedade na portaria',
    'procurando amigo perdido no rolê',
    'tentando ouvir conversa no barulho',
    'dançando sem saber a música',
    'pedindo banheiro em casa desconhecida',
    'segurando copo de alguém sem querer',
    'descobrindo que o after é longe',
    'fingindo conhecer música do DJ',
    'tentando chamar Uber com 2% de bateria',
    'reencontrando pessoa que você evitou',
    'tentando explicar pro segurança que conhece alguém',
    'chegando cedo demais no rolê',
    'procurando casaco que ninguém viu',
    'indo embora e voltando pela fofoca',
  ],
  problemas_de_rico: [
    'reclamando que o voo atrasou na sala VIP',
    'descobrindo que a diarista cancelou',
    'sofrendo porque o resort não tem oat milk',
    'escolhendo mala pra fim de semana',
    'ficando sem bateria no carro elétrico',
    'pedindo desconto em loja cara',
    'reclamando do Wi-Fi da casa de praia',
    'perdendo reserva no restaurante concorrido',
    'brigando com aplicativo de milhas',
    'achando que todo mundo tem personal',
    'confundindo champagne com espumante',
    'reclamando da obra no apartamento',
    'fingindo humildade falando de intercâmbio',
    'descobrindo que o valet arranhou o carro',
    'tendo crise porque acabou gelo da adega',
  ],
  exposed_cancelamento: [
    'descobrindo que falaram mal de você',
    'vendo print seu no grupo',
    'tentando explicar curtida suspeita',
    'sendo marcado em foto péssima',
    'ouvindo "posso falar uma coisa?"',
    'fingindo calma durante exposed',
    'apagando story depois de arrependimento',
    'recebendo "isso foi pra mim?"',
    'tentando sair de fofoca que você começou',
    'vendo alguém contar sua versão errada',
    'respondendo acusação com "contexto?"',
    'percebendo que o microfone estava aberto',
    'lendo indireta claramente sua',
    'tentando negar algo com prova na tela',
    'pedindo desculpa sem admitir tudo',
  ],
  situacoes_muito_especificas: [
    'desbloqueando Face ID bêbado',
    'entrando no elevador e esquecendo o andar',
    'tentando parecer normal depois de quase cair',
    'fingindo que sabe onde está indo',
    'escolhendo foto enquanto todo mundo espera',
    'tentando ouvir áudio escondido no transporte',
    'segurando espirro em lugar silencioso',
    'fingindo que não está com ciúme do amigo',
    'percebendo que chamou professora de mãe',
    'tentando cortar assunto com pessoa carente',
    'comendo algo quente demais sem demonstrar',
    'fingindo que não está olhando conversa alheia',
    'tentando lembrar senha com gente esperando',
    'entrando em live sem querer',
    'pagando por aproximação e falhando três vezes',
  ],
};

function slugCategoria(id: CategoriaFazAiId): string {
  return id.replaceAll('_', '-');
}

const AJUSTES_CARTAS: Record<string, AjusteCartaFazAi> = {
  'fingindo tranquilidade depois do PIX errado': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'direta',
    respostasAceitas: ['pix errado', 'transferiu errado', 'pagamento errado'],
  },
  'atendendo interfone sem saber quem é': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: ['interfone', 'porteiro', 'quem está chamando'],
  },
  'esperando o motoboy olhando o mapa': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: ['motoboy', 'entrega chegando', 'olhando mapa'],
  },
  'entrando no mercado só pra comprar uma coisa': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'boa',
    respostasAceitas: ['mercado', 'comprar uma coisa', 'supermercado'],
  },
  'percebendo que esqueceu roupa na máquina': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'boa',
    respostasAceitas: ['roupa na máquina', 'esqueceu roupa', 'lavanderia'],
  },
  'fingindo que não viu o story': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'boa',
    respostasAceitas: [
      'não viu o story',
      'ignorando story',
      'fingindo que não viu',
    ],
  },
  'ouvindo áudio em 2x e fingindo que entendeu': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'áudio em 2x',
      'não entendeu o áudio',
      'áudio acelerado',
    ],
  },
  'stalkeando e curtindo foto antiga sem querer': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'direta',
    respostasAceitas: ['curtiu foto antiga', 'stalk sem querer', 'stalkeando'],
  },
  'mandando print no grupo errado': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'direta',
    respostasAceitas: [
      'print errado',
      'grupo errado',
      'mandou no lugar errado',
    ],
  },
  'fingindo que caiu a internet': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'situacao',
    atuabilidade: 'boa',
    respostasAceitas: [
      'caiu a internet',
      'conexão ruim',
      'travando de propósito',
    ],
  },
  'fingindo que entendeu a explicação': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'boa',
    respostasAceitas: [
      'fingiu que entendeu',
      'não entendeu nada',
      'explicação confusa',
    ],
  },
  'tentando falar no mute': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: ['está no mute', 'microfone fechado', 'falando sem som'],
  },
  'fingindo conexão ruim em reunião': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'boa',
    respostasAceitas: [
      'conexão ruim',
      'travando na reunião',
      'fingiu que caiu',
    ],
  },
  'apresentando slide que nunca viu': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'boa',
    respostasAceitas: [
      'apresentando slide',
      'não conhece o slide',
      'improvisando apresentação',
    ],
  },
  'esperando alguém compartilhar tela': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'boa',
    respostasAceitas: ['compartilhar tela', 'esperando tela', 'call parada'],
  },
  'mandando áudio chorando pro ex': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'direta',
    respostasAceitas: [
      'áudio chorando',
      'chorando pro ex',
      'mandando áudio triste',
    ],
  },
  'lendo "a gente precisa conversar"': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'direta',
    respostasAceitas: [
      'precisa conversar',
      'mensagem assustadora',
      'levou um susto no relacionamento',
    ],
  },
  'tentando escolher restaurante sem brigar': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'boa',
    respostasAceitas: [
      'escolher restaurante',
      'decidir onde comer',
      'briga por comida',
    ],
  },
  'perguntando "quem é essa pessoa?"': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'boa',
    respostasAceitas: ['ciúme', 'quem é essa pessoa', 'perguntando do contato'],
  },
  'esperando pedido de desculpas': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'boa',
    respostasAceitas: [
      'esperando desculpa',
      'quer pedido de desculpas',
      'ficou bravo esperando',
    ],
  },
  'explicando meme pra quem não usa internet': {
    dificuldadeAtuacao: 'media',
    atuabilidade: 'boa',
    respostasAceitas: [
      'explicando meme',
      'meme para pessoa perdida',
      'ensinando internet',
    ],
  },
  'dançando trend sem saber a coreografia': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'gesto',
    atuabilidade: 'direta',
    respostasAceitas: ['trend', 'dança de internet', 'coreografia errada'],
  },
  'fazendo pose de NPC de live': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'personagem',
    atuabilidade: 'boa',
    respostasAceitas: ['NPC de live', 'personagem de live', 'pose repetitiva'],
  },
  'narrando a própria vida como vlog': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'personagem',
    atuabilidade: 'boa',
    respostasAceitas: ['vlog', 'narrando a vida', 'influencer'],
  },
  'tentando explicar lore de fofoca': {
    dificuldadeAtuacao: 'dificil',
    atuabilidade: 'sutil',
    respostasAceitas: [
      'explicando fofoca',
      'lore da fofoca',
      'fofoca complicada',
    ],
  },
  'tentando sair da festa sem se despedir': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'situacao',
    atuabilidade: 'direta',
    respostasAceitas: [
      'saindo de fininho',
      'indo embora escondido',
      'fugindo da festa',
    ],
  },
  'fingindo sobriedade na portaria': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'personagem',
    atuabilidade: 'direta',
    respostasAceitas: [
      'fingindo sobriedade',
      'porteiro',
      'tentando entrar bêbado',
    ],
  },
  'procurando amigo perdido no rolê': {
    dificuldadeAtuacao: 'facil',
    atuabilidade: 'direta',
    respostasAceitas: ['amigo perdido', 'procurando no rolê', 'perdeu alguém'],
  },
  'tentando chamar Uber com 2% de bateria': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'uber com bateria acabando',
      'celular sem bateria',
      'chamando carro desesperado',
    ],
  },
  'reclamando que o voo atrasou na sala VIP': {
    dificuldadeAtuacao: 'media',
    modoAtuacao: 'personagem',
    atuabilidade: 'boa',
    respostasAceitas: [
      'sala vip',
      'voo atrasado',
      'problema de rico no aeroporto',
    ],
  },
  'sofrendo porque o resort não tem oat milk': {
    dificuldadeAtuacao: 'dificil',
    atuabilidade: 'sutil',
    respostasAceitas: [
      'problema de rico',
      'resort sem leite vegetal',
      'drama no hotel',
    ],
  },
  'descobrindo que falaram mal de você': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'direta',
    respostasAceitas: [
      'falaram mal',
      'descobriu fofoca',
      'foi traído pelo grupo',
    ],
  },
  'vendo print seu no grupo': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: ['print no grupo', 'vazou print', 'foi exposto'],
  },
  'tentando explicar curtida suspeita': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'boa',
    respostasAceitas: [
      'curtida suspeita',
      'se explicando',
      'curtiu foto errada',
    ],
  },
  'percebendo que o microfone estava aberto': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'microfone aberto',
      'falou no mudo errado',
      'vazou áudio',
    ],
  },
  'tentando negar algo com prova na tela': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'boa',
    respostasAceitas: ['negando com prova', 'foi pego', 'prova na tela'],
  },
  'desbloqueando Face ID bêbado': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'face id bêbado',
      'desbloquear celular',
      'celular não reconhece',
    ],
  },
  'entrando no elevador e esquecendo o andar': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'elevador',
      'esqueceu o andar',
      'apertando botão errado',
    ],
  },
  'tentando ouvir áudio escondido no transporte': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'ouvir áudio escondido',
      'áudio no ônibus',
      'celular no ouvido',
    ],
  },
  'segurando espirro em lugar silencioso': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'gesto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'segurando espirro',
      'espirro preso',
      'lugar silencioso',
    ],
  },
  'comendo algo quente demais sem demonstrar': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'emocao',
    atuabilidade: 'direta',
    respostasAceitas: [
      'comida quente',
      'queimou a boca',
      'fingindo que não queimou',
    ],
  },
  'tentando lembrar senha com gente esperando': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'boa',
    respostasAceitas: ['lembrar senha', 'senha errada', 'gente esperando'],
  },
  'pagando por aproximação e falhando três vezes': {
    dificuldadeAtuacao: 'facil',
    modoAtuacao: 'objeto',
    atuabilidade: 'direta',
    respostasAceitas: [
      'aproximação falhando',
      'cartão não passa',
      'pagamento recusado',
    ],
  },
};

function normalizarSeed(
  seed: CartaSeedFazAi,
): { texto: string } & AjusteCartaFazAi {
  return typeof seed === 'string' ? { texto: seed } : seed;
}

function carta(
  categoria: CategoriaFazAiId,
  seed: CartaSeedFazAi,
  indice: number,
): CartaFazAi {
  const { texto, ...ajustesDiretos } = normalizarSeed(seed);
  const ajustes = { ...AJUSTES_CARTAS[texto], ...ajustesDiretos };

  return {
    id: `faz-ai-${slugCategoria(categoria)}-${String(indice + 1).padStart(2, '0')}`,
    texto,
    categoria,
    ideiaCentral: ajustes.ideiaCentral ?? texto,
    ...PERFIS[categoria],
    ...ajustes,
  };
}

export const CARTAS_FAZ_AI: readonly CartaFazAi[] = Object.entries(
  CARTAS_BASE,
).flatMap(([categoria, textos]) =>
  textos.map((texto, indice) =>
    carta(categoria as CategoriaFazAiId, texto, indice),
  ),
);

export function getCategoriaFazAi(id: CategoriaFazAiId): CategoriaFazAi {
  const categoria = CATEGORIAS_FAZ_AI.find((item) => item.id === id);
  if (!categoria) {
    throw new Error(`Categoria Faz Aí desconhecida: ${id}`);
  }
  return categoria;
}

export function pesoEnergia(energia: EnergiaRodada): number {
  if (energia === 'aquecimento') return 1;
  if (energia === 'ritmo') return 2;
  if (energia === 'gritaria') return 3;
  return 4;
}

export function pesoVergonha(intensidade: IntensidadeSocial): number {
  if (intensidade === 'leve') return 1;
  if (intensidade === 'social') return 2;
  if (intensidade === 'caotica') return 3;
  return 4;
}

export function pesoDificuldade(dificuldade: DificuldadeAtuacao): number {
  if (dificuldade === 'facil') return 1;
  if (dificuldade === 'media') return 2;
  if (dificuldade === 'dificil') return 3;
  return 4;
}

export function pesoAtuabilidade(
  atuabilidade: CartaFazAi['atuabilidade'],
): number {
  if (atuabilidade === 'direta') return 1;
  if (atuabilidade === 'boa') return 2;
  if (atuabilidade === 'sutil') return 3;
  return 4;
}
