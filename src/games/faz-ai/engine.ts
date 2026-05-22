import { GameEngine } from '@/engine/GameEngine';
import type { GameConfig, GameState, Player, PlayerId } from '@/engine/types';
import { pesoEnergia, pesoVergonha } from '@/games/faz-ai/cards';
import { selecionarCartaFazAi } from '@/games/faz-ai/cardSelection';
import type {
  CartaFazAi,
  CategoriaFazAiId,
  FazAiAction,
  FazAiPrivateState,
  FazAiPublicState,
  HistoricoCartaFazAi,
  HistoricoTurnoFazAi,
  OpcoesFazAi,
  ResultadoFazAiFinalizado,
  ResultadoTurnoFazAi,
} from '@/games/faz-ai/types';
import { embaralhar } from '@/utils/random';

type FazAiState = GameState<FazAiPublicState, FazAiPrivateState>;

const DURACOES_VALIDAS = new Set([20, 30, 45]);
const OPCOES_PADRAO: OpcoesFazAi = {
  duracaoSegundos: 30,
  rodadasPorJogador: 2,
  categorias: 'todas',
  intensidade: 'todas',
};

function normalizarOpcoes(opcoes: unknown): OpcoesFazAi {
  const o = (opcoes ?? {}) as Partial<OpcoesFazAi>;
  const duracaoSegundos = (
    DURACOES_VALIDAS.has(o.duracaoSegundos as number)
      ? o.duracaoSegundos
      : OPCOES_PADRAO.duracaoSegundos
  ) as OpcoesFazAi['duracaoSegundos'];
  const rodadasPorJogador = Math.max(
    1,
    Math.min(
      6,
      Number.isFinite(o.rodadasPorJogador)
        ? Number(o.rodadasPorJogador)
        : OPCOES_PADRAO.rodadasPorJogador,
    ),
  );
  const categorias =
    o.categorias === 'todas' ||
    (Array.isArray(o.categorias) && o.categorias.length > 0)
      ? o.categorias
      : OPCOES_PADRAO.categorias;
  const intensidade =
    o.intensidade === 'leve' ||
    o.intensidade === 'social' ||
    o.intensidade === 'caotica' ||
    o.intensidade === 'absurda' ||
    o.intensidade === 'todas'
      ? o.intensidade
      : OPCOES_PADRAO.intensidade;

  return {
    duracaoSegundos,
    rodadasPorJogador,
    categorias,
    intensidade,
  };
}

function estadosPrivadosVazios(
  jogadores: Player[],
): Record<PlayerId, FazAiPrivateState> {
  return Object.fromEntries(jogadores.map((j) => [j.id, { carta: null }]));
}

function porTurnoVazio() {
  return {
    acertosTurnoAtual: 0,
    passesTurnoAtual: 0,
    streakTurnoAtual: 0,
    historicoTurnoAtual: [] as HistoricoCartaFazAi[],
  };
}

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((acc, valor) => acc + valor, 0) / valores.length;
}

function criarHistoricoCarta(
  carta: CartaFazAi,
  resultado: 'acertou' | 'passou',
  iniciadaEm: number | null,
  em: number,
): HistoricoCartaFazAi {
  return {
    cartaId: carta.id,
    texto: carta.texto,
    categoria: carta.categoria,
    ideiaCentral: carta.ideiaCentral,
    intensidadeSocial: carta.intensidadeSocial,
    dificuldadeAtuacao: carta.dificuldadeAtuacao,
    energiaRodada: carta.energiaRodada,
    tipo: carta.tipo,
    modoAtuacao: carta.modoAtuacao,
    atuabilidade: carta.atuabilidade,
    respostasAceitas: carta.respostasAceitas,
    resultado,
    duracaoMs: Math.max(0, em - (iniciadaEm ?? em)),
  };
}

function criarHistoricoTurno(
  estado: FazAiState,
  resultado: ResultadoTurnoFazAi,
  em: number,
): HistoricoTurnoFazAi {
  const publico = estado.estadoPublico;
  const iniciadoEm = publico.turnoIniciadoEm ?? em;
  const cartas = publico.historicoTurnoAtual;

  return {
    rodada: estado.rodada,
    jogadorId: publico.ordemJogadores[publico.indiceTurno]!,
    resultado,
    iniciadoEm,
    finalizadoEm: em,
    acertos: publico.acertosTurnoAtual,
    passes: publico.passesTurnoAtual,
    cartas,
    energiaMedia: media(
      cartas.map((carta) => pesoEnergia(carta.energiaRodada)),
    ),
    vergonhaMedia: media(
      cartas.map((carta) => pesoVergonha(carta.intensidadeSocial)),
    ),
  };
}

function selecionarProximaCarta(estadoPublico: FazAiPublicState): CartaFazAi {
  return selecionarCartaFazAi(
    estadoPublico.cartasUsadas,
    estadoPublico.categorias,
    estadoPublico.intensidade,
    estadoPublico.turnosJogados,
    estadoPublico.totalTurnos,
    {
      acertosTurnoAtual: estadoPublico.acertosTurnoAtual,
      passesTurnoAtual: estadoPublico.passesTurnoAtual,
      streakTurnoAtual: estadoPublico.streakTurnoAtual,
    },
  );
}

class FazAiEngine extends GameEngine<
  FazAiPublicState,
  FazAiPrivateState,
  FazAiAction
> {
  readonly config: GameConfig = {
    id: 'faz-ai',
    nome: 'Faz Aí',
    descricao:
      'Atue situações sociais modernas antes que o grupo perca a paciência.',
    minJogadores: 3,
    maxJogadores: 12,
    tempoDeRodadaSegundos: 30,
  };

  criarEstadoInicial(
    jogadores: Player[],
    anfitriaoId: PlayerId,
    opcoes?: unknown,
  ): FazAiState {
    const config = normalizarOpcoes(opcoes);
    const ordemJogadores = embaralhar(jogadores.map((j) => j.id));
    const totalTurnos = ordemJogadores.length * config.rodadasPorJogador;
    const agora = Date.now();

    return {
      fase: 'playing',
      rodada: 1,
      jogadorAtualId: ordemJogadores[0] ?? null,
      estadoPublico: {
        subFase: 'preparando',
        anfitriaoId,
        duracaoSegundos: config.duracaoSegundos,
        rodadasPorJogador: config.rodadasPorJogador,
        categorias: config.categorias,
        intensidade: config.intensidade,
        indiceTurno: 0,
        ordemJogadores,
        turnosJogados: 0,
        totalTurnos,
        turnoIniciadoEm: null,
        prazoTurnoEm: null,
        cartaAtualIniciadaEm: null,
        melhorStreak: 0,
        pontos: Object.fromEntries(ordemJogadores.map((id) => [id, 0])),
        historico: [],
        cartasUsadas: [],
        ...porTurnoVazio(),
      },
      estadosPrivados: estadosPrivadosVazios(jogadores),
      vencedorIds: [],
      iniciadoEm: agora,
      atualizadoEm: agora,
    };
  }

  processarAcao(estado: FazAiState, acao: FazAiAction): FazAiState {
    switch (acao.tipo) {
      case 'comecar':
        return this.tratarComecar(estado, acao.jogadorId, acao.em);
      case 'acertou':
        return this.tratarResultadoCarta(estado, 'acertou', acao.em);
      case 'passou':
        return this.tratarResultadoCarta(estado, 'passou', acao.em);
      case 'tempo_esgotado':
        return this.tratarTempoEsgotado(estado, acao.em);
      case 'avancar':
        return this.tratarAvancar(estado, acao.em);
    }
  }

  avancarFase(estado: FazAiState): FazAiState {
    return estado;
  }

  verificarFim(estado: FazAiState): boolean {
    return estado.estadoPublico.subFase === 'finalizado';
  }

  private tratarComecar(
    estado: FazAiState,
    jogadorId: PlayerId,
    em: number,
  ): FazAiState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'preparando') return estado;
    const jogadorAtualId =
      estadoPublico.ordemJogadores[estadoPublico.indiceTurno];
    if (jogadorId !== jogadorAtualId) return estado;

    const carta = selecionarProximaCarta(estadoPublico);

    return {
      ...estado,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorId]: { carta },
      },
      estadoPublico: {
        ...estadoPublico,
        subFase: 'atuando',
        turnoIniciadoEm: em,
        prazoTurnoEm: em + estadoPublico.duracaoSegundos * 1000,
        cartaAtualIniciadaEm: em,
        cartasUsadas: [...estadoPublico.cartasUsadas, carta.id],
        ...porTurnoVazio(),
      },
      atualizadoEm: em,
    };
  }

  private tratarResultadoCarta(
    estado: FazAiState,
    resultado: 'acertou' | 'passou',
    em: number,
  ): FazAiState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'atuando') return estado;

    const jogadorAtualId =
      estadoPublico.ordemJogadores[estadoPublico.indiceTurno]!;
    const cartaAtual = estado.estadosPrivados[jogadorAtualId]?.carta;
    if (!cartaAtual) return estado;

    const historicoCarta = criarHistoricoCarta(
      cartaAtual,
      resultado,
      estadoPublico.cartaAtualIniciadaEm,
      em,
    );
    const proximoAcertosTurnoAtual =
      estadoPublico.acertosTurnoAtual + (resultado === 'acertou' ? 1 : 0);
    const proximoPassesTurnoAtual =
      estadoPublico.passesTurnoAtual + (resultado === 'passou' ? 1 : 0);
    const novoStreak =
      resultado === 'acertou' ? estadoPublico.streakTurnoAtual + 1 : 0;
    const proximaCartasUsadas = [...estadoPublico.cartasUsadas];
    const proximaCarta = selecionarCartaFazAi(
      proximaCartasUsadas,
      estadoPublico.categorias,
      estadoPublico.intensidade,
      estadoPublico.turnosJogados,
      estadoPublico.totalTurnos,
      {
        acertosTurnoAtual: proximoAcertosTurnoAtual,
        passesTurnoAtual: proximoPassesTurnoAtual,
        streakTurnoAtual: novoStreak,
      },
    );
    proximaCartasUsadas.push(proximaCarta.id);

    const pontos = { ...estadoPublico.pontos };
    if (resultado === 'acertou') {
      pontos[jogadorAtualId] = (pontos[jogadorAtualId] ?? 0) + 1;
    }

    return {
      ...estado,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorAtualId]: { carta: proximaCarta },
      },
      estadoPublico: {
        ...estadoPublico,
        pontos,
        cartasUsadas: proximaCartasUsadas,
        cartaAtualIniciadaEm: em,
        acertosTurnoAtual: proximoAcertosTurnoAtual,
        passesTurnoAtual: proximoPassesTurnoAtual,
        streakTurnoAtual: novoStreak,
        melhorStreak: Math.max(estadoPublico.melhorStreak, novoStreak),
        historicoTurnoAtual: [
          ...estadoPublico.historicoTurnoAtual,
          historicoCarta,
        ],
      },
      atualizadoEm: em,
    };
  }

  private tratarTempoEsgotado(estado: FazAiState, em: number): FazAiState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'atuando') return estado;

    const jogadorAtualId =
      estadoPublico.ordemJogadores[estadoPublico.indiceTurno]!;
    const cartaAtual = estado.estadosPrivados[jogadorAtualId]?.carta;
    const historicoTurnoAtual = cartaAtual
      ? [
          ...estadoPublico.historicoTurnoAtual,
          criarHistoricoCarta(
            cartaAtual,
            'passou',
            estadoPublico.cartaAtualIniciadaEm,
            em,
          ),
        ]
      : estadoPublico.historicoTurnoAtual;

    const estadoComCartaFinal: FazAiState = {
      ...estado,
      estadoPublico: {
        ...estadoPublico,
        passesTurnoAtual: estadoPublico.passesTurnoAtual + (cartaAtual ? 1 : 0),
        historicoTurnoAtual,
      },
    };
    const historicoTurno = criarHistoricoTurno(
      estadoComCartaFinal,
      'tempo_esgotado',
      em,
    );

    return {
      ...estadoComCartaFinal,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorAtualId]: { carta: null },
      },
      estadoPublico: {
        ...estadoComCartaFinal.estadoPublico,
        subFase: 'resumo_turno',
        prazoTurnoEm: null,
        cartaAtualIniciadaEm: null,
        streakTurnoAtual: 0,
        historico: [...estadoPublico.historico, historicoTurno],
      },
      atualizadoEm: em,
    };
  }

  private tratarAvancar(estado: FazAiState, em: number): FazAiState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'resumo_turno') return estado;

    const turnosJogados = estadoPublico.turnosJogados + 1;
    if (turnosJogados >= estadoPublico.totalTurnos) {
      return this.finalizarPartida(estado, turnosJogados, em);
    }

    const proximoIndice =
      (estadoPublico.indiceTurno + 1) % estadoPublico.ordemJogadores.length;
    const proximoJogadorId = estadoPublico.ordemJogadores[proximoIndice]!;
    const proximaRodada = estado.rodada + (proximoIndice === 0 ? 1 : 0);

    return {
      ...estado,
      rodada: proximaRodada,
      jogadorAtualId: proximoJogadorId,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'preparando',
        indiceTurno: proximoIndice,
        turnosJogados,
        turnoIniciadoEm: null,
        prazoTurnoEm: null,
        cartaAtualIniciadaEm: null,
        ...porTurnoVazio(),
      },
      atualizadoEm: em,
    };
  }

  private finalizarPartida(
    estado: FazAiState,
    turnosJogados: number,
    em: number,
  ): FazAiState {
    const { estadoPublico } = estado;
    const maxPontos = Math.max(0, ...Object.values(estadoPublico.pontos));
    const vencedorIds = estadoPublico.ordemJogadores.filter(
      (id) => (estadoPublico.pontos[id] ?? 0) === maxPontos,
    );

    return {
      ...estado,
      fase: 'results',
      vencedorIds,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'finalizado',
        turnosJogados,
        turnoIniciadoEm: null,
        prazoTurnoEm: null,
        cartaAtualIniciadaEm: null,
      },
      atualizadoEm: em,
    };
  }
}

export function criarResultadoFinalFazAi(
  estadoPublico: FazAiPublicState,
): ResultadoFazAiFinalizado {
  const acertosPorJogador: Record<PlayerId, number> = Object.fromEntries(
    estadoPublico.ordemJogadores.map((id) => [id, 0]),
  );
  const passesPorJogador: Record<PlayerId, number> = Object.fromEntries(
    estadoPublico.ordemJogadores.map((id) => [id, 0]),
  );
  const energiaPorTurno: number[] = [];
  const vergonhaPorTurno: number[] = [];
  const categorias = new Map<CategoriaFazAiId, number>();

  for (const turno of estadoPublico.historico) {
    acertosPorJogador[turno.jogadorId] =
      (acertosPorJogador[turno.jogadorId] ?? 0) + turno.acertos;
    passesPorJogador[turno.jogadorId] =
      (passesPorJogador[turno.jogadorId] ?? 0) + turno.passes;
    energiaPorTurno.push(turno.energiaMedia);
    vergonhaPorTurno.push(turno.vergonhaMedia);
    for (const carta of turno.cartas) {
      categorias.set(
        carta.categoria,
        (categorias.get(carta.categoria) ?? 0) + 1,
      );
    }
  }

  const jogadores = estadoPublico.ordemJogadores;
  const quemMaisAcertaId =
    jogadores.length > 0
      ? jogadores.reduce((melhor, id) =>
          (acertosPorJogador[id] ?? 0) > (acertosPorJogador[melhor] ?? 0)
            ? id
            : melhor,
        )
      : null;
  const quemAtuaPiorId =
    jogadores.length > 0
      ? jogadores.reduce((pior, id) =>
          (passesPorJogador[id] ?? 0) > (passesPorJogador[pior] ?? 0)
            ? id
            : pior,
        )
      : null;
  const jogadorMaisCaoticoId =
    estadoPublico.historico.length > 0
      ? estadoPublico.historico.reduce((melhor, turno) =>
          turno.energiaMedia + turno.vergonhaMedia + turno.passes >
          melhor.energiaMedia + melhor.vergonhaMedia + melhor.passes
            ? turno
            : melhor,
        ).jogadorId
      : null;
  const categoriasFavoritas = [...categorias.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoria]) => categoria);

  return {
    totalTurnos: estadoPublico.historico.length,
    totalCartas: estadoPublico.historico.reduce(
      (acc, turno) => acc + turno.cartas.length,
      0,
    ),
    acertosPorJogador,
    passesPorJogador,
    jogadorMaisCaoticoId,
    quemMaisAcertaId,
    quemAtuaPiorId,
    energiaMediaGrupo: media(energiaPorTurno),
    vergonhaColetiva: media(vergonhaPorTurno),
    categoriasFavoritas,
  };
}

export const fazAiEngine = new FazAiEngine();
