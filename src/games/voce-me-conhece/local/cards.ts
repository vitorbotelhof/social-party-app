/**
 * VOCÊ ME CONHECE? — BANCO DE CARDS
 *
 * Fase 2: 5 categorias, 15 cards cada = 75 cards.
 *
 * Regras de um card bom:
 *   - Opções curtas: 1–4 palavras.
 *   - Nenhuma opção é obviamente "certa" — depende de quem é a pessoa.
 *   - Qualquer escolha revela algo sobre quem escolheu.
 *   - Gera polarização: metade do grupo sente de um jeito, metade de outro.
 *
 * Temperatura de referência:
 *   leve    → diversão, sem peso emocional
 *   social  → leitura humana, julgamento leve
 *   pessoal → valores, intimidade, trade-offs reais
 *   intenso → fase 3+
 */

import type { CartaoVMC, CategoriaVMC } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Categorias
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIAS_VMC: CategoriaVMC[] = [
  {
    id: 'vibes',
    nome: 'Vibes',
    temperatura: 'leve',
    descricao: 'qual dessas é mais você?',
  },
  {
    id: 'escolhas',
    nome: 'Escolhas',
    temperatura: 'leve',
    descricao: 'se tivesse que escolher agora.',
  },
  {
    id: 'prioridades',
    nome: 'Prioridades',
    temperatura: 'social',
    descricao: 'o que vale mais pra você?',
  },
  {
    id: 'vida-real',
    nome: 'Vida Real',
    temperatura: 'social',
    descricao: 'como você age de verdade?',
  },
  {
    id: 'o-que-vale-mais',
    nome: 'O Que Vale Mais',
    temperatura: 'pessoal',
    descricao: 'no fundo, o que importa?',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cards — Vibes (leve)
// Comportamentos e padrões do dia a dia que revelam jeito de ser.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS_VIBES: CartaoVMC[] = [
  {
    id: 'vib-001',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['planejamento total', 'improviso total', 'planejo o básico', 'sigo o instinto'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-002',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['responde na hora', 'deixa na fila', 'responde quando pode', 'some da conversa'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-003',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['sempre pontual', 'sempre atrasado', 'uns 10 minutos', 'antecipado por ansiedade'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-004',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['manda áudio longo', 'manda texto', 'manda meme', 'reage e não responde'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-005',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['lembra tudo', 'esquece tudo', 'lembra o importante', 'anota pra lembrar'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-006',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['desabafa pra todo mundo', 'desabafa pra um', 'processa sozinho', 'fica quieto'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-007',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['fala na hora', 'engole e some', 'fala depois que esfriou', 'faz cara feia'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-008',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['toque físico', 'palavras de afirmação', 'atos de serviço', 'tempo de qualidade'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-009',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['workaholic', 'equilibrado', 'trabalha o mínimo', 'depende da fase'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-010',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['resolve na hora', 'pesquisa tudo antes', 'pergunta pra alguém', 'segue o instinto'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-011',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['fala muito', 'escuta muito', 'fala quando importa', 'observa e não comenta'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-012',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['vive no passado', 'vive no futuro', 'presente total', 'saudade do que não viveu'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-013',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['aceita crítica fácil', 'fica na defensiva', 'processa depois', 'depende de quem'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-014',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['acorda cedo animado', 'acorda tarde tranquilo', 'acorda cedo sofrendo', 'qualquer hora com café'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vib-015',
    categoriaId: 'vibes',
    temperatura: 'leve',
    opcoes: ['pede ajuda fácil', 'resolve tudo sozinho', 'pesquisa antes de pedir', 'depende do assunto'],
    tipoEscolha: 'top1',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cards — Escolhas (leve)
// Preferências simples, sem peso moral. O prazer está na justificativa.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS_ESCOLHAS: CartaoVMC[] = [
  {
    id: 'esc-001',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['viagem de aventura', 'viagem relaxante', 'viagem cultural', 'viagem gastronômica'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-002',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['série nova toda semana', 'filme no cinema', 'podcast novo', 'livro sem tela'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-003',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['churrasco na casa de alguém', 'restaurante caro', 'bar animado', 'janta em casa'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-004',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['verão na praia', 'inverno na montanha', 'primavera na cidade', 'outono com chuva'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-005',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['cozinhar em casa', 'pedir delivery', 'comer fora', 'que alguém cozinhe'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-006',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['invisibilidade', 'voar', 'ler mentes', 'parar o tempo'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-007',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['happy hour sexta', 'brunch domingo', 'jantar sábado', 'nada, em casa'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-008',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['música no fone', 'caixa em casa', 'carro no volume', 'silêncio'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-009',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['presente: experiência', 'presente: objeto', 'presente: dinheiro', 'só a presença'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-010',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['cachorro', 'gato', 'nenhum pet', 'pet exótico'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-011',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['ler antes de ver', 'ver antes de ler', 'só o livro', 'só o filme'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-012',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['comprar na loja', 'comprar online', 'pesquisar e não comprar', 'só se precisar muito'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-013',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['café da manhã farto', 'café rápido', 'pular o café', 'café da tarde'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-014',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['férias na praia', 'city trip europeu', 'sítio ou fazenda', 'férias em casa'],
    tipoEscolha: 'top1',
  },
  {
    id: 'esc-015',
    categoriaId: 'escolhas',
    temperatura: 'leve',
    opcoes: ['saber tudo mas não poder falar', 'não saber nada mas poder opinar', 'saber o essencial', 'preferir não saber'],
    tipoEscolha: 'top1',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cards — Prioridades (social)
// O que vale mais quando você tem que escolher de verdade.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS_PRIORIDADES: CartaoVMC[] = [
  {
    id: 'pri-001',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['liberdade', 'estabilidade', 'reconhecimento', 'amor'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-002',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['viagem', 'dinheiro', 'amizades', 'saúde'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-003',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['ser amado', 'ser respeitado', 'ser temido', 'ser admirado'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-004',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['trabalho dos sonhos', 'salário alto', 'boa equipe', 'equilíbrio'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-005',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['ganhar a discussão', 'manter a paz', 'ser honesto', 'ser compreendido'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-006',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['independência', 'companhia', 'privacidade', 'pertencimento'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-007',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['sucesso profissional', 'vida amorosa', 'saúde', 'aventura'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-008',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['ser lembrado', 'ser amado', 'ser respeitado', 'ser feliz'],
    tipoEscolha: 'top1',
  },
  {
    id: 'pri-009',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['carreira', 'família', 'amizades', 'saúde mental'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-010',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['dinheiro hoje', 'felicidade hoje', 'segurança amanhã', 'liberdade agora'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-011',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['fazer rir', 'ser ouvido', 'ser entendido', 'ser valorizado'],
    tipoEscolha: 'top1',
  },
  {
    id: 'pri-012',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['paz de espírito', 'propósito', 'prazer', 'conexão'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-013',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['coragem', 'inteligência', 'empatia', 'resiliência'],
    tipoEscolha: 'top1',
  },
  {
    id: 'pri-014',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['casa própria', 'experiências únicas', 'segurança financeira', 'tempo livre'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'pri-015',
    categoriaId: 'prioridades',
    temperatura: 'social',
    opcoes: ['ter razão', 'ser feliz', 'ser justo', 'ser gentil'],
    tipoEscolha: 'ambos',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cards — Vida Real (social)
// Como a pessoa age no dia a dia — comportamentos observáveis, não ideais.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS_VIDA_REAL: CartaoVMC[] = [
  {
    id: 'vr-001',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['primeiro a chegar', 'último a chegar', 'exatamente na hora', 'quando já tá esquentando'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-002',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['celular virado na mesa', 'celular guardado', 'celular na mão', 'celular longe de vista'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-003',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['divide na hora exato', 'paga e cobra depois', 'quem pediu mais paga mais', 'tudo igual sem contar'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-004',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['home office sempre', 'escritório sempre', 'híbrido', 'café ou coworking'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-005',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['primeiro alarme', 'vários alarmes', 'acorda natural', 'alguém acorda você'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-006',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['notificações tudo ativo', 'só o essencial', 'quase tudo no mudo', 'mudo sempre'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'vr-007',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['3 horas no aeroporto', '1h30 tranquilo', 'chega certinho', 'sempre correndo'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-008',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['pede desculpa fácil', 'difícil pedir desculpa', 'pede mesmo sem errar', 'só quando tem certeza'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-009',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['roupas dobradas', 'cabide em tudo', 'a cadeira da bagunça', 'sistema inexplicável'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-010',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['médico preventivo', 'só quando tá mal', 'evita ao máximo', 'pesquisa antes de ir'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-011',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['planeja a semana', 'vê o que acontece', 'só o dia seguinte', 'nada planejado'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-012',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['faz compras semanais', 'vai toda hora no mercado', 'delivery de tudo', 'mercado mensal e improvisa'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-013',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['responde e-mail na hora', 'deixa acumular', 'filtra e responde o urgente', 'e-mail? quem usa isso?'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-014',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['fotos organizadas', 'câmera roll caótico', 'tudo no backup sem olhar', 'raramente tira foto'],
    tipoEscolha: 'top1',
  },
  {
    id: 'vr-015',
    categoriaId: 'vida-real',
    temperatura: 'social',
    opcoes: ['economiza antes de gastar', 'gasta e equilibra depois', 'orçamento rígido', 'gasta no que vale'],
    tipoEscolha: 'top1',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cards — O Que Vale Mais (pessoal)
// Trade-offs reais entre coisas que importam. Sem resposta óbvia.
// Força o grupo a enxergar valores que a pessoa talvez não verbalize.
// ─────────────────────────────────────────────────────────────────────────────

const CARDS_O_QUE_VALE_MAIS: CartaoVMC[] = [
  {
    id: 'ovm-001',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['amado por poucos', 'querido por muitos', 'respeitado por todos', 'indiferente pra maioria'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-002',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['errar e aprender', 'não errar, não tentar', 'aprender sem errar', 'errar sem perceber'],
    tipoEscolha: 'ambos',
  },
  {
    id: 'ovm-003',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['amor intenso que acabou', 'amor estável que durou', 'vários amores medianos', 'nunca ter amado fundo'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-004',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['ser lembrado depois', 'ser feliz agora', 'mudar poucas vidas', 'mudar o mundo anônimo'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-005',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['família difícil mas próxima', 'família fácil mas distante', 'criar família própria', 'total independência'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-006',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['coragem e erro', 'medo e segurança', 'cautela e tentativa', 'planejamento e espera'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-007',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['honesto e fere', 'gentil e omite', 'honesto com cuidado', 'fica quieto'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-008',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['perdoar e esquecer', 'perdoar sem esquecer', 'não perdoar mas seguir', 'nem pensar mais'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-009',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['saber o que pensam de mim', 'nunca saber', 'saber só dos próximos', 'saber e poder ignorar'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-010',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['certeza de quem sou', 'me questionar sempre', 'mudar com o tempo', 'ser percebido diferente'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-011',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['ser o mais inteligente', 'o mais empático', 'o mais engraçado', 'o mais confiável'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-012',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['intenso mas curto', 'tranquilo mas longo', 'mediano mas eterno', 'propósito sem prazo'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-013',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['mudar uma coisa do passado', 'não mudar nada', 'rever mas não mudar', 'esquecer e recomeçar'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-014',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['certeza de ter acertado', 'dúvida mas seguir', 'poder refazer', 'aceitar que não havia certo'],
    tipoEscolha: 'top1',
  },
  {
    id: 'ovm-015',
    categoriaId: 'o-que-vale-mais',
    temperatura: 'pessoal',
    opcoes: ['completamente livre', 'completamente amado', 'completamente seguro', 'completamente eu mesmo'],
    tipoEscolha: 'top1',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export const CARDS_VMC: CartaoVMC[] = [
  ...CARDS_VIBES,
  ...CARDS_ESCOLHAS,
  ...CARDS_PRIORIDADES,
  ...CARDS_VIDA_REAL,
  ...CARDS_O_QUE_VALE_MAIS,
];

export function getCardsPorCategorias(categoriaIds: string[]): CartaoVMC[] {
  return CARDS_VMC.filter((c) => categoriaIds.includes(c.categoriaId));
}
