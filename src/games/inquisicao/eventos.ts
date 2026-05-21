/**
 * INQUISIÇÃO — BANCO EMOCIONAL DE EVENTOS
 *
 * Fonte canônica de todos os textos exibidos como eventos durante a partida.
 * Importado por socialEvents.ts para seleção e entrega; importado pela UI
 * para preview e documentação interna.
 *
 * ─── Filosofia editorial ──────────────────────────────────────────────────────
 *
 * Cada evento deve passar três testes antes de entrar neste banco:
 *
 *   TESTE DO OLHAR — alguém vai olhar pro lado ao ler isso?
 *   TESTE DO SILÊNCIO — isso vai calar alguém que estava falando?
 *   TESTE DA PARANOIA — isso vai fazer alguém reinterpretar algo que aconteceu?
 *
 * Regras absolutas:
 *   ✗ Nunca nomear jogador
 *   ✗ Nunca resolver ambiguidade
 *   ✗ Nunca instruir como regra de sistema
 *   ✗ Nunca usar linguagem de jogo (rodada, turno, papel, fase, ponto)
 *   ✗ Nunca ultrapassar 7 palavras
 *   ✓ Sempre parecer observação humana, não mecânica
 *   ✓ Sempre funcionar em ambos os lados (inocente E corrompido podem se sentir atingidos)
 *
 * ─── Estrutura do banco ───────────────────────────────────────────────────────
 *
 *   BANCO_PUBLICO  — 24 eventos, exibidos a todos simultaneamente
 *     suspeita       (8)  — paranoia difusa, sem alvo definido
 *     corrupcao      (4)  — falsos positivos que simulam contaminação
 *     pressao_social (6)  — força ação onde havia hesitação
 *     caos_social    (6)  — descreve a deterioração do grupo
 *
 *   BANCO_PRIVADO  — 6 eventos, entregues a um único jogador
 *     informacao_parcial (6) — sempre em segunda pessoa, sempre ambíguos
 *
 * ─── Relação com socialEvents.ts ────────────────────────────────────────────
 *
 * Este arquivo é exclusivamente dados — sem lógica de seleção.
 * socialEvents.ts é o camada de seleção — sem dados inline.
 *
 * Migração planejada: socialEvents.ts passará a importar deste banco.
 * Por enquanto os dois coexistem — os 30 eventos aqui NÃO se repetem
 * nos 43 de socialEvents.ts.
 */

import type { CategoriaEvento } from '@/games/inquisicao/types';

// ─────────────────────────────────────────────────────────────────────────────
// §1  TIPOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raridade controla a frequência de aparição via peso na seleção aleatória.
 *
 *   comum    — peso 5 — tom de fundo, cria ansiedade cotidiana
 *   incomum  — peso 2 — específico, altera dinâmica da conversa
 *   raro     — peso 1 — máximo impacto, guardado para quando o grupo já está tenso
 */
export type RaridadeEvento = 'comum' | 'incomum' | 'raro';

/**
 * Template de evento público — base para EventoPublico em runtime.
 *
 * A diferença entre Template e EventoPublico (types.ts):
 *   Template   — entidade do banco, sem loop/timestamp, design time
 *   EventoPublico — instância runtime com id dinâmico, loop e timestamp
 */
export interface TemplateEventoPublico {
  /** ID único e estável. Formato: `{categoria-curta}-{slug}`. */
  readonly id: string;

  /** Categoria emocional. 'informacao_parcial' NUNCA aparece em templates públicos. */
  readonly categoria: Exclude<CategoriaEvento, 'informacao_parcial'>;

  /**
   * Texto exibido. Regras editoriais:
   *   — Sempre em minúsculas (jamais capitalizar)
   *   — Máximo 7 palavras absolutas
   *   — Ambíguo: inocente e corrompido se sentem atingidos
   *   — Observação social, nunca instrução de sistema
   */
  readonly texto: string;

  readonly raridade: RaridadeEvento;

  /**
   * Loop mínimo para elegibilidade.
   * 1 = disponível desde o primeiro loop (sem contexto necessário).
   * 2 = requer ao menos um ciclo social estabelecido.
   */
  readonly loopMinimo: number;
}

/**
 * Template de evento privado — base para EventoPrivado em runtime.
 *
 * Sempre entregue a um único jogador, em segunda pessoa ("você").
 * Categoria sempre 'informacao_parcial'.
 */
export interface TemplateEventoPrivado {
  readonly id: string;
  readonly categoria: 'informacao_parcial';

  /**
   * Texto em segunda pessoa. Regras adicionais:
   *   — Começa com "você" ou "seus/suas" (endereçado diretamente)
   *   — Valida suspeita sem confirmar nada
   *   — Deve funcionar tanto se for verdade quanto se for mentira
   */
  readonly texto: string;

  readonly raridade: RaridadeEvento;
  readonly loopMinimo: number;
}

/**
 * Frase exibida publicamente após a resolução da fase noturna.
 *
 * Regras editoriais (adicionais às globais):
 *   — Nunca descreve o que aconteceu (eliminação? corrupção? nada?)
 *   — Funciona nos três cenários: nada / eliminação / corrupção
 *   — Tom: manhã seguinte — algo passou, não se sabe o quê
 *   — NÃO é: terror, horror, fantasia, possessão, jumpscare
 *   — É: desconforto humano, transformação silenciosa, dread cotidiano
 *
 * peso controla a frequência de seleção ponderada.
 * Seleção anti-repetição: nunca a mesma frase duas noites consecutivas.
 */
export interface FraseNoite {
  readonly texto: string;
  readonly peso: number;
}

/**
 * Mensagem privada entregue ao jogador imediatamente após ser corrompido.
 * Exibida apenas uma vez, em /privados/{id}/mensagemPrivada.
 *
 * Regras editoriais:
 *   — Segunda pessoa obrigatória ("você")
 *   — Máximo 7 palavras
 *   — Tom: ajuste interno, não revelação dramática
 *   — NÃO é: "você foi corrompido", "bem-vindo ao lado sombrio"
 *   — É: a percepção de que algo em si mesmo mudou, sem nomear o quê
 *   — Funciona se o jogador aceitar a mudança E se resistir internamente
 *
 * peso controla a frequência de seleção ponderada.
 * Cada jogador recebe no máximo uma por partida.
 */
export interface MensagemCorrupcao {
  readonly texto: string;
  readonly peso: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  SUSPEITA (8 eventos públicos)
//
// Objetivo: criar paranoia difusa.
// Cada evento deve fazer alguém olhar para o lado sem saber exatamente para onde.
// Nunca descreve identidade — apenas comportamento, timing ou padrão.
//
// Regra editorial: o observador do evento é o jogo; o observado é anônimo.
// ─────────────────────────────────────────────────────────────────────────────

const SUSPEITA: readonly TemplateEventoPublico[] = [

  {
    // Timing de fala. Quem parou antes de responder? Por quê agora?
    id: 'sus-pausa',
    categoria: 'suspeita',
    texto: 'uma pausa durou longa demais.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Pergunta direta feita — ficou sem resposta. Quem evitou e por quê?
    id: 'sus-pergunta',
    categoria: 'suspeita',
    texto: 'a pergunta direta ficou sem resposta.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Narrativa inconsistente. Quem elaborou demais uma coisa simples?
    // Over-explanation é sinal clássico de encobrimento.
    id: 'sus-detalhes',
    categoria: 'suspeita',
    texto: 'detalhes demais num relato simples.',
    raridade: 'incomum',
    loopMinimo: 1,
  },

  {
    // Alguma versão da história tem ponta solta. Quem narrou?
    id: 'sus-pontas',
    categoria: 'suspeita',
    texto: 'a história tem pontas soltas.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // O sorriso delatou o momento. Desconforto? Alívio? Prazer em ver alguém errar?
    id: 'sus-sorriso',
    categoria: 'suspeita',
    texto: 'um sorriso saiu fora de hora.',
    raridade: 'incomum',
    loopMinimo: 1,
  },

  {
    // Mudança de posição rápida demais implica que a posição original era encenada.
    id: 'sus-rapida',
    categoria: 'suspeita',
    texto: 'alguém mudou de opinião rápido demais.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Uma escolha foi tomada antes da conversa começar. Pré-arranjo?
    id: 'sus-escolheu',
    categoria: 'suspeita',
    texto: 'alguém já escolheu antes da hora.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // Defesa antecipada implica prévia consciência da acusação.
    // "A defesa veio antes da acusação" é estruturalmente impossível se não há culpa.
    id: 'sus-defesa',
    categoria: 'suspeita',
    texto: 'a defesa veio antes da acusação.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // Calar no momento exato é mais eloquente do que falar.
    // Loop 2+: o grupo já sabe quando deveriam falar. O silêncio no momento certo é suspeito.
    id: 'sus-calado-hora',
    categoria: 'suspeita',
    texto: 'alguém ficou calado na hora exata.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Recalcular antes de falar implica que a resposta espontânea teria sido diferente.
    // O observador não sabe o que foi filtrado — mas sente que algo foi.
    id: 'sus-recalculou',
    categoria: 'suspeita',
    texto: 'alguém recalculou antes de responder.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Narrativa revisada sem motivo declarado: o que mudou entre as duas versões?
    // Loop 3: o grupo tem histórico suficiente para detectar inconsistência.
    id: 'sus-versao-mudou',
    categoria: 'suspeita',
    texto: 'a versão mudou sem que ninguém pedisse.',
    raridade: 'incomum',
    loopMinimo: 3,
  },

  {
    // Saber algo antes de saber: pré-conhecimento é o sinal mais condenador.
    // Funciona em ambos os lados: o inocente que "sabia" também sente o peso.
    id: 'sus-antes-saber',
    categoria: 'suspeita',
    texto: 'alguém soube antes de poder saber.',
    raridade: 'raro',
    loopMinimo: 3,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// §3  CORRUPÇÃO (4 eventos públicos)
//
// Objetivo: simular que algo invisível aconteceu — mesmo quando não aconteceu.
// Estes são os principais FALSOS POSITIVOS do banco.
// Um evento de corrupção pode aparecer em qualquer loop, inclusive quando
// nenhuma conversão ocorreu. O efeito desejado: o grupo vira o grupo contra si.
//
// ⚠ "a influência se espalhou." É PROIBIDA em mensagens pós-noite (/noiteControle)
//   mas PERMITIDA aqui (fase de conversa) — seu valor emocional está em ser
//   potencialmente falso.
// ─────────────────────────────────────────────────────────────────────────────

const CORRUPCAO: readonly TemplateEventoPublico[] = [

  {
    // O sinal clássico. Pode ser falso positivo — esse é o ponto.
    // Quando verdadeiro: quem converteu? Quando falso: parece que alguém sabe algo.
    id: 'cor-influencia',
    categoria: 'corrupcao',
    texto: 'a influência se espalhou.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Mudança estrutural sem fonte identificável.
    // "Entre vocês" é mais social que "aqui dentro" — aponta para a rede de relações.
    id: 'cor-silencio',
    categoria: 'corrupcao',
    texto: 'algo entre vocês mudou silenciosamente.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Falha estrutural no grupo. Uma fissura não é rompimento — é o antes do rompimento.
    // Mais específica que "algo mudou": implica que há dois lados que divergem.
    id: 'cor-fissura',
    categoria: 'corrupcao',
    texto: 'uma fissura invisível atravessa o grupo.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Identidade coletiva corrompida. A mudança é declarada, não sugerida.
    // Em paranoia é explosivo; em modo leve é desconcertante.
    id: 'cor-mesmo',
    categoria: 'corrupcao',
    texto: 'o grupo já não é o mesmo.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // A origem interna da mudança é a revelação mais perturbadora.
    // "Veio de dentro" elimina a hipótese de causa externa — é um de vocês.
    // Falso positivo igualmente eficaz: planta desconfiança sem evidência.
    id: 'cor-dentro',
    categoria: 'corrupcao',
    texto: 'a mudança veio de dentro.',
    raridade: 'raro',
    loopMinimo: 3,
  },

  {
    // Fronteiras dissolvidas. Quem era claramente aliado agora é ambíguo.
    // Loop 4+: ao este ponto a confiança já foi testada várias vezes.
    // "Sumiu" é mais definitivo que "se apagou" — a perda é irreversível.
    id: 'cor-linha',
    categoria: 'corrupcao',
    texto: 'a linha entre vocês sumiu.',
    raridade: 'raro',
    loopMinimo: 4,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// §4  PRESSÃO SOCIAL (6 eventos públicos)
//
// Objetivo: interromper conforto. Forçar ação onde havia hesitação.
// Regra editorial: deve soar como pressão do grupo sobre si mesmo,
// nunca como instrução de um sistema externo.
//
// Limite recomendado: no máximo 1 evento desta categoria a cada 2 loops.
// Em excesso vira coerção; escasso vira impasse.
// ─────────────────────────────────────────────────────────────────────────────

const PRESSAO_SOCIAL: readonly TemplateEventoPublico[] = [

  {
    // Silêncio de alguém nomeado sem nomear quem. Todos sabem de quem é.
    // Mais eficaz quando há alguém claramente calado no grupo.
    id: 'prs-pesa',
    categoria: 'pressao_social',
    texto: 'o silêncio de alguém pesa.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // O tópico que ninguém quer nomear existe — este evento o aponta sem nomeá-lo.
    // Força o grupo a identificar coletivamente o assunto evitado.
    id: 'prs-ponto',
    categoria: 'pressao_social',
    texto: 'o ponto que ninguém quer tocar.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Demanda direta de fala. Sem alvo: qualquer um que hesita se sente cobrado.
    // Humano — é o que alguém diria em voz alta num grupo impaciente.
    id: 'prs-agora',
    categoria: 'pressao_social',
    texto: 'alguém aqui precisa falar agora.',
    raridade: 'incomum',
    loopMinimo: 1,
  },

  {
    // Dívida social. "Explicação" implica que algo aconteceu que requer prestação de contas.
    id: 'prs-deve',
    categoria: 'pressao_social',
    texto: 'alguém aqui está devendo uma explicação.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Observador crônico apontado sem ser nomeado. Quem nunca fala?
    id: 'prs-observa',
    categoria: 'pressao_social',
    texto: 'alguém só observa, nunca fala.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // Escolha por omissão. Implica cumplicidade no silêncio — o pior tipo.
    // "faz sua escolha" encerra com agência: calar foi uma decisão ativa.
    id: 'prs-cala',
    categoria: 'pressao_social',
    texto: 'quem sabe e cala faz sua escolha.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // Observação social pura — não é instrução. O grupo identifica quem é.
    // "ainda não se posicionou" implica que a posição é esperada e cobrada.
    id: 'prs-posicionou',
    categoria: 'pressao_social',
    texto: 'alguém aqui ainda não se posicionou.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // O custo do silêncio nomeado sem nomear quem paga.
    // Funciona como pressão coletiva: todos que estão calados se sentem atingidos.
    id: 'prs-custo',
    categoria: 'pressao_social',
    texto: 'silêncio tem um preço aqui.',
    raridade: 'incomum',
    loopMinimo: 3,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// §5  CAOS SOCIAL (6 eventos públicos)
//
// Objetivo: descrever a deterioração do grupo como entidade.
// Não aponta indivíduo — diagnostica o coletivo.
// Efeito: cada um culpa internamente quem acha responsável pelo caos.
//
// Requer loopMinimo: 2 (o caos pressupõe algo que estava inteiro e quebrou).
// ─────────────────────────────────────────────────────────────────────────────

const CAOS_SOCIAL: readonly TemplateEventoPublico[] = [

  {
    // Fragmentação radical. Ninguém compartilha a mesma realidade.
    // Simples, direto — o grupo imediatamente tenta reconciliar o que ouviu.
    id: 'cao-ouviu',
    categoria: 'caos_social',
    texto: 'cada um ouviu algo diferente.',
    raridade: 'comum',
    loopMinimo: 2,
  },

  {
    // O grupo perdeu o fio. A conversa foi longe e ninguém sabe como voltou aqui.
    id: 'cao-fio',
    categoria: 'caos_social',
    texto: 'o fio da conversa se perdeu.',
    raridade: 'comum',
    loopMinimo: 2,
  },

  {
    // Defensividade coletiva. Quando todo mundo se defende, ninguém acusa —
    // e esse travamento coletivo é sua própria forma de caos.
    id: 'cao-defensivo',
    categoria: 'caos_social',
    texto: 'todo mundo está se defendendo.',
    raridade: 'comum',
    loopMinimo: 2,
  },

  {
    // Algo irrevogável foi dito. O grupo absorve mas não pode desfazer.
    id: 'cao-palavras',
    categoria: 'caos_social',
    texto: 'palavras saíram que não voltam.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Medo de ser o próximo. Paralisia por antecipação — ninguém quer ser o alvo.
    // "próximo" é ambíguo: próximo a falar, ou próximo a cair.
    id: 'cao-proximo',
    categoria: 'caos_social',
    texto: 'ninguém quer ser o próximo.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Fragmentação estrutural. O grupo deixou de funcionar como unidade.
    // "partes soltas" implica que o elo foi quebrado — por quem?
    id: 'cao-partes',
    categoria: 'caos_social',
    texto: 'o grupo virou partes soltas.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // O argumento circular como diagnóstico de impasse. Quem começou?
    // Mais específico que "ninguém concorda" — implica que a conversa rodou sem sair.
    id: 'cao-volta',
    categoria: 'caos_social',
    texto: 'a conversa voltou onde começou.',
    raridade: 'incomum',
    loopMinimo: 3,
  },

  {
    // Cada aliança formada cria um adversário implícito. Loop 4+: fica explícito.
    // "escolheu um lado" é mais concreto que fragmentação abstrata.
    id: 'cao-lado',
    categoria: 'caos_social',
    texto: 'todo mundo já escolheu um lado.',
    raridade: 'incomum',
    loopMinimo: 4,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// §6  INFORMAÇÃO PARCIAL (6 eventos privados)
//
// Objetivo: dar ao jogador a sensação de saber mais — mesmo sem saber nada.
// Entregues a um único jogador por loop (inocente ou guardião; nunca corrompido).
// Sempre em segunda pessoa. Sempre ambíguos.
//
// Design crítico: o evento funciona se for verdade E se for mentira.
//   Exemplo: "seus instintos estão certos" serve tanto para validar suspeita
//   correta quanto para reforçar suspeita errada — ambos são tensão.
// ─────────────────────────────────────────────────────────────────────────────

const INFORMACAO_PARCIAL: readonly TemplateEventoPrivado[] = [

  {
    // Valida percepção sem especificar o quê. O jogador projeta o que mais teme ou suspeita.
    // Funciona igual se for verdade (ele percebeu algo real) ou mentira (paranoia).
    id: 'prv-percebeu',
    categoria: 'informacao_parcial',
    texto: 'você percebeu o que os outros não.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Vigilância inesperada. Quem observou? Por proteção ou por interesse adverso?
    // O "mais do que imagina" implica que o jogador subestimou a atenção que recebe.
    id: 'prv-observado',
    categoria: 'informacao_parcial',
    texto: 'você foi observado mais do que imagina.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Observador inesperado. Quem o notou? E por quê esse alguém em específico?
    // "por quem não esperava" implica que o observador é surpresa — aliado ou ameaça?
    id: 'prv-notado',
    categoria: 'informacao_parcial',
    texto: 'você foi notado por quem não esperava.',
    raridade: 'incomum',
    loopMinimo: 1,
  },

  {
    // FOMO social. Algo aconteceu na ausência — conversa paralela? Acordo? Revelação?
    id: 'prv-costas',
    categoria: 'informacao_parcial',
    texto: 'algo aconteceu quando você virou as costas.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Palavras têm peso. Alguém guardou o que você disse e pode usar.
    // Cria paranoia sobre o que foi dito anteriormente sem especificar o quê.
    id: 'prv-disse',
    categoria: 'informacao_parcial',
    texto: 'o que você disse não foi esquecido.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Autoconhecimento perturbador. Implica encobrimento ativo — o jogador sabe,
    // mas não está admitindo. Funciona tanto se for sobre suspeita quanto sobre culpa.
    id: 'prv-admite',
    categoria: 'informacao_parcial',
    texto: 'você sabe mais do que está admitindo.',
    raridade: 'raro',
    loopMinimo: 2,
  },

  {
    // Confiança depositada no lugar errado. O jogador não sabe em quem — só sabe que errou.
    // Funciona se for verdade (ele confiou no corrompido) ou como paranoia (não confiou em ninguém).
    id: 'prv-confiou-errado',
    categoria: 'informacao_parcial',
    texto: 'você confiou em alguém que não merecia.',
    raridade: 'comum',
    loopMinimo: 1,
  },

  {
    // Próxima ação como revelação de identidade. Cria paralisia decisória intencional.
    // O jogador vai deliberar excessivamente — e esse deliberar vai ser observado.
    id: 'prv-proxima',
    categoria: 'informacao_parcial',
    texto: 'sua próxima escolha vai revelar mais do que você pensa.',
    raridade: 'incomum',
    loopMinimo: 2,
  },

  {
    // Urgência sem explicação. Loop 3+: a partida já está avançada.
    // "Correndo contra você" não especifica o quê — mas o grupo acelerado vai completar.
    id: 'prv-tempo',
    categoria: 'informacao_parcial',
    texto: 'o tempo está correndo contra você.',
    raridade: 'raro',
    loopMinimo: 3,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// §7  BANCOS EXPORTADOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Banco público completo — 35 templates, 4 categorias.
 *
 * Distribuição após calibração emocional (v3):
 *   suspeita       13  (comum:3, incomum:6, raro:4)  — arco loop 1–3
 *   corrupcao       6  (comum:2, incomum:1, raro:3)  — falsos positivos + real
 *   pressao_social  8  (comum:1, incomum:5, raro:2)  — pressão social, nunca instrução
 *   caos_social     8  (comum:3, incomum:4, raro:1)  — diagnóstico do grupo, não do indivíduo
 *
 * Uso: importado por socialEvents.ts para seleção ponderada.
 */
export const BANCO_PUBLICO: readonly TemplateEventoPublico[] = [
  ...SUSPEITA,
  ...CORRUPCAO,
  ...PRESSAO_SOCIAL,
  ...CAOS_SOCIAL,
] as const;

/**
 * Banco privado completo — 9 templates, categoria 'informacao_parcial'.
 *
 * Distribuição após calibração emocional (v3):
 *   comum    3   (prv-percebeu, prv-observado, prv-confiou-errado)
 *   incomum  4   (prv-notado, prv-costas, prv-disse, prv-proxima)
 *   raro     2   (prv-admite, prv-tempo)
 *
 * Todos em segunda pessoa. Todos funcionam como verdade E como falso positivo.
 * Uso: importado por socialEvents.ts para entrega a jogador único por loop.
 */
export const BANCO_PRIVADO: readonly TemplateEventoPrivado[] = [
  ...INFORMACAO_PARCIAL,
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// §8  HELPERS DE CONSULTA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna contagens do banco para diagnóstico e testes.
 *
 * @example
 * const { publicos, privados, total } = totalDoBanco();
 * // → { publicos: 24, privados: 6, total: 30 }
 */
export function totalDoBanco(): {
  readonly publicos: number;
  readonly privados: number;
  readonly total: number;
} {
  return {
    publicos: BANCO_PUBLICO.length,
    privados: BANCO_PRIVADO.length,
    total:    BANCO_PUBLICO.length + BANCO_PRIVADO.length,
  };
}

/**
 * Retorna todos os templates públicos de uma categoria específica.
 *
 * @param categoria  Categoria a filtrar (nunca 'informacao_parcial' — use BANCO_PRIVADO).
 * @returns          Subset readonly do BANCO_PUBLICO.
 */
export function porCategoria(
  categoria: Exclude<CategoriaEvento, 'informacao_parcial'>,
): readonly TemplateEventoPublico[] {
  return BANCO_PUBLICO.filter((t) => t.categoria === categoria);
}

/**
 * Busca template por ID em ambos os bancos (público e privado).
 *
 * @param id  ID do template (ex: 'sus-pausa', 'prv-percebeu').
 * @returns   Template correspondente ou null se não encontrado.
 */
export function porId(
  id: string,
): TemplateEventoPublico | TemplateEventoPrivado | null {
  const publico = BANCO_PUBLICO.find((t) => t.id === id);
  if (publico !== undefined) return publico;

  const privado = BANCO_PRIVADO.find((t) => t.id === id);
  return privado ?? null;
}

/**
 * Retorna todos os templates elegíveis para um loop específico.
 * Elegível: loopMinimo <= loopAtual.
 *
 * @param loopAtual  Loop atual da partida (começa em 1).
 * @param banco      'publico' | 'privado' | 'ambos'
 */
export function elegiveisParaLoop(
  loopAtual: number,
  banco: 'publico' | 'privado' | 'ambos' = 'publico',
): readonly (TemplateEventoPublico | TemplateEventoPrivado)[] {
  const publicos = banco !== 'privado'
    ? BANCO_PUBLICO.filter((t) => t.loopMinimo <= loopAtual)
    : [];

  const privados = banco !== 'publico'
    ? BANCO_PRIVADO.filter((t) => t.loopMinimo <= loopAtual)
    : [];

  return [...publicos, ...privados];
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  FRASES DA NOITE (10 entradas)
//
// Exibidas publicamente ao grupo após a resolução de cada noite.
// Ambíguas por design: funcionam independente do resultado (nada/eliminação/corrupção).
//
// Tom alvo: manhã seguinte a algo que não se pode nomear.
// Calibração: curtas o suficiente para serem lidas de relance; pesadas o suficiente
// para ficarem. O jogador não deve conseguir "não pensar" sobre isso.
//
// Pesos refletem frequência desejada: comum não significa banal —
// significa que o efeito emocional é sustentável em repetição.
// ─────────────────────────────────────────────────────────────────────────────

const FRASES_NOITE_DATA: readonly FraseNoite[] = [

  {
    // O universal catch-all. Verdadeiro em qualquer resultado.
    // "algo" não especifica quem, o quê, ou quanto. Perfeito.
    texto: 'algo mudou.',
    peso: 6,
  },

  {
    // Agência sem agente. "trabalho" implica propósito — de quem?
    // Cria a sensação de que a noite operou sobre o grupo, não que o grupo operou.
    texto: 'a noite fez seu trabalho.',
    peso: 4,
  },

  {
    // Limite epistemológico. Ninguém pode saber tudo.
    // Funciona tanto quando algo aconteceu quanto quando nada aconteceu.
    texto: 'nem tudo pode ser visto.',
    peso: 4,
  },

  {
    // Sobrevivência ambígua. O grupo "continua" — mas todos?
    // O verbo "continua" é deliberadamente vago sobre integridade.
    texto: 'o grupo continua.',
    peso: 5,
  },

  {
    // O silêncio pós-noite como mensagem em si. O que ele disse?
    // Cria o impulso de preencher o vazio com interpretação.
    texto: 'o silêncio disse o suficiente.',
    peso: 3,
  },

  {
    // Transformação universal — ninguém é imune.
    // "exatamente" é a palavra que corta: talvez quase igual, mas não igual.
    texto: 'ninguém volta exatamente igual.',
    peso: 3,
  },

  {
    // Irreversibilidade sem especificação. O que não se desfaz?
    // Cada jogador projeta o que mais teme.
    texto: 'algumas coisas não se desfazem.',
    peso: 2,
  },

  {
    // Permanência sem especificidade. O que a noite fez persiste.
    // "ficou" encerra em nota grave — irreversível, sem consolação.
    texto: 'o que a noite fez, ficou.',
    peso: 4,
  },

  {
    // A noite como agente com privacidade. Ela sabe; você não.
    // Assimetria de informação personificada no período noturno.
    texto: 'a noite guarda seus segredos.',
    peso: 3,
  },

  {
    // A manhã chegou diferente. Não "melhor" ou "pior" — só diferente.
    // Menos abstrato que os outros; mais sensorial. Bom como variação de ritmo.
    texto: 'o dia começa de outro jeito.',
    peso: 2,
  },

];

/**
 * Banco de frases pós-noite — 10 entradas, seleção ponderada com anti-repetição.
 *
 * Distribuição de pesos (total: 36):
 *   Altamente frequente (≥5): algo mudou. / o grupo continua.
 *   Frequente (3–4):          a noite fez seu trabalho. / nem tudo pode ser visto. /
 *                             o que passou, passou. / o silêncio disse o suficiente. /
 *                             ninguém volta exatamente igual. / a noite guarda seus segredos.
 *   Raro (≤2):                algumas coisas não se desfazem. / o dia começa de outro jeito.
 *
 * Uso: via sortearFraseNoite(ultimaFrase) — nunca acessar diretamente para seleção.
 */
export const BANCO_FRASES_NOITE: readonly FraseNoite[] = FRASES_NOITE_DATA;

// ─────────────────────────────────────────────────────────────────────────────
// §10  MENSAGENS DE CORRUPÇÃO (5 entradas)
//
// Entregues em /privados/{id}/mensagemPrivada ao jogador recém-corrompido.
// Uma única vez por partida — o momento de ruptura interior do personagem.
//
// Tom alvo: reconhecimento silencioso de uma mudança já ocorrida.
// Não é anúncio, não é revelação dramática — é constatação.
//
// Calibração emocional:
//   Evitar: "você foi corrompido" (explícito demais, sistema)
//   Evitar: "as trevas te dominaram" (fantasia, possessão)
//   Evitar: "agora você é um traidor" (julgamento, dramatização)
//   Buscar: o que alguém pensa de si mesmo ao perceber que mudou
//
// Todas com peso equivalente — cada uma representa uma entrada psicológica
// diferente para a mesma experiência de transformação.
// ─────────────────────────────────────────────────────────────────────────────

const MENSAGENS_CORRUPCAO_DATA: readonly MensagemCorrupcao[] = [

  {
    // A mais direta. Dois palavras, peso bruto. Inegável.
    // "você mudou" não acusa — constata. O jogador não pode discutir.
    texto: 'você mudou.',
    peso: 5,
  },

  {
    // Percepção alterada. O que antes parecia uma coisa, agora parece outra.
    // "diferente" não especifica melhor ou pior — só alterado.
    texto: 'agora você vê diferente.',
    peso: 4,
  },

  {
    // Clínico. "Ajustou" é a palavra mais perturbadora porque é neutra.
    // Não foi rompido, não foi destruído — apenas ajustado. Como uma calibração.
    texto: 'algo em você se ajustou.',
    peso: 3,
  },

  {
    // Pertencimento a algo que não é nomeado. O jogador sabe o que é "algo diferente".
    // Mais preciso que "nisso" — "algo diferente" confirma mudança de grupo sem dizê-la.
    texto: 'você faz parte de algo diferente agora.',
    peso: 3,
  },

  {
    // Passado como lugar físico. O eu anterior ficou lá — aqui está o novo.
    // Não é perda dramática: é a observação fria de que houve uma virada.
    texto: 'o que você era ficou para trás.',
    peso: 3,
  },

];

/**
 * Banco de mensagens de corrupção — 5 entradas, todas de peso equivalente.
 *
 * Uso: via sortearMensagemCorrupcao() — seleção aleatória ponderada.
 * O jogador recebe exatamente uma por partida, no momento da conversão.
 */
export const BANCO_MENSAGENS_CORRUPCAO: readonly MensagemCorrupcao[] = MENSAGENS_CORRUPCAO_DATA;

// ─────────────────────────────────────────────────────────────────────────────
// §11  SELETORES DE NOITE E CORRUPÇÃO
//
// Funções puras de seleção — injetáveis (aleatorio parametrizado para testes).
// Sem efeitos colaterais. Sem escrita no Firebase.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seleciona aleatoriamente de um banco com pesos, usando seleção ponderada.
 *
 * Algoritmo: acumula o peso total, sorteia ponto aleatório no intervalo,
 * percorre o banco decrementando até encontrar o item. O(n).
 *
 * @internal — usado por sortearFraseNoite e sortearMensagemCorrupcao.
 */
function _selecionarPonderado<T extends { peso: number }>(
  banco: readonly T[],
  aleatorio: () => number,
): T {
  if (banco.length === 0) {
    throw new Error('[eventos] banco vazio passado para _selecionarPonderado');
  }

  const pesoTotal = banco.reduce((acc, item) => acc + item.peso, 0);
  let cursor = aleatorio() * pesoTotal;

  for (const item of banco) {
    cursor -= item.peso;
    if (cursor <= 0) return item;
  }

  // Fallback de segurança numérica (floating-point underrun raro)
  return banco[banco.length - 1]!;
}

/**
 * Sorteia uma frase para exibição pós-noite, com anti-repetição consecutiva.
 *
 * Garante que a mesma frase nunca aparece duas noites seguidas.
 * Usa seleção ponderada sobre o banco filtrado.
 *
 * Exceção: se o banco tiver apenas 1 entrada, retorna ela independente
 * de ser a última usada (borda de testes com banco reduzido).
 *
 * @param ultimaFrase  Texto da frase usada na noite anterior. null = primeira noite.
 * @param aleatorio    Função aleatória. Padrão: Math.random. Injetável para testes.
 * @returns            Texto selecionado (2–7 palavras, sempre minúsculas).
 *
 * @example
 * // Primeira noite (sem histórico)
 * const frase = sortearFraseNoite(null);
 *
 * // Noites seguintes (com anti-repetição)
 * let ultimaFrase: string | null = null;
 * ultimaFrase = sortearFraseNoite(ultimaFrase); // loop 1
 * ultimaFrase = sortearFraseNoite(ultimaFrase); // loop 2 — nunca igual ao anterior
 */
export function sortearFraseNoite(
  ultimaFrase: string | null,
  aleatorio: () => number = Math.random,
): string {
  const banco = BANCO_FRASES_NOITE;

  const elegíveis: readonly FraseNoite[] =
    ultimaFrase !== null && banco.length > 1
      ? banco.filter((f) => f.texto !== ultimaFrase)
      : banco;

  return _selecionarPonderado(elegíveis, aleatorio).texto;
}

/**
 * Sorteia uma mensagem de corrupção do banco ponderado.
 *
 * Sem anti-repetição — cada jogador recebe no máximo uma por partida,
 * então não há contexto de "última mensagem usada" relevante.
 *
 * @param aleatorio  Função aleatória. Padrão: Math.random. Injetável para testes.
 * @returns          Texto selecionado (em segunda pessoa, 2–7 palavras).
 *
 * @example
 * const mensagem = sortearMensagemCorrupcao();
 * // → "você mudou." | "agora você vê diferente." | etc.
 */
export function sortearMensagemCorrupcao(
  aleatorio: () => number = Math.random,
): string {
  return _selecionarPonderado(BANCO_MENSAGENS_CORRUPCAO, aleatorio).texto;
}
