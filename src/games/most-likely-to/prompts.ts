import type { Prompt } from '@/games/most-likely-to/types';

/**
 * Banco de prompts do Most Likely To.
 *
 * Energia:
 *  - leve    → seguro para qualquer grupo; primeiras rodadas
 *  - medio   → requer algum nível de conhecimento mútuo
 *  - intenso → vulnerabilidade real; modo Sincero apenas
 *
 * Sequenciamento: o engine seleciona prompts respeitando a energia e
 * evitando repetições via indicesPromptUsados.
 */
export const PROMPTS: ReadonlyArray<Prompt> = [
  // ── Leve ───────────────────────────────────────────────────────────────────
  {
    id: 'l01',
    texto: 'quem mais provavelmente chegaria atrasado a um casamento?',
    energia: 'leve',
  },
  {
    id: 'l02',
    texto: 'quem mais provavelmente tentaria negociar o preço de tudo?',
    energia: 'leve',
  },
  {
    id: 'l03',
    texto: 'quem mais provavelmente assistiria uma série inteira num fim de semana?',
    energia: 'leve',
  },
  {
    id: 'l04',
    texto: 'quem mais provavelmente esqueceria o nome de alguém que acabou de conhecer?',
    energia: 'leve',
  },
  {
    id: 'l05',
    texto: 'quem mais provavelmente mandaria mensagem para a pessoa errada?',
    energia: 'leve',
  },
  {
    id: 'l06',
    texto: 'quem mais provavelmente compraria algo que nunca vai usar?',
    energia: 'leve',
  },
  {
    id: 'l07',
    texto: 'quem mais provavelmente se perderia mesmo com GPS ligado?',
    energia: 'leve',
  },
  {
    id: 'l08',
    texto: 'quem mais provavelmente viajaria sem planejar nada?',
    energia: 'leve',
  },
  {
    id: 'l09',
    texto: 'quem mais provavelmente falaria sem parar numa viagem de carro?',
    energia: 'leve',
  },
  {
    id: 'l10',
    texto: 'quem mais provavelmente ia esquecer o carregador em toda viagem?',
    energia: 'leve',
  },
  {
    id: 'l11',
    texto: 'quem mais provavelmente dormia antes da meia-noite numa festa?',
    energia: 'leve',
  },
  {
    id: 'l12',
    texto: 'quem mais provavelmente chegaria na casa do outro sem avisar?',
    energia: 'leve',
  },
  {
    id: 'l13',
    texto: 'quem mais provavelmente comeria a parte de todo mundo?',
    energia: 'leve',
  },
  {
    id: 'l14',
    texto: 'quem mais provavelmente tem o celular cheio de capturas de tela?',
    energia: 'leve',
  },
  {
    id: 'l15',
    texto: 'quem mais provavelmente trocaria de roupa três vezes antes de sair?',
    energia: 'leve',
  },
  {
    id: 'l16',
    texto: 'quem mais provavelmente ficaria falando de um série que ninguém mais assistiu?',
    energia: 'leve',
  },
  {
    id: 'l17',
    texto: 'quem mais provavelmente usaria um cupom de desconto numa data comemorativa?',
    energia: 'leve',
  },
  {
    id: 'l18',
    texto: 'quem mais provavelmente mandaria áudio de cinco minutos?',
    energia: 'leve',
  },
  {
    id: 'l19',
    texto: 'quem mais provavelmente ficaria na fila do banheiro mais longa?',
    energia: 'leve',
  },
  {
    id: 'l20',
    texto: 'quem mais provavelmente teria um apelido constrangedor que a família ainda usa?',
    energia: 'leve',
  },

  // ── Médio ──────────────────────────────────────────────────────────────────
  {
    id: 'm01',
    texto: 'quem mais provavelmente mentiria para não comparecer a um compromisso?',
    energia: 'medio',
  },
  {
    id: 'm02',
    texto: 'quem mais provavelmente passaria a noite inteira conversando com um desconhecido?',
    energia: 'medio',
  },
  {
    id: 'm03',
    texto: 'quem mais provavelmente choraria num filme de ação?',
    energia: 'medio',
  },
  {
    id: 'm04',
    texto: 'quem mais provavelmente diria "estou bem" quando claramente não está?',
    energia: 'medio',
  },
  {
    id: 'm05',
    texto: 'quem mais provavelmente nunca admite que errou primeiro?',
    energia: 'medio',
  },
  {
    id: 'm06',
    texto: 'quem mais provavelmente seria o primeiro a ir embora de uma festa?',
    energia: 'medio',
  },
  {
    id: 'm07',
    texto: 'quem mais provavelmente seria o último a ir embora de uma festa?',
    energia: 'medio',
  },
  {
    id: 'm08',
    texto: 'quem mais provavelmente guarda rancor por muito tempo sem falar nada?',
    energia: 'medio',
  },
  {
    id: 'm09',
    texto: 'quem mais provavelmente tomaria uma decisão enorme por impulso?',
    energia: 'medio',
  },
  {
    id: 'm10',
    texto: 'quem mais provavelmente mudaria o plano inteiro na última hora?',
    energia: 'medio',
  },
  {
    id: 'm11',
    texto: 'quem mais provavelmente fingiria não ter visto a mensagem?',
    energia: 'medio',
  },
  {
    id: 'm12',
    texto: 'quem mais provavelmente nunca retorna ligações?',
    energia: 'medio',
  },
  {
    id: 'm13',
    texto: 'quem mais provavelmente entraria em silêncio total depois de brigar?',
    energia: 'medio',
  },
  {
    id: 'm14',
    texto: 'quem mais provavelmente terminaria um relacionamento por mensagem?',
    energia: 'medio',
  },
  {
    id: 'm15',
    texto: 'quem mais provavelmente faria uma amizade nova e ignoraria todo mundo do grupo?',
    energia: 'medio',
  },
  {
    id: 'm16',
    texto: 'quem mais provavelmente publicaria uma foto do outro sem pedir permissão?',
    energia: 'medio',
  },
  {
    id: 'm17',
    texto: 'quem mais provavelmente guardaria um segredo de todo mundo por anos?',
    energia: 'medio',
  },
  {
    id: 'm18',
    texto: 'quem mais provavelmente chamaria a atenção de um estranho na rua?',
    energia: 'medio',
  },
  {
    id: 'm19',
    texto: 'quem mais provavelmente teria uma história inacreditável que ninguém sabe?',
    energia: 'medio',
  },
  {
    id: 'm20',
    texto: 'quem mais provavelmente tentaria resolver tudo sozinho antes de pedir ajuda?',
    energia: 'medio',
  },

  // ── Intenso (modo Sincero) ─────────────────────────────────────────────────
  {
    id: 'i01',
    texto: 'quem mais provavelmente nunca pede ajuda mesmo quando está precisando muito?',
    energia: 'intenso',
  },
  {
    id: 'i02',
    texto: 'quem mais provavelmente se apaixona pela pessoa mais complicada possível?',
    energia: 'intenso',
  },
  {
    id: 'i03',
    texto: 'quem mais provavelmente faria uma grande mudança de vida sem contar para ninguém?',
    energia: 'intenso',
  },
  {
    id: 'i04',
    texto: 'quem mais provavelmente revelaria um segredo do grupo sem querer?',
    energia: 'intenso',
  },
  {
    id: 'i05',
    texto: 'quem mais provavelmente está pensando em algo completamente diferente agora?',
    energia: 'intenso',
  },
  {
    id: 'i06',
    texto: 'quem mais provavelmente sabota algo bom antes que dê certo?',
    energia: 'intenso',
  },
  {
    id: 'i07',
    texto: 'quem mais provavelmente nunca esquece uma mágoa mesmo dizendo que esqueceu?',
    energia: 'intenso',
  },
  {
    id: 'i08',
    texto: 'quem mais provavelmente vai mudar completamente de vida nos próximos anos?',
    energia: 'intenso',
  },
  {
    id: 'i09',
    texto: 'quem mais provavelmente está se sentindo mais sozinho do que aparenta?',
    energia: 'intenso',
  },
  {
    id: 'i10',
    texto: 'quem mais provavelmente tem mais medo de ser feliz do que de falhar?',
    energia: 'intenso',
  },
];

export const TOTAL_PROMPTS = PROMPTS.length;
