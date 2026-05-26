// ─── Quem na Sala? — Editorial de Perguntas ──────────────────────────────────
//
// 100 perguntas em 5 categorias.
// Formato: "Quem na sala..." + complemento.
// Curadoria: específico, reconhecível, sem ser cruel gratuito.
// Cada pergunta gera revelação social genuína — não humilhação.
//
// Categorias:
//   provavel  (25) — situações prováveis, comportamentos
//   elogio    (20) — qualidades reais do grupo
//   dinamica  (20) — como o grupo funciona junto
//   exposicao (20) — julgamentos honestos, um pouco pesados
//   caos      (15) — perguntas que desestabilizam

import type {
  CartaQNS,
  CategoriaQNS,
  CategoriaQNSId,
  IntensidadeQNS,
} from './types';

export const CATEGORIAS_QNS: CategoriaQNS[] = [
  {
    id: 'provavel',
    nome: 'Mais Provável',
    descricao: 'quem provavelmente faria isso',
    emoji: '🎯',
    temMais18: false,
  },
  {
    id: 'elogio',
    nome: 'Elogios',
    descricao: 'qualidades genuínas do grupo',
    emoji: '✨',
    temMais18: false,
  },
  {
    id: 'dinamica',
    nome: 'Dinâmica do Grupo',
    descricao: 'como todo mundo funciona junto',
    emoji: '🔄',
    temMais18: false,
  },
  {
    id: 'exposicao',
    nome: 'Exposição',
    descricao: 'opiniões honestas sobre comportamento',
    emoji: '👁️',
    temMais18: false,
  },
  {
    id: 'caos',
    nome: 'Caos',
    descricao: 'perguntas que ninguém esperava',
    emoji: '🌪️',
    temMais18: true,
  },
];

export const CARTAS_QNS: CartaQNS[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PROVÁVEL (25 cartas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'pr01',
    complemento: '... chegaria mais atrasado em algo importante?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr02',
    complemento: '... provavelmente não sabe cozinhar mas finge que sabe?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr03',
    complemento: '... seria o último a acordar numa viagem em grupo?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr04',
    complemento: '... esqueceria a carteira no dia de pagar a conta?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr05',
    complemento: '... faria uma tatuagem por impulso essa semana?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr06',
    complemento: '... desistiria de uma dieta no primeiro dia?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr07',
    complemento:
      '... mandaria mensagem errada pro grupo errado com mais frequência?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr08',
    complemento: '... ficaria acordado às 4 da manhã por motivo idiota?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr09',
    complemento: '... seria o primeiro a chorar num filme?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr10',
    complemento: '... organizaria uma viagem e cancelaria na última hora?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr11',
    complemento:
      '... compraria algo caro num impulso e se arrependeria no dia seguinte?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr12',
    complemento: '... stalkearia alguém no Instagram por mais de uma hora?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr13',
    complemento:
      '... ficaria no celular enquanto alguém conta uma história longa?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr14',
    complemento: '... aceitaria fazer algo constrangedor por dinheiro?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'pr15',
    complemento: '... terminaria um relacionamento por mensagem de texto?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'pr16',
    complemento: '... viveria fora do Brasil primeiro?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'pr17',
    complemento: '... ficaria famoso — e por quê provavelmente o errado?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'pr18',
    complemento: '... mandaria uma mensagem picante para a conversa errada?',
    categoria: 'provavel',
    intensidade: 'caotico',
    mais18: true,
    fase: 'pico',
  },
  {
    id: 'pr19',
    complemento:
      '... seria visto dançando sozinho em casa por alguém inesperado?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr20',
    complemento:
      '... se arrependeria mais rápido depois de tomar uma decisão grande?',
    categoria: 'provavel',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'pr21',
    complemento: '... iria a uma festa e ficaria no canto o tempo todo?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr22',
    complemento: '... toparia comer algo bizarro por desafio?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr23',
    complemento:
      '... choraria de rir numa situação em que era pra estar sério?',
    categoria: 'provavel',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'pr24',
    complemento: '... inventaria uma desculpa mais elaborada do que precisava?',
    categoria: 'provavel',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'pr25',
    complemento:
      '... se tornaria o caçula mimado do grupo numa situação de pressão?',
    categoria: 'provavel',
    intensidade: 'pesado',
    mais18: false,
    fase: 'release',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELOGIO (20 cartas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'el01',
    complemento: '... todo mundo chamaria primeiro em caso de emergência real?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'el02',
    complemento: '... você confiaria pra guardar seu maior segredo?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'el03',
    complemento: '... faria o discurso de casamento mais emocionante?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'el04',
    complemento: '... seria o melhor chefe que você já teria?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el05',
    complemento:
      '... daria o conselho mais honesto sem precisar que você pedisse?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el06',
    complemento:
      '... ainda vai longe e todo mundo vê isso, mas ela não enxerga ainda?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el07',
    complemento: '... organizaria a melhor viagem em grupo?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el08',
    complemento: '... faz o ambiente ficar mais leve só de estar presente?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'el09',
    complemento:
      '... você nunca ouviu reclamar de alguém por detrás das costas?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el10',
    complemento:
      '... seria o melhor parceiro num roadtrip de emergência às 2 da manhã?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el11',
    complemento: '... você pegaria a culpa junto sem perguntar o motivo?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'el12',
    complemento: '... provavelmente é mais corajoso do que deixa parecer?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'el13',
    complemento: '... daria o melhor abraço numa situação difícil?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'el14',
    complemento:
      '... você ligaria às 3 da manhã com um problema e saberia que vai atender?',
    categoria: 'elogio',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'el15',
    complemento:
      '... provavelmente vai ser o mais bem-sucedido daqui a 10 anos?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'el16',
    complemento:
      '... surpreende o grupo toda vez que revela algo novo sobre si?',
    categoria: 'elogio',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'el17',
    complemento:
      '... é o tipo de pessoa que você quer por perto quando tudo dá errado?',
    categoria: 'elogio',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'el18',
    complemento:
      '... faz o grupo inteiro se sentir bem-vindo sem precisar esforçar?',
    categoria: 'elogio',
    intensidade: 'leve',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'el19',
    complemento:
      '... tem a inteligência emocional mais silenciosa e mais forte do grupo?',
    categoria: 'elogio',
    intensidade: 'pesado',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'el20',
    complemento:
      '... você nunca viu perder a cabeça — mesmo quando tinha todo o direito?',
    categoria: 'elogio',
    intensidade: 'pesado',
    mais18: false,
    fase: 'release',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DINÂMICA DO GRUPO (20 cartas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'di01',
    complemento: '... lidera o grupo sem nunca ter pedido pra liderar?',
    categoria: 'dinamica',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'di02',
    complemento: '... sempre aparece quando o grupo precisa, sem ser chamado?',
    categoria: 'dinamica',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'di03',
    complemento: '... é o primeiro a animar qualquer situação parada?',
    categoria: 'dinamica',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'di04',
    complemento: '... aparece depois de semanas sumido com a melhor história?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di05',
    complemento: '... sempre tem a melhor sugestão mas fala por último?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di06',
    complemento: '... é o que mantém o grupo unido sem que ninguém perceba?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di07',
    complemento:
      '... sairia mais cedo do rolê sem conseguir se despedir de todo mundo?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di08',
    complemento: '... conhece mais fofoca do grupo do que admite?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di09',
    complemento:
      '... todos já pediram conselho mas nunca verbalizaram que seguiram?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'di10',
    complemento: '... faz todo mundo rir mas raramente é o centro da atenção?',
    categoria: 'dinamica',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di11',
    complemento: '... vai durar mais tempo nesse grupo do que todos pensam?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'di12',
    complemento: '... vira assunto carinhoso quando não está presente?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'di13',
    complemento: '... faria mais falta se faltasse justamente hoje?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'di14',
    complemento: '... sempre tem uma história que encerra qualquer discussão?',
    categoria: 'dinamica',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'di15',
    complemento: '... ainda tem histórias que surpreenderiam todo mundo aqui?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'di16',
    complemento:
      '... lembraria por mais tempo de uma brincadeira que passou do ponto?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'di17',
    complemento: '... une pessoas que nunca se encontrariam sozinhas?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'di18',
    complemento: '... será lembrado daqui a 10 anos por algo inesperado?',
    categoria: 'dinamica',
    intensidade: 'social',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'di19',
    complemento: '... é melhor em ouvir do que em pedir colo?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'di20',
    complemento:
      '... o grupo inteiro mudou de opinião sobre ela ao longo do tempo — pra melhor?',
    categoria: 'dinamica',
    intensidade: 'pesado',
    mais18: false,
    fase: 'release',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPOSIÇÃO (20 cartas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ex01',
    complemento:
      '... defenderia uma opinião por orgulho mesmo depois de mudar de ideia?',
    categoria: 'exposicao',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ex02',
    complemento: '... inventaria uma desculpa elaborada para cancelar um rolê?',
    categoria: 'exposicao',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ex03',
    complemento: '... age diferente dependendo de quem está por perto?',
    categoria: 'exposicao',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ex04',
    complemento:
      '... surpreenderia mais se contasse uma história que ninguém conhece?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex05',
    complemento:
      '... faz mais pelos outros do que recebe de volta — e não diz nada?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex06',
    complemento: '... parece mais seguro do que realmente se sente por dentro?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex07',
    complemento:
      '... escuta os problemas de todo mundo e raramente fala dos próprios?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex08',
    complemento:
      '... você conhece há mais tempo mas sente que conhece menos do que devia?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex09',
    complemento: '... provavelmente teve uma fase que ninguém aqui sabe?',
    categoria: 'exposicao',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ex10',
    complemento: '... tem mais histórias boas do que costuma contar?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex11',
    complemento: '... o grupo inteiro protege sem que ela peça proteção?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex12',
    complemento: '... seria a última a pedir ajuda mesmo precisando muito?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex13',
    complemento:
      '... provavelmente sabe mais sobre todo mundo do que faz parecer?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex14',
    complemento:
      '... demoraria mais para voltar a confiar depois de uma mancada?',
    categoria: 'exposicao',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex15',
    complemento:
      '... consegue disfarçar melhor quando não está curtindo um rolê?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex16',
    complemento: '... dá o melhor de si quando ninguém está olhando?',
    categoria: 'exposicao',
    intensidade: 'social',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'ex17',
    complemento: '... o grupo subestima e não deveria?',
    categoria: 'exposicao',
    intensidade: 'pesado',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'ex18',
    complemento:
      '... seria melhor em resumir cada pessoa do grupo em uma frase?',
    categoria: 'exposicao',
    intensidade: 'caotico',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'ex19',
    complemento:
      '... traria uma novidade que deixaria a roda falando a noite inteira?',
    categoria: 'exposicao',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ex20',
    complemento:
      '... costuma ter a opinião mais inesperada quando resolve falar?',
    categoria: 'exposicao',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CAOS (15 cartas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ca01',
    complemento: '... sobreviveria mais tempo numa ilha deserta?',
    categoria: 'caos',
    intensidade: 'leve',
    mais18: false,
    fase: 'aquecimento',
  },
  {
    id: 'ca02',
    complemento: '... conseguiria enganar um detector de mentiras?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ca03',
    complemento:
      '... seria o vilão num filme de suspense — e todo mundo acreditaria?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ca04',
    complemento: '... protagonizaria o meme mais constrangedor do ano?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ca05',
    complemento:
      '... casaria em Las Vegas com alguém que mal conhece depois de uma noite?',
    categoria: 'caos',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca06',
    complemento:
      '... toparia trocar de vida com alguém do grupo por uma semana?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca07',
    complemento: '... seria expulso de um grupo de WhatsApp por falar demais?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca08',
    complemento:
      '... viraria influencer e teria mais seguidores do que imagina?',
    categoria: 'caos',
    intensidade: 'leve',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ca09',
    complemento: '... faria uma confissão pública que quebraria a internet?',
    categoria: 'caos',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca10',
    complemento: '... viraria o vizinho mais memorável do prédio?',
    categoria: 'caos',
    intensidade: 'pesado',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca11',
    complemento:
      '... levaria um cargo inventado de síndico da festa a sério demais?',
    categoria: 'caos',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca12',
    complemento:
      '... desapareceria de um grupo e voltaria meses depois como se nada tivesse acontecido?',
    categoria: 'caos',
    intensidade: 'caotico',
    mais18: false,
    fase: 'pico',
  },
  {
    id: 'ca13',
    complemento: '... você colocaria no Survivor e apostaria que ganhava?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'subida',
  },
  {
    id: 'ca14',
    complemento:
      '... seria o primeiro a virar celebridade e o último a agir igual depois?',
    categoria: 'caos',
    intensidade: 'social',
    mais18: false,
    fase: 'release',
  },
  {
    id: 'ca15',
    complemento:
      '... ganharia um reality do grupo só por saber construir alianças?',
    categoria: 'caos',
    intensidade: 'caotico',
    mais18: false,
    fase: 'release',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCategoria(id: CategoriaQNSId): CategoriaQNS {
  return CATEGORIAS_QNS.find((c) => c.id === id) ?? CATEGORIAS_QNS[0]!;
}

export function pesoIntensidade(i: IntensidadeQNS): number {
  const pesos: Record<IntensidadeQNS, number> = {
    leve: 1,
    social: 2,
    pesado: 3,
    caotico: 4,
  };
  return pesos[i];
}
