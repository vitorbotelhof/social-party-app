import type {
  CartaPrivadaOR,
  ConfiguracaoOR,
  DistribuicaoPapeisOR,
  EventoEspecialOR,
  FaccaoOR,
  JogadorOR,
  ModoOR,
  PapelOR,
  ZonaOR,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Tabela de distribuição de papéis ─────────────────────────────────────────
//
// Sempre: 1 Alvo, 1 Ameaça fixos.
// O restante é distribuído conforme a tabela abaixo.

type TabelaDistribuicao = Record<number, DistribuicaoPapeisOR>;

const DISTRIBUICAO_RAPIDO: TabelaDistribuicao = {
  4:  { agentes: 0, informantes: 1, operadores: 1, duploAgentes: 0 },
  5:  { agentes: 1, informantes: 1, operadores: 1, duploAgentes: 0 },
  6:  { agentes: 1, informantes: 1, operadores: 2, duploAgentes: 0 },
  7:  { agentes: 1, informantes: 1, operadores: 3, duploAgentes: 0 },
  8:  { agentes: 1, informantes: 2, operadores: 3, duploAgentes: 0 },
  9:  { agentes: 2, informantes: 2, operadores: 3, duploAgentes: 0 },
  10: { agentes: 2, informantes: 2, operadores: 4, duploAgentes: 0 },
  11: { agentes: 2, informantes: 2, operadores: 5, duploAgentes: 0 },
  12: { agentes: 2, informantes: 2, operadores: 6, duploAgentes: 0 },
};

const DISTRIBUICAO_PADRAO: TabelaDistribuicao = {
  4:  { agentes: 0, informantes: 1, operadores: 1, duploAgentes: 0 },
  5:  { agentes: 1, informantes: 1, operadores: 1, duploAgentes: 0 },
  6:  { agentes: 1, informantes: 1, operadores: 2, duploAgentes: 0 },
  7:  { agentes: 1, informantes: 2, operadores: 2, duploAgentes: 0 },
  8:  { agentes: 2, informantes: 2, operadores: 2, duploAgentes: 0 },
  9:  { agentes: 2, informantes: 2, operadores: 3, duploAgentes: 0 },
  10: { agentes: 2, informantes: 2, operadores: 4, duploAgentes: 0 },
  11: { agentes: 2, informantes: 3, operadores: 4, duploAgentes: 0 },
  12: { agentes: 3, informantes: 3, operadores: 4, duploAgentes: 0 },
};

const DISTRIBUICAO_AVANCADO: TabelaDistribuicao = {
  4:  { agentes: 0, informantes: 1, operadores: 0, duploAgentes: 1 },
  5:  { agentes: 0, informantes: 1, operadores: 1, duploAgentes: 1 },
  6:  { agentes: 1, informantes: 1, operadores: 1, duploAgentes: 1 },
  7:  { agentes: 1, informantes: 2, operadores: 1, duploAgentes: 1 },
  8:  { agentes: 2, informantes: 2, operadores: 1, duploAgentes: 1 },
  9:  { agentes: 2, informantes: 2, operadores: 2, duploAgentes: 1 },
  10: { agentes: 2, informantes: 2, operadores: 3, duploAgentes: 1 },
  11: { agentes: 2, informantes: 3, operadores: 3, duploAgentes: 1 },
  12: { agentes: 3, informantes: 3, operadores: 3, duploAgentes: 1 },
};

const TABELAS: Record<ModoOR, TabelaDistribuicao> = {
  rapido: DISTRIBUICAO_RAPIDO,
  padrao: DISTRIBUICAO_PADRAO,
  avancado: DISTRIBUICAO_AVANCADO,
};

function obterDistribuicao(
  n: number,
  modo: ModoOR,
): DistribuicaoPapeisOR {
  const tabela = TABELAS[modo];
  // Clamp para o range da tabela
  const chave = Math.max(4, Math.min(12, n));
  return tabela[chave] ?? tabela[12];
}

// ─── distribuirPapeis ─────────────────────────────────────────────────────────

export function distribuirPapeis(
  jogadores: { id: string; nome: string }[],
  modo: ModoOR,
): JogadorOR[] {
  const n = jogadores.length;
  const dist = obterDistribuicao(n, modo);

  // Monta o array de papéis (sempre 1 alvo + 1 ameaça + resto)
  const papeis: PapelOR[] = [
    'alvo',
    'ameaca',
    ...Array(dist.agentes).fill('agente' as PapelOR),
    ...Array(dist.informantes).fill('informante' as PapelOR),
    ...Array(dist.operadores).fill('operador' as PapelOR),
    ...Array(dist.duploAgentes).fill('duplo_agente' as PapelOR),
  ];

  // Embaralha os papéis antes de atribuir
  const papeisEmbaralhados = embaralhar(papeis);

  // Identifica nomes dos jogadores com papel específico para fragmentos
  // (passado em segundo momento; aqui apenas criamos os JogadorOR)
  const resultado: JogadorOR[] = jogadores.map((j, i) => {
    const papel = papeisEmbaralhados[i] ?? 'operador';
    const faccao = obterFaccao(papel);

    return {
      id: j.id,
      nome: j.nome,
      papel,
      faccao,
      zona: 'zona_a', // zona provisória — atribuída em criarEstadoInicial
      informacao: null, // preenchida abaixo para informantes
      objetivoSecundario: null,
      cartaLida: false,
    };
  });

  // Preenche informação dos Informantes
  return preencherInformacoes(resultado);
}

function obterFaccao(papel: PapelOR): FaccaoOR {
  if (papel === 'ameaca' || papel === 'duplo_agente') return 'sabotagem';
  return 'resgate';
}

// ─── Fragmentos de informação ─────────────────────────────────────────────────

/**
 * Preenche o campo `informacao` de cada Informante com um fragmento
 * verdadeiro sobre o estado inicial do jogo.
 *
 * Atenção: as zonas ainda estão como 'zona_a' provisório —
 * o fragmento é sobre papéis, não zonas (zonas são embaralhadas depois).
 * Fragmentos sobre zonas são gerados depois em `ajustarInformacoesDeZona`.
 */
function preencherInformacoes(jogadores: JogadorOR[]): JogadorOR[] {
  const informantes = jogadores.filter((j) => j.papel === 'informante');
  if (informantes.length === 0) return jogadores;

  const alvo = jogadores.find((j) => j.papel === 'alvo');
  const ameaca = jogadores.find((j) => j.papel === 'ameaca');
  const naoAmeacas = jogadores.filter(
    (j) => j.papel !== 'ameaca' && j.papel !== 'alvo',
  );

  const todosOsFragmentos: string[] = [];

  if (alvo && ameaca) {
    // Fragmentos sobre identidades
    todosOsFragmentos.push(
      `"${ameaca.nome}" não é alguém que você deveria confiar.`,
    );

    // Nomear 2 não-ameaças para confirmar inocência
    const doisInocentes = embaralhar(naoAmeacas).slice(0, 2);
    if (doisInocentes.length >= 2) {
      todosOsFragmentos.push(
        `"${doisInocentes[0].nome}" e "${doisInocentes[1].nome}" não são a Ameaça.`,
      );
    } else if (doisInocentes.length === 1) {
      todosOsFragmentos.push(
        `"${doisInocentes[0].nome}" não é a Ameaça.`,
      );
    }

    // Fragmentos genéricos sobre composição
    todosOsFragmentos.push(
      'Há exatamente 1 Ameaça entre os operadores.',
      `O Alvo não é "${ameaca.nome}".`,
      'Algum membro do Resgate sabe quem é a Ameaça.',
    );
  }

  // Embaralha e distribui 1 fragmento por informante
  const fragmentosEmbaralhados = embaralhar(todosOsFragmentos);

  return jogadores.map((j) => {
    if (j.papel !== 'informante') return j;
    const idx = informantes.indexOf(j);
    const fragmento = fragmentosEmbaralhados[idx % fragmentosEmbaralhados.length] ?? 'Observe quem tenta controlar as trocas.';
    return { ...j, informacao: fragmento };
  });
}

/**
 * Chamado após a divisão inicial de zonas (em criarEstadoInicial),
 * para enriquecer informações dos Informantes com dados reais de zona.
 */
export function ajustarInformacoesDeZona(jogadores: JogadorOR[]): JogadorOR[] {
  const ameaca = jogadores.find((j) => j.papel === 'ameaca');
  const alvo = jogadores.find((j) => j.papel === 'alvo');
  if (!ameaca || !alvo) return jogadores;

  const fragmentosDeZona: string[] = [
    `A Ameaça começou na ${ameaca.zona === 'zona_a' ? 'Zona A' : 'Zona B'}.`,
    `O Alvo começou na ${alvo.zona === 'zona_a' ? 'Zona A' : 'Zona B'}.`,
    ameaca.zona === alvo.zona
      ? 'A Ameaça e o Alvo começaram na mesma zona.'
      : 'A Ameaça e o Alvo começaram em zonas diferentes.',
    `A Zona ${ameaca.zona === 'zona_a' ? 'A' : 'B'} contém pelo menos 1 membro da Sabotagem.`,
  ];

  // Substitui informações dos informantes com fragmentos de zona (mais úteis)
  const informantes = jogadores.filter((j) => j.papel === 'informante');
  const zonasEmbaralhadas = embaralhar(fragmentosDeZona);

  return jogadores.map((j) => {
    if (j.papel !== 'informante') return j;
    const idx = informantes.indexOf(j);
    return { ...j, informacao: zonasEmbaralhadas[idx % zonasEmbaralhadas.length] ?? j.informacao };
  });
}

// ─── Textos das cartas privadas ───────────────────────────────────────────────

export function gerarTextoCarta(jogador: JogadorOR): CartaPrivadaOR {
  switch (jogador.papel) {
    case 'alvo':
      return {
        titulo: 'Alvo',
        corpo: 'Você é o Alvo desta operação. Sua proteção é prioridade.',
        objetivo: 'Termine longe da Ameaça. Você não sabe quem ela é — observe quem tenta se aproximar de você.',
        informacao: null,
      };

    case 'ameaca':
      return {
        titulo: 'Ameaça',
        corpo: 'Você é a Ameaça infiltrada na operação. Sua missão é se aproximar do Alvo.',
        objetivo: 'Termine na mesma zona que o Alvo na última rodada. Você pode mentir sobre seu papel.',
        informacao: null,
      };

    case 'agente':
      return {
        titulo: 'Agente',
        corpo: 'Você é um Agente do Resgate. Há uma Ameaça entre os operadores.',
        objetivo: 'Proteja o grupo. Observe quem tenta controlar as trocas e isole comportamentos suspeitos.',
        informacao: null,
      };

    case 'informante':
      return {
        titulo: 'Informante',
        corpo: 'Você é um Informante do Resgate. Você tem acesso a uma informação privilegiada.',
        objetivo: 'Use sua informação com sabedoria. Revelar cedo pode salvar a missão — ou tornar você um alvo.',
        informacao: jogador.informacao,
      };

    case 'operador':
      return {
        titulo: 'Operador',
        corpo: 'Você é um Operador. Sem informação especial.',
        objetivo: 'Observe o grupo. Desconfie de quem força trocas e proteja quem parece confiável.',
        informacao: null,
      };

    case 'duplo_agente':
      return {
        titulo: 'Operador', // aparece como operador para o jogador
        corpo: 'Você é um Operador. Sem informação especial.',
        objetivo: 'Observe o grupo. Desconfie de quem força trocas e proteja quem parece confiável.',
        informacao: null,
        // Internamente é da Sabotagem mas não sabe disso explicitamente
      };
  }
}

// ─── Eventos especiais ────────────────────────────────────────────────────────

export const EVENTOS_ESPECIAIS: EventoEspecialOR[] = [
  {
    id: 'comunicacao_cortada',
    titulo: 'Comunicação Cortada',
    descricao:
      'Canal comprometido. Nesta rodada, cada líder tem apenas 30 segundos para ouvir argumentos antes de decidir.',
    trocasExtras: 0,
    timerOverride: 30,
  },
  {
    id: 'vazamento',
    titulo: 'Vazamento de Informação',
    descricao:
      'Inteligência confirmou: há pelo menos 1 membro da Sabotagem em cada zona neste momento.',
    trocasExtras: 0,
    timerOverride: -1,
  },
  {
    id: 'ordem_superior',
    titulo: 'Ordem Superior',
    descricao:
      'A central exige movimentação urgente. Nesta rodada, cada zona deve enviar 2 operadores.',
    trocasExtras: 1,
    timerOverride: -1,
  },
  {
    id: 'ultima_chance',
    titulo: 'Última Chance',
    descricao:
      'Esta é a rodada final. Cada zona pode enviar 2 operadores em vez de 1.',
    trocasExtras: 1,
    timerOverride: -1,
  },
  {
    id: 'operador_descoberto',
    titulo: 'Operador Descoberto',
    descricao:
      'Um membro da equipe foi identificado como suspeito, mas a identidade não foi confirmada. O grupo decide com menos informação.',
    trocasExtras: 0,
    timerOverride: -1,
  },
];

// ─── Rótulos e labels para UI ─────────────────────────────────────────────────

export const LABEL_PAPEL: Record<PapelOR, string> = {
  alvo:         'Alvo',
  ameaca:       'Ameaça',
  agente:       'Agente',
  informante:   'Informante',
  operador:     'Operador',
  duplo_agente: 'Duplo Agente',
};

export const LABEL_FACCAO: Record<FaccaoOR, string> = {
  resgate:    'Resgate',
  sabotagem:  'Sabotagem',
};

export const LABEL_ZONA: Record<ZonaOR, string> = {
  zona_a: 'Zona A',
  zona_b: 'Zona B',
};

export const COR_ZONA: Record<ZonaOR, string> = {
  zona_a: '#3B82F6', // azul
  zona_b: '#10B981', // emerald
};

export const TOTAL_RODADAS_POR_MODO: Record<ConfiguracaoOR['modo'], number> = {
  rapido:   3,
  padrao:   4,
  avancado: 5,
};
