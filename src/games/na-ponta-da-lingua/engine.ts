import { GameEngine } from '@/engine/GameEngine';
import type {
  GameConfig,
  GameState,
  Player,
  PlayerId,
} from '@/engine/types';
import { CARTAS } from '@/games/na-ponta-da-lingua/prompts';
import type {
  Carta,
  CategoriaIdNPL,
  DificuldadeNPL,
  NPLAction,
  NPLPrivateState,
  NPLPublicState,
  OpoesNPL,
  ResultadoRodada,
} from '@/games/na-ponta-da-lingua/types';
import { embaralhar, sortearUm } from '@/utils/random';

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
    o.dificuldade === 'facil' || o.dificuldade === 'medio' || o.dificuldade === 'dificil' || o.dificuldade === 'todas'
      ? o.dificuldade
      : OPCOES_PADRAO.dificuldade;
  const categorias =
    o.categorias === 'todas' || (Array.isArray(o.categorias) && o.categorias.length > 0)
      ? o.categorias
      : OPCOES_PADRAO.categorias;
  return { duracaoSegundos, rodadasPorJogador, dificuldade, categorias };
}

function selecionarCarta(
  usadas: string[],
  dificuldade: DificuldadeNPL | 'todas',
  categorias: CategoriaIdNPL[] | 'todas',
): Carta {
  const pool = CARTAS.filter(
    (c) =>
      !usadas.includes(c.id) &&
      (dificuldade === 'todas' || c.dificuldade === dificuldade) &&
      (categorias === 'todas' || categorias.includes(c.categoria)),
  );
  // Fallback: ignore used restriction when pool empty.
  const fonte = pool.length > 0 ? pool : CARTAS.filter(
    (c) =>
      (dificuldade === 'todas' || c.dificuldade === dificuldade) &&
      (categorias === 'todas' || categorias.includes(c.categoria)),
  );
  return sortearUm(fonte.length > 0 ? fonte : [...CARTAS]);
}

function estadosPrivadosVazios(jogadores: Player[]): Record<PlayerId, NPLPrivateState> {
  return Object.fromEntries(jogadores.map((j) => [j.id, { carta: null }]));
}

class NaPontaDaLinguaEngine extends GameEngine<NPLPublicState, NPLPrivateState, NPLAction> {
  readonly config: GameConfig = {
    id: 'na-ponta-da-lingua',
    nome: 'Na Ponta da Língua',
    descricao:
      'Faça o grupo adivinhar a palavra sem usar as proibidas. O tempo está acabando.',
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
        indiceTurno: 0,
        ordemJogadores,
        turnosJogados: 0,
        totalTurnos,
        turnoIniciadoEm: null,
        prazoTurnoEm: null,
        pontos: Object.fromEntries(ordemJogadores.map((id) => [id, 0])),
        historico: [],
        ultimoResultado: null,
        ultimaPalavra: null,
        cartasUsadas: [],
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
        return this.tratarFimTurno(estado, 'acertou', acao.em);
      case 'passou':
        return this.tratarFimTurno(estado, 'passou', acao.em);
      case 'tempo_esgotado':
        return this.tratarFimTurno(estado, 'tempo_esgotado', acao.em);
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

    const carta = selecionarCarta(
      estadoPublico.cartasUsadas,
      estadoPublico.subFase === 'preparando' ? 'todas' : 'todas', // filtered by opcoes stored in config
      'todas',
    );

    const prazoTurnoEm = em + estadoPublico.duracaoSegundos * 1000;

    // Reveal carta only to current player.
    const novosPrivados = {
      ...estado.estadosPrivados,
      [jogadorId]: { carta },
    };

    return {
      ...estado,
      estadosPrivados: novosPrivados,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'jogando',
        turnoIniciadoEm: em,
        prazoTurnoEm,
        cartasUsadas: [...estadoPublico.cartasUsadas, carta.id],
      },
      atualizadoEm: em,
    };
  }

  private tratarFimTurno(estado: NPLState, resultado: ResultadoRodada, em: number): NPLState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'jogando') return estado;

    const jogadorAtualId = estadoPublico.ordemJogadores[estadoPublico.indiceTurno]!;
    const cartaAtual = estado.estadosPrivados[jogadorAtualId]?.carta;
    const duracaoMs = estadoPublico.turnoIniciadoEm != null ? em - estadoPublico.turnoIniciadoEm : 0;

    const novosPontos = { ...estadoPublico.pontos };
    if (resultado === 'acertou') {
      novosPontos[jogadorAtualId] = (novosPontos[jogadorAtualId] ?? 0) + 1;
    }

    const registroHistorico = cartaAtual
      ? {
          rodada: estado.rodada,
          jogadorId: jogadorAtualId,
          carta: { palavra: cartaAtual.palavra, proibidas: [...cartaAtual.proibidas] },
          resultado,
          duracaoMs,
        }
      : null;

    const subFase = resultado === 'acertou' ? 'acertou' : 'passou';

    return {
      ...estado,
      estadoPublico: {
        ...estadoPublico,
        subFase,
        pontos: novosPontos,
        ultimoResultado: resultado,
        ultimaPalavra: cartaAtual?.palavra ?? null,
        historico: registroHistorico
          ? [...estadoPublico.historico, registroHistorico]
          : estadoPublico.historico,
      },
      atualizadoEm: em,
    };
  }

  private tratarAvancar(estado: NPLState, em: number): NPLState {
    const { estadoPublico } = estado;
    const subFaseAtual = estadoPublico.subFase;
    if (subFaseAtual !== 'acertou' && subFaseAtual !== 'passou') return estado;

    const turnosJogados = estadoPublico.turnosJogados + 1;
    if (turnosJogados >= estadoPublico.totalTurnos) {
      return this.finalizarPartida(estado, turnosJogados, em);
    }

    // Advance to next player in rotation.
    const proximoIndice = (estadoPublico.indiceTurno + 1) % estadoPublico.ordemJogadores.length;
    const proximoJogadorId = estadoPublico.ordemJogadores[proximoIndice]!;
    const proximaRodada =
      estado.rodada + (proximoIndice === 0 ? 1 : 0);

    // Clear private state for previous player.
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
        ultimoResultado: null,
        ultimaPalavra: null,
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
