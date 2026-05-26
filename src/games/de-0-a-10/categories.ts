// ─── De 0 a 10 — Pool de Categorias ─────────────────────────────────────────
//
// 22 categorias regulares (Tier S/A/B) + 2 adultas (+18).
//
// Cada categoria tem 3–5 perguntas específicas com âncoras de 0 e 10 embutidas.
// O engine sorteia uma pergunta por rodada — o grupo nunca vê a mesma formulação.
//
// Critérios de qualidade:
//   1. Âncoras claras: 0 e 10 são exemplos concretos e reconhecíveis
//   2. Escala emocional: todos do grupo sabem o que é "alto" e "baixo"
//   3. Revelação: a resposta conta algo real sobre quem está jogando

import type { Categoria, CategoriaId } from './types';

export const CATEGORIAS: ReadonlyArray<Categoria> = [
  // ── Tier S ─────────────────────────────────────────────────────────────────

  {
    id: 'filme',
    emoji: '🎬',
    nome: 'filme',
    tier: 'S',
    perguntas: [
      'um filme que te fez chorar — 0: não saiu uma lágrima, 10: foi o maior choro da sua vida',
      'um filme que te prendeu do começo ao fim — 0: dormiu no meio, 10: não conseguiu parar de pensar depois',
      'um filme que te assustou — 0: não sentiu nem um frio na barriga, 10: teve pesadelo depois',
      'um filme que você indicaria para alguém — 0: jamais recomendaria, 10: obrigaria todo mundo a assistir',
      'um filme pelo quanto ele representa a sua vida — 0: nenhuma semelhança, 10: foi feito sobre você',
    ],
  },

  {
    id: 'profissao',
    emoji: '💼',
    nome: 'profissão',
    tier: 'S',
    perguntas: [
      'uma profissão pelo quanto você seria bom nela — 0: seria um desastre completo, 10: nasceu pra isso',
      'uma profissão pelo quanto ela te daria prazer de exercer — 0: seria um martírio diário, 10: faria de graça e feliz',
      'uma profissão pelo quanto o salário médio dela te satisfaria — 0: passaria fome, 10: mais do que precisa',
      'uma profissão pelo prestígio que ela te daria — 0: ninguém te respeitaria, 10: todos te admirariam',
    ],
  },

  {
    id: 'animal',
    emoji: '🦊',
    nome: 'animal',
    tier: 'S',
    perguntas: [
      'um animal pelo quanto ele te representa — 0: nada a ver contigo, 10: é você em forma de bicho',
      'um animal pelo quanto você teria medo de encontrá-lo — 0: abraçaria sem pensar, 10: fugiria em pânico',
      'um animal pelo quanto você teria vontade de ter como pet — 0: jamais na sua casa, 10: já teria adotado',
      'um animal pelo quanto ele te fascina — 0: indiferente total, 10: ficaria horas só observando',
    ],
  },

  {
    id: 'sabor',
    emoji: '👅',
    nome: 'sabor',
    tier: 'S',
    perguntas: [
      'um sabor que define como você está se sentindo agora — 0: completamente insosso, 10: intensidade total',
      'um sabor pelo quanto ele te agrada — 0: dá vontade de cuspir, 10: poderia comer todo dia',
      'um sabor que representa seu estado de espírito essa semana — 0: amargo e difícil, 10: doce e fácil',
      'um sabor pelo quanto ele te conforta — 0: nenhum efeito em você, 10: muda seu humor na hora',
    ],
  },

  {
    id: 'bebida',
    emoji: '🥤',
    nome: 'bebida',
    tier: 'S',
    perguntas: [
      'uma bebida pelo quanto ela representa quem você é numa festa — 0: nada a ver com você, 10: te define completamente',
      'uma bebida pelo quanto você a aprecia — 0: não consegue engolir, 10: bebe com todo o prazer',
      'uma bebida pelo quanto ela combina com seu humor agora — 0: última coisa que beberia, 10: exatamente o que quer',
      'uma bebida pelo quanto ela evoca uma memória sua — 0: não lembra de nada com ela, 10: traz uma memória fortíssima',
    ],
  },

  {
    id: 'red_flag',
    emoji: '🚩',
    nome: 'red flag',
    tier: 'S',
    perguntas: [
      'uma red flag em parceiro(a) — 0: não te incomodaria nada, 10: seria motivo imediato de término',
      'uma red flag que você mesmo já teve — 0: nunca foi o seu caso, 10: era 100% você',
      'uma red flag que te atrai mesmo sabendo que é problema — 0: jamais cairia nisso, 10: já caiu várias vezes',
      'uma red flag pelo quanto ela destruiria um relacionamento — 0: inofensiva, sem impacto, 10: fim na hora',
    ],
  },

  {
    id: 'ex',
    emoji: '💔',
    nome: 'ex',
    tier: 'S',
    perguntas: [
      'um tipo de ex — 0: o que você mal lembra, 10: o que ainda ocupa espaço na sua cabeça',
      'um comportamento de ex — 0: nunca te fizeram isso, 10: viveu isso na carne',
      'uma característica de ex — 0: nunca toparia de novo, 10: caíria no mesmo tipo amanhã',
      'um tipo de término — 0: nunca passou por isso, 10: foi exatamente assim que aconteceu com você',
    ],
  },

  // ── Tier A ─────────────────────────────────────────────────────────────────

  {
    id: 'comida',
    emoji: '🍕',
    nome: 'comida',
    tier: 'A',
    perguntas: [
      'uma comida pelo quanto ela te conforta — 0: come por pura obrigação, 10: pede toda semana',
      'uma comida pelo quanto ela te representa — 0: nada a ver com você, 10: é sua comida definitiva',
      'uma comida pelo quanto ela evoca uma memória afetiva — 0: nenhuma memória com ela, 10: te leva direto pra infância',
      'uma comida pelo quanto ela combina com seu humor agora — 0: última coisa que comeria, 10: exatamente o que quer',
    ],
  },

  {
    id: 'serie',
    emoji: '📺',
    nome: 'série',
    tier: 'A',
    perguntas: [
      'uma série pelo quanto ela te prendeu — 0: desistiu no primeiro episódio, 10: assistiu tudo numa semana',
      'uma série pelo quanto ela te afetou emocionalmente — 0: passou em branco, 10: ficou dias pensando',
      'uma série que representa sua vida agora — 0: nenhuma semelhança, 10: é o seu roteiro',
      'uma série pelo quanto você já indicou pra alguém — 0: nunca tocou no assunto, 10: obriga todo mundo a assistir',
    ],
  },

  {
    id: 'superpoder',
    emoji: '⚡',
    nome: 'superpoder',
    tier: 'A',
    perguntas: [
      'um superpoder pelo quanto você precisaria dele na sua vida — 0: seria inútil pra você, 10: resolveria todos os seus problemas',
      'um superpoder pelo quanto você abusaria dele — 0: usaria com muita moderação, 10: usaria pra tudo sem pensar duas vezes',
      'um superpoder pelo medo que teria de ele revelar algo sobre você — 0: sem problema algum, 10: seria sua ruína',
      'um superpoder pelo quanto ele te tentaria a fazer algo errado — 0: ficaria tranquilo, 10: já estaria nas notícias',
    ],
  },

  {
    id: 'emoji',
    emoji: '😶',
    nome: 'emoji',
    tier: 'A',
    perguntas: [
      'um emoji que representa como você chegou hoje — 0: nada a ver, 10: é exatamente você agora',
      'um emoji que define sua semana — 0: não traduz em nada, 10: foi esse do começo ao fim',
      'um emoji que resume seu relacionamento com a vida adulta — 0: não te representa, 10: é praticamente sua identidade',
      'um emoji que você mais manda nas suas conversas — 0: nunca usou, 10: usa em praticamente toda mensagem',
    ],
  },

  {
    id: 'cidade',
    emoji: '🌆',
    nome: 'cidade',
    tier: 'A',
    perguntas: [
      'uma cidade pelo quanto você quer morar lá — 0: nem de visita, 10: largaria tudo amanhã',
      'uma cidade pelo quanto ela combina com sua personalidade — 0: seria completamente deslocado, 10: nasceu na cidade errada',
      'uma cidade pelo quanto ela te assusta — 0: iria tranquilo sem pensar, 10: só de pensar dá ansiedade',
      'uma cidade por uma memória ou história que você tem com ela — 0: não tem nenhuma conexão, 10: mudou sua vida',
    ],
  },

  {
    id: 'cantor',
    emoji: '🎤',
    nome: 'cantor',
    tier: 'A',
    perguntas: [
      'um cantor ou banda pelo quanto você foi ou iria ao show — 0: nunca pagaria ingresso, 10: já foi ou iria amanhã',
      'um cantor que representa um momento da sua vida — 0: sem conexão nenhuma, 10: a trilha daquele período',
      'um cantor pelo quanto as músicas dele falam sobre você — 0: não te representa, 10: parece que escreve pra você',
      'um cantor que você teria vergonha de admitir que ouve — 0: pode declarar em praça pública, 10: segredo de estimação',
    ],
  },

  {
    id: 'cor',
    emoji: '🎨',
    nome: 'cor',
    tier: 'A',
    perguntas: [
      'uma cor que representa seu estado emocional agora — 0: não tem nada a ver com o que você sente, 10: é exatamente a cor do que está sentindo',
      'uma cor pelo quanto ela aparece na sua vida — 0: praticamente inexistente no seu dia a dia, 10: está em tudo que você usa',
      'uma cor pelo quanto ela te incomoda — 0: completamente indiferente, 10: te afeta fisicamente de tão ruim',
      'uma cor pelo quanto ela te acalma — 0: nenhum efeito em você, 10: muda seu humor instantaneamente',
    ],
  },

  {
    id: 'frase',
    emoji: '💬',
    nome: 'frase',
    tier: 'A',
    perguntas: [
      'uma frase que você repete pra si mesmo — 0: nunca passou pela sua cabeça, 10: é seu mantra diário',
      'uma frase que define como você enfrenta problemas — 0: nada a ver com você, 10: é exatamente sua filosofia',
      'uma frase que alguém disse pra você e que não saiu da sua cabeça — 0: não lembra de nenhuma assim, 10: ainda ouve na cabeça',
      'uma frase que você gostaria que dissessem pra você — 0: seria indiferente ouvir, 10: precisava muito ouvir isso',
    ],
  },

  {
    id: 'viagem',
    emoji: '✈️',
    nome: 'destino',
    tier: 'A',
    perguntas: [
      'um destino pelo quanto você quer ir — 0: não está nos planos nem no sonho, 10: é o primeiro da sua lista',
      'um destino pelo quanto ele combina com quem você é — 0: seria completamente deslocado, 10: vai sentir que chegou em casa',
      'um destino pelo quanto ele te assusta — 0: vai tranquilo sem pensar, 10: só de pensar trava de ansiedade',
      'um destino por uma memória ou história que você tem com ele — 0: não tem nenhuma conexão, 10: mudou sua vida',
    ],
  },

  {
    id: 'marca',
    emoji: '🏷️',
    nome: 'marca',
    tier: 'A',
    perguntas: [
      'uma marca pelo quanto ela faz parte da sua identidade — 0: usaria com vergonha, 10: é praticamente quem você é',
      'uma marca pelo quanto você a confia — 0: não compraria de jeito nenhum, 10: fiel há anos sem arrependimento',
      'uma marca pelo quanto ela simboliza algo que você almeja — 0: sem nenhuma aspiração, 10: representa exatamente onde quer chegar',
      'uma marca pelo quanto ela aparece na sua vida — 0: nunca usou, 10: está em pelo menos 5 coisas que usa hoje',
    ],
  },

  // ── Tier B ─────────────────────────────────────────────────────────────────

  {
    id: 'dia_da_semana',
    emoji: '📅',
    nome: 'dia da semana',
    tier: 'B',
    perguntas: [
      'um dia da semana pelo quanto ele representa como você está se sentindo — 0: no fundo do poço (segunda), 10: no auge (sexta à noite)',
      'um dia da semana pelo quanto você gosta dele — 0: o dia que você mais odeia na semana, 10: seu favorito absoluto',
      'um dia da semana pelo quanto ele combina com sua energia hoje — 0: você está em modo segunda de manhã, 10: está em modo sábado à noite',
      'um dia da semana pela associação que ele evoca — 0: nenhuma memória boa, 10: lembra algo que você ama',
    ],
  },

  {
    id: 'esporte',
    emoji: '⚽',
    nome: 'esporte',
    tier: 'B',
    perguntas: [
      'um esporte pelo quanto você o praticaria com prazer — 0: jamais colocaria o pé, 10: jogaria todo dia',
      'um esporte pelo quanto ele te entretém assistindo — 0: troca de canal na hora, 10: assiste sem respirar',
      'um esporte pelo quanto você seria bom nele — 0: seria uma vergonha pública, 10: poderia ter ido longe',
      'um esporte pelo quanto ele representa sua personalidade — 0: nada a ver contigo, 10: é você em movimento',
    ],
  },

  {
    id: 'app',
    emoji: '📱',
    nome: 'app',
    tier: 'B',
    perguntas: [
      'um app pelo quanto ele domina a sua vida — 0: praticamente não usa, 10: é o primeiro que abre de manhã',
      'um app pelo quanto você sentiria falta se ele sumisse — 0: nem notaria, 10: seria uma crise pessoal',
      'um app pelo quanto ele te trouxe coisas boas — 0: trouxe mais malefício que benefício, 10: mudou sua vida pra melhor',
      'um app que você tem vergonha do tempo que passa nele — 0: sem nenhum motivo de vergonha, 10: prefere não mostrar o tempo de uso',
    ],
  },

  {
    id: 'famoso',
    emoji: '⭐',
    nome: 'famoso',
    tier: 'B',
    perguntas: [
      'um famoso pelo quanto você o admira — 0: indiferente ou até antipatia, 10: genuína admiração',
      'um famoso pelo quanto você gostaria de ter a vida dele — 0: nem trocaria de jeito nenhum, 10: assinaria na hora',
      'um famoso pelo quanto você torce que ele dê certo — 0: não liga nem um pouco, 10: torce de coração',
      'um famoso pelo quanto o comportamento dele te incomoda — 0: passa em branco, 10: sobe a pressão de pensar',
    ],
  },

  {
    id: 'clima',
    emoji: '⛅',
    nome: 'clima',
    tier: 'B',
    perguntas: [
      'um tipo de clima pelo quanto ele afeta seu humor — 0: totalmente indiferente, 10: muda completamente como você se sente',
      'um tipo de clima que representa como você está por dentro agora — 0: nada a ver com o que sente, 10: é exatamente o que você sente',
      'um tipo de clima que você preferiria que fosse hoje — 0: é o oposto do que quer, 10: exatamente isso',
      'um tipo de clima pelo quanto ele te conforta — 0: nenhum conforto, zero, 10: faz você se sentir completamente em casa',
    ],
  },

  // ── +18 (apenas com incluirMais18 ativo) ──────────────────────────────────

  {
    id: 'fantasia',
    emoji: '🌙',
    nome: 'fantasia',
    tier: 'A',
    mais18: true,
    perguntas: [
      'uma fantasia pelo quanto você nunca admitiria publicamente — 0: pode contar em voz alta agora, 10: leva pro túmulo',
      'uma fantasia pelo quanto ela diz algo verdadeiro sobre você — 0: é só besteira passageira, 10: revela muito de quem você é',
      'uma fantasia que você nunca teria coragem de realizar — 0: já realizou ou tentaria amanhã, 10: impossível de executar',
      'uma fantasia pelo quanto ela está longe do que as pessoas esperariam de você — 0: exatamente o que esperariam, 10: ninguém chutaria nunca',
    ],
  },

  {
    id: 'pecado',
    emoji: '😈',
    nome: 'pecado favorito',
    tier: 'A',
    mais18: true,
    perguntas: [
      'um pecado pelo quanto você o pratica sem culpa — 0: sente muita culpa sempre, 10: sem nenhum remorso',
      'um pecado que mais te define nas últimas semanas — 0: nem chegou perto disso, 10: praticou com orgulho',
      'um pecado pelo quanto você julgaria alguém por cometê-lo — 0: cada um com o seu, sem julgamento, 10: já julgou e condena',
      'um pecado pelo quanto ele te causa prazer — 0: nenhuma satisfação real, 10: uma das melhores coisas da vida',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCategoria(id: CategoriaId): Categoria {
  const cat = CATEGORIAS.find((c) => c.id === id);
  if (!cat) throw new Error(`Categoria não encontrada: ${id}`);
  return cat;
}

// Pool filtrado por tier — usado na seleção
export function getCategoriasPorTier(
  tier: Categoria['tier'],
  incluirMais18: boolean,
): Categoria[] {
  return CATEGORIAS.filter(
    (c) => c.tier === tier && (incluirMais18 || !c.mais18),
  );
}

/** Sorteia uma pergunta aleatória do pool de perguntas de uma categoria. */
export function sortearPergunta(categoria: Categoria): string {
  const { perguntas } = categoria;
  return perguntas[Math.floor(Math.random() * perguntas.length)]!;
}
