import { GameEngine } from '@/engine/GameEngine';
import type {
  GameConfig,
  GameState,
  Player,
  PlayerId,
} from '@/engine/types';
import { selecionarCartaInteligente } from '@/games/na-ponta-da-lingua/cardSelection';
import type {
  HistoricoTurnoItem,
  NPLAction,
  NPLPrivateState,
  NPLPublicState,
  OpoesNPL,
} from '@/games/na-ponta-da-lingua/types';
import { embaralhar } from '@/utils/random';

type NPLState = GameState<NPLPublicState, NPLPrivateState>;

const OPCOES_PADRAO: OpoesNPL = {
  duracaoSegundos: 60,
  rodadasPorJogador: 3,
  dificuldade: 'todas',
  categorias: 'todas',
};

const DURACAO_VALIDAS = new Set([45, 60, 90]);

function normalizarOpcoes(opcoes: unknown): OpoesNPL {
  const o = (opcoes ?? {}) as Partial<OpoesNPL>;
  const duracaoSegundos = (DURACAO_VALIDAS.has(o.duracaoSegundos as number)
    ? o.duracaoSegundos
    : OPCOES_PADRAO.duracaoSegundos) as OpoesNPL['duracaoSegundos'];
  const rodadasPorJogador = Math.max(
    1,
    Math.min(10, Number.isFinite(o.rodadasPorJogador) ? Number(o.rodadasPorJogador) : OPCOES_PADRAO.rodadasPorJogador),
  );
  const dificuldade =
    o.dificuldade === 'facil' || o.dificuldade === 'medio' || o.dificuldade === 'dificil' || o.dificuldade === 'colapso' || o.dificuldade === 'todas'
      ? o.dificuldade
      : OPCOES_PADRAO.dificuldade;
  const categorias =
    o.categorias === 'todas' || (Array.isArray(o.categorias) && o.categorias.length > 0)
      ? o.categorias
      : OPCOES_PADRAO.categorias;
  return { duracaoSegundos, rodadasPorJogador, dificuldade, categorias };
}

// ─── State helpers ────────────────────────────────────────────────────────────

function estadosPrivadosVazios(jogadores: Player[]): Record<PlayerId, NPLPrivateState> {
  return Object.fromEntries(jogadores.map((j) => [j.id, { carta: null }]));
}

function perTurnoVazio() {
  return {
    acertosTurnoAtual: 0,
    passousTurnoAtual: 0,
    streakTurnoAtual: 0,
    melhorStreakTurnoAtual: 0,
    historicoTurnoAtual: [] as HistoricoTurnoItem[],
  };
}

// ─── Engine ───────────────────────────────────────────────────────────────────

class NaPontaDaLinguaEngine extends GameEngine<NPLPublicState, NPLPrivateState, NPLAction> {
  readonly config: GameConfig = {
    id: 'na-ponta-da-lingua',
    nome: 'Na Ponta da Língua',
    descricao:
      'Faça o grupo adivinhar o máximo de palavras possível no tempo. As proibidas não perdoam.',
    minJogadores: 2,
    maxJogadores: 10,
    tempoDeRodadaSegundos: 60,
  };

  criarEstadoInicial(jogadores: Player[], anfitriaoId: PlayerId, opcoes?: unknown): NPLState {
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
        dificuldade: config.dificuldade,
        categorias: config.categorias,
        indiceTurno: 0,
        ordemJogadores,
        turnosJogados: 0,
        totalTurnos,
        turnoIniciadoEm: null,
        prazoTurnoEm: null,
        pontos: Object.fromEntries(ordemJogadores.map((id) => [id, 0])),
        historico: [],
        cartasUsadas: [],
        ...perTurnoVazio(),
      },
      estadosPrivados: estadosPrivadosVazios(jogadores),
      vencedorIds: [],
      iniciadoEm: agora,
      atualizadoEm: agora,
    };
  }

  processarAcao(estado: NPLState, acao: NPLAction): NPLState {
    switch (acao.tipo) {
      case 'pronto':
        return this.tratarPronto(estado, acao.jogadorId, acao.em);
      case 'acertou':
        return this.tratarAcertou(estado, acao.em);
      case 'passou':
        return this.tratarPassou(estado, acao.em);
      case 'tempo_esgotado':
        return this.tratarTempoEsgotado(estado, acao.em);
      case 'avancar':
        return this.tratarAvancar(estado, acao.em);
    }
  }

  avancarFase(estado: NPLState): NPLState {
    return estado;
  }

  verificarFim(estado: NPLState): boolean {
    return estado.estadoPublico.subFase === 'finalizado';
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  private tratarPronto(estado: NPLState, jogadorId: PlayerId, em: number): NPLState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'preparando') return estado;
    const jogadorAtual = estadoPublico.ordemJogadores[estadoPublico.indiceTurno];
    if (jogadorId !== jogadorAtual) return estado;

    const carta = selecionarCartaInteligente(
      estadoPublico.cartasUsadas,
      estadoPublico.dificuldade,
      estadoPublico.categorias,
      estadoPublico.turnosJogados,
      estadoPublico.totalTurnos,
    );
    const prazoTurnoEm = em + estadoPublico.duracaoSegundos * 1000;

    return {
      ...estado,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorId]: { carta },
      },
      estadoPublico: {
        ...estadoPublico,
        subFase: 'jogando',
        turnoIniciadoEm: em,
        prazoTurnoEm,
        cartasUsadas: [...estadoPublico.cartasUsadas, carta.id],
        ...perTurnoVazio(),
      },
      atualizadoEm: em,
    };
  }

  /**
   * Palavra acertada — permanece em `jogando`, sorteia próxima carta.
   * A seleção inteligente usa o cartasUsadas atualizado como contexto.
   */
  private tratarAcertou(estado: NPLState, em: number): NPLState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'jogando') return estado;

    const jogadorAtualId = estadoPublico.ordemJogadores[estadoPublico.indiceTurno]!;
    const cartaAtual = estado.estadosPrivados[jogadorAtualId]?.carta;

    const novoStreak = estadoPublico.streakTurnoAtual + 1;
    const novoMelhorStreak = Math.max(novoStreak, estadoPublico.melhorStreakTurnoAtual);
    const novoHistorico: HistoricoTurnoItem[] = cartaAtual
      ? [...estadoPublico.historicoTurnoAtual, { palavra: cartaAtual.palavra, resultado: 'acertou' }]
      : estadoPublico.historicoTurnoAtual;

    const novaCartasUsadas = [...estadoPublico.cartasUsadas];
    const proximaCarta = selecionarCartaInteligente(
      novaCartasUsadas,
      estadoPublico.dificuldade,
      estadoPublico.categorias,
      estadoPublico.turnosJogados,
      estadoPublico.totalTurnos,
    );
    novaCartasUsadas.push(proximaCarta.id);

    const novosPontos = { ...estadoPublico.pontos };
    novosPontos[jogadorAtualId] = (novosPontos[jogadorAtualId] ?? 0) + 1;

    return {
      ...estado,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorAtualId]: { carta: proximaCarta },
      },
      estadoPublico: {
        ...estadoPublico,
        pontos: novosPontos,
        cartasUsadas: novaCartasUsadas,
        acertosTurnoAtual: estadoPublico.acertosTurnoAtual + 1,
        streakTurnoAtual: novoStreak,
        melhorStreakTurnoAtual: novoMelhorStreak,
        historicoTurnoAtual: novoHistorico,
      },
      atualizadoEm: em,
    };
  }

  /**
   * Palavra passada — permanece em `jogando`, sorteia próxima carta.
   */
  private tratarPassou(estado: NPLState, em: number): NPLState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'jogando') return estado;

    const jogadorAtualId = estadoPublico.ordemJogadores[estadoPublico.indiceTurno]!;
    const cartaAtual = estado.estadosPrivados[jogadorAtualId]?.carta;

    const novoHistorico: HistoricoTurnoItem[] = cartaAtual
      ? [...estadoPublico.historicoTurnoAtual, { palavra: cartaAtual.palavra, resultado: 'passou' }]
      : estadoPublico.historicoTurnoAtual;

    const novaCartasUsadas = [...estadoPublico.cartasUsadas];
    const proximaCarta = selecionarCartaInteligente(
      novaCartasUsadas,
      estadoPublico.dificuldade,
      estadoPublico.categorias,
      estadoPublico.turnosJogados,
      estadoPublico.totalTurnos,
    );
    novaCartasUsadas.push(proximaCarta.id);

    return {
      ...estado,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorAtualId]: { carta: proximaCarta },
      },
      estadoPublico: {
        ...estadoPublico,
        cartasUsadas: novaCartasUsadas,
        passousTurnoAtual: estadoPublico.passousTurnoAtual + 1,
        streakTurnoAtual: 0,
        historicoTurnoAtual: novoHistorico,
      },
      atualizadoEm: em,
    };
  }

  /**
   * Timer esgotado → `resumo_turno`.
   */
  private tratarTempoEsgotado(estado: NPLState, em: number): NPLState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'jogando') return estado;

    return {
      ...estado,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'resumo_turno',
        prazoTurnoEm: null,
        streakTurnoAtual: 0,
      },
      atualizadoEm: em,
    };
  }

  /**
   * Avança de `resumo_turno` → próximo `preparando` ou `finalizado`.
   */
  private tratarAvancar(estado: NPLState, em: number): NPLState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'resumo_turno') return estado;

    const turnosJogados = estadoPublico.turnosJogados + 1;
    if (turnosJogados >= estadoPublico.totalTurnos) {
      return this.finalizarPartida(estado, turnosJogados, em);
    }

    const proximoIndice = (estadoPublico.indiceTurno + 1) % estadoPublico.ordemJogadores.length;
    const proximoJogadorId = estadoPublico.ordemJogadores[proximoIndice]!;
    const proximaRodada = estado.rodada + (proximoIndice === 0 ? 1 : 0);

    const novosPrivados = { ...estado.estadosPrivados };
    const jogadorAnteriorId = estadoPublico.ordemJogadores[estadoPublico.indiceTurno]!;
    novosPrivados[jogadorAnteriorId] = { carta: null };

    return {
      ...estado,
      rodada: proximaRodada,
      jogadorAtualId: proximoJogadorId,
      estadosPrivados: novosPrivados,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'preparando',
        indiceTurno: proximoIndice,
        turnosJogados,
        turnoIniciadoEm: null,
        prazoTurnoEm: null,
        ...perTurnoVazio(),
      },
      atualizadoEm: em,
    };
  }

  private finalizarPartida(estado: NPLState, turnosJogados: number, em: number): NPLState {
    const { estadoPublico } = estado;

    let maxPontos = 0;
    for (const p of Object.values(estadoPublico.pontos)) {
      if (p > maxPontos) maxPontos = p;
    }
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
        prazoTurnoEm: null,
        turnoIniciadoEm: null,
      },
      atualizadoEm: em,
    };
  }
}

export const naPontaDaLinguaEngine = new NaPontaDaLinguaEngine();
