import type {
  CartaFazAi,
  CategoriaFazAi,
  CategoriaFazAiId,
  DificuldadeAtuacao,
  EnergiaRodada,
  IntensidadeSocial,
} from '@/games/faz-ai/types';

type PerfilCategoria = Pick<
  CartaFazAi,
  'intensidadeSocial' | 'dificuldadeAtuacao' | 'energiaRodada'
>;

export const CATEGORIAS_FAZ_AI: readonly CategoriaFazAi[] = [
  {
    id: 'vida_adulta_brasileira',
    nome: 'Vida Adulta Brasileira',
    descricao: 'boletos, entregas e pequenas falências emocionais.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
  },
  {
    id: 'internet_brasileira',
    nome: 'Internet Brasileira',
    descricao: 'o corpo tentando explicar o que o print já disse.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'gritaria',
  },
  {
    id: 'corporate_chaos',
    nome: 'Corporate Chaos',
    descricao: 'reunião, mute e sofrimento com planilha aberta.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
  },
  {
    id: 'casal_moderno',
    nome: 'Casal Moderno',
    descricao: 'visualizado, indireta e maturidade performada.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'media',
    energiaPadrao: 'gritaria',
  },
  {
    id: 'vergonhas_universais',
    nome: 'Vergonhas Universais',
    descricao: 'todo mundo já passou. ninguém superou.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'facil',
    energiaPadrao: 'gritaria',
  },
  {
    id: 'brainrot_brasileiro',
    nome: 'Brainrot Brasileiro',
    descricao: 'quando a internet ganhou do cérebro.',
    intensidadePadrao: 'absurda',
    dificuldadePadrao: 'surto',
    energiaPadrao: 'colapso',
  },
  {
    id: 'festa_e_role',
    nome: 'Festa e Rolê',
    descricao: 'o grupo, o barulho e decisões questionáveis.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'facil',
    energiaPadrao: 'gritaria',
  },
  {
    id: 'problemas_de_rico',
    nome: 'Problemas de Rico',
    descricao: 'dramas caros com sofrimento realíssimo.',
    intensidadePadrao: 'social',
    dificuldadePadrao: 'media',
    energiaPadrao: 'ritmo',
  },
  {
    id: 'exposed_cancelamento',
    nome: 'Exposed & Cancelamento',
    descricao: 'print, indireta e tentativa de controle de danos.',
    intensidadePadrao: 'caotica',
    dificuldadePadrao: 'dificil',
    energiaPadrao: 'gritaria',
  },
  {
    id: 'situacoes_muito_especificas',
    nome: 'Situações Muito Específicas',
    descricao: 'ninguém sabe explicar por que reconheceu tão rápido.',
    intensidadePadrao: 'absurda',
    dificuldadePadrao: 'dificil',
    energiaPadrao: 'colapso',
  },
];

const PERFIS = Object.fromEntries(
  CATEGORIAS_FAZ_AI.map((categoria) => [
    categoria.id,
    {
      intensidadeSocial: categoria.intensidadePadrao,
      dificuldadeAtuacao: categoria.dificuldadePadrao,
      energiaRodada: categoria.energiaPadrao,
    },
  ]),
) as Record<CategoriaFazAiId, PerfilCategoria>;

const CARTAS_BASE: Record<CategoriaFazAiId, readonly string[]> = {
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

function carta(
  categoria: CategoriaFazAiId,
  texto: string,
  indice: number,
): CartaFazAi {
  return {
    id: `faz-ai-${slugCategoria(categoria)}-${String(indice + 1).padStart(2, '0')}`,
    texto,
    categoria,
    ...PERFIS[categoria],
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
