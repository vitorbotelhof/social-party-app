import type {
  ConfiguracaoOR,
  EstadoOR,
  FaccaoOR,
  JogadorOR,
  RodadaOR,
  ZonaOR,
} from './types';
import { distribuirPapeis, ajustarInformacoesDeZona } from './papeis';

// ─── Constantes ───────────────────────────────────────────────────────────────

const TOTAL_RODADAS: Record<string, number> = {
  rapido: 3,
  padrao: 4,
  avancado: 5,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortearLider(jogadores: JogadorOR[], zona: ZonaOR): string {
  const candidatos = jogadores.filter((j) => j.zona === zona);
  if (candidatos.length === 0) return '';
  const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
  return escolhido.id;
}

export function jogadoresDaZona(estado: EstadoOR, zona: ZonaOR): JogadorOR[] {
  return estado.jogadores.filter((j) => j.zona === zona);
}

export function encontrarPorPapel(
  estado: EstadoOR,
  papel: JogadorOR['papel'],
): JogadorOR | null {
  return estado.jogadores.find((j) => j.papel === papel) ?? null;
}

export function encontrarPorId(estado: EstadoOR, id: string): JogadorOR | null {
  return estado.jogadores.find((j) => j.id === id) ?? null;
}

// ─── criarEstadoInicial ───────────────────────────────────────────────────────

/**
 * Cria o estado inicial completo.
 * Distribui papéis e divide jogadores entre as zonas.
 */
export function criarEstadoInicial(config: ConfiguracaoOR): EstadoOR {
  const totalRodadas = TOTAL_RODADAS[config.modo] ?? 4;

  // Distribui papéis para todos os jogadores
  const jogadoresComPapeis = distribuirPapeis(config.jogadores, config.modo);

  // Divide em zonas: metade em A, metade em B (embaralhado)
  const embaralhados = embaralhar(jogadoresComPapeis);
  const metade = Math.ceil(embaralhados.length / 2);
  const jogadoresComZonas: JogadorOR[] = embaralhados.map((j, i) => ({
    ...j,
    zona: i < metade ? 'zona_a' : 'zona_b',
  }));

  // Agora que as zonas reais estão definidas, ajusta os fragmentos dos Informantes
  const jogadoresFinais = ajustarInformacoesDeZona(jogadoresComZonas);

  return {
    config,
    jogadores: jogadoresFinais,
    fase: 'distribuindo',
    distribuicaoIndex: 0,
    rodadaAtual: 0,
    totalRodadas,
    historico: [],
    rodadaEmCurso: null,
    eventoAtual: null,
    vencedor: null,
    decisaoChave: null,
  };
}

// ─── Distribuição de cartas ───────────────────────────────────────────────────

/**
 * Avança para o próximo jogador na distribuição de cartas.
 * Quando todos leram, entra na fase zonas_iniciais.
 */
export function avancarDistribuicao(estado: EstadoOR): EstadoOR {
  const novoIndex = estado.distribuicaoIndex + 1;

  // Marca o jogador atual como tendo lido sua carta
  const jogadores = estado.jogadores.map((j, i) =>
    i === estado.distribuicaoIndex ? { ...j, cartaLida: true } : j,
  );

  if (novoIndex >= estado.jogadores.length) {
    return {
      ...estado,
      jogadores,
      fase: 'zonas_iniciais',
      distribuicaoIndex: novoIndex,
    };
  }

  return {
    ...estado,
    jogadores,
    distribuicaoIndex: novoIndex,
  };
}

// ─── Início da primeira rodada ────────────────────────────────────────────────

export function iniciarPrimeiraRodada(estado: EstadoOR): EstadoOR {
  const liderA = sortearLider(estado.jogadores, 'zona_a');
  const liderB = sortearLider(estado.jogadores, 'zona_b');

  return {
    ...estado,
    fase: 'discussao',
    rodadaAtual: 1,
    rodadaEmCurso: {
      numero: 1,
      liderZonaA: liderA,
      liderZonaB: liderB,
      enviadoDaA: null,
      enviadoDaB: null,
      eventoId: null,
    },
  };
}

// ─── Avançar para fase de decisão ─────────────────────────────────────────────

/** Encerra a discussão e abre a decisão para a Zona A. */
export function avancarParaDecisao(estado: EstadoOR): EstadoOR {
  return { ...estado, fase: 'decisao_zona_a' };
}

// ─── Registrar decisões de troca ──────────────────────────────────────────────

/**
 * Líder da Zona A escolhe um jogador para enviar à Zona B.
 * Avança para a fase de decisão da Zona B.
 */
export function registrarDecisaoZonaA(
  estado: EstadoOR,
  jogadorId: string,
): EstadoOR {
  const jogador = encontrarPorId(estado, jogadorId);
  if (!jogador || jogador.zona !== 'zona_a') return estado;

  return {
    ...estado,
    fase: 'decisao_zona_b',
    rodadaEmCurso: {
      ...estado.rodadaEmCurso,
      enviadoDaA: jogadorId,
    },
  };
}

/**
 * Líder da Zona B escolhe um jogador para enviar à Zona A.
 * Executa as trocas e avança para resultado_rodada.
 */
export function registrarDecisaoZonaB(
  estado: EstadoOR,
  jogadorId: string,
): EstadoOR {
  const jogador = encontrarPorId(estado, jogadorId);
  if (!jogador || jogador.zona !== 'zona_b') return estado;

  const rodadaEmCurso = {
    ...estado.rodadaEmCurso,
    enviadoDaB: jogadorId,
    eventoId: estado.eventoAtual?.id ?? null,
  } as RodadaOR;

  const enviadoDaA = rodadaEmCurso.enviadoDaA;
  const enviadoDaB = rodadaEmCurso.enviadoDaB;

  // Aplica as trocas
  const jogadores = estado.jogadores.map((j) => {
    if (j.id === enviadoDaA) return { ...j, zona: 'zona_b' as ZonaOR };
    if (j.id === enviadoDaB) return { ...j, zona: 'zona_a' as ZonaOR };
    return j;
  });

  return {
    ...estado,
    jogadores,
    fase: 'resultado_rodada',
    rodadaEmCurso,
    historico: [...estado.historico, rodadaEmCurso],
  };
}

// ─── Avançar rodada ───────────────────────────────────────────────────────────

/**
 * Chamado ao confirmar o resultado de uma rodada.
 * Se há mais rodadas: inicia a próxima.
 * Se acabaram: chama verificarCondicaoFinal.
 */
export function avancarRodada(estado: EstadoOR): EstadoOR {
  if (estado.rodadaAtual >= estado.totalRodadas) {
    return verificarCondicaoFinal(estado);
  }

  const proximaRodada = estado.rodadaAtual + 1;
  const liderA = sortearLider(estado.jogadores, 'zona_a');
  const liderB = sortearLider(estado.jogadores, 'zona_b');

  // Sorteia evento se o modo avançado com eventos estiver ativado
  const eventoAtual =
    estado.config.comEventos && estado.config.modo === 'avancado'
      ? sortearEvento(estado.historico.map((r) => r.eventoId ?? ''))
      : null;

  return {
    ...estado,
    fase: eventoAtual ? 'evento' : 'discussao',
    rodadaAtual: proximaRodada,
    rodadaEmCurso: {
      numero: proximaRodada,
      liderZonaA: liderA,
      liderZonaB: liderB,
      enviadoDaA: null,
      enviadoDaB: null,
      eventoId: eventoAtual?.id ?? null,
    },
    eventoAtual,
  };
}

/** Após exibir o evento, avança para a discussão. */
export function confirmarEvento(estado: EstadoOR): EstadoOR {
  return { ...estado, fase: 'discussao' };
}

// ─── Verificação final ────────────────────────────────────────────────────────

export function verificarCondicaoFinal(estado: EstadoOR): EstadoOR {
  const alvo = encontrarPorPapel(estado, 'alvo');
  const ameaca = encontrarPorPapel(estado, 'ameaca');

  let vencedor: FaccaoOR;
  let decisaoChave: string;

  if (!alvo || !ameaca) {
    // Fallback — não deve acontecer
    vencedor = 'resgate';
    decisaoChave = 'Configuração inválida.';
  } else if (alvo.zona === ameaca.zona) {
    vencedor = 'sabotagem';
    decisaoChave = identificarDecisaoChave(estado, alvo.id, ameaca.id);
  } else {
    vencedor = 'resgate';
    decisaoChave = identificarDecisaoChave(estado, alvo.id, ameaca.id);
  }

  return {
    ...estado,
    fase: 'debrief',
    vencedor,
    decisaoChave,
    rodadaEmCurso: null,
  };
}

// ─── Identificação da decisão chave ──────────────────────────────────────────

/**
 * Encontra a rodada em que a configuração decisiva foi estabelecida:
 * a última troca que colocou Alvo e Ameaça juntos (Sabotagem vence)
 * ou a última troca que os separou (Resgate vence).
 */
function identificarDecisaoChave(
  estado: EstadoOR,
  alvoId: string,
  ameacaId: string,
): string {
  // Reconstrói o histórico de zonas rodada por rodada para encontrar o ponto decisivo
  const zonaInicial: Record<string, ZonaOR> = {};
  for (const j of estado.jogadores) {
    // Zona atual pode ser diferente da inicial. Reconstruímos retroativamente.
    zonaInicial[j.id] = j.zona;
  }

  // Desfaz as trocas de trás para frente para encontrar o estado inicial
  const zonas: Record<string, ZonaOR> = { ...zonaInicial };
  for (let i = estado.historico.length - 1; i >= 0; i--) {
    const rodada = estado.historico[i];
    if (rodada.enviadoDaA) zonas[rodada.enviadoDaA] = 'zona_a';
    if (rodada.enviadoDaB) zonas[rodada.enviadoDaB] = 'zona_b';
  }

  // Avança rodada por rodada encontrando quando a configuração final foi criada
  const simulado: Record<string, ZonaOR> = { ...zonas };
  let decisiva = 1;

  for (const rodada of estado.historico) {
    const zonaAlvoAntes = simulado[alvoId];
    const zonaAmeacaAntes = simulado[ameacaId];

    if (rodada.enviadoDaA) simulado[rodada.enviadoDaA] = 'zona_b';
    if (rodada.enviadoDaB) simulado[rodada.enviadoDaB] = 'zona_a';

    const zonaAlvoDepois = simulado[alvoId];
    const zonaAmeacaDepois = simulado[ameacaId];

    const juntosAntes = zonaAlvoAntes === zonaAmeacaAntes;
    const juntosDepois = zonaAlvoDepois === zonaAmeacaDepois;

    if (juntosAntes !== juntosDepois) {
      decisiva = rodada.numero;
    }
  }

  const alvo = encontrarPorId(estado, alvoId);
  const ameaca = encontrarPorId(estado, ameacaId);
  const vencedor = alvo?.zona === ameaca?.zona ? 'sabotagem' : 'resgate';

  if (vencedor === 'sabotagem') {
    return `Rodada ${decisiva} — a Ameaça conseguiu chegar até o Alvo.`;
  }
  return `Rodada ${decisiva} — o Resgate manteve o Alvo separado da Ameaça.`;
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

import { EVENTOS_ESPECIAIS } from './papeis';

function sortearEvento(
  eventosUsados: string[],
): import('./types').EventoEspecialOR | null {
  const disponiveis = EVENTOS_ESPECIAIS.filter(
    (e) => !eventosUsados.includes(e.id),
  );
  if (disponiveis.length === 0) return null;
  return disponiveis[Math.floor(Math.random() * disponiveis.length)];
}

// ─── Queries úteis ────────────────────────────────────────────────────────────

export function liderDaZona(estado: EstadoOR, zona: ZonaOR): JogadorOR | null {
  const liderId =
    zona === 'zona_a'
      ? estado.rodadaEmCurso?.liderZonaA
      : estado.rodadaEmCurso?.liderZonaB;
  if (!liderId) return null;
  return encontrarPorId(estado, liderId);
}

export function podeContinuarJogo(estado: EstadoOR): boolean {
  return estado.vencedor === null && estado.fase !== 'debrief';
}

export function progressoRodadas(estado: EstadoOR): string {
  return `${estado.rodadaAtual} de ${estado.totalRodadas}`;
}
