import type {
  ConfiguracaoNMP,
  EstadoNMP,
  CelulaNMP,
  TipoPalavra,
  PistaNMP,
  ResultadoTurno,
  MotivoEncerramentoTurno,
  MomentoNMP,
} from './types';
import { DISTRIBUICAO_POR_MODO } from './types';
import { sortearPalavras } from './palavras';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fisher-Yates in-place shuffle para arrays genéricos */
function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function timeOposto(time: 'time_a' | 'time_b'): 'time_a' | 'time_b' {
  return time === 'time_a' ? 'time_b' : 'time_a';
}

// ─── criarEstadoInicial ───────────────────────────────────────────────────────

/**
 * Cria o estado inicial completo do jogo a partir da configuração.
 * Sorteia as palavras, distribui tipos e embaralha a grade.
 */
export function criarEstadoInicial(config: ConfiguracaoNMP): EstadoNMP {
  const dist = DISTRIBUICAO_POR_MODO[config.modo];
  const palavras = sortearPalavras(config.deck, dist.total);

  // Monta array de tipos na ordem correta e embaralha junto com as palavras
  const tipos: TipoPalavra[] = [
    ...Array(dist.timeA).fill('time_a' as TipoPalavra),
    ...Array(dist.timeB).fill('time_b' as TipoPalavra),
    ...Array(dist.neutras).fill('neutra' as TipoPalavra),
    ...Array(dist.perigosa).fill('perigosa' as TipoPalavra),
  ];

  // Embaralha os índices para parear palavra↔tipo aleatoriamente
  const indices = embaralhar(Array.from({ length: dist.total }, (_, i) => i));
  const grade: CelulaNMP[] = indices.map((i) => ({
    palavra: palavras[i],
    tipo: tipos[i],
    revelada: false,
  }));

  const usaPontuacao = config.modo === 'festa';

  return {
    config,
    grade,
    colunas: dist.colunas,
    timeAtivo: 'time_a',
    fase: 'aguardando_pista',
    pistaAtual: null,
    restantesTimeA: dist.timeA,
    restantesTimeB: dist.timeB,
    pontosTimeA: usaPontuacao ? 0 : null,
    pontosTimeB: usaPontuacao ? 0 : null,
    vencedor: null,
    historicoTurnos: [],
    momentos: [],
    errosConsecutivos: 0,
  };
}

// ─── iniciarVisualizacaoMapa ──────────────────────────────────────────────────

/** Mestre tocou "Ver Mapa": avança para fase privada de visualização. */
export function iniciarVisualizacaoMapa(estado: EstadoNMP): EstadoNMP {
  return { ...estado, fase: 'vendo_mapa' };
}

/** Mestre fechou o mapa: avança para digitar a pista. */
export function fecharMapa(estado: EstadoNMP): EstadoNMP {
  return { ...estado, fase: 'dando_pista' };
}

/** Mestre decidiu dar pista sem ver o mapa. */
export function darPistaSemVer(estado: EstadoNMP): EstadoNMP {
  return { ...estado, fase: 'dando_pista' };
}

// ─── registrarPista ───────────────────────────────────────────────────────────

/**
 * Mestre confirmou a pista e o número.
 * numero = 0 significa ilimitado (chute livre total).
 */
export function registrarPista(
  estado: EstadoNMP,
  texto: string,
  numero: number,
): EstadoNMP {
  const pista: PistaNMP = {
    texto: texto.trim().toUpperCase(),
    numero,
    tentativasFeitas: 0,
    tentativasCorretas: 0,
  };

  const momentos: MomentoNMP[] = [...estado.momentos];
  if (numero >= 3) momentos.push('mestre_ousado');

  return {
    ...estado,
    fase: 'adivinhando',
    pistaAtual: pista,
    errosConsecutivos: 0,
    momentos,
  };
}

// ─── revelarPalavra ───────────────────────────────────────────────────────────

/**
 * Time tocou na célula de índice `indice`.
 * Retorna o novo estado após aplicar todas as regras do toque.
 */
export function revelarPalavra(estado: EstadoNMP, indice: number): EstadoNMP {
  const celula = estado.grade[indice];
  if (!celula || celula.revelada) return estado;
  if (estado.fase !== 'adivinhando') return estado;
  if (!estado.pistaAtual) return estado;

  // Marca célula como revelada
  const novaGrade = estado.grade.map((c, i) =>
    i === indice ? { ...c, revelada: true } : c,
  );

  const pista: PistaNMP = {
    ...estado.pistaAtual,
    tentativasFeitas: estado.pistaAtual.tentativasFeitas + 1,
  };

  let novoEstado: EstadoNMP = {
    ...estado,
    grade: novaGrade,
    pistaAtual: pista,
  };

  // ── Perigosa ──────────────────────────────────────────────────────────────
  if (celula.tipo === 'perigosa') {
    const vencedor = timeOposto(estado.timeAtivo);
    const momentos = adicionarMomento(estado.momentos, 'chute_fatal');

    if (estado.config.modo === 'festa') {
      // No modo Festa: penalidade em pontos, turno encerra mas jogo continua
      const novosPontos = calcularPontosFesta(novoEstado, estado.timeAtivo, -2);
      const resultado = criarResultadoTurno(estado, pista, 'perigosa');
      return {
        ...novoEstado,
        ...novosPontos,
        momentos,
        historicoTurnos: [...estado.historicoTurnos, resultado],
        fase: 'resultado_turno',
        errosConsecutivos: estado.errosConsecutivos + 1,
      };
    }

    // Clássico / Rápido / Difícil: derrota imediata
    const resultado = criarResultadoTurno(estado, pista, 'perigosa');
    return {
      ...novoEstado,
      momentos,
      historicoTurnos: [...estado.historicoTurnos, resultado],
      fase: 'encerrado',
      vencedor,
    };
  }

  // ── Palavra do time adversário ─────────────────────────────────────────────
  if (celula.tipo === timeOposto(estado.timeAtivo)) {
    const restantes = atualizarRestantes(novoEstado, celula.tipo);
    const momentos = adicionarMomento(estado.momentos, 'ajudou_adversario');

    let novoVencedor = novoEstado.vencedor;
    let novaFase: EstadoNMP['fase'] = 'resultado_turno';

    // Verifica se o adversário venceu por isso
    if (
      (celula.tipo === 'time_a' && restantes.restantesTimeA === 0) ||
      (celula.tipo === 'time_b' && restantes.restantesTimeB === 0)
    ) {
      novoVencedor = celula.tipo;
      novaFase = 'encerrado';
    }

    const resultado = criarResultadoTurno(estado, pista, novaFase === 'encerrado' ? 'vitoria' : 'adversario');
    return {
      ...novoEstado,
      ...restantes,
      momentos,
      historicoTurnos: [...estado.historicoTurnos, resultado],
      fase: novaFase,
      vencedor: novoVencedor,
      errosConsecutivos: estado.errosConsecutivos + 1,
    };
  }

  // ── Palavra neutra ─────────────────────────────────────────────────────────
  if (celula.tipo === 'neutra') {
    const momentos = adicionarMomento(estado.momentos, null);
    const resultado = criarResultadoTurno(estado, pista, 'neutro');
    return {
      ...novoEstado,
      momentos,
      historicoTurnos: [...estado.historicoTurnos, resultado],
      fase: 'resultado_turno',
      errosConsecutivos: estado.errosConsecutivos + 1,
    };
  }

  // ── Acerto: palavra do time ativo ──────────────────────────────────────────
  const pistaComAcerto: PistaNMP = {
    ...pista,
    tentativasCorretas: pista.tentativasCorretas + 1,
  };

  const restantes = atualizarRestantes(novoEstado, celula.tipo);
  let momentos = [...estado.momentos];
  let novaFase: EstadoNMP['fase'] = 'adivinhando';
  let novoVencedor = novoEstado.vencedor;

  // Modo Festa: +1 ponto por acerto
  const novosPontosFesta =
    estado.config.modo === 'festa'
      ? calcularPontosFesta(novoEstado, estado.timeAtivo, 1)
      : {};

  // Verificar vitória
  const venceu =
    (estado.timeAtivo === 'time_a' && restantes.restantesTimeA === 0) ||
    (estado.timeAtivo === 'time_b' && restantes.restantesTimeB === 0);

  if (venceu) {
    novoVencedor = estado.timeAtivo;
    novaFase = 'encerrado';
    momentos = adicionarMomento(momentos, 'vitoria_por_sincronia');
  } else {
    // Verificar se atingiu o limite da pista (e não é ilimitado)
    const limiteAtingido =
      pistaComAcerto.numero !== 0 &&
      pistaComAcerto.tentativasFeitas >= pistaComAcerto.numero + 1; // +1 = chute livre

    if (limiteAtingido) {
      novaFase = 'resultado_turno';
    }

    // Pista perfeita: acertou todas sem errar
    if (
      pistaComAcerto.tentativasFeitas === pistaComAcerto.numero &&
      pistaComAcerto.tentativasCorretas === pistaComAcerto.numero &&
      pistaComAcerto.numero > 0
    ) {
      momentos = adicionarMomento(momentos, 'pista_perfeita');
    }

    // Chute livre correto: tentativa além do número
    if (
      pistaComAcerto.numero > 0 &&
      pistaComAcerto.tentativasFeitas === pistaComAcerto.numero + 1
    ) {
      momentos = adicionarMomento(momentos, 'chute_livre_correto');
      novaFase = 'resultado_turno';
    }
  }

  const resultadoFinal: ResultadoTurno | undefined =
    novaFase !== 'adivinhando'
      ? criarResultadoTurno(
          estado,
          pistaComAcerto,
          novaFase === 'encerrado' ? 'vitoria' : 'limite',
        )
      : undefined;

  return {
    ...novoEstado,
    ...restantes,
    ...novosPontosFesta,
    pistaAtual: pistaComAcerto,
    momentos,
    historicoTurnos: resultadoFinal
      ? [...estado.historicoTurnos, resultadoFinal]
      : estado.historicoTurnos,
    fase: novaFase,
    vencedor: novoVencedor,
    errosConsecutivos: 0, // reset ao acertar
  };
}

// ─── passarTurno ──────────────────────────────────────────────────────────────

/** Time escolheu parar voluntariamente. Encerra o turno. */
export function passarTurno(estado: EstadoNMP): EstadoNMP {
  if (estado.fase !== 'adivinhando') return estado;
  if (!estado.pistaAtual) return estado;

  const resultado = criarResultadoTurno(estado, estado.pistaAtual, 'passou');
  return {
    ...estado,
    pistaAtual: estado.pistaAtual,
    historicoTurnos: [...estado.historicoTurnos, resultado],
    fase: 'resultado_turno',
  };
}

/** Confirma resultado do turno e passa para o próximo time. */
export function avancarParaProximoTurno(estado: EstadoNMP): EstadoNMP {
  if (estado.fase !== 'resultado_turno') return estado;

  // Detecta time_perdido: erros consecutivos ≥ 2
  let momentos = [...estado.momentos];
  if (estado.errosConsecutivos >= 2) {
    momentos = adicionarMomento(momentos, 'time_perdido');
  }

  return {
    ...estado,
    timeAtivo: timeOposto(estado.timeAtivo),
    fase: 'aguardando_pista',
    pistaAtual: null,
    errosConsecutivos: 0,
    momentos,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Nome do mestre do time ativo. */
export function mestredoTimeAtivo(estado: EstadoNMP): string {
  const { config } = estado;
  const mestreId =
    estado.timeAtivo === 'time_a' ? config.mestreTimeA : config.mestreTimeB;
  const time =
    estado.timeAtivo === 'time_a' ? config.jogadoresTimeA : config.jogadoresTimeB;
  return time.find((j) => j.id === mestreId)?.nome ?? mestreId;
}

/** Nome do time ativo para exibição. */
export function nomeTimeAtivo(estado: EstadoNMP): string {
  return estado.timeAtivo === 'time_a' ? 'Time A' : 'Time B';
}

/** Palavras não reveladas do tipo especificado. */
export function palavrasRestantesDeTipo(
  estado: EstadoNMP,
  tipo: TipoPalavra,
): CelulaNMP[] {
  return estado.grade.filter((c) => c.tipo === tipo && !c.revelada);
}

/** Retorna true se o time ativo ainda pode tentar (dentro do limite da pista). */
export function podeContinuarAdivinhando(estado: EstadoNMP): boolean {
  if (!estado.pistaAtual) return false;
  if (estado.pistaAtual.numero === 0) return true; // ilimitado
  // Pode tentar até numero + 1 (chute livre)
  return estado.pistaAtual.tentativasFeitas <= estado.pistaAtual.numero;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function adicionarMomento(
  momentos: MomentoNMP[],
  novo: MomentoNMP | null,
): MomentoNMP[] {
  if (novo === null) return momentos;
  return [...momentos, novo];
}

function atualizarRestantes(
  estado: EstadoNMP,
  tipoPalavra: TipoPalavra,
): Pick<EstadoNMP, 'restantesTimeA' | 'restantesTimeB'> {
  return {
    restantesTimeA:
      tipoPalavra === 'time_a'
        ? estado.restantesTimeA - 1
        : estado.restantesTimeA,
    restantesTimeB:
      tipoPalavra === 'time_b'
        ? estado.restantesTimeB - 1
        : estado.restantesTimeB,
  };
}

function calcularPontosFesta(
  estado: EstadoNMP,
  time: 'time_a' | 'time_b',
  delta: number,
): Pick<EstadoNMP, 'pontosTimeA' | 'pontosTimeB'> {
  return {
    pontosTimeA:
      time === 'time_a'
        ? Math.max(0, (estado.pontosTimeA ?? 0) + delta)
        : estado.pontosTimeA,
    pontosTimeB:
      time === 'time_b'
        ? Math.max(0, (estado.pontosTimeB ?? 0) + delta)
        : estado.pontosTimeB,
  };
}

function criarResultadoTurno(
  estado: EstadoNMP,
  pista: PistaNMP,
  motivo: MotivoEncerramentoTurno,
): ResultadoTurno {
  return {
    timeQueJogou: estado.timeAtivo,
    pistaDada: pista,
    acertos: pista.tentativasCorretas,
    motivo,
  };
}
