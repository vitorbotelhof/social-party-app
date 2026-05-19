import { GameEngine } from '@/engine/GameEngine';
import type {
  GameConfig,
  GameState,
  Player,
  PlayerId,
} from '@/engine/types';
import { PROMPTS } from '@/games/most-likely-to/prompts';
import type {
  EnergiaPrompt,
  ModoMostLikely,
  MostLikelyAction,
  MostLikelyPrivateState,
  MostLikelyPublicState,
  OpcoesMostLikely,
  ResultadoRodada,
} from '@/games/most-likely-to/types';
import { embaralhar, sortearUm } from '@/utils/random';

type MostLikelyState = GameState<MostLikelyPublicState, MostLikelyPrivateState>;

const TOTAL_RODADAS_PADRAO = 10;
const TOTAL_RODADAS_MIN = 3;
const TOTAL_RODADAS_MAX = 20;

const OPCOES_PADRAO: OpcoesMostLikely = {
  totalRodadas: TOTAL_RODADAS_PADRAO,
  modo: 'classico',
};

function normalizarOpcoes(opcoes: unknown): OpcoesMostLikely {
  const o = (opcoes ?? {}) as Partial<OpcoesMostLikely>;
  const totalSolicitado = Number.isFinite(o.totalRodadas)
    ? Number(o.totalRodadas)
    : OPCOES_PADRAO.totalRodadas;
  const totalRodadas = Math.max(
    TOTAL_RODADAS_MIN,
    Math.min(totalSolicitado, TOTAL_RODADAS_MAX),
  );
  const modo: ModoMostLikely =
    o.modo === 'classico' || o.modo === 'sincero'
      ? o.modo
      : OPCOES_PADRAO.modo;
  return { totalRodadas, modo };
}

/**
 * Seleciona o próximo prompt respeitando a progressão de energia e
 * evitando repetições da sessão atual.
 *
 * Rodada 1 → apenas Leve.
 * Rodadas 2-3 → Leve + Médio.
 * Rodadas 4+ → Leve + Médio (+ Intenso em modo Sincero).
 */
function selecionarProximo(
  usados: number[],
  rodada: number,
  modo: ModoMostLikely,
): { texto: string; indice: number } {
  const energiasPermitidas: EnergiaPrompt[] = (() => {
    if (rodada === 1) return ['leve'];
    if (rodada <= 3) return ['leve', 'medio'];
    return modo === 'sincero'
      ? ['leve', 'medio', 'intenso']
      : ['leve', 'medio'];
  })();

  const candidatos = PROMPTS.map((p, i) => ({ p, i })).filter(
    ({ p, i }) => energiasPermitidas.includes(p.energia) && !usados.includes(i),
  );

  // Fallback: se esgotou todos os da energia permitida, reabre sem restrição de uso.
  const pool =
    candidatos.length > 0
      ? candidatos
      : PROMPTS.map((p, i) => ({ p, i })).filter(({ p }) =>
          energiasPermitidas.includes(p.energia),
        );

  const escolhido = sortearUm(pool);
  return { texto: escolhido.p.texto, indice: escolhido.i };
}

/**
 * Conta votos e retorna o vencedor da rodada.
 * Empate: primeiro na ordemJogadores (sem aleatoriedade server-side).
 */
function resolverVotos(
  votos: Record<PlayerId, PlayerId>,
  ordemJogadores: PlayerId[],
): { vencedorId: PlayerId; totalVotos: number; foiEmpate: boolean } {
  const contagem = new Map<PlayerId, number>();
  for (const alvoId of Object.values(votos)) {
    contagem.set(alvoId, (contagem.get(alvoId) ?? 0) + 1);
  }

  let maxVotos = 0;
  for (const c of contagem.values()) {
    if (c > maxVotos) maxVotos = c;
  }

  // Candidatos empatados no máximo, ordenados pela ordem original dos jogadores.
  const empatados = ordemJogadores.filter(
    (id) => (contagem.get(id) ?? 0) === maxVotos,
  );
  const foiEmpate = empatados.length > 1;
  // Desempate: primeiro na ordem (determinístico).
  const vencedorId = empatados[0]!;

  return { vencedorId, totalVotos: maxVotos, foiEmpate };
}

class MostLikelyEngine extends GameEngine<
  MostLikelyPublicState,
  MostLikelyPrivateState,
  MostLikelyAction
> {
  readonly config: GameConfig = {
    id: 'most-likely-to',
    nome: 'Most Likely To',
    descricao:
      'O grupo vota em quem melhor representa cada situação. O reveal é o coração do jogo.',
    minJogadores: 3,
    maxJogadores: 10,
    tempoDeRodadaSegundos: 30,
  };

  criarEstadoInicial(
    jogadores: Player[],
    anfitriaoId: PlayerId,
    opcoes?: unknown,
  ): MostLikelyState {
    const config = normalizarOpcoes(opcoes);
    const ordemJogadores = embaralhar(jogadores.map((j) => j.id));

    const { texto: promptAtual, indice } = selecionarProximo([], 1, config.modo);

    // Todos os jogadores têm estado privado vazio — MLT não tem informação assimétrica.
    const estadosPrivados = Object.fromEntries(
      jogadores.map((j) => [j.id, {} as MostLikelyPrivateState]),
    );

    const agora = Date.now();
    return {
      fase: 'voting',
      rodada: 1,
      jogadorAtualId: null, // sem sistema de turno
      estadoPublico: {
        subFase: 'votando',
        anfitriaoId,
        totalRodadas: config.totalRodadas,
        modo: config.modo,
        ordemJogadores,
        promptAtual,
        rodadaIniciadaEm: agora,
        votos: {},
        vencedorRodadaAtual: null,
        foiEmpate: false,
        resultados: [],
        indicesPromptUsados: [indice],
      },
      estadosPrivados,
      vencedorIds: [],
      iniciadoEm: agora,
      atualizadoEm: agora,
    };
  }

  processarAcao(estado: MostLikelyState, acao: MostLikelyAction): MostLikelyState {
    switch (acao.tipo) {
      case 'votar':
        return this.tratarVotar(estado, acao.jogadorId, acao.payload.alvoId, acao.em);
      case 'forcar_reveal':
        return this.tratarForcarReveal(estado, acao.em);
      case 'avancar_rodada':
        return this.tratarAvancarRodada(estado, acao.jogadorId, acao.em);
    }
  }

  avancarFase(estado: MostLikelyState): MostLikelyState {
    // MLT conduz todas as transições via processarAcao.
    return estado;
  }

  verificarFim(estado: MostLikelyState): boolean {
    return estado.estadoPublico.subFase === 'finalizado';
  }

  // ---------- handlers privados ----------

  private tratarVotar(
    estado: MostLikelyState,
    eleitorId: PlayerId,
    alvoId: PlayerId,
    em: number,
  ): MostLikelyState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'votando') return estado;
    if (eleitorId === alvoId) return estado;
    if (estadoPublico.votos[eleitorId]) return estado; // voto já registrado
    if (!estadoPublico.ordemJogadores.includes(alvoId)) return estado;

    const votos = { ...estadoPublico.votos, [eleitorId]: alvoId };
    const todosVotaram =
      Object.keys(votos).length === estadoPublico.ordemJogadores.length;

    if (!todosVotaram) {
      return {
        ...estado,
        estadoPublico: { ...estadoPublico, votos },
        atualizadoEm: em,
      };
    }

    return this.resolverRodada(estado, votos, em);
  }

  private tratarForcarReveal(estado: MostLikelyState, em: number): MostLikelyState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'votando') return estado;
    const totalEsperado = estadoPublico.ordemJogadores.length;
    if (Object.keys(estadoPublico.votos).length < totalEsperado) return estado;
    return this.resolverRodada(estado, estadoPublico.votos, em);
  }

  private tratarAvancarRodada(
    estado: MostLikelyState,
    jogadorId: PlayerId,
    em: number,
  ): MostLikelyState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'reveal') return estado;
    if (jogadorId !== estadoPublico.anfitriaoId) return estado;

    const proximaRodada = estado.rodada + 1;
    if (proximaRodada > estadoPublico.totalRodadas) {
      return this.finalizarPartida(estado, em);
    }

    const { texto: novoPrompt, indice: novoIndice } = selecionarProximo(
      estadoPublico.indicesPromptUsados,
      proximaRodada,
      estadoPublico.modo,
    );

    return {
      ...estado,
      fase: 'voting',
      rodada: proximaRodada,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'votando',
        promptAtual: novoPrompt,
        rodadaIniciadaEm: em,
        votos: {},
        vencedorRodadaAtual: null,
        foiEmpate: false,
        indicesPromptUsados: [...estadoPublico.indicesPromptUsados, novoIndice],
      },
      atualizadoEm: em,
    };
  }

  // ---------- resolução de rodada ----------

  private resolverRodada(
    estado: MostLikelyState,
    votos: Record<PlayerId, PlayerId>,
    em: number,
  ): MostLikelyState {
    const { estadoPublico } = estado;
    const { vencedorId, totalVotos, foiEmpate } = resolverVotos(
      votos,
      estadoPublico.ordemJogadores,
    );

    const resultado: ResultadoRodada = {
      rodada: estado.rodada,
      prompt: estadoPublico.promptAtual,
      vencedorId,
      totalVotosVencedor: totalVotos,
      votos,
      foiEmpate,
    };

    return {
      ...estado,
      fase: 'playing', // host precisa avançar manualmente
      estadoPublico: {
        ...estadoPublico,
        subFase: 'reveal',
        votos,
        vencedorRodadaAtual: vencedorId,
        foiEmpate,
        resultados: [...estadoPublico.resultados, resultado],
      },
      atualizadoEm: em,
    };
  }

  // ---------- finalização ----------

  private finalizarPartida(estado: MostLikelyState, em: number): MostLikelyState {
    // O "mais nomeado da noite" vira o vencedorIds — usado no retrato social.
    const contagem = new Map<PlayerId, number>();
    for (const r of estado.estadoPublico.resultados) {
      contagem.set(r.vencedorId, (contagem.get(r.vencedorId) ?? 0) + 1);
    }

    let maxRodadas = 0;
    for (const c of contagem.values()) {
      if (c > maxRodadas) maxRodadas = c;
    }

    const maisNomeados = estado.estadoPublico.ordemJogadores.filter(
      (id) => (contagem.get(id) ?? 0) === maxRodadas,
    );

    return {
      ...estado,
      fase: 'results',
      jogadorAtualId: null,
      estadoPublico: {
        ...estado.estadoPublico,
        subFase: 'finalizado',
      },
      vencedorIds: maisNomeados,
      atualizadoEm: em,
    };
  }
}

export const mostLikelyEngine = new MostLikelyEngine();
