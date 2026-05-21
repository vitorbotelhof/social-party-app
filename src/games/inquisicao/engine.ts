/**
 * INQUISIÇÃO — ENGINE PRINCIPAL
 *
 * Coordenador central da partida. Estende GameEngine e orquestra o loop completo:
 *   revelando_papeis → conversa → votando → apurando → noite → (repete) → finalizado
 *
 * ─── Responsabilidades ───────────────────────────────────────────────────────
 *
 * ✓ Satisfazer o contrato abstrato de GameEngine
 * ✓ Inicializar estado via roleDistribution + initialState
 * ✓ Processar ações de jogadores (votos, ações noturnas, confirmações)
 * ✓ Auto-avançar sub-fases por timer (poll loop de 500ms)
 * ✓ Early resolution: todos votaram / todos agiram → avançar sem esperar timer
 * ✓ Emitir eventos sociais (públicos e privados) no início de cada conversa
 * ✓ Resolver votação inline (ler votos privados, calcular maioria, publicar)
 * ✓ Resolver fase noturna via nightPhase.ts
 * ✓ Detectar vitória após cada eliminação ou conversão
 * ✓ Construir revelação final ao encerrar
 *
 * ─── NÃO é responsabilidade deste engine ─────────────────────────────────────
 *
 * ✗ Escrever no Firebase — EngineCallbacks injetáveis pelo service layer
 * ✗ Autenticação ou autorização de jogadores
 * ✗ Gerenciar reconexão de jogadores (host chama iniciar() com estado restaurado)
 * ✗ Apresentação / UI — este módulo é agnóstico de interface
 *
 * ─── Segurança de transição ───────────────────────────────────────────────────
 *
 * _transitando: boolean é o guard central.
 * Toda transição de sub-fase passa por _tentarAvancarSubFase(), que adquire
 * o flag antes de executar. O poll loop verifica o flag antes de cada tick.
 * Nenhuma transição dupla pode ocorrer, mesmo com concorrência local
 * (timer expirou E todos votaram no mesmo instante).
 *
 * ─── Modelo de callbacks ──────────────────────────────────────────────────────
 *
 * O engine produz objetos de atualização; o service layer os escreve.
 * Firebase é injetado via EngineCallbacks — facilita testes unitários.
 * Todos os callbacks são async; erros de IO são capturados no try/finally
 * de _tentarAvancarSubFase() para nunca travar o engine.
 */

import { GameEngine } from '@/engine/GameEngine';
import type { GameConfig, GameState, Player, PlayerId } from '@/engine/types';
import {
  criarAtualizacaoFase,
  criarEstadoInicial as criarEstadoPublicoInicial,
  deveAvancarPorTimer,
  obterIdsDosVencedores,
  verificarCondicaoVitoria,
} from '@/games/inquisicao/initialState';
import {
  jaFoiResolvida,
  podeTentarResolver,
  resolverNoite,
  todosAtoresElegiveisAgiram,
} from '@/games/inquisicao/nightPhase';
import type { ResultadoResolucaoNoite } from '@/games/inquisicao/nightPhase';
import {
  distribuirPapeis,
  MAX_JOGADORES_INQUISICAO,
  MIN_JOGADORES_INQUISICAO,
} from '@/games/inquisicao/roleDistribution';
import {
  calcularProbabilidadeEventoPrivado,
  calcularProbabilidadeEventoPublico,
  selecionarEventoPrivado,
  selecionarEventoPublico,
} from '@/games/inquisicao/socialEvents';
import type {
  ContextoSelecaoPrivado,
  ContextoSelecaoPublico,
  ResultadoSelecao,
} from '@/games/inquisicao/socialEvents';
import type {
  AcaoInquisicaoJogador,
  AcaoNoturna,
  CategoriaEvento,
  ConfiguracaoPartida,
  ContextoResolucaoHost,
  ControleNoiteInquisicao,
  EliminacaoRecord,
  EstadoFirebaseInquisicao,
  EstadoPrivadoInquisicao,
  EventoPublico,
  IntensidadeInquisicao,
  PapelFinalRevelado,
  PapelInquisicao,
  RevelacaoFinalRecord,
  ResultadoPartida,
  TipoAcaoNoturna,
  VotacaoEmAndamento,
  VotacaoResolvida,
  VotoPrivado,
} from '@/games/inquisicao/types';

// ─────────────────────────────────────────────────────────────────────────────
// §1  TIPOS PÚBLICOS DO ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/** Opções de criação da partida — passadas via criarEstadoInicial(opcoes). */
export interface OpcoesCriacaoInquisicao {
  readonly intensidade: IntensidadeInquisicao;
}

/**
 * Callbacks injetáveis pelo service layer para operações no Firebase.
 *
 * O engine NUNCA importa Firebase diretamente.
 * Cada método é async — o engine aguarda antes de continuar.
 * Erros são capturados no guard de _tentarAvancarSubFase.
 */
export interface EngineCallbacks {
  /**
   * Aplica update parcial em /salas/{codigo}/estado.
   * Usa Firebase update() — merge, nunca substituição total.
   */
  escreverEstadoPublico(update: Partial<EstadoFirebaseInquisicao>): Promise<void>;

  /**
   * Aplica patch parcial em /salas/{codigo}/privados/{id}.
   * Cada jogador tem seu próprio nó protegido por Security Rules.
   * NUNCA chamar com o mapa completo — escrever um por um.
   */
  escreverPrivado(id: PlayerId, patch: Partial<EstadoPrivadoInquisicao>): Promise<void>;

  /**
   * Sobrescreve /salas/{codigo}/noiteControle.
   * Exclusivo do host — protegido por Security Rules.
   */
  escreverControle(controle: ControleNoiteInquisicao): Promise<void>;

  /**
   * Lê todos os nós em /salas/{codigo}/noite/*.
   * Retorna array vazio se nenhuma ação foi submetida ainda.
   */
  lerAcoesNoturnas(): Promise<readonly AcaoNoturna[]>;

  /** Deleta todos os nós em /salas/{codigo}/noite/*. Chamado após resolução. */
  deletarAcoesNoturnas(): Promise<void>;

  /**
   * Lê todos os nós em /salas/{codigo}/votosPrivados/*.
   * Retorna {} se nenhum voto foi submetido.
   */
  lerVotosPrivados(): Promise<Record<PlayerId, VotoPrivado>>;

  /** Deleta todos os nós em /salas/{codigo}/votosPrivados/*. Chamado após resolução. */
  deletarVotosPrivados(): Promise<void>;

  /**
   * Tenta adquirir o lock de resolução da noite via runTransaction.
   * Retorna true se o lock foi adquirido com sucesso.
   * Retorna false se outro host está resolvendo (lock ativo e não expirado).
   */
  adquirirLockNoite(agora: number): Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  TIPO INTERNO DE ESTADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GameState específico do Inquisição.
 *
 * estadoPublico = EstadoFirebaseInquisicao (o que vai para /estado no Firebase)
 * estadosPrivados = estados em memória no host (escritos individualmente em /privados/{id})
 *
 * Nota: estadoPublico.estadosPrivados é sempre {} — os privados vivem aqui,
 * não em /estado. Este GameState é o snapshot em memória do host.
 */
type EstadoInquisicao = GameState<EstadoFirebaseInquisicao, EstadoPrivadoInquisicao>;

// ─────────────────────────────────────────────────────────────────────────────
// §3  CONSTANTES OPERACIONAIS
// ─────────────────────────────────────────────────────────────────────────────

/** Frequência do poll loop que verifica timers e condições de early resolution. */
const INTERVALO_POLL_MS = 500;

/**
 * Mensagens de empate exibidas quando nenhum jogador é eliminado por empate.
 * Tom: tensão sem resolução — aumenta paranoia sem informação.
 * Editoriamente separadas das mensagens pós-noite para manter distinção emocional.
 */
const MENSAGENS_EMPATE: readonly string[] = [
  'ninguém foi eliminado.',
  'o grupo não decidiu.',
  'o impasse persiste.',
  'a decisão escapou.',
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// §4  CLASSE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export class InquisicaoEngine extends GameEngine<
  EstadoFirebaseInquisicao,
  EstadoPrivadoInquisicao,
  AcaoInquisicaoJogador
> {
  // ── Metadados estáticos ────────────────────────────────────────────────────

  readonly config: GameConfig = {
    id: 'inquisicao',
    nome: 'Inquisição',
    descricao: 'Jogo de deterioração social acelerada. Quem está contaminando o grupo?',
    minJogadores: MIN_JOGADORES_INQUISICAO,
    maxJogadores: MAX_JOGADORES_INQUISICAO,
    tempoDeRodadaSegundos: null, // duração gerida internamente por sub-fase
  };

  // ── Estado interno do host (jamais serializado em nós públicos) ────────────

  /**
   * Controle exclusivo do host — espelha /noiteControle.
   * null antes de iniciar ou ao aguardar restauração (reconexão do host).
   */
  private _controleNoite: ControleNoiteInquisicao | null = null;

  /**
   * IDs de templates de eventos já usados nesta partida.
   * Previne repetição do mesmo evento. Em memória — aceitável perder no reconect.
   * O pool de 43 eventos supera qualquer partida típica (8–12 loops).
   */
  private _idsTemplatesUsados: Set<string> = new Set();

  /**
   * Categoria do último evento público emitido.
   * Usado pelo algoritmo de alternância suave de seleção de eventos.
   */
  private _ultimaCategoriaPublica: Exclude<CategoriaEvento, 'informacao_parcial'> | null = null;

  /** Total de eventos públicos emitidos — afeta probabilidade futura de emissão. */
  private _totalEventosPublicosUsados: number = 0;

  /** Total de eventos privados emitidos — limitado por intensidade (máx 1–2). */
  private _totalEventosPrivadosUsados: number = 0;

  /**
   * Jogadores que confirmaram visualizar seu papel (revelando_papeis).
   * Quando todos confirmam, avança para conversa antes do timer.
   */
  private _papelConfirmadoPor: Set<PlayerId> = new Set();

  /**
   * Guard de reentrância de transição de fase.
   *
   * Garantia crítica: NUNCA duas transições executam simultaneamente.
   * Caminhos que podem disparar transição ao mesmo tempo:
   *   a) Poll loop (timer expirou)
   *   b) processarAcao (todos votaram / todos agiram)
   *   c) Ação HOST explícita (avancar_fase)
   *
   * Regra: verificar ANTES, setar no início de _tentarAvancarSubFase,
   * liberar no finally (mesmo em caso de erro de IO).
   */
  private _transitando: boolean = false;

  /** Handle do setInterval do poll loop. null quando engine não está ativo. */
  private _intervaloId: ReturnType<typeof setInterval> | null = null;

  /** Callbacks de Firebase. null antes de iniciar() ou após parar(). */
  private _callbacks: EngineCallbacks | null = null;

  /** Estado atual mantido em memória pelo host para decisões internas. */
  private _estadoAtual: EstadoInquisicao | null = null;

  // ── §5  CONTRATO ABSTRATO DO GameEngine ───────────────────────────────────

  /**
   * Cria o estado inicial completo da partida.
   *
   * Sequência:
   *   1. Extrair e validar intensidade de opcoes
   *   2. distribuirPapeis → configuração + estados privados + controle de noite
   *   3. criarEstadoPublicoInicial → EstadoFirebaseInquisicao
   *   4. Inicializar estado interno do engine (tracking, guards, contadores)
   *   5. Retornar GameState<EstadoFirebaseInquisicao, EstadoPrivadoInquisicao>
   *
   * SÍNCRONO e PURO — não escreve no Firebase.
   * O service layer escreve /estado, /privados/*, /noiteControle após este retorno.
   *
   * @param jogadores   Lista de Players da sala.
   * @param anfitriaoId ID do host (para logging e futura validação de ações HOST).
   * @param opcoes      OpcoesCriacaoInquisicao — intensidade obrigatória.
   * @throws Error se intensidade inválida ou jogadores < MIN ou > MAX.
   */
  criarEstadoInicial(
    jogadores: Player[],
    anfitriaoId: PlayerId,
    opcoes?: unknown,
  ): EstadoInquisicao {
    const intensidade = this._extrairIntensidade(opcoes);
    const agora = Date.now();

    // Distribuição de papéis — define toda a configuração e estados iniciais
    const distribuicao = distribuirPapeis(jogadores, intensidade, agora);

    // Estado público da partida (visível para todos em /estado)
    const estadoPublico = criarEstadoPublicoInicial(
      distribuicao.configuracao,
      jogadores,
      agora,
    );

    // Inicializar estado interno — resetar tudo para nova partida
    this._controleNoite = distribuicao.controleNoiteInicial;
    this._idsTemplatesUsados = new Set();
    this._ultimaCategoriaPublica = null;
    this._totalEventosPublicosUsados = 0;
    this._totalEventosPrivadosUsados = 0;
    this._papelConfirmadoPor = new Set();
    this._transitando = false;

    const estado: EstadoInquisicao = {
      fase: 'playing',
      rodada: 0,             // Inquisição não usa rodadas — loops geridos internamente
      jogadorAtualId: null,  // fases coletivas — sem jogador de vez
      estadoPublico,
      estadosPrivados: { ...distribuicao.estadoPrivadoPorId },
      vencedorIds: [],
      iniciadoEm: agora,
      atualizadoEm: agora,
    };

    this._estadoAtual = estado;

    // anfitriaoId disponível para validação futura (ações HOST)
    void anfitriaoId;

    return estado;
  }

  /**
   * Processa uma ação de jogador, retorna o novo estado.
   *
   * Despacha por tipo:
   *   JOGADOR: confirmar_papel_visto, marcar_mensagem_lida,
   *            marcar_evento_privado_lido, votar, acao_noturna
   *   HOST:    avancar_fase, publicar_resultado_votacao,
   *            publicar_resultado_noite, finalizar_partida
   *
   * Ações com side effects no Firebase (ex: marcar_mensagem_lida):
   *   - Retornam novo estado imediatamente (para memória local do host)
   *   - Disparam callback async em paralelo (void — não bloqueia o retorno)
   *
   * Ações que disparam transição de fase (ex: confirmar_papel_visto quando
   * todos confirmaram) chamam _tentarAvancarSubFase() assincronamente.
   */
  processarAcao(
    estado: EstadoInquisicao,
    acao: AcaoInquisicaoJogador,
  ): EstadoInquisicao {
    let novoEstado = estado;

    switch (acao.tipo) {
      case 'confirmar_papel_visto':
        novoEstado = this._processarConfirmacaoPapel(estado, acao.jogadorId);
        break;

      case 'marcar_mensagem_lida':
        novoEstado = this._processarMensagemLida(estado, acao.jogadorId);
        break;

      case 'marcar_evento_privado_lido':
        novoEstado = this._processarEventoPrivadoLido(estado, acao.jogadorId);
        break;

      case 'votar':
        novoEstado = this._processarVoto(estado, acao.jogadorId, acao.payload.alvoId);
        break;

      case 'acao_noturna':
        novoEstado = this._processarAcaoNoturna(estado, acao.jogadorId, acao.payload);
        break;

      case 'avancar_fase':
        // HOST força avanço — útil para debug e overrides manuais
        void this._tentarAvancarSubFase(estado);
        break;

      case 'publicar_resultado_votacao':
        novoEstado = this._aplicarResultadoVotacao(estado, acao.payload.resultado);
        break;

      case 'publicar_resultado_noite':
        novoEstado = this._aplicarMensagemNoite(estado, acao.payload.mensagem);
        break;

      case 'finalizar_partida':
        novoEstado = this._aplicarFinalizacao(
          estado,
          acao.payload.vencedor,
          acao.payload.revelacao,
        );
        break;

      default:
        // Invariante: nunca alcançado se AcaoInquisicaoJogador estiver completo.
        // Se chegar aqui, AcaoInquisicaoJogador tem um tipo não mapeado — investigar.
        break;
    }

    this._estadoAtual = novoEstado;
    return novoEstado;
  }

  /**
   * Avança a fase macro (playing → results).
   * No Inquisição, o avanço granular é por sub-fase via _tentarAvancarSubFase.
   * Este método implementa o mínimo do contrato do GameEngine.
   */
  avancarFase(estado: EstadoInquisicao): EstadoInquisicao {
    void this._tentarAvancarSubFase(estado);
    return estado;
  }

  /** Verdadeiro quando a partida tem vencedor definido. */
  verificarFim(estado: EstadoInquisicao): boolean {
    return estado.estadoPublico.vencedor !== null;
  }

  /**
   * Hook: indica se a fase deve avançar automaticamente (compatibilidade com engine base).
   * No Inquisição, o poll loop chama deveAvancarPorTimer diretamente.
   */
  deveAvancarFase(estado: EstadoInquisicao): boolean {
    const { estadoPublico } = estado;
    return deveAvancarPorTimer(estadoPublico.prazoFaseEm, estadoPublico.subFase, Date.now());
  }

  /**
   * Autoriza processamento de uma ação dado o estado atual.
   * Validação granular por tipo é feita dentro de cada handler.
   * O engine base aceita 'playing' e 'voting' — substituímos com lógica de sub-fase.
   */
  podeProcessarAcao(estado: EstadoInquisicao, acao: AcaoInquisicaoJogador): boolean {
    const { subFase } = estado.estadoPublico;

    // Partida encerrada: nenhuma ação aceita
    if (subFase === 'finalizado') return false;

    // Votos: exclusivos da fase votando
    if (acao.tipo === 'votar') return subFase === 'votando';

    // Ações noturnas: exclusivas da fase noite
    if (acao.tipo === 'acao_noturna') return subFase === 'noite';

    // Confirmações: aceitas em qualquer fase (jogadores podem confirmar com atraso)
    if (
      acao.tipo === 'confirmar_papel_visto' ||
      acao.tipo === 'marcar_mensagem_lida' ||
      acao.tipo === 'marcar_evento_privado_lido'
    ) return true;

    // Ações HOST: sempre aceitas aqui — autoridade validada pelo service layer
    return true;
  }

  // ── §6  LIFECYCLE DO ENGINE ────────────────────────────────────────────────

  /**
   * Inicia o engine com o estado atual e callbacks de Firebase.
   *
   * Deve ser chamado pelo service layer após criarEstadoInicial() ou ao
   * restaurar o host após reconexão (com estado carregado do Firebase).
   *
   * Inicia o poll loop de 500ms que gerencia timers e early resolution.
   *
   * @param estado    Estado atual (inicial ou restaurado).
   * @param controle  ControleNoiteInquisicao restaurado de /noiteControle.
   * @param callbacks Callbacks de IO do Firebase.
   */
  iniciar(
    estado: EstadoInquisicao,
    controle: ControleNoiteInquisicao,
    callbacks: EngineCallbacks,
  ): void {
    if (this._intervaloId !== null) {
      // Engine já está rodando — possível chamada dupla acidental
      console.warn('[InquisicaoEngine] iniciar() chamado com engine já ativo. Ignorando.');
      return;
    }

    this._estadoAtual = estado;
    this._controleNoite = controle;
    this._callbacks = callbacks;
    this._transitando = false;

    this._intervaloId = setInterval(() => {
      void this._tick();
    }, INTERVALO_POLL_MS);
  }

  /**
   * Para o engine. Limpa o poll loop e remove referência aos callbacks.
   * Chamado quando a sala é encerrada ou quando o host desconecta.
   */
  parar(): void {
    if (this._intervaloId !== null) {
      clearInterval(this._intervaloId);
      this._intervaloId = null;
    }
    this._callbacks = null;
  }

  // ── §7  POLL LOOP ──────────────────────────────────────────────────────────

  /**
   * Tick do poll loop — executado a cada 500ms.
   *
   * Ordem de verificação:
   *   1. Engine ativo e não em transição? (guards)
   *   2. Sub-fase finalizado? → parar loop
   *   3. Sub-fase votando: todos votaram? → early resolution
   *   4. Sub-fase noite: todos agiram? → early resolution (lê Firebase)
   *   5. Timer da sub-fase atual expirou? → avançar
   *
   * Apenas UMA verificação dispara transição por tick.
   */
  private async _tick(): Promise<void> {
    if (this._callbacks === null || this._estadoAtual === null) return;
    if (this._transitando) return;

    const estado = this._estadoAtual;
    const { estadoPublico } = estado;
    const { subFase } = estadoPublico;

    // Partida encerrada — desligar o loop
    if (subFase === 'finalizado') {
      this.parar();
      return;
    }

    const agora = Date.now();

    // ── Early resolution por sub-fase ─────────────────────────────────────

    if (subFase === 'votando') {
      const votacao = estadoPublico.votacaoAtual;
      if (
        votacao?.tipo === 'em_andamento' &&
        Object.keys(votacao.votantesConfirmados).length >= votacao.totalEsperado
      ) {
        await this._tentarAvancarSubFase(estado);
        return;
      }
    }

    if (subFase === 'noite') {
      // Leitura do Firebase para checar se todos agiram (pode ser lento — ok)
      await this._verificarEarlyResolutionNoite(estado);
      return;
    }

    // ── Verificação de timer ───────────────────────────────────────────────

    if (deveAvancarPorTimer(estadoPublico.prazoFaseEm, subFase, agora)) {
      await this._tentarAvancarSubFase(estado);
    }
  }

  /**
   * Verifica se todos os atores elegíveis da noite já submeteram ação.
   * Se todos agiram OU o timer expirou, resolve a noite antecipadamente.
   *
   * Lê /noite/* do Firebase — necessário para ter estado mais recente
   * (jogadores escrevem no Firebase, não via processarAcao do engine).
   */
  private async _verificarEarlyResolutionNoite(estado: EstadoInquisicao): Promise<void> {
    if (this._controleNoite === null || this._callbacks === null) return;

    const ctx: ContextoResolucaoHost = {
      estadoPublico: estado.estadoPublico,
      estadosPrivados: estado.estadosPrivados,
      controleNoite: this._controleNoite,
    };

    const acoes = await this._callbacks.lerAcoesNoturnas();
    const todosAgiram = todosAtoresElegiveisAgiram(acoes, ctx);
    const timerExpirou = deveAvancarPorTimer(
      estado.estadoPublico.prazoFaseEm,
      'noite',
      Date.now(),
    );

    if (todosAgiram || timerExpirou) {
      await this._tentarAvancarSubFase(estado);
    }
  }

  // ── §8  ORQUESTRADOR DE TRANSIÇÃO ─────────────────────────────────────────

  /**
   * Ponto de entrada de qualquer transição de sub-fase.
   *
   * Adquire _transitando → garante exclusividade.
   * Libera no finally → mesmo em erro de IO, o engine não trava.
   *
   * Despacha para o handler específico da sub-fase atual.
   */
  private async _tentarAvancarSubFase(estado: EstadoInquisicao): Promise<void> {
    if (this._transitando) return;
    if (this._callbacks === null) return;

    this._transitando = true;
    try {
      await this._executarTransicao(estado);
    } catch (erro) {
      // Erro de IO é logado mas não propaga — engine deve continuar no próximo tick
      console.error('[InquisicaoEngine] Erro durante transição de fase:', erro);
    } finally {
      this._transitando = false;
    }
  }

  /** Despacha a transição de acordo com a sub-fase atual do estado. */
  private async _executarTransicao(estado: EstadoInquisicao): Promise<void> {
    switch (estado.estadoPublico.subFase) {
      case 'revelando_papeis': await this._transicaoRevelando(estado); break;
      case 'conversa':         await this._transicaoConversa(estado);  break;
      case 'votando':          await this._transicaoVotando(estado);   break;
      case 'apurando':         await this._transicaoApurando(estado);  break;
      case 'noite':            await this._transicaoNoite(estado);     break;
      case 'finalizado':       /* partida encerrada — nada a fazer */  break;
    }
  }

  // ── §9  HANDLERS DE TRANSIÇÃO ─────────────────────────────────────────────

  /**
   * revelando_papeis → conversa
   *
   * Emite o primeiro evento social (probabilidade 1.0 no loop 1).
   * Limpa mensagens e votação anteriores.
   *
   * Emocional: saída da leitura silenciosa → provocação social imediata.
   */
  private async _transicaoRevelando(estado: EstadoInquisicao): Promise<void> {
    if (this._callbacks === null) return;

    const { estadoPublico } = estado;
    const agora = Date.now();

    const eventoResult = this._selecionarEventoPublicoSeMerecido(
      estadoPublico.loop,
      estadoPublico.configuracao.intensidade,
    );

    const atualizacao = criarAtualizacaoFase('conversa', estadoPublico.configuracao, agora, {
      votacaoAtual: null,
      eventoAtivo: eventoResult?.evento ?? null,
      mensagemDoSistema: null,
    });

    await this._callbacks.escreverEstadoPublico(atualizacao);
    this._atualizarEstadoInterno(estado, atualizacao);
  }

  /**
   * conversa → votando
   *
   * Inicia coleta de votos.
   * Cria VotacaoEmAndamento com totalEsperado = jogadoresAtivos.length.
   * Limpa eventoAtivo — a votação exige atenção plena, sem ruído visual.
   *
   * Emocional: de "quem é suspeito?" para "decida agora".
   */
  private async _transicaoConversa(estado: EstadoInquisicao): Promise<void> {
    if (this._callbacks === null) return;

    const { estadoPublico } = estado;
    const agora = Date.now();

    const votacaoEmAndamento: VotacaoEmAndamento = {
      tipo: 'em_andamento',
      loop: estadoPublico.loop,
      votantesConfirmados: {},
      totalEsperado: estadoPublico.jogadoresAtivos.length,
    };

    const atualizacao = criarAtualizacaoFase('votando', estadoPublico.configuracao, agora, {
      votacaoAtual: votacaoEmAndamento,
      eventoAtivo: null,
      mensagemDoSistema: null,
    });

    await this._callbacks.escreverEstadoPublico(atualizacao);
    this._atualizarEstadoInterno(estado, atualizacao);
  }

  /**
   * votando → apurando
   *
   * Lê votos privados do Firebase, calcula maioria, publica VotacaoResolvida.
   * Em seguida deleta /votosPrivados/* (votos são efêmeros).
   *
   * Empate → eliminadoId: null, mensagem que aumenta tensão.
   * Maioria → eliminadoId preenchido (eliminação aplicada em _transicaoApurando).
   *
   * Emocional: revelação simultânea do julgamento coletivo.
   */
  private async _transicaoVotando(estado: EstadoInquisicao): Promise<void> {
    if (this._callbacks === null) return;

    const { estadoPublico } = estado;
    const agora = Date.now();

    const votos = await this._callbacks.lerVotosPrivados();
    await this._callbacks.deletarVotosPrivados();

    const resultado = this._resolverVotacao(
      votos,
      estadoPublico.loop,
      estadoPublico.configuracao,
      estado.estadosPrivados,
      agora,
    );

    // Empate: mensagem que aumenta paranoia sem resolver nada
    // Maioria: silêncio — a revelação do papel (se configurado) faz o trabalho emocional
    const mensagem = resultado.foiEmpate ? this._mensagemEmpate() : null;

    const atualizacao = criarAtualizacaoFase('apurando', estadoPublico.configuracao, agora, {
      votacaoAtual: resultado,
      mensagemDoSistema: mensagem,
    });

    await this._callbacks.escreverEstadoPublico(atualizacao);
    this._atualizarEstadoInterno(estado, atualizacao);
  }

  /**
   * apurando → noite (ou finalizado)
   *
   * Aplica eliminação da votação (se houver eliminado).
   * Verifica condição de vitória.
   *
   * Se vencedor: finaliza partida.
   * Se não: avança para noite com lista de ativos atualizada.
   *
   * Emocional: consequência aplicada — o grupo absorve antes de escurecer.
   */
  private async _transicaoApurando(estado: EstadoInquisicao): Promise<void> {
    if (this._callbacks === null || this._controleNoite === null) return;

    const { estadoPublico } = estado;
    const agora = Date.now();

    let jogadoresAtivos = [...estadoPublico.jogadoresAtivos];
    let eliminados = [...estadoPublico.eliminados];

    // Aplicar eliminação da votação (se houver)
    const votacao = estadoPublico.votacaoAtual;
    if (votacao?.tipo === 'resolvida' && votacao.eliminadoId !== null) {
      const eliminadoId = votacao.eliminadoId;

      jogadoresAtivos = jogadoresAtivos.filter((id) => id !== eliminadoId);

      const novoRecord: EliminacaoRecord = {
        jogadorId: eliminadoId,
        loop: estadoPublico.loop,
        causa: 'votacao',
        papelRevelado: votacao.papelRevelado,
        eliminadoEm: agora,
      };
      eliminados = [...eliminados, novoRecord];
    }

    // Verificar vitória com ativos atualizados
    const vencedor = verificarCondicaoVitoria(
      jogadoresAtivos,
      this._controleNoite.corrompidosAtuais,
    );

    if (vencedor !== null) {
      await this._finalizarPartida(estado, vencedor, jogadoresAtivos, eliminados, agora);
      return;
    }

    // Sem vitória: avançar para noite
    const atualizacao = criarAtualizacaoFase('noite', estadoPublico.configuracao, agora, {
      jogadoresAtivos,
      eliminados,
      votacaoAtual: null,
      mensagemDoSistema: null,
    });

    await this._callbacks.escreverEstadoPublico(atualizacao);
    this._atualizarEstadoInterno(estado, atualizacao, { estadosPrivados: estado.estadosPrivados });
  }

  /**
   * noite → conversa (loop+1) ou finalizado
   *
   * Fluxo de resolução noturna com lock otimista:
   *   1. Verificar idempotência (jaFoiResolvida)
   *   2. Verificar lock não expirado (podeTentarResolver)
   *   3. Tentar adquirir lock via runTransaction
   *   4. Ler ações noturnas do Firebase
   *   5. resolverNoite() — módulo puro, sem Firebase
   *   6. Escrever patches privados um a um
   *   7. Persistir novoControleNoite em /noiteControle
   *   8. Deletar /noite/* (ações são efêmeras)
   *   9. Verificar vitória com estado pós-noite
   *  10. Avançar para conversa (loop+1) ou finalizar
   *
   * Emocional: "o grupo piscou e a realidade mudou um pouco."
   */
  private async _transicaoNoite(estado: EstadoInquisicao): Promise<void> {
    if (this._callbacks === null || this._controleNoite === null) return;

    const { estadoPublico } = estado;
    const agora = Date.now();
    const loop = estadoPublico.loop;

    // ── Guards de lock ─────────────────────────────────────────────────────

    // Idempotência: outro host já resolveu esta noite
    if (jaFoiResolvida(this._controleNoite, loop)) return;

    // Lock ativo e não expirado: outro host está resolvendo agora
    if (!podeTentarResolver(this._controleNoite, agora)) return;

    // Tentar adquirir lock via runTransaction no Firebase
    const lockAdquirido = await this._callbacks.adquirirLockNoite(agora);
    if (!lockAdquirido) return;

    // ── Resolução ─────────────────────────────────────────────────────────

    const acoes = await this._callbacks.lerAcoesNoturnas();

    const ctx: ContextoResolucaoHost = {
      estadoPublico,
      estadosPrivados: estado.estadosPrivados,
      controleNoite: this._controleNoite,
    };

    const resultado: ResultadoResolucaoNoite = resolverNoite(acoes, ctx, agora);

    // ── Escrita de patches privados (um a um — nunca em batch) ─────────────

    // Cópia mutável dos estadosPrivados para atualização em memória
    const estadosPrivadosAtualizados = { ...estado.estadosPrivados };

    for (const [jogadorId, patch] of resultado.patchesPrivados) {
      await this._callbacks.escreverPrivado(jogadorId, patch);

      const privadoAtual = estadosPrivadosAtualizados[jogadorId];
      if (privadoAtual !== undefined) {
        estadosPrivadosAtualizados[jogadorId] = { ...privadoAtual, ...patch };
      }
    }

    // ── Persistir controle da noite ────────────────────────────────────────

    this._controleNoite = resultado.novoControleNoite;
    await this._callbacks.escreverControle(resultado.novoControleNoite);

    // Limpar ações efêmeras
    await this._callbacks.deletarAcoesNoturnas();

    // ── Calcular ativos e eliminados pós-noite ─────────────────────────────

    let jogadoresAtivosAposNoite = [...estadoPublico.jogadoresAtivos];
    let eliminadosAposNoite = [...estadoPublico.eliminados];

    if (resultado.resolucaoInterna.eliminado !== null) {
      const eliminadoId = resultado.resolucaoInterna.eliminado;

      jogadoresAtivosAposNoite = jogadoresAtivosAposNoite.filter((id) => id !== eliminadoId);

      // Papel revelado: apenas se configuração permite (leve/padrão revelam, paranoia não)
      let papelRevelado: PapelInquisicao | null = null;
      if (estadoPublico.configuracao.revelarPapelAoEliminar) {
        const privado = estadosPrivadosAtualizados[eliminadoId];
        if (privado !== undefined) {
          // Facção no momento da eliminação: convertidos aparecem como corrompidos
          papelRevelado = privado.convertidoNoLoop !== null ? 'corrompido' : privado.papelOriginal;
        }
      }

      const novoRecord: EliminacaoRecord = {
        jogadorId: eliminadoId,
        loop,
        causa: 'noite',
        papelRevelado,
        eliminadoEm: agora,
      };
      eliminadosAposNoite = [...eliminadosAposNoite, novoRecord];
    }

    // ── Verificar vitória ──────────────────────────────────────────────────

    const vencedor = verificarCondicaoVitoria(
      jogadoresAtivosAposNoite,
      resultado.novoControleNoite.corrompidosAtuais,
    );

    if (vencedor !== null) {
      const estadoComPrivadosAtualizados: EstadoInquisicao = {
        ...estado,
        estadosPrivados: estadosPrivadosAtualizados,
      };
      await this._finalizarPartida(
        estadoComPrivadosAtualizados,
        vencedor,
        jogadoresAtivosAposNoite,
        eliminadosAposNoite,
        agora,
      );
      return;
    }

    // ── Sem vitória: avançar para nova conversa (loop+1) ─────────────────

    const proximoLoop = loop + 1;
    const { intensidade } = estadoPublico.configuracao;

    // Selecionar evento público para a nova conversa
    const eventoResult = this._selecionarEventoPublicoSeMerecido(proximoLoop, intensidade);

    // Tentar emitir evento privado para um inocente
    const eventoPrivadoResult = this._tentarSelecionarEventoPrivado(
      proximoLoop,
      intensidade,
      jogadoresAtivosAposNoite,
    );

    const atualizacao = criarAtualizacaoFase('conversa', estadoPublico.configuracao, agora, {
      loop: proximoLoop,
      votacaoAtual: null,
      eventoAtivo: eventoResult?.evento ?? null,
      // Mensagem pós-noite: ambígua, do pool de nightPhase.ts ("algo mudou." etc.)
      mensagemDoSistema: resultado.resolucaoInterna.mensagemDoSistema,
      jogadoresAtivos: jogadoresAtivosAposNoite,
      eliminados: eliminadosAposNoite,
    });

    await this._callbacks.escreverEstadoPublico(atualizacao);

    // Escrever evento privado, se selecionado
    if (eventoPrivadoResult !== null) {
      const { jogadorId, patch } = eventoPrivadoResult;
      await this._callbacks.escreverPrivado(jogadorId, patch);

      const privadoAtual = estadosPrivadosAtualizados[jogadorId];
      if (privadoAtual !== undefined) {
        estadosPrivadosAtualizados[jogadorId] = { ...privadoAtual, ...patch };
      }
    }

    this._atualizarEstadoInterno(estado, atualizacao, {
      estadosPrivados: estadosPrivadosAtualizados,
    });
  }

  // ── §10  FINALIZAÇÃO DA PARTIDA ────────────────────────────────────────────

  /**
   * Encerra a partida: escreve vencedor, revelação final, fase 'finalizado'.
   *
   * Chamado quando vitória é detectada em:
   *   - _transicaoApurando (eliminação por votação)
   *   - _transicaoNoite (eliminação ou vitória por dominação pós-conversão)
   *
   * O reveal final sempre mostra tudo — mesmo em modo paranoia.
   * Em paranoia, é a PRIMEIRA vez que o grupo vê os papéis de todos.
   */
  private async _finalizarPartida(
    estado: EstadoInquisicao,
    vencedor: ResultadoPartida,
    jogadoresAtivos: readonly PlayerId[],
    eliminados: readonly EliminacaoRecord[],
    agora: number,
  ): Promise<void> {
    if (this._callbacks === null || this._controleNoite === null) return;

    const { estadoPublico } = estado;

    // IDs de todos os jogadores da partida (ativos + eliminados acumulados)
    const todosIds = [
      ...jogadoresAtivos,
      ...eliminados.map((e) => e.jogadorId),
    ];
    // Deduplicar (jogadores eliminados que também estão em ativos por bug defensivo)
    const todosIdsUnicos = [...new Set(todosIds)];

    const vencedorIds = obterIdsDosVencedores(
      vencedor,
      this._controleNoite.corrompidosAtuais,
      todosIdsUnicos,
    );

    const revelacaoFinal = this._construirRevelacaoFinal(vencedor, estado, agora);

    const atualizacao = criarAtualizacaoFase('finalizado', estadoPublico.configuracao, agora, {
      jogadoresAtivos: [...jogadoresAtivos],
      eliminados: [...eliminados],
      vencedor,
      vencedorIds,
      revelacaoFinal,
      votacaoAtual: null,
      mensagemDoSistema: null,
    });

    // Compatibilidade com fase macro: 'playing' → 'results'
    const atualizacaoFinal: Partial<EstadoFirebaseInquisicao> = {
      ...atualizacao,
      fase: 'results',
    };

    await this._callbacks.escreverEstadoPublico(atualizacaoFinal);

    this._atualizarEstadoInterno(estado, atualizacaoFinal, {
      fase: 'results',
      vencedorIds,
    });
  }

  // ── §11  HANDLERS DE AÇÃO POR TIPO ────────────────────────────────────────

  /**
   * Registra confirmação de papel visto.
   * Quando todos confirmam (antes do timer), avança para conversa imediatamente.
   */
  private _processarConfirmacaoPapel(
    estado: EstadoInquisicao,
    jogadorId: PlayerId,
  ): EstadoInquisicao {
    if (estado.estadoPublico.subFase !== 'revelando_papeis') return estado;

    this._papelConfirmadoPor.add(jogadorId);

    const totalEsperado = estado.estadoPublico.jogadoresAtivos.length;
    if (this._papelConfirmadoPor.size >= totalEsperado) {
      // Todos confirmaram — early resolution (não bloqueia o retorno síncrono)
      void this._tentarAvancarSubFase(estado);
    }

    // Estado público não muda — confirmação é tracking interno
    return estado;
  }

  /**
   * Marca mensagem privada como lida.
   * Atualiza em memória imediatamente + escreve patch no Firebase assincronamente.
   */
  private _processarMensagemLida(
    estado: EstadoInquisicao,
    jogadorId: PlayerId,
  ): EstadoInquisicao {
    const privado = estado.estadosPrivados[jogadorId];
    if (privado === undefined || privado.mensagemLida) return estado;

    const patch: Partial<EstadoPrivadoInquisicao> = {
      mensagemLida: true,
      atualizadaEm: Date.now(),
    };

    void this._callbacks?.escreverPrivado(jogadorId, patch);
    return this._patchPrivadoLocal(estado, jogadorId, patch);
  }

  /**
   * Marca evento privado como lido.
   * Atualiza em memória imediatamente + escreve patch no Firebase assincronamente.
   */
  private _processarEventoPrivadoLido(
    estado: EstadoInquisicao,
    jogadorId: PlayerId,
  ): EstadoInquisicao {
    const privado = estado.estadosPrivados[jogadorId];
    if (privado?.eventoPrivado === null || privado?.eventoPrivado === undefined) return estado;
    if (privado.eventoPrivado.lido) return estado;

    const patch: Partial<EstadoPrivadoInquisicao> = {
      eventoPrivado: { ...privado.eventoPrivado, lido: true },
      atualizadaEm: Date.now(),
    };

    void this._callbacks?.escreverPrivado(jogadorId, patch);
    return this._patchPrivadoLocal(estado, jogadorId, patch);
  }

  /**
   * Registra confirmação de voto no estado público (votantesConfirmados).
   *
   * O voto real (alvoId) é escrito pelo cliente diretamente em /votosPrivados/{id}.
   * Aqui apenas atualizamos o contador público para que o grupo veja "X de N votaram".
   *
   * Quando todos confirmarem, o poll loop detecta e resolve a votação.
   */
  private _processarVoto(
    estado: EstadoInquisicao,
    eleitorId: PlayerId,
    _alvoId: PlayerId,
  ): EstadoInquisicao {
    const { estadoPublico } = estado;
    if (estadoPublico.subFase !== 'votando') return estado;

    const votacao = estadoPublico.votacaoAtual;
    if (votacao?.tipo !== 'em_andamento') return estado;

    // Voto já registrado — idempotência
    if (votacao.votantesConfirmados[eleitorId]) return estado;

    const novosConfirmados: Record<PlayerId, true> = {
      ...votacao.votantesConfirmados,
      [eleitorId]: true,
    };

    const novaVotacao: VotacaoEmAndamento = {
      ...votacao,
      votantesConfirmados: novosConfirmados,
    };

    const novoEstadoPublico: EstadoFirebaseInquisicao = {
      ...estadoPublico,
      votacaoAtual: novaVotacao,
      atualizadoEm: Date.now(),
    };

    // Nota: o host não precisa escrever no Firebase aqui —
    // o cliente já atualizou /estado/votacaoAtual/votantesConfirmados/{id} via runTransaction.
    // Este update é para manter a memória interna do host consistente.
    return { ...estado, estadoPublico: novoEstadoPublico };
  }

  /**
   * Registra ação noturna localmente para checar early resolution.
   *
   * Ações noturnas são escritas pelo cliente em /noite/{id}.
   * O engine lê do Firebase no poll loop (via lerAcoesNoturnas).
   * Aqui tentamos checar early resolution com a nova ação sem esperar o próximo tick.
   */
  private _processarAcaoNoturna(
    estado: EstadoInquisicao,
    jogadorId: PlayerId,
    payload: { tipo: TipoAcaoNoturna; alvoId: PlayerId },
  ): EstadoInquisicao {
    if (estado.estadoPublico.subFase !== 'noite') return estado;
    if (this._controleNoite === null) return estado;

    // Construir a ação como seria lida do Firebase
    const acaoLocal: AcaoNoturna = {
      tipo: payload.tipo,
      alvoId: payload.alvoId,
      loop: estado.estadoPublico.loop,
      jogadorId,
      registradaEm: Date.now(),
    };

    // Check assíncrono de early resolution (optimista — não bloqueia retorno)
    void this._callbacks?.lerAcoesNoturnas().then((acoesFb) => {
      if (this._controleNoite === null) return;

      // Combinar ações do Firebase com a ação local recém-chegada
      const acoesSemDuplicata = acoesFb.filter((a) => a.jogadorId !== jogadorId);
      const todasAcoes = [...acoesSemDuplicata, acaoLocal];

      const ctx: ContextoResolucaoHost = {
        estadoPublico: estado.estadoPublico,
        estadosPrivados: estado.estadosPrivados,
        controleNoite: this._controleNoite,
      };

      if (todosAtoresElegiveisAgiram(todasAcoes, ctx)) {
        void this._tentarAvancarSubFase(estado);
      }
    });

    // Estado público não muda com ação noturna — resolução acontece na transição
    return estado;
  }

  /**
   * Aplica resultado de votação publicado pelo HOST.
   * Usado quando HOST gerencia resolução externamente.
   */
  private _aplicarResultadoVotacao(
    estado: EstadoInquisicao,
    resultado: VotacaoResolvida,
  ): EstadoInquisicao {
    return {
      ...estado,
      estadoPublico: {
        ...estado.estadoPublico,
        votacaoAtual: resultado,
        atualizadoEm: Date.now(),
      },
    };
  }

  /**
   * Aplica mensagem pós-noite publicada pelo HOST.
   * Usado quando HOST gerencia resolução externamente.
   */
  private _aplicarMensagemNoite(
    estado: EstadoInquisicao,
    mensagem: string,
  ): EstadoInquisicao {
    return {
      ...estado,
      estadoPublico: {
        ...estado.estadoPublico,
        mensagemDoSistema: mensagem,
        atualizadoEm: Date.now(),
      },
    };
  }

  /**
   * Aplica finalização publicada pelo HOST.
   * Usado quando HOST gerencia finalização externamente.
   */
  private _aplicarFinalizacao(
    estado: EstadoInquisicao,
    vencedor: ResultadoPartida,
    revelacao: RevelacaoFinalRecord,
  ): EstadoInquisicao {
    return {
      ...estado,
      fase: 'results',
      estadoPublico: {
        ...estado.estadoPublico,
        subFase: 'finalizado',
        fase: 'results',
        vencedor,
        revelacaoFinal: revelacao,
        atualizadoEm: Date.now(),
      },
    };
  }

  // ── §12  RESOLUÇÃO DE VOTAÇÃO (inline) ────────────────────────────────────

  /**
   * Calcula o resultado da votação a partir dos votos privados lidos do Firebase.
   *
   * Regras:
   *   - Votos com loop ≠ loop atual são descartados (anti-stale)
   *   - Maioria simples: candidato com mais votos é eliminado
   *   - Empate (dois ou mais com mesmo máximo): eliminadoId = null, foiEmpate = true
   *   - Nenhum voto válido: tratado como empate
   *
   * Papel revelado: conforme configuracao.revelarPapelAoEliminar.
   *   Convertidos aparecem como 'corrompido' (facção no momento da eliminação).
   *   Em modo paranoia: papelRevelado = null (revela apenas no reveal final).
   */
  private _resolverVotacao(
    votos: Record<PlayerId, VotoPrivado>,
    loop: number,
    configuracao: ConfiguracaoPartida,
    estadosPrivados: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
    agora: number,
  ): VotacaoResolvida {
    // Contar votos válidos por alvo
    const contagem = new Map<PlayerId, number>();

    for (const voto of Object.values(votos)) {
      if (voto.loop !== loop) continue; // Descartar voto stale

      const atual = contagem.get(voto.alvoId) ?? 0;
      contagem.set(voto.alvoId, atual + 1);
    }

    const empate = (): VotacaoResolvida => ({
      tipo: 'resolvida',
      loop,
      eliminadoId: null,
      foiEmpate: true,
      papelRevelado: null,
      resolvidaEm: agora,
    });

    if (contagem.size === 0) return empate();

    const maxVotos = Math.max(...contagem.values());
    const candidatos = [...contagem.entries()].filter(([, v]) => v === maxVotos);

    if (candidatos.length > 1) return empate();

    const eliminadoId = candidatos[0]![0];

    // Derivar papel a revelar conforme configuração
    let papelRevelado: PapelInquisicao | null = null;
    if (configuracao.revelarPapelAoEliminar) {
      const privado = estadosPrivados[eliminadoId];
      if (privado !== undefined) {
        // Facção real no momento da eliminação
        papelRevelado = privado.convertidoNoLoop !== null
          ? 'corrompido'
          : privado.papelOriginal;
      }
    }

    return {
      tipo: 'resolvida',
      loop,
      eliminadoId,
      foiEmpate: false,
      papelRevelado,
      resolvidaEm: agora,
    };
  }

  // ── §13  EVENTOS SOCIAIS ───────────────────────────────────────────────────

  /**
   * Seleciona um evento público se a probabilidade editorial for atingida.
   *
   * A decisão de emitir usa Math.random() contra a probabilidade calculada.
   * Tracking: templateId adicionado a _idsTemplatesUsados; categoria e contador atualizados.
   *
   * @returns ResultadoSelecao (evento + templateId) ou null se não emitido.
   */
  private _selecionarEventoPublicoSeMerecido(
    loop: number,
    intensidade: IntensidadeInquisicao,
  ): ResultadoSelecao<EventoPublico> | null {
    const probabilidade = calcularProbabilidadeEventoPublico(
      loop,
      intensidade,
      this._totalEventosPublicosUsados,
    );

    // Decisão probabilística — dados editorial
    if (Math.random() > probabilidade) return null;

    const ctx: ContextoSelecaoPublico = {
      loop,
      idsTemplatesUsados: this._idsTemplatesUsados,
      ultimaCategoriaPublica: this._ultimaCategoriaPublica,
      intensidade,
    };

    const resultado = selecionarEventoPublico(ctx, Date.now());
    if (resultado === null) return null;

    // Tracking anti-repetição
    this._idsTemplatesUsados.add(resultado.templateId);
    this._ultimaCategoriaPublica = resultado.evento.categoria;
    this._totalEventosPublicosUsados++;

    return resultado;
  }

  /**
   * Tenta selecionar e endereçar um evento privado para um inocente ativo.
   *
   * Filosofia:
   *   - Apenas inocentes recebem eventos privados
   *   - Corrompidos já têm assimetria de informação (conhecem aliados)
   *   - Adicionar assimetria a corrompidos aumentaria vantagem demais
   *
   * @param loop               Loop atual.
   * @param intensidade        Intensidade da partida.
   * @param estadosPrivados    Estados privados em memória.
   * @param jogadoresAtivos    IDs ativos no momento.
   * @returns { jogadorId, patch } ou null se não deve emitir.
   */
  private _tentarSelecionarEventoPrivado(
    loop: number,
    intensidade: IntensidadeInquisicao,
    jogadoresAtivos: readonly PlayerId[],
  ): { jogadorId: PlayerId; patch: Partial<EstadoPrivadoInquisicao> } | null {
    const probabilidade = calcularProbabilidadeEventoPrivado(
      loop,
      intensidade,
      this._totalEventosPrivadosUsados,
    );

    if (Math.random() > probabilidade) return null;

    const ctx: ContextoSelecaoPrivado = {
      loop,
      idsTemplatesUsados: this._idsTemplatesUsados,
      intensidade,
    };

    const resultado = selecionarEventoPrivado(ctx, Date.now());
    if (resultado === null) return null;

    // Selecionar inocente ativo aleatório
    // "inocente" aqui = não está em corrompidosAtuais do controle de noite
    const corrompidosAtuais = this._controleNoite?.corrompidosAtuais ?? [];
    const inocentesAtivos = jogadoresAtivos.filter(
      (id) => !corrompidosAtuais.includes(id),
    );

    if (inocentesAtivos.length === 0) return null;

    const jogadorId = inocentesAtivos[
      Math.floor(Math.random() * inocentesAtivos.length)
    ]!;

    // Tracking
    this._idsTemplatesUsados.add(resultado.templateId);
    this._totalEventosPrivadosUsados++;

    const agora = Date.now();
    const patch: Partial<EstadoPrivadoInquisicao> = {
      eventoPrivado: resultado.evento,
      atualizadaEm: agora,
    };

    return { jogadorId, patch };
  }

  // ── §14  REVELAÇÃO FINAL ──────────────────────────────────────────────────

  /**
   * Constrói a revelação final completa de todos os jogadores.
   *
   * Inclui ativos e eliminados — o reveal é sempre total.
   * Para convertidos: papelOriginal preservado + convertidoNoLoop preenchido.
   * Para corrompidos originais: papelOriginal = 'corrompido', convertidoNoLoop = null.
   *
   * Em modo paranoia, esta é a PRIMEIRA vez que o grupo vê os papéis.
   * O efeito desejado: "então VOCÊ já tinha virado naquela rodada?"
   */
  private _construirRevelacaoFinal(
    vencedor: ResultadoPartida,
    estado: EstadoInquisicao,
    agora: number,
  ): RevelacaoFinalRecord {
    const papeisPorJogador: Record<PlayerId, PapelFinalRevelado> = {};

    for (const [id, privado] of Object.entries(estado.estadosPrivados)) {
      papeisPorJogador[id] = {
        papelOriginal: privado.papelOriginal,
        convertidoNoLoop: privado.convertidoNoLoop,
      };
    }

    return {
      papeisPorJogador,
      vencedor,
      totalLoops: estado.estadoPublico.loop,
      totalCorrupcoes: this._controleNoite?.totalCorrupcoes ?? 0,
      geradaEm: agora,
    };
  }

  // ── §15  HELPERS INTERNOS ─────────────────────────────────────────────────

  /**
   * Atualiza _estadoAtual aplicando um partial de EstadoFirebaseInquisicao.
   *
   * Centraliza a mutação interna: toda escrita no Firebase deve ser
   * acompanhada desta chamada para manter a memória do host consistente.
   *
   * @param estado        Estado base antes da transição.
   * @param atualizacao   Partial do estado público a aplicar (o que foi escrito no Firebase).
   * @param extras        Campos adicionais do GameState a atualizar (fase, estadosPrivados, etc.).
   */
  private _atualizarEstadoInterno(
    estado: EstadoInquisicao,
    atualizacao: Partial<EstadoFirebaseInquisicao>,
    extras?: Partial<Omit<EstadoInquisicao, 'estadoPublico'>>,
  ): void {
    const novoEstadoPublico: EstadoFirebaseInquisicao = {
      ...estado.estadoPublico,
      ...atualizacao,
    } as EstadoFirebaseInquisicao;

    this._estadoAtual = {
      ...estado,
      ...extras,
      estadoPublico: novoEstadoPublico,
      atualizadoEm: Date.now(),
    };
  }

  /**
   * Aplica patch ao estado privado de um jogador em memória.
   * Não escreve no Firebase — use callbacks para isso.
   */
  private _patchPrivadoLocal(
    estado: EstadoInquisicao,
    jogadorId: PlayerId,
    patch: Partial<EstadoPrivadoInquisicao>,
  ): EstadoInquisicao {
    const privadoAtual = estado.estadosPrivados[jogadorId];
    if (privadoAtual === undefined) return estado;

    return {
      ...estado,
      estadosPrivados: {
        ...estado.estadosPrivados,
        [jogadorId]: { ...privadoAtual, ...patch },
      },
    };
  }

  /**
   * Extrai e valida a intensidade das opcoes de criação.
   * @throws Error se opcoes não contiver intensidade válida.
   */
  private _extrairIntensidade(opcoes: unknown): IntensidadeInquisicao {
    if (
      typeof opcoes === 'object' &&
      opcoes !== null &&
      'intensidade' in opcoes
    ) {
      const intensidade = (opcoes as Record<string, unknown>)['intensidade'];
      if (
        intensidade === 'leve' ||
        intensidade === 'padrao' ||
        intensidade === 'paranoia'
      ) {
        return intensidade;
      }
    }
    throw new Error(
      '[InquisicaoEngine] opcoes.intensidade inválido ou ausente. ' +
      'Esperado: "leve" | "padrao" | "paranoia".',
    );
  }

  /** Seleciona uma mensagem de empate aleatória do pool editorial. */
  private _mensagemEmpate(): string {
    return MENSAGENS_EMPATE[Math.floor(Math.random() * MENSAGENS_EMPATE.length)]!;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  SINGLETON + REGISTRO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Instância singleton do InquisicaoEngine.
 *
 * Uma instância por processo — o service layer reutiliza para múltiplas salas
 * via chamadas sequenciais de criarEstadoInicial() e iniciar().
 *
 * Para múltiplas salas simultâneas no mesmo processo: instanciar separadamente.
 */
export const inquisicaoEngine = new InquisicaoEngine();
