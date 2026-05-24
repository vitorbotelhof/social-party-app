/**
 * VOCÊ ME CONHECE? — LOCAL ENGINE
 *
 * Motor do modo 1 celular. Estado em memória — sem Firebase, sem rede.
 *
 * ── Arquitetura de estado ──────────────────────────────────────────────────
 *
 * EstadoVMCPublico  — emitido via callback a cada mudança.
 *                     UI lê sem restrição.
 *
 * _escolha          — PRIVADO. A resposta do ranqueador.
 *                     Jamais incluída no estado público antes de 'revelando'.
 *
 * _previsoes        — PRIVADO. Mapa de jogador → previsão.
 *                     Jamais exposto antes do reveal.
 *
 * ── Rotação de ranqueadores ────────────────────────────────────────────────
 *
 * Cada jogador vira ranqueador rodadasPorJogador vezes.
 * Ordem: circular na ordem cadastrada, como o celular passando de mão em mão.
 *
 * ── Seleção de cards ──────────────────────────────────────────────────────
 *
 * Cards filtrados por categoria + selecionados por variedade editorial.
 * Sem repetição até esgotar o deck. A seleção penaliza categoria, família
 * e tags recentes para a sessão respirar melhor quando o baralho é grande.
 */

import { getCardsPorCategorias } from './cards';
import type {
  CartaoVMC,
  ConfiguracaoVMC,
  EstadoColetandoPrevisoes,
  EstadoVMCPublico,
  JogadorVMC,
  LeituraVMC,
  PlayerId,
  RodadaHistoricoVMC,
  ResultadoVMCFinalizado,
  TipoEscolha,
  VMCCallbacks,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function embaralhar<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function intersecao<T>(a: T[], b: T[]): T[] {
  const bSet = new Set(b);
  return a.filter((item) => bSet.has(item));
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────────────────────

export class VMCLocalEngine {
  private readonly _jogadores: JogadorVMC[];
  private readonly _config: ConfiguracaoVMC;
  private readonly _onEstado: (estado: EstadoVMCPublico) => void;
  private readonly _callbacks: VMCCallbacks;

  // ── Deck de cards ──────────────────────────────────────────────────────────
  private readonly _deck: CartaoVMC[];
  private _cardsUsados = new Set<string>();
  private _cardsRecentes: CartaoVMC[] = [];

  // ── Rotação de ranqueadores ────────────────────────────────────────────────
  private readonly _ordemRanqueadores: PlayerId[];
  private _rodadaIndex = 0;

  // ── Estado privado da rodada ───────────────────────────────────────────────
  /** A resposta do ranqueador — NUNCA exposta antes de 'revelando'. */
  private _escolha: string | null = null;
  /** Previsões dos não-ranqueadores — NUNCA expostas antes de 'revelando'. */
  private _previsoes = new Map<PlayerId, string>();

  // ── Histórico público ──────────────────────────────────────────────────────
  private _historico: RodadaHistoricoVMC[] = [];

  // ── Estado público ─────────────────────────────────────────────────────────
  private _estado: EstadoVMCPublico;

  constructor(
    jogadores: JogadorVMC[],
    config: ConfiguracaoVMC,
    onEstado: (estado: EstadoVMCPublico) => void,
    callbacks: VMCCallbacks = {},
  ) {
    this._jogadores = jogadores;
    this._config = config;
    this._onEstado = onEstado;
    this._callbacks = callbacks;

    this._deck = embaralhar(getCardsPorCategorias(config.categorias));
    this._ordemRanqueadores = this._criarOrdemRanqueadores();

    this._estado = {
      fase: 'aguardando_ranqueador',
      rodadaAtual: 1,
      totalRodadas: this._ordemRanqueadores.length,
      ranqueadorId: this._ordemRanqueadores[0]!,
      cartaoAtual: null,
      tipoEscolhaNaRodada: null,
      coletandoPrevisoes: null,
      escolhaRevelada: null,
      acertosRevelados: null,
      leituraRevelada: null,
      historico: [],
      configuracao: config,
    };

    this._emit();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Consultas pontuais (UI usa quando necessário)
  // ─────────────────────────────────────────────────────────────────────────

  getEstado(): EstadoVMCPublico {
    return this._estado;
  }

  getRanqueadorAtual(): JogadorVMC | null {
    return (
      this._jogadores.find((j) => j.id === this._estado.ranqueadorId) ?? null
    );
  }

  getPrevisortAtual(): JogadorVMC | null {
    const coleta = this._estado.coletandoPrevisoes;
    if (!coleta) return null;
    const id = coleta.ordemJogadores[coleta.indiceAtual];
    return id ? (this._jogadores.find((j) => j.id === id) ?? null) : null;
  }

  getJogadores(): JogadorVMC[] {
    return this._jogadores;
  }

  getNome(id: PlayerId): string {
    return this._jogadores.find((j) => j.id === id)?.nome ?? id;
  }

  private _ordemCircularDepoisDe(jogadorId: PlayerId): PlayerId[] {
    const base = this._jogadores.map((j) => j.id);
    const indice = base.indexOf(jogadorId);
    if (indice < 0) return base;
    const depois = base.slice(indice + 1);
    const antes = base.slice(0, indice);
    return [...depois, ...antes];
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ações públicas
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Host confirma que o celular foi passado para o ranqueador.
   * Sorteia o card + tipo → transição para ranqueador_escolhendo.
   */
  confirmarPassagem(): void {
    if (this._estado.fase !== 'aguardando_ranqueador') return;

    const card = this._sortearCard();
    const tipoEscolha = this._resolverTipo(card);

    this._estado = {
      ...this._estado,
      fase: 'ranqueador_escolhendo',
      cartaoAtual: card,
      tipoEscolhaNaRodada: tipoEscolha,
    };

    this._emit();
  }

  /**
   * Ranqueador tocou em uma das 4 opções.
   * A escolha é guardada em _escolha (PRIVADO).
   * Engine transiciona para coletando_previsoes.
   *
   * UI deve exibir ~800ms de blackout antes de chamar este método
   * para garantir que o ranqueador tenha tempo de baixar o celular.
   */
  ranqueadorEscolheu(opcao: string): void {
    if (this._estado.fase !== 'ranqueador_escolhendo') return;
    if (!this._estado.cartaoAtual?.opcoes.includes(opcao as never)) return;

    this._escolha = opcao;
    this._previsoes.clear();

    const ordemJogadores = this._ordemCircularDepoisDe(
      this._estado.ranqueadorId,
    );

    const coleta: EstadoColetandoPrevisoes = {
      indiceAtual: 0,
      ordemJogadores,
      previstoPor: [],
    };

    this._estado = {
      ...this._estado,
      fase: 'coletando_previsoes',
      coletandoPrevisoes: coleta,
    };

    this._emit();
  }

  /**
   * Previsor atual tocou em uma opção.
   * Se era o último, resolve a rodada → revelando.
   * Senão, avança para o próximo previsor.
   *
   * Componente deve ser keyed por indiceAtual para remount automático.
   */
  registrarPrevisao(opcao: string): void {
    if (this._estado.fase !== 'coletando_previsoes') return;

    const coleta = this._estado.coletandoPrevisoes;
    if (!coleta) return;

    const jogadorId = coleta.ordemJogadores[coleta.indiceAtual];
    if (!jogadorId) return;

    this._previsoes.set(jogadorId, opcao);

    const nextIndex = coleta.indiceAtual + 1;
    const isLastPredictor = nextIndex >= coleta.ordemJogadores.length;

    if (isLastPredictor) {
      this._resolverRodada();
    } else {
      this._estado = {
        ...this._estado,
        coletandoPrevisoes: {
          ...coleta,
          indiceAtual: nextIndex,
          previstoPor: [...coleta.previstoPor, jogadorId],
        },
      };
      this._emit();
    }
  }

  /**
   * Host confirma o reveal (toque em "próxima" na tela de revelação).
   * Transiciona para resultado_rodada.
   */
  confirmarRevelacao(): void {
    if (this._estado.fase !== 'revelando') return;

    this._estado = {
      ...this._estado,
      fase: 'resultado_rodada',
    };

    this._emit();
  }

  /**
   * Host confirma o resultado da rodada.
   * Avança para a próxima ou encerra o jogo.
   */
  confirmarResultado(): void {
    if (this._estado.fase !== 'resultado_rodada') return;

    const proximoIndex = this._rodadaIndex + 1;

    if (proximoIndex >= this._ordemRanqueadores.length) {
      this._encerrarJogo();
    } else {
      this._rodadaIndex = proximoIndex;

      this._estado = {
        ...this._estado,
        fase: 'aguardando_ranqueador',
        rodadaAtual: this._estado.rodadaAtual + 1,
        ranqueadorId: this._ordemRanqueadores[proximoIndex]!,
        cartaoAtual: null,
        tipoEscolhaNaRodada: null,
        coletandoPrevisoes: null,
        escolhaRevelada: null,
        acertosRevelados: null,
        leituraRevelada: null,
      };

      this._emit();
    }
  }

  destroy(): void {
    // Engine sem timers — nada a limpar.
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Privados
  // ─────────────────────────────────────────────────────────────────────────

  private _sortearCard(): CartaoVMC {
    let disponiveis = this._deck.filter((c) => !this._cardsUsados.has(c.id));

    if (disponiveis.length === 0) {
      // Deck esgotado — resetar sem repetir o último card
      const ultimoCardId = this._cardsRecentes.at(-1)?.id;
      this._cardsUsados.clear();
      disponiveis = this._deck.filter((c) => c.id !== ultimoCardId);
      if (disponiveis.length === 0) disponiveis = [...this._deck];
    }

    const card = this._selecionarCardMaisVariado(disponiveis);
    this._cardsUsados.add(card.id);
    this._cardsRecentes = [...this._cardsRecentes.slice(-4), card];
    return card;
  }

  private _selecionarCardMaisVariado(disponiveis: CartaoVMC[]): CartaoVMC {
    if (disponiveis.length <= 1) return disponiveis[0]!;

    const ranqueados = disponiveis
      .map((card) => ({
        card,
        score: this._pontuarVariedade(card, disponiveis),
      }))
      .sort((a, b) => b.score - a.score);

    // Pega um card entre os melhores para manter a sessão viva, não determinista.
    const tamanhoPool = Math.max(1, Math.ceil(ranqueados.length * 0.18));
    const pool = ranqueados.slice(0, tamanhoPool);
    return pool[Math.floor(Math.random() * pool.length)]!.card;
  }

  private _pontuarVariedade(card: CartaoVMC, disponiveis: CartaoVMC[]): number {
    const recentes = this._cardsRecentes.slice(-4);
    const ultimo = recentes.at(-1);
    let score = Math.random() * 6;

    score += this._pontuarCurvaEmocional(card);

    if (ultimo && this._existeAlternativaDeCategoria(disponiveis, ultimo)) {
      if (card.categoriaId === ultimo.categoriaId) score -= 18;
      if (card.editorial.familia === ultimo.editorial.familia) score -= 12;
    }

    recentes.forEach((recente, index) => {
      const distancia = recentes.length - index;
      const peso = distancia === 1 ? 1 : 0.55;

      if (card.categoriaId === recente.categoriaId) score -= 5 * peso;
      if (card.editorial.familia === recente.editorial.familia) {
        score -= 3 * peso;
      }

      const tagsRepetidas = intersecao(
        card.editorial.tags,
        recente.editorial.tags,
      );
      score -= tagsRepetidas.length * 1.7 * peso;

      if (
        card.editorial.riscoRepeticao === 'alto' &&
        card.categoriaId === recente.categoriaId
      ) {
        score -= 3 * peso;
      }
    });

    return score;
  }

  private _pontuarCurvaEmocional(card: CartaoVMC): number {
    const progresso =
      this._estado.totalRodadas <= 1
        ? 1
        : (this._estado.rodadaAtual - 1) / (this._estado.totalRodadas - 1);

    if (progresso < 0.25) {
      if (card.editorial.intensidade === 'baixa') return 5;
      if (card.editorial.intensidade === 'media') return 1;
      return -5;
    }

    if (progresso > 0.72) {
      if (card.editorial.intensidade === 'alta') return 4;
      if (card.editorial.intensidade === 'media') return 2;
      return -1;
    }

    if (card.editorial.intensidade === 'media') return 4;
    return 1;
  }

  private _existeAlternativaDeCategoria(
    disponiveis: CartaoVMC[],
    ultimo: CartaoVMC,
  ): boolean {
    return disponiveis.some((card) => card.categoriaId !== ultimo.categoriaId);
  }

  private _resolverTipo(card: CartaoVMC): TipoEscolha {
    if (card.tipoEscolha === 'ambos') {
      return Math.random() < 0.5 ? 'top1' : 'last';
    }
    return card.tipoEscolha;
  }

  private _criarOrdemRanqueadores(): PlayerId[] {
    const base = this._jogadores.map((j) => j.id);
    const ordem: PlayerId[] = [];
    for (let i = 0; i < this._config.rodadasPorJogador; i++) {
      ordem.push(...base);
    }
    return ordem;
  }

  private _resolverRodada(): void {
    const escolha = this._escolha!;
    const previsoes: Record<PlayerId, string> = {};
    this._previsoes.forEach((v, k) => {
      previsoes[k] = v;
    });

    const acertos = Object.entries(previsoes)
      .filter(([, p]) => p === escolha)
      .map(([id]) => id);

    const leitura = this._calcularLeitura(acertos.length, this._previsoes.size);

    const entrada: RodadaHistoricoVMC = {
      numero: this._estado.rodadaAtual,
      ranqueadorId: this._estado.ranqueadorId,
      cartaoId: this._estado.cartaoAtual!.id,
      tipoEscolha: this._estado.tipoEscolhaNaRodada!,
      escolha,
      acertos,
      leitura,
    };

    this._historico = [...this._historico, entrada];

    this._estado = {
      ...this._estado,
      fase: 'revelando',
      coletandoPrevisoes: null,
      escolhaRevelada: escolha,
      acertosRevelados: acertos,
      leituraRevelada: leitura,
      historico: this._historico,
    };

    this._emit();

    this._callbacks.onRodadaResolvida?.({
      numero: entrada.numero,
      ranqueadorId: entrada.ranqueadorId,
      cartaoId: entrada.cartaoId,
      tipoEscolha: entrada.tipoEscolha,
      escolha,
      previsoes,
      acertos,
      leitura,
    });
  }

  private _calcularLeitura(
    acertos: number,
    totalPrevisores: number,
  ): LeituraVMC {
    if (totalPrevisores === 0 || acertos === 0) return 'desconhecido';
    if (acertos === totalPrevisores) return 'leitura_perfeita';
    if (acertos === 1) return 'leitura_solo';
    const ratio = acertos / totalPrevisores;
    if (ratio > 0.5) return 'sincronizados';
    if (ratio === 0.5) return 'divididos';
    return 'surpresa';
  }

  private _encerrarJogo(): void {
    const acertosPorJogador: Record<PlayerId, number> = {};
    const acertosComoRanqueador: Record<PlayerId, number> = {};
    let leiturasPerfeitasTotal = 0;
    let desconhecidosTotal = 0;

    this._jogadores.forEach((j) => {
      acertosPorJogador[j.id] = 0;
      acertosComoRanqueador[j.id] = 0;
    });

    this._historico.forEach((rodada) => {
      rodada.acertos.forEach((id) => {
        acertosPorJogador[id] = (acertosPorJogador[id] ?? 0) + 1;
      });
      acertosComoRanqueador[rodada.ranqueadorId] =
        (acertosComoRanqueador[rodada.ranqueadorId] ?? 0) +
        rodada.acertos.length;
      if (rodada.leitura === 'leitura_perfeita') leiturasPerfeitasTotal++;
      if (rodada.leitura === 'desconhecido') desconhecidosTotal++;
    });

    // Melhor leitor: mais acertos como previsor
    let melhorLeitorId: PlayerId | null = null;
    let maxAcertos = -1;
    this._jogadores.forEach((j) => {
      const n = acertosPorJogador[j.id] ?? 0;
      if (n > maxAcertos) {
        maxAcertos = n;
        melhorLeitorId = j.id;
      }
    });
    // Se todos têm o mesmo, não há "melhor"
    const todosMesmo = this._jogadores.every(
      (j) => (acertosPorJogador[j.id] ?? 0) === maxAcertos,
    );
    if (todosMesmo && this._jogadores.length > 1) melhorLeitorId = null;

    // Menos previsto: ranqueador que o grupo menos acertou
    let menosPrevistoId: PlayerId | null = null;
    let minAcertosRanqueador = Infinity;
    this._jogadores.forEach((j) => {
      const n = acertosComoRanqueador[j.id] ?? 0;
      if (n < minAcertosRanqueador) {
        minAcertosRanqueador = n;
        menosPrevistoId = j.id;
      }
    });

    const resultado: ResultadoVMCFinalizado = {
      totalRodadas: this._historico.length,
      totalJogadores: this._jogadores.length,
      acertosPorJogador,
      acertosComoRanqueador,
      melhorLeitorId,
      menosPrevistoId,
      leiturasPerfeitasTotal,
      desconhecidosTotal,
    };

    this._estado = {
      ...this._estado,
      fase: 'finalizado',
    };

    this._emit();

    this._callbacks.onJogoFinalizado?.(resultado);
  }

  private _emit(): void {
    this._onEstado({ ...this._estado });
  }
}
