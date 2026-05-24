/**
 * INQUISIÇÃO LOCAL ENGINE
 *
 * Motor do modo 1 celular. Toda a lógica em memória — sem Firebase,
 * sem rede, sem listeners externos.
 *
 * ── Arquitetura de estado ──────────────────────────────────────────────────
 *
 * EstadoPrivadoEngine  — nunca sai do engine. Papéis, ações noturnas,
 *                        contaminação pendente, ator da noite.
 *
 * EstadoLocalPublico   — emitido via callback a cada mudança.
 *                        UI lê sem restrição. Zero informação privada.
 *
 * Consultas pontuais   — UI chama getPapelAtribuido(id) e getAlvosDisponiveis()
 *                        apenas quando o celular está nas mãos daquele jogador.
 *
 * ── Ownership de pacing ───────────────────────────────────────────────────
 *
 * Engine controla:  validação e resolução das microfases noturnas
 * UI controla:      passagem física do celular e confirmação curta das ações
 * Ninguém controla: fase de dia (host-driven, sem timer)
 *
 * ── Corrupção diferida ───────────────────────────────────────────────────
 *
 * Contaminação registrada na noite do loop N.
 * Efeito aplicado no início do loop N+1 (antes da distribuição de papéis).
 * O jogador contaminado descobre seu novo papel durante a distribuição.
 * Ninguém vê a reação — a descoberta é em silêncio.
 *
 * ── Ator da noite (rotação) ─────────────────────────────────────────────
 *
 * Se há múltiplos corrompidos, apenas um age por noite.
 * Rotação determinística: corrompido[( loop - 1 ) % total].
 * Todos os corrompidos conhecem o ator desta noite via getPapelAtribuido().
 *
 * ── Eliminação silenciosa vs. pública ───────────────────────────────────
 *
 * Votação:  resultado_votacao → eliminação, empate ou ninguém caiu.
 * Noite:    encerrando_noite → ausência descoberta na próxima distribuição.
 */

import { sortearMensagemNoite } from './mensagens';
import { sortearEventoDia } from './socialEvents';
import type {
  PlayerId,
  PapelLocal,
  TipoAcaoLocal,
  JogadorLocal,
  ConfiguracaoLocal,
  EliminadoLocal,
  EstadoLocalPublico,
  EstadoDistribuicao,
  PapelAtribuidoLocal,
  ResultadoVotacaoLocal,
  RevelacaoFinalLocal,
  LoopLocalResolvido,
  ResultadoLocalFinalizado,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Estado privado — nunca exposto ao UI
// ─────────────────────────────────────────────────────────────────────────────

interface AcaoNoturnaInterna {
  tipo: TipoAcaoLocal;
  agente: PlayerId;
  alvo: PlayerId;
}

interface EstadoPrivadoEngine {
  /** Papéis correntes. Atualizados quando contaminação entra em vigor. */
  papeis: Map<PlayerId, PapelLocal>;

  /** Papéis iniciais — para revelação final e histórico. */
  papelOriginal: Map<PlayerId, PapelLocal>;

  /**
   * Loop em que o jogador virou corrompido.
   * null = corrompido desde o início.
   * Indefinido = nunca foi contaminado.
   */
  convertidoNoLoop: Map<PlayerId, number | null>;

  /** Jogador que receberá papel corrompido no próximo loop. */
  contaminacaoPendente: PlayerId | null;

  /** Ações registradas na noite atual. Resetado em cada iniciarNoite(). */
  acoesNoturnas: AcaoNoturnaInterna[];

  /** Corrompido designado como ator desta noite. */
  atorNoite: PlayerId | null;

  /** Última mensagem pós-noite — para anti-repetição. */
  ultimaMensagemNoite: string | null;

  /** Último evento social exibido no dia — anti-repetição. */
  ultimoEventoDiaId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Callbacks opcionais de sessão
// ─────────────────────────────────────────────────────────────────────────────

export interface EngineCallbacks {
  /** Chamado ao encerrar cada loop (após resolução da noite). */
  onLoopResolvido?: (loop: LoopLocalResolvido) => void;
  /** Chamado uma única vez quando o jogo termina. */
  onJogoFinalizado?: (resultado: ResultadoLocalFinalizado) => void;
}

export class InquisicaoLocalEngine {
  private readonly _jogadores: JogadorLocal[];
  private readonly _config: ConfiguracaoLocal;
  private _priv: EstadoPrivadoEngine;
  private _estado: EstadoLocalPublico;
  private readonly _onMudanca: (estado: EstadoLocalPublico) => void;
  private readonly _callbacks: EngineCallbacks;

  // ── Tracking de sessão (acumula ao longo do jogo) ─────────────────────────

  /** Eliminado por votação no loop corrente — resetado em iniciarNoite(). */
  private _eliminadoVotacaoLoop: {
    jogadorId: PlayerId;
    papel: PapelLocal;
  } | null = null;

  /** Resultado físico da votação no loop corrente. */
  private _resultadoVotacaoLoop: ResultadoVotacaoLocal['tipo'] =
    'sem_eliminacao';

  /** Histórico de eliminações por votação — para o resultado final. */
  private _eliminadosPorVotacaoHistorico: Array<{
    jogadorId: PlayerId;
    loop: number;
    papelNoMomento: PapelLocal;
  }> = [];

  /** Contagem de ações noturnas executadas por corrompido. */
  private _acoesCorrompidas = new Map<PlayerId, number>();

  /** Conversões já agendadas nesta partida, incluindo pendentes. */
  private _contaminacoesAgendadas = 0;

  constructor(
    jogadores: JogadorLocal[],
    config: ConfiguracaoLocal,
    onMudanca: (estado: EstadoLocalPublico) => void,
    callbacks: EngineCallbacks = {},
  ) {
    if (jogadores.length < 4) {
      throw new Error('Inquisição Local: mínimo 4 jogadores.');
    }

    this._jogadores = jogadores;
    this._config = config;
    this._onMudanca = onMudanca;
    this._callbacks = callbacks;

    const { papeis, atorNoite } = this._atribuirPapeis(jogadores, config);
    const jogadoresAtivos = jogadores.map((j) => j.id);

    // Corrompidos iniciais: convertidoNoLoop = null (sempre foram corrompidos).
    // Inocentes/guardiões: não entram no Map — get() retorna undefined,
    // que _construirRevelacao() trata como "nunca contaminado".
    const convertidoNoLoop = new Map<PlayerId, number | null>();
    for (const [id, papel] of papeis) {
      if (papel === 'corrompido') convertidoNoLoop.set(id, null);
    }

    this._priv = {
      papeis,
      papelOriginal: new Map(papeis),
      convertidoNoLoop,
      contaminacaoPendente: null,
      acoesNoturnas: [],
      atorNoite,
      ultimaMensagemNoite: null,
      ultimoEventoDiaId: null,
    };

    this._estado = {
      fase: 'distribuindo_papeis',
      loop: 1,
      jogadoresAtivos,
      eliminados: [],
      distribuicao: this._novaDistribuicao(jogadoresAtivos),
      mensagemNoite: null,
      eliminadoPendente: null,
      resultadoVotacao: null,
      eventoDia: null,
      vencedor: null,
      revelacaoFinal: null,
      configuracao: config,
      totalJogadores: jogadores.length,
    };
  }

  // ── API pública — ações do host e jogadores ──────────────────────────────

  /**
   * Avança a distribuição de papéis para o próximo jogador.
   * Chamado pelo UI após o auto-avanço de 3s ou toque do host.
   * Quando o último jogador recebe seu papel: transição automática para 'dia'.
   */
  avancarDistribuicao(): void {
    if (this._estado.fase !== 'distribuindo_papeis') return;
    const dist = this._estado.distribuicao!;
    const proximo = dist.indiceAtual + 1;

    if (proximo >= dist.jogadoresOrdem.length) {
      this._emit({
        fase: 'dia',
        distribuicao: null,
        eventoDia: this._sortearEventoDia(this._estado.loop),
      });
    } else {
      this._emit({ distribuicao: { ...dist, indiceAtual: proximo } });
    }
  }

  /**
   * Host decide que a discussão foi suficiente.
   * Transição para registro do resultado do apontamento físico.
   */
  chamarVotacao(): void {
    if (this._estado.fase !== 'dia') return;
    this._emit({ fase: 'chamando_votacao' });
  }

  /**
   * Host registra o jogador com mais votos após o apontamento simultâneo.
   * Resultado fica visível por modo — silêncio de absorção começa.
   */
  registrarEliminado(jogadorId: PlayerId): void {
    if (this._estado.fase !== 'chamando_votacao') return;
    if (!this._estado.jogadoresAtivos.includes(jogadorId)) return;
    const papel = this._priv.papeis.get(jogadorId);
    if (!papel) return;

    this._priv.papeis.delete(jogadorId);

    // Rastrear para callback de sessão — papel atual no momento da eliminação
    this._eliminadoVotacaoLoop = { jogadorId, papel };
    this._resultadoVotacaoLoop = 'eliminacao';
    this._eliminadosPorVotacaoHistorico.push({
      jogadorId,
      loop: this._estado.loop,
      papelNoMomento: papel,
    });

    const eliminado: EliminadoLocal = {
      jogadorId,
      papel,
      loop: this._estado.loop,
      origem: 'votacao',
    };

    this._emit({
      fase: 'resultado_votacao',
      jogadoresAtivos: this._estado.jogadoresAtivos.filter(
        (id) => id !== jogadorId,
      ),
      eliminados: [...this._estado.eliminados, eliminado],
      eliminadoPendente: eliminado,
      resultadoVotacao: { tipo: 'eliminacao', eliminado },
      eventoDia: null,
    });
  }

  registrarEmpate(): void {
    if (this._estado.fase !== 'chamando_votacao') return;
    this._eliminadoVotacaoLoop = null;
    this._resultadoVotacaoLoop = 'empate';
    this._emit({
      fase: 'resultado_votacao',
      eliminadoPendente: null,
      resultadoVotacao: { tipo: 'empate', eliminado: null },
      eventoDia: null,
    });
  }

  registrarSemEliminacao(): void {
    if (this._estado.fase !== 'chamando_votacao') return;
    this._eliminadoVotacaoLoop = null;
    this._resultadoVotacaoLoop = 'sem_eliminacao';
    this._emit({
      fase: 'resultado_votacao',
      eliminadoPendente: null,
      resultadoVotacao: { tipo: 'sem_eliminacao', eliminado: null },
      eventoDia: null,
    });
  }

  /**
   * Host confirma após o silêncio de absorção da votação.
   * Verifica vitória — ou avança para a espera da noite.
   */
  confirmarEliminacao(): void {
    if (this._estado.fase !== 'resultado_votacao') return;

    if (this._estado.resultadoVotacao?.tipo === 'eliminacao') {
      const vitoria = this._checarVitoria(this._estado.jogadoresAtivos);
      if (vitoria) {
        this._encerrarJogo(vitoria);
        return;
      }
    }

    this._emit({
      fase: 'aguardando_noite',
      eliminadoPendente: null,
      resultadoVotacao: null,
      eventoDia: null,
    });
  }

  /**
   * Host inicia a noite após todos estarem com cabeças baixas.
   * A UI conduz cada microfase por confirmação manual curta para não punir
   * o tempo real de passar o celular entre jogadores.
   */
  iniciarNoite(): void {
    if (this._estado.fase !== 'aguardando_noite') return;

    // Limpar ações da noite anterior e rastreio de eliminação deste loop
    this._priv.acoesNoturnas = [];

    // Designar ator desta noite (rotação entre corrompidos ativos)
    this._priv.atorNoite = this._escolherAtorNoite();

    this._emit({ fase: 'noite_corrompidos' });
  }

  /**
   * Jogador ativo registra sua ação na microfase noturna.
   * Se o mesmo agente já registrou ação (mudou de ideia), substitui.
   * Engine valida que a fase está correta antes de aceitar.
   */
  registrarAcaoNoturna(tipo: TipoAcaoLocal, alvo: PlayerId): void {
    const fase = this._estado.fase;
    if (fase !== 'noite_corrompidos' && fase !== 'noite_guardioes') return;

    const agente =
      fase === 'noite_corrompidos'
        ? this._priv.atorNoite
        : this._encontrarGuardiao();

    if (agente === null) return;
    if (!this._acaoEhValidaParaFase(tipo, agente, alvo, fase)) return;

    // Substituir ação anterior do mesmo agente
    this._priv.acoesNoturnas = [
      ...this._priv.acoesNoturnas.filter((a) => a.agente !== agente),
      { tipo, agente, alvo },
    ];
  }

  /**
   * Confirma a microfase noturna atual.
   * noite_corrompidos → noite_guardioes
   * noite_guardioes   → resolução da noite
   */
  confirmarFaseNoite(): void {
    if (this._estado.fase === 'noite_corrompidos') {
      this._avancarParaGuardioes();
      return;
    }

    if (this._estado.fase === 'noite_guardioes') {
      this._resolverNoite();
    }
  }

  /**
   * Host confirma após ler a mensagem em voz alta.
   * Inicia novo loop: aplica contaminação pendente, distribui papéis.
   */
  confirmarNoite(): void {
    if (this._estado.fase !== 'encerrando_noite') return;
    this._iniciarNovoLoop();
  }

  /** Mantido como API de cleanup do componente. Engine local não retém timers. */
  destroy(): void {
    // Sem recursos persistentes para liberar no modo local atual.
  }

  // ── API de consulta — UI chama apenas com o celular nas mãos corretas ────

  /** Retorna estado público corrente. */
  getEstado(): EstadoLocalPublico {
    return this._estado;
  }

  /**
   * Papel e informação privada do jogador especificado.
   * Chamar SOMENTE quando o celular está nas mãos desse jogador.
   * Retorna null se jogador não existe ou já foi eliminado.
   */
  getPapelAtribuido(jogadorId: PlayerId): PapelAtribuidoLocal | null {
    const papel = this._priv.papeis.get(jogadorId);
    if (!papel) return null;

    const aliados =
      papel === 'corrompido'
        ? this._estado.jogadoresAtivos.filter(
            (id) =>
              id !== jogadorId && this._priv.papeis.get(id) === 'corrompido',
          )
        : [];

    return {
      papel,
      aliados,
      isAtorNoite: this._priv.atorNoite === jogadorId,
    };
  }

  /**
   * Alvos válidos para uma ação noturna específica.
   * Regras:
   *   eliminar  → qualquer ativo exceto o próprio agente
   *   contaminar → ativos exceto agente e já-corrompidos
   *   proteger  → qualquer ativo, inclusive o próprio guardião
   */
  getAlvosDisponiveis(jogadorId: PlayerId, tipo: TipoAcaoLocal): PlayerId[] {
    const ativos = this._estado.jogadoresAtivos;

    switch (tipo) {
      case 'eliminar':
        return ativos.filter((id) => id !== jogadorId);

      case 'contaminar':
        return ativos.filter((id) => this._podeContaminar(jogadorId, id));

      case 'proteger':
        return ativos;
    }
  }

  getAcoesCorrompidoDisponiveis(jogadorId: PlayerId): TipoAcaoLocal[] {
    const acoes: TipoAcaoLocal[] = ['eliminar'];
    const podeContaminar = this._estado.jogadoresAtivos.some((id) =>
      this._podeContaminar(jogadorId, id),
    );
    if (podeContaminar) acoes.push('contaminar');
    return acoes;
  }

  /**
   * Jogador cujo papel está sendo revelado agora.
   * Retorna null fora da fase distribuindo_papeis.
   */
  getJogadorNaVez(): JogadorLocal | null {
    const dist = this._estado.distribuicao;
    if (!dist) return null;
    const id = dist.jogadoresOrdem[dist.indiceAtual];
    if (!id) return null;
    return this._jogadores.find((j) => j.id === id) ?? null;
  }

  /**
   * Verifica se um jogador é o ator noturno ativo neste momento.
   * Usado no protocolo de toque universal (modo Paranoia) para decidir
   * se o toque mostra a tela de ação ou a tela neutra.
   */
  isAtorNaFaseAtual(jogadorId: PlayerId): boolean {
    switch (this._estado.fase) {
      case 'noite_corrompidos':
        return this._priv.atorNoite === jogadorId;
      case 'noite_guardioes':
        return this._encontrarGuardiao() === jogadorId;
      default:
        return false;
    }
  }

  /**
   * Retorna o ID do ator da fase noturna atual.
   * null → não há ator (guardião inexistente em noite_guardioes = modo Leve).
   * UI usa isso para decidir entre tela de ação e tela neutra.
   */
  getAtorFaseAtual(): PlayerId | null {
    switch (this._estado.fase) {
      case 'noite_corrompidos':
        return this._priv.atorNoite;
      case 'noite_guardioes':
        return this._encontrarGuardiao();
      default:
        return null;
    }
  }

  // ── Internals — fluxo noturno ─────────────────────────────────────────────

  /**
   * Fim da microfase dos corrompidos.
   * Narra guardiões — sempre, mesmo em modo Leve — criando ambiguidade
   * sobre se existem guardiões na sessão.
   */
  private _avancarParaGuardioes(): void {
    this._emit({ fase: 'noite_guardioes' });
  }

  /**
   * Resolve todas as ações registradas na noite.
   *
   * Regra de prioridade:
   *   1. Guardião protege → anula eliminação E contaminação no mesmo alvo.
   *   2. Corrompido elimina → remove ativo (origem: 'noite', sem reveal público).
   *   3. Corrompido contamina → armazena pendente para o próximo loop.
   *
   * Eliminações noturnas são silenciosas: o jogador desaparece da distribuição
   * no próximo loop. A ausência é o anúncio.
   */
  private _resolverNoite(): void {
    const acaoGuardiao = this._priv.acoesNoturnas.find(
      (a) => a.tipo === 'proteger',
    );
    const acaoCorrompido = this._priv.acoesNoturnas.find(
      (a) => a.tipo === 'eliminar' || a.tipo === 'contaminar',
    );

    let novosAtivos = [...this._estado.jogadoresAtivos];
    let novosEliminados = [...this._estado.eliminados];

    // Rastrear se houve bloqueio para o callback de sessão
    let eliminarAlvoId: PlayerId | null = null;
    let eliminarBloqueado = false;

    if (acaoCorrompido) {
      const protegido = acaoGuardiao?.alvo === acaoCorrompido.alvo;

      // Registrar ação do corrompido (independente de bloqueio)
      if (this._priv.atorNoite) {
        const count = this._acoesCorrompidas.get(this._priv.atorNoite) ?? 0;
        this._acoesCorrompidas.set(this._priv.atorNoite, count + 1);
      }

      if (!protegido) {
        if (acaoCorrompido.tipo === 'eliminar') {
          eliminarAlvoId = acaoCorrompido.alvo;
          const papel = this._priv.papeis.get(acaoCorrompido.alvo);
          if (papel) {
            this._priv.papeis.delete(acaoCorrompido.alvo);
            novosAtivos = novosAtivos.filter(
              (id) => id !== acaoCorrompido.alvo,
            );
            novosEliminados = [
              ...novosEliminados,
              {
                jogadorId: acaoCorrompido.alvo,
                papel,
                loop: this._estado.loop,
                origem: 'noite',
              },
            ];
          }
        } else {
          // contaminar — efeito diferido
          const papelAlvo = this._priv.papeis.get(acaoCorrompido.alvo);
          if (
            (papelAlvo === 'inocente' || papelAlvo === 'guardiao') &&
            this._podeContaminar(acaoCorrompido.agente, acaoCorrompido.alvo)
          ) {
            this._priv.contaminacaoPendente = acaoCorrompido.alvo;
            this._contaminacoesAgendadas++;
          }
        }
      } else if (acaoCorrompido.tipo === 'eliminar') {
        // Tentativa de eliminar bloqueada pelo guardião
        eliminarAlvoId = acaoCorrompido.alvo;
        eliminarBloqueado = true;
      }
    }

    const mensagem = sortearMensagemNoite(this._priv.ultimaMensagemNoite);
    this._priv.ultimaMensagemNoite = mensagem;

    // Emitir dados do loop para o sistema de sessão
    const contaminados = this._priv.contaminacaoPendente
      ? [this._priv.contaminacaoPendente]
      : [];

    this._callbacks.onLoopResolvido?.({
      loop: this._estado.loop,
      eliminadoId: this._eliminadoVotacaoLoop?.jogadorId ?? null,
      eliminadoEraPapel: this._eliminadoVotacaoLoop?.papel ?? null,
      totalAtivos: novosAtivos.length,
      contaminados,
      eliminarAlvoId,
      eliminarBloqueado,
      resultadoVotacao: this._resultadoVotacaoLoop,
    });

    // Vitória pode acontecer por eliminação noturna
    const vitoria = this._checarVitoria(novosAtivos);

    if (vitoria) {
      this._encerrarJogo(vitoria, {
        jogadoresAtivos: novosAtivos,
        eliminados: novosEliminados,
        mensagemNoite: mensagem,
      });
      return;
    }

    this._emit({
      jogadoresAtivos: novosAtivos,
      eliminados: novosEliminados,
      mensagemNoite: mensagem,
      fase: 'encerrando_noite',
      eventoDia: null,
    });
  }

  // ── Internals — progressão de loops ──────────────────────────────────────

  private _iniciarNovoLoop(): void {
    const novoLoop = this._estado.loop + 1;

    // Aplicar contaminação pendente (efeito do loop anterior)
    if (this._priv.contaminacaoPendente !== null) {
      const alvo = this._priv.contaminacaoPendente;
      this._priv.papeis.set(alvo, 'corrompido');
      this._priv.convertidoNoLoop.set(alvo, novoLoop);
      this._priv.contaminacaoPendente = null;

      // Contaminação pode ter criado paridade → checar vitória antes de distribuir
      const vitoria = this._checarVitoria(this._estado.jogadoresAtivos);
      if (vitoria) {
        this._encerrarJogo(vitoria);
        return;
      }
    }

    const ativos = this._estado.jogadoresAtivos;
    this._priv.atorNoite = this._escolherAtorNoite(ativos, novoLoop);

    this._emit({
      fase: 'distribuindo_papeis',
      loop: novoLoop,
      distribuicao: this._novaDistribuicao(ativos),
      eliminadoPendente: null,
      resultadoVotacao: null,
      eventoDia: null,
    });
  }

  // ── Internals — helpers ───────────────────────────────────────────────────

  /**
   * Atribui papéis por sorteio Fisher-Yates.
   * Garante: numCorrompidos ≤ floor(n/3), mínimo 1.
   * Guardião vem logo após os corrompidos na ordem shuffled.
   */
  private _atribuirPapeis(
    jogadores: JogadorLocal[],
    config: ConfiguracaoLocal,
  ): { papeis: Map<PlayerId, PapelLocal>; atorNoite: PlayerId | null } {
    const papeis = new Map<PlayerId, PapelLocal>();
    const ids = jogadores.map((j) => j.id);

    // Fisher-Yates
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = tmp;
    }

    const numCorrompidos = Math.max(
      1,
      Math.min(config.numeroCorrompidosInicial, Math.floor(ids.length / 3)),
    );

    let idx = 0;

    for (let i = 0; i < numCorrompidos; i++, idx++) {
      papeis.set(shuffled[idx]!, 'corrompido');
    }

    if (config.incluirGuardiao && idx < shuffled.length) {
      papeis.set(shuffled[idx]!, 'guardiao');
      idx++;
    }

    while (idx < shuffled.length) {
      papeis.set(shuffled[idx]!, 'inocente');
      idx++;
    }

    const primeiroCorrompido =
      shuffled.find((id) => papeis.get(id) === 'corrompido') ?? null;

    return { papeis, atorNoite: primeiroCorrompido };
  }

  /**
   * Escolhe o corrompido ator desta noite por rotação determinística.
   * Garante que todos os corrompidos agem ao longo dos loops.
   */
  private _escolherAtorNoite(
    ativos: PlayerId[] = this._estado.jogadoresAtivos,
    loop: number = this._estado.loop,
  ): PlayerId | null {
    const corrompidos = ativos.filter(
      (id) => this._priv.papeis.get(id) === 'corrompido',
    );
    if (corrompidos.length === 0) return null;

    const indice = (loop - 1) % corrompidos.length;
    return corrompidos[indice] ?? null;
  }

  private _encontrarGuardiao(): PlayerId | null {
    for (const id of this._estado.jogadoresAtivos) {
      if (this._priv.papeis.get(id) === 'guardiao') return id;
    }
    return null;
  }

  private _acaoEhValidaParaFase(
    tipo: TipoAcaoLocal,
    agente: PlayerId,
    alvo: PlayerId,
    fase: EstadoLocalPublico['fase'],
  ): boolean {
    if (!this._estado.jogadoresAtivos.includes(agente)) return false;
    if (!this._estado.jogadoresAtivos.includes(alvo)) return false;

    if (fase === 'noite_corrompidos') {
      if (agente !== this._priv.atorNoite) return false;
      if (this._priv.papeis.get(agente) !== 'corrompido') return false;
      if (tipo === 'eliminar') return alvo !== agente;
      if (tipo === 'contaminar') return this._podeContaminar(agente, alvo);
      return false;
    }

    if (fase === 'noite_guardioes') {
      return (
        tipo === 'proteger' && this._priv.papeis.get(agente) === 'guardiao'
      );
    }

    return false;
  }

  private _podeContaminar(agente: PlayerId, alvo: PlayerId): boolean {
    if (this._config.maxContaminacoes <= 0) return false;
    if (this._contaminacoesAgendadas >= this._config.maxContaminacoes) {
      return false;
    }
    if (this._priv.contaminacaoPendente !== null) return false;
    if (agente === alvo) return false;
    if (!this._estado.jogadoresAtivos.includes(alvo)) return false;
    if (this._priv.papeis.get(agente) !== 'corrompido') return false;

    const papelAlvo = this._priv.papeis.get(alvo);
    if (papelAlvo !== 'inocente' && papelAlvo !== 'guardiao') return false;

    return !this._contaminacaoGerariaParidade(alvo);
  }

  private _contaminacaoGerariaParidade(alvo: PlayerId): boolean {
    let corrompidos = 0;
    let inocentes = 0;

    for (const id of this._estado.jogadoresAtivos) {
      if (id === alvo || this._priv.papeis.get(id) === 'corrompido') {
        corrompidos++;
      } else {
        inocentes++;
      }
    }

    return corrompidos >= inocentes;
  }

  /**
   * Corrompidos vencem por paridade (≥ inocentes) ou supermaioria.
   * Inocentes vencem quando não há nenhum corrompido ativo.
   * Guardião conta como inocente para cálculo de paridade.
   */
  private _checarVitoria(
    ativos: PlayerId[],
  ): 'corrompidos' | 'inocentes' | null {
    let corrompidos = 0;
    let inocentes = 0; // inclui guardião

    for (const id of ativos) {
      if (this._priv.papeis.get(id) === 'corrompido') corrompidos++;
      else inocentes++;
    }

    if (corrompidos === 0) return 'inocentes';
    if (corrompidos >= inocentes) return 'corrompidos';
    return null;
  }

  private _construirRevelacao(): RevelacaoFinalLocal {
    const papeisPorJogador: RevelacaoFinalLocal['papeisPorJogador'] = {};

    for (const jogador of this._jogadores) {
      const papelFinal =
        this._priv.papeis.get(jogador.id) ??
        this._priv.papelOriginal.get(jogador.id) ??
        'inocente';

      const papelOriginal =
        this._priv.papelOriginal.get(jogador.id) ?? 'inocente';

      papeisPorJogador[jogador.id] = {
        papelFinal,
        papelOriginal,
        convertidoNoLoop: this._priv.convertidoNoLoop.get(jogador.id) ?? null,
      };
    }

    return { papeisPorJogador, totalLoops: this._estado.loop };
  }

  private _sortearEventoDia(
    loop: number,
    resultadoVotacaoAnterior: ResultadoVotacaoLocal['tipo'] = this
      ._resultadoVotacaoLoop,
  ) {
    const evento = sortearEventoDia({
      loop,
      modo: this._config.modo,
      resultadoVotacaoAnterior,
      ultimoEventoId: this._priv.ultimoEventoDiaId,
    });

    if (evento) this._priv.ultimoEventoDiaId = evento.id;
    return evento;
  }

  private _encerrarJogo(
    vencedor: 'corrompidos' | 'inocentes',
    extra: Partial<EstadoLocalPublico> = {},
  ): void {
    // Construir dados de resultado para o sistema de sessão
    const papeisPorJogador: ResultadoLocalFinalizado['papeisPorJogador'] = {};
    for (const jogador of this._jogadores) {
      papeisPorJogador[jogador.id] = {
        papelOriginal: this._priv.papelOriginal.get(jogador.id) ?? 'inocente',
        convertidoNoLoop: this._priv.convertidoNoLoop.get(jogador.id) ?? null,
      };
    }

    const acoesCorrompidas: Record<PlayerId, number> = {};
    for (const [id, count] of this._acoesCorrompidas) {
      acoesCorrompidas[id] = count;
    }

    this._callbacks.onJogoFinalizado?.({
      vencedor,
      totalLoops: this._estado.loop,
      totalJogadores: this._jogadores.length,
      papeisPorJogador,
      eliminadosPorVotacao: [...this._eliminadosPorVotacaoHistorico],
      acoesCorrompidas,
    });

    this._emit({
      ...extra,
      fase: 'finalizado',
      vencedor,
      eliminadoPendente: null,
      resultadoVotacao: null,
      revelacaoFinal: this._construirRevelacao(),
    });
  }

  private _novaDistribuicao(ativos: PlayerId[]): EstadoDistribuicao {
    return { indiceAtual: 0, jogadoresOrdem: [...ativos] };
  }

  private _emit(parcial: Partial<EstadoLocalPublico>): void {
    this._estado = { ...this._estado, ...parcial };
    this._onMudanca(this._estado);
  }
}
