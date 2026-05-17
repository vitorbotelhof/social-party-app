import { GameEngine } from '@/engine/GameEngine';
import type {
  GameConfig,
  GameState,
  Player,
  PlayerId,
} from '@/engine/types';
import { CATEGORIAS } from '@/games/mr-white/categorias';
import type {
  CategoriaId,
  Dificuldade,
  MrWhiteAction,
  MrWhitePrivateState,
  MrWhitePublicState,
  OpcoesMrWhite,
} from '@/games/mr-white/types';
import { embaralhar, sortearUm } from '@/utils/random';

type MrWhiteState = GameState<MrWhitePublicState, MrWhitePrivateState>;

const OPCOES_PADRAO: OpcoesMrWhite = {
  categoriaId: 'comidas',
  dificuldade: 'medio',
  numeroMrWhites: 1,
  duracaoTurnoSegundos: 60,
};

const MAX_MR_WHITES = 3;
const DURACOES_VALIDAS = new Set([0, 30, 60, 90]);

function calcularPrazoTurno(
  duracaoSegundos: number,
  agora: number,
): number | null {
  if (duracaoSegundos <= 0) return null;
  return agora + duracaoSegundos * 1000;
}

function ehCategoriaValida(valor: unknown): valor is CategoriaId {
  return typeof valor === 'string' && valor in CATEGORIAS;
}

function ehDificuldadeValida(valor: unknown): valor is Dificuldade {
  return valor === 'facil' || valor === 'medio' || valor === 'dificil';
}

function normalizarOpcoes(opcoes: unknown, totalJogadores: number): OpcoesMrWhite {
  const o = (opcoes ?? {}) as Partial<OpcoesMrWhite>;
  const categoriaId = ehCategoriaValida(o.categoriaId)
    ? o.categoriaId
    : OPCOES_PADRAO.categoriaId;
  const dificuldade = ehDificuldadeValida(o.dificuldade)
    ? o.dificuldade
    : OPCOES_PADRAO.dificuldade;
  const numeroSolicitado = Number.isFinite(o.numeroMrWhites)
    ? Number(o.numeroMrWhites)
    : OPCOES_PADRAO.numeroMrWhites;
  // Pelo menos 1 civil sempre.
  const maxPermitido = Math.max(1, totalJogadores - 1);
  const numeroMrWhites = Math.max(
    1,
    Math.min(numeroSolicitado, MAX_MR_WHITES, maxPermitido),
  );
  const duracaoSolicitada = Number(o.duracaoTurnoSegundos);
  const duracaoTurnoSegundos = DURACOES_VALIDAS.has(duracaoSolicitada)
    ? duracaoSolicitada
    : OPCOES_PADRAO.duracaoTurnoSegundos;
  return { categoriaId, dificuldade, numeroMrWhites, duracaoTurnoSegundos };
}

/** Normaliza texto para comparar palpites (remove acentos, espaços e case). */
// Combining diacritical marks (U+0300 a U+036F). Escapado para portabilidade.
const RE_ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizarPalavra(s: string): string {
  return s.normalize('NFD').replace(RE_ACENTOS, '').toLowerCase().trim();
}

class MrWhiteEngine extends GameEngine<
  MrWhitePublicState,
  MrWhitePrivateState,
  MrWhiteAction
> {
  readonly config: GameConfig = {
    id: 'mrwhite',
    nome: 'Mr White',
    descricao:
      'Quase todos recebem a mesma palavra secreta. Um (ou mais) é Mr White e não recebe palavra. Descubra quem é o impostor.',
    minJogadores: 3,
    maxJogadores: 12,
    tempoDeRodadaSegundos: 60,
  };

  criarEstadoInicial(
    jogadores: Player[],
    _anfitriaoId: PlayerId,
    opcoes?: unknown,
  ): MrWhiteState {
    const config = normalizarOpcoes(opcoes, jogadores.length);
    const categoria = CATEGORIAS[config.categoriaId];
    const par = sortearUm(categoria.palavras);

    const idsEmbaralhados = embaralhar(jogadores.map((j) => j.id));
    const mrWhiteIds = new Set(
      idsEmbaralhados.slice(0, config.numeroMrWhites),
    );

    const estadosPrivados: Record<PlayerId, MrWhitePrivateState> = {};
    for (const j of jogadores) {
      const ehMrWhite = mrWhiteIds.has(j.id);
      estadosPrivados[j.id] = {
        ehMrWhite,
        palavraSecreta: ehMrWhite ? null : par.civis,
      };
    }

    // Regra clássica: Mr White nunca começa dando dica (entregaria de cara).
    const ordemTurnos = this.ordemSemMrWhiteNoComeco(
      embaralhar(jogadores.map((j) => j.id)),
      mrWhiteIds,
    );

    const agora = Date.now();
    return {
      fase: 'playing',
      rodada: 1,
      jogadorAtualId: ordemTurnos[0] ?? null,
      estadoPublico: {
        subFase: 'revelando',
        categoriaId: config.categoriaId,
        dificuldade: config.dificuldade,
        numeroMrWhites: config.numeroMrWhites,
        duracaoTurnoSegundos: config.duracaoTurnoSegundos,
        prazoTurnoEm: null,
        ordemJogadores: ordemTurnos,
        idsPorAntiguidade: [...jogadores]
          .sort((a, b) => a.entrouEm - b.entrouEm)
          .map((j) => j.id),
        jogadoresQueViram: [],
        indiceTurno: 0,
        pistas: [],
        votos: {},
        eliminadosIds: [],
        jogadorAdivinhandoId: null,
        palpiteFinal: null,
        palpiteCorreto: null,
        vencedor: null,
        // Guardamos a palavra desde já, mas a UI só revela no fim.
        palavraRevelada: par.civis,
        mrWhiteIdsRevelados: [],
      },
      estadosPrivados,
      vencedorIds: [],
      iniciadoEm: agora,
      atualizadoEm: agora,
    };
  }

  processarAcao(estado: MrWhiteState, acao: MrWhiteAction): MrWhiteState {
    switch (acao.tipo) {
      case 'jogador_viu_palavra':
        return this.tratarRevelarPalavra(estado, acao.jogadorId, acao.em);
      case 'enviar_pista':
        return this.tratarEnviarPista(
          estado,
          acao.jogadorId,
          acao.payload.texto,
          acao.em,
        );
      case 'votar':
        return this.tratarVotar(
          estado,
          acao.jogadorId,
          acao.payload.alvoId,
          acao.em,
        );
      case 'palpite_final':
        return this.tratarPalpiteFinal(
          estado,
          acao.jogadorId,
          acao.payload.palavra,
          acao.em,
        );
      case 'forcar_resolucao_votacao':
        return this.tratarForcarResolucaoVotacao(estado, acao.em);
    }
  }

  private tratarForcarResolucaoVotacao(
    estado: MrWhiteState,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'votando') return estado;
    const total = estadoPublico.ordemJogadores.length;
    if (Object.keys(estadoPublico.votos).length < total) return estado;
    return this.resolverVotacao(estado, estadoPublico.votos, em);
  }

  avancarFase(estado: MrWhiteState): MrWhiteState {
    // Mr White conduz transições internamente via processarAcao.
    return estado;
  }

  verificarFim(estado: MrWhiteState): boolean {
    return estado.estadoPublico.vencedor !== null;
  }

  // ---------- handlers privados ----------

  private tratarRevelarPalavra(
    estado: MrWhiteState,
    jogadorId: PlayerId,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'revelando') return estado;
    if (estadoPublico.jogadoresQueViram.includes(jogadorId)) return estado;

    const queViram = [...estadoPublico.jogadoresQueViram, jogadorId];
    const todosViram = queViram.length === estadoPublico.ordemJogadores.length;

    return {
      ...estado,
      estadoPublico: {
        ...estadoPublico,
        jogadoresQueViram: queViram,
        subFase: todosViram ? 'dando_dicas' : 'revelando',
        prazoTurnoEm: todosViram
          ? calcularPrazoTurno(estadoPublico.duracaoTurnoSegundos, em)
          : null,
      },
      atualizadoEm: em,
    };
  }

  private tratarEnviarPista(
    estado: MrWhiteState,
    jogadorId: PlayerId,
    texto: string,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'dando_dicas') return estado;

    const esperadoId = estadoPublico.ordemJogadores[estadoPublico.indiceTurno];
    if (esperadoId !== jogadorId) return estado;

    // Texto vazio = jogador passou (auto-skip do timer).
    const textoLimpo = texto.trim();
    const textoFinal = textoLimpo.length === 0 ? '(passou)' : textoLimpo;

    const pistas = [
      ...estadoPublico.pistas,
      { jogadorId, texto: textoFinal, rodada: estado.rodada },
    ];
    const proximoIndice = estadoPublico.indiceTurno + 1;
    const acabouRodada =
      proximoIndice >= estadoPublico.ordemJogadores.length;

    if (acabouRodada) {
      return {
        ...estado,
        fase: 'voting',
        jogadorAtualId: null,
        estadoPublico: {
          ...estadoPublico,
          pistas,
          indiceTurno: proximoIndice,
          subFase: 'votando',
          prazoTurnoEm: null,
        },
        atualizadoEm: em,
      };
    }

    return {
      ...estado,
      jogadorAtualId: estadoPublico.ordemJogadores[proximoIndice] ?? null,
      estadoPublico: {
        ...estadoPublico,
        pistas,
        indiceTurno: proximoIndice,
        prazoTurnoEm: calcularPrazoTurno(estadoPublico.duracaoTurnoSegundos, em),
      },
      atualizadoEm: em,
    };
  }

  private tratarVotar(
    estado: MrWhiteState,
    eleitorId: PlayerId,
    alvoId: PlayerId,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'votando') return estado;
    if (eleitorId === alvoId) return estado;
    if (estadoPublico.votos[eleitorId]) return estado;

    const votos = { ...estadoPublico.votos, [eleitorId]: alvoId };
    const totalEsperado = estadoPublico.ordemJogadores.length;
    const todosVotaram = Object.keys(votos).length === totalEsperado;

    if (!todosVotaram) {
      return {
        ...estado,
        estadoPublico: { ...estadoPublico, votos },
        atualizadoEm: em,
      };
    }

    return this.resolverVotacao(estado, votos, em);
  }

  private resolverVotacao(
    estado: MrWhiteState,
    votos: Record<PlayerId, PlayerId>,
    em: number,
  ): MrWhiteState {
    // Conta votos por alvo.
    const contagem = new Map<PlayerId, number>();
    for (const alvoId of Object.values(votos)) {
      contagem.set(alvoId, (contagem.get(alvoId) ?? 0) + 1);
    }

    // Maior votado; empate resolve pelo mais antigo na sala.
    let eliminadoId: PlayerId | null = null;
    let maxVotos = 0;
    const ordemDesempate =
      estado.estadoPublico.idsPorAntiguidade?.length > 0
        ? estado.estadoPublico.idsPorAntiguidade
        : estado.estadoPublico.ordemJogadores;
    for (const jogadorId of ordemDesempate) {
      const c = contagem.get(jogadorId) ?? 0;
      if (c > maxVotos) {
        maxVotos = c;
        eliminadoId = jogadorId;
      }
    }
    if (!eliminadoId) return estado;

    const eraMrWhite =
      estado.estadosPrivados[eliminadoId]?.ehMrWhite ?? false;
    const eliminadosIds = [...estado.estadoPublico.eliminadosIds, eliminadoId];

    if (eraMrWhite) {
      // Mr White descoberto: ele tem direito a um palpite final.
      return {
        ...estado,
        fase: 'playing',
        estadoPublico: {
          ...estado.estadoPublico,
          votos,
          eliminadosIds,
          jogadorAdivinhandoId: eliminadoId,
          subFase: 'palpite_final',
        },
        atualizadoEm: em,
      };
    }

    // Civil eliminado → Mr White vence imediatamente.
    return this.finalizarPartida(estado, 'mrwhite', votos, eliminadosIds, em);
  }

  private tratarPalpiteFinal(
    estado: MrWhiteState,
    jogadorId: PlayerId,
    palavra: string,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'palpite_final') return estado;
    if (estadoPublico.jogadorAdivinhandoId !== jogadorId) return estado;

    const palpiteLimpo = palavra.trim();
    if (palpiteLimpo.length === 0) return estado;

    const alvo = estadoPublico.palavraRevelada ?? '';
    const acertou = normalizarPalavra(palpiteLimpo) === normalizarPalavra(alvo);
    const vencedor = acertou ? 'mrwhite' : 'civis';

    const finalizado = this.finalizarPartida(
      estado,
      vencedor,
      estadoPublico.votos,
      estadoPublico.eliminadosIds,
      em,
    );
    return {
      ...finalizado,
      estadoPublico: {
        ...finalizado.estadoPublico,
        palpiteFinal: palpiteLimpo,
        palpiteCorreto: acertou,
      },
    };
  }

  private finalizarPartida(
    estado: MrWhiteState,
    vencedor: 'civis' | 'mrwhite',
    votos: Record<PlayerId, PlayerId>,
    eliminadosIds: PlayerId[],
    em: number,
  ): MrWhiteState {
    const mrWhiteIds = Object.entries(estado.estadosPrivados)
      .filter(([, p]) => p.ehMrWhite)
      .map(([id]) => id);
    const vencedorIds =
      vencedor === 'mrwhite'
        ? mrWhiteIds
        : estado.estadoPublico.ordemJogadores.filter(
            (id) => !mrWhiteIds.includes(id),
          );

    return {
      ...estado,
      fase: 'results',
      jogadorAtualId: null,
      estadoPublico: {
        ...estado.estadoPublico,
        votos,
        eliminadosIds,
        subFase: 'finalizado',
        vencedor,
        mrWhiteIdsRevelados: mrWhiteIds,
      },
      vencedorIds,
      atualizadoEm: em,
    };
  }

  private ordemSemMrWhiteNoComeco(
    ordem: PlayerId[],
    mrWhiteIds: Set<PlayerId>,
  ): PlayerId[] {
    if (ordem.length === 0 || !mrWhiteIds.has(ordem[0]!)) return ordem;
    const idxCivil = ordem.findIndex((id) => !mrWhiteIds.has(id));
    if (idxCivil <= 0) return ordem; // todos são Mr White (não acontece após validação)
    const copia = [...ordem];
    [copia[0], copia[idxCivil]] = [copia[idxCivil]!, copia[0]!];
    return copia;
  }
}

export const mrWhiteEngine = new MrWhiteEngine();
