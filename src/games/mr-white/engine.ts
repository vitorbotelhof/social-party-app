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
  DificuldadeParPalavras,
  MrWhiteAction,
  MrWhitePrivateState,
  MrWhitePublicState,
  OpcoesMrWhite,
  ParPalavras,
} from '@/games/mr-white/types';
import { embaralhar, sortearUm } from '@/utils/random';

type MrWhiteState = GameState<MrWhitePublicState, MrWhitePrivateState>;

const OPCOES_PADRAO: OpcoesMrWhite = {
  categoriaId: 'comidas',
  dificuldade: 'medio',
  numeroMrWhites: 1,
  duracaoTurnoSegundos: 60,
  modoDualWord: false,
  dificuldadePar: 'media',
};

const MAX_MR_WHITES = 3;
const DURACOES_VALIDAS = new Set([0, 30, 60, 90]);

// 12 segundos: 4.5s de overlay (apurando+eliminado) + 7.5s na TelaEntreRodadas.
const DURACAO_ENTRE_RODADAS_MS = 12000;

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

function ehDificuldadeParValida(valor: unknown): valor is DificuldadeParPalavras {
  return valor === 'leve' || valor === 'media' || valor === 'hard' || valor === 'insana';
}

/** Dificuldades de par aceitas para cada nível de dificuldade no modo clássico. */
const PARES_POR_DIFICULDADE: Record<Dificuldade, DificuldadeParPalavras[]> = {
  facil: ['leve'],
  medio: ['leve', 'media'],
  dificil: ['leve', 'media', 'hard', 'insana'],
};

function filtrarPares(palavras: ParPalavras[], niveis: DificuldadeParPalavras[]): ParPalavras[] {
  const filtrado = palavras.filter((p) => !p.dificuldade || niveis.includes(p.dificuldade));
  return filtrado.length > 0 ? filtrado : palavras;
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
  const modoDualWord = o.modoDualWord === true;
  const dificuldadePar = ehDificuldadeParValida(o.dificuldadePar)
    ? o.dificuldadePar
    : OPCOES_PADRAO.dificuldadePar;
  return { categoriaId, dificuldade, numeroMrWhites, duracaoTurnoSegundos, modoDualWord, dificuldadePar };
}

/** Normaliza texto para comparar palpites (remove acentos, espaços e case). */
// Combining diacritical marks (U+0300 a U+036F). Escapado para portabilidade.
const RE_ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g');

function normalizarPalavra(s: string): string {
  return s.normalize('NFD').replace(RE_ACENTOS, '').toLowerCase().trim();
}

/**
 * Rotaciona a ordem ativa removendo eliminados e movendo o primeiro para o fim.
 * Apenas no round 2 (rodadaVotacao === 1 sendo concluída) evita Mr White na
 * primeira posição. A partir do round 3 não há restrição.
 */
function rotacionarOrdemAtiva(
  ordemAtual: PlayerId[],
  eliminadosIds: PlayerId[],
  mrWhiteIds: Set<PlayerId>,
  rodadaVotacao: number,
): PlayerId[] {
  const ativos = ordemAtual.filter((id) => !eliminadosIds.includes(id));
  if (ativos.length === 0) return ativos;

  // Rotação simples: primeiro vai para o fim.
  const rotacionada = [...ativos.slice(1), ativos[0]!];

  // Apenas no primeiro round de transição evita Mr White abrindo.
  if (rodadaVotacao <= 1 && rotacionada.length > 1 && mrWhiteIds.has(rotacionada[0]!)) {
    const idxCivil = rotacionada.findIndex((id) => !mrWhiteIds.has(id));
    if (idxCivil > 0) {
      const copia = [...rotacionada];
      [copia[0], copia[idxCivil]] = [copia[idxCivil]!, copia[0]!];
      return copia;
    }
  }

  return rotacionada;
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

    // No modo dual-word filtra pelos níveis de proximidade semântica escolhidos;
    // no modo clássico filtra pela dificuldade geral da partida.
    const niveisPermitidos = config.modoDualWord
      ? [config.dificuldadePar]
      : PARES_POR_DIFICULDADE[config.dificuldade];
    const par = sortearUm(filtrarPares(categoria.palavras, niveisPermitidos));

    const idsEmbaralhados = embaralhar(jogadores.map((j) => j.id));
    const mrWhiteIds = new Set(
      idsEmbaralhados.slice(0, config.numeroMrWhites),
    );

    const estadosPrivados: Record<PlayerId, MrWhitePrivateState> = {};
    for (const j of jogadores) {
      const ehMrWhite = mrWhiteIds.has(j.id);
      estadosPrivados[j.id] = {
        ehMrWhite,
        // Modo dual-word: Mr White recebe palavra "undercover"; modo clássico: nenhuma.
        palavraSecreta: ehMrWhite
          ? (config.modoDualWord ? (par.undercover ?? null) : null)
          : par.civis,
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
        ordemAtiva: ordemTurnos,
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
        // Multi-round
        rodadaVotacao: 1,
        ultimoEliminadoId: null,
        ultimoEliminadoEraMrWhite: null,
        prazoProximaRodadaEm: null,
        mrWhitesEliminados: 0,
        civilsEliminados: 0,
        modoJogo: config.modoDualWord ? 'dual-word' : 'classico',
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
      case 'avancar_proxima_rodada':
        return this.tratarAvancarProximaRodada(estado, acao.em);
    }
  }

  private tratarForcarResolucaoVotacao(
    estado: MrWhiteState,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'votando') return estado;
    // Usa ordemAtiva (jogadores que ainda estão no jogo) como total esperado.
    const total = estadoPublico.ordemAtiva.length || estadoPublico.ordemJogadores.length;
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

    // Usa ordemAtiva — apenas jogadores ainda no jogo têm vez.
    const esperadoId = estadoPublico.ordemAtiva[estadoPublico.indiceTurno];
    if (esperadoId !== jogadorId) return estado;

    // Texto vazio = jogador passou (auto-skip do timer).
    const textoLimpo = texto.trim();
    const textoFinal = textoLimpo.length === 0 ? '(passou)' : textoLimpo;

    const pistas = [
      ...estadoPublico.pistas,
      { jogadorId, texto: textoFinal, rodada: estado.rodada },
    ];
    const proximoIndice = estadoPublico.indiceTurno + 1;
    const acabouRodada = proximoIndice >= estadoPublico.ordemAtiva.length;

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
      jogadorAtualId: estadoPublico.ordemAtiva[proximoIndice] ?? null,
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

    // Eliminados não votam e não podem ser votados.
    const ativosSet = new Set(estadoPublico.ordemAtiva);
    if (ativosSet.size > 0 && !ativosSet.has(eleitorId)) return estado;
    if (ativosSet.size > 0 && !ativosSet.has(alvoId)) return estado;

    const votos = { ...estadoPublico.votos, [eleitorId]: alvoId };
    const totalEsperado = estadoPublico.ordemAtiva.length || estadoPublico.ordemJogadores.length;
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

    // Atualiza contadores de eliminados.
    const mrWhitesEliminados =
      estado.estadoPublico.mrWhitesEliminados + (eraMrWhite ? 1 : 0);
    const civilsEliminados =
      estado.estadoPublico.civilsEliminados + (eraMrWhite ? 0 : 1);

    // Estado intermediário com eliminação aplicada.
    const estadoEliminado: MrWhiteState = {
      ...estado,
      estadoPublico: {
        ...estado.estadoPublico,
        votos,
        eliminadosIds,
        ultimoEliminadoId: eliminadoId,
        ultimoEliminadoEraMrWhite: eraMrWhite,
        mrWhitesEliminados,
        civilsEliminados,
      },
      atualizadoEm: em,
    };

    if (eraMrWhite) {
      // Mr White descoberto: ele tem direito a um palpite final.
      return {
        ...estadoEliminado,
        fase: 'playing',
        estadoPublico: {
          ...estadoEliminado.estadoPublico,
          jogadorAdivinhandoId: eliminadoId,
          subFase: 'palpite_final',
        },
      };
    }

    // Civil eliminado → verificar win condition, continuar ou encerrar.
    return this.verificarWinOuContinuar(estadoEliminado, em);
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

    // Aplica o resultado do palpite ao estado antes de decidir o destino.
    const estadoComPalpite: MrWhiteState = {
      ...estado,
      estadoPublico: {
        ...estadoPublico,
        palpiteFinal: palpiteLimpo,
        palpiteCorreto: acertou,
      },
    };

    if (acertou) {
      // Mr White adivinha a palavra → vitória imediata do Mr White.
      return this.finalizarPartida(estadoComPalpite, 'mrwhite', em);
    }

    // Errou: Mr White já está em eliminadosIds (adicionado em resolverVotacao).
    // Verificar win condition com o estado atual.
    return this.verificarWinOuContinuar(estadoComPalpite, em);
  }

  /**
   * Verifica as win conditions após uma eliminação.
   * - Todos os Mr Whites mortos → civis vencem.
   * - Mr Whites vivos >= civis vivos → Mr White vence.
   * - Caso contrário → entra em entre_rodadas para o próximo ciclo.
   */
  private verificarWinOuContinuar(
    estado: MrWhiteState,
    em: number,
  ): MrWhiteState {
    const mrWhiteIds = this.getMrWhiteIds(estado);
    const { eliminadosIds, ordemJogadores } = estado.estadoPublico;

    const mrWhitesVivos = mrWhiteIds.filter(
      (id) => !eliminadosIds.includes(id),
    ).length;
    const civilsVivos = ordemJogadores.filter(
      (id) => !mrWhiteIds.includes(id) && !eliminadosIds.includes(id),
    ).length;

    if (mrWhitesVivos === 0) {
      return this.finalizarPartida(estado, 'civis', em);
    }
    if (mrWhitesVivos >= civilsVivos) {
      return this.finalizarPartida(estado, 'mrwhite', em);
    }

    return this.entrarEntreRodadas(estado, em);
  }

  /**
   * Transição para entre_rodadas: pausa dramática antes do próximo ciclo.
   * Reset de votos acontece apenas em avancar_proxima_rodada.
   */
  private entrarEntreRodadas(estado: MrWhiteState, em: number): MrWhiteState {
    return {
      ...estado,
      fase: 'playing',
      jogadorAtualId: null,
      estadoPublico: {
        ...estado.estadoPublico,
        subFase: 'entre_rodadas',
        prazoProximaRodadaEm: em + DURACAO_ENTRE_RODADAS_MS,
        prazoTurnoEm: null,
        jogadorAdivinhandoId: null,
      },
      atualizadoEm: em,
    };
  }

  /**
   * Avança para o próximo ciclo de dicas após entre_rodadas.
   * - Remove eliminados da ordemAtiva.
   * - Rotaciona a ordem para variar quem abre.
   * - Reseta votos e indiceTurno.
   * - Incrementa rodada e rodadaVotacao.
   */
  private tratarAvancarProximaRodada(
    estado: MrWhiteState,
    em: number,
  ): MrWhiteState {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'entre_rodadas') return estado;

    const mrWhiteIds = new Set(this.getMrWhiteIds(estado));
    const novaOrdemAtiva = rotacionarOrdemAtiva(
      estadoPublico.ordemAtiva,
      estadoPublico.eliminadosIds,
      mrWhiteIds,
      estadoPublico.rodadaVotacao,
    );

    return {
      ...estado,
      fase: 'playing',
      rodada: estado.rodada + 1,
      jogadorAtualId: novaOrdemAtiva[0] ?? null,
      estadoPublico: {
        ...estadoPublico,
        subFase: 'dando_dicas',
        ordemAtiva: novaOrdemAtiva,
        indiceTurno: 0,
        votos: {},
        rodadaVotacao: estadoPublico.rodadaVotacao + 1,
        prazoProximaRodadaEm: null,
        prazoTurnoEm: calcularPrazoTurno(estadoPublico.duracaoTurnoSegundos, em),
      },
      atualizadoEm: em,
    };
  }

  private finalizarPartida(
    estado: MrWhiteState,
    vencedor: 'civis' | 'mrwhite',
    em: number,
  ): MrWhiteState {
    const mrWhiteIds = this.getMrWhiteIds(estado);
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
        subFase: 'finalizado',
        vencedor,
        mrWhiteIdsRevelados: mrWhiteIds,
        prazoProximaRodadaEm: null,
        prazoTurnoEm: null,
      },
      vencedorIds,
      atualizadoEm: em,
    };
  }

  /** Retorna os IDs de todos os Mr Whites a partir do estado privado. */
  private getMrWhiteIds(estado: MrWhiteState): PlayerId[] {
    return Object.entries(estado.estadosPrivados)
      .filter(([, p]) => p.ehMrWhite)
      .map(([id]) => id);
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
