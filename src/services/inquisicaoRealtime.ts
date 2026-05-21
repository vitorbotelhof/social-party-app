/**
 * INQUISIÇÃO — SERVIÇO DE TEMPO REAL (Firebase)
 *
 * Camada de serviço que conecta o InquisicaoEngine ao Firebase Realtime Database.
 *
 * ─── Responsabilidades ───────────────────────────────────────────────────────
 *
 * ✓ Implementar EngineCallbacks (injeção no engine — engine nunca importa Firebase)
 * ✓ Observar /estado em tempo real (todos os clientes)
 * ✓ Observar /privados/{id} por jogador autenticado
 * ✓ Expor ações de jogadores: votar, acao_noturna, confirmar leitura
 * ✓ Lock otimista de resolução noturna via runTransaction
 * ✓ Escrita atômica /estado + /noiteControle (multi-path update)
 * ✓ Gerenciar presença do host com onDisconnect
 * ✓ Timer de fase: polling local baseado em prazoFaseEm do Firebase
 * ✓ Fallback de host: detectar desconexão e permitir novo host assumir
 *
 * ─── NÃO é responsabilidade deste serviço ────────────────────────────────────
 *
 * ✗ Lógica de jogo — engine.ts resolve tudo
 * ✗ Autenticação — usa jogadorId injetado (jogadorLocal.ts gerencia Auth)
 * ✗ UI — zero referências a componentes React Native
 *
 * ─── Estrutura de nós Firebase ───────────────────────────────────────────────
 *
 *   /salas/{codigo}/estado                → EstadoFirebaseInquisicao  (todos leem)
 *   /salas/{codigo}/privados/{playerId}   → EstadoPrivadoInquisicao   (host + próprio jogador)
 *   /salas/{codigo}/noite/{playerId}      → AcaoNoturna               (host lê, jogador escreve)
 *   /salas/{codigo}/votosPrivados/{id}    → VotoPrivado               (host lê, jogador escreve)
 *   /salas/{codigo}/noiteControle         → ControleNoiteInquisicao   (host exclusivo)
 *
 * ─── Crash-safety ────────────────────────────────────────────────────────────
 *
 *   O lock de resolução noturna (tentandoResolver + tentativaEm) expira em
 *   LOCK_TIMEOUT_MS (10s). Se o host crashar durante a resolução:
 *     - Antes da escrita atômica: outro host retenta ao detectar lock expirado.
 *     - Após a escrita atômica: estado público está consistente; patches privados
 *       podem estar incompletos, mas o jogo avança corretamente.
 *
 * ─── Firebase Security Rules ─────────────────────────────────────────────────
 *
 *   Ver: src/services/inquisicao.rules.json
 *   As rules garantem que:
 *     - /privados/{id} só é lido pelo próprio jogador e pelo host
 *     - /noiteControle só é lido/escrito pelo host
 *     - /votosPrivados/{id} e /noite/{id} só são lidos pelo host
 *     - Jogadores escrevem apenas nos seus próprios nós efêmeros
 */

import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';

import type { EngineCallbacks } from '@/games/inquisicao/engine';
import type {
  AcaoNoturna,
  ControleNoiteInquisicao,
  EstadoFirebaseInquisicao,
  EstadoPrivadoInquisicao,
  TipoAcaoNoturna,
  VotoPrivado,
} from '@/games/inquisicao/types';
import type { PlayerId, RoomCode } from '@/engine/types';
import { comTimeout } from '@/services/comTimeout';
import { getRealtimeDb } from '@/services/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// §1  CONSTANTES OPERACIONAIS
// ─────────────────────────────────────────────────────────────────────────────

/** Prefixo de coleção — idêntico ao usado em roomService.ts. */
const PASTA = 'salas';

/**
 * Tempo em ms após o qual um lock de resolução noturna é considerado expirado.
 * Deve coincidir com o valor documentado em ControleNoiteInquisicao.
 */
const LOCK_TIMEOUT_MS = 10_000;

/** Intervalo de polling do timer de fase. Baixo o suficiente para não perder o prazo. */
const POLL_TIMER_MS = 500;

/** Timeout para operações de escrita no Firebase. */
const WRITE_TIMEOUT_MS = 10_000;

/** Timeout para operações de leitura (get() único). */
const READ_TIMEOUT_MS = 8_000;

// ─────────────────────────────────────────────────────────────────────────────
// §2  HELPERS DE PATH
//
// Funções puras — nunca cachear refs (Firebase as recria rapidamente).
// ─────────────────────────────────────────────────────────────────────────────

function refRaiz(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}`);
}

function refEstado(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/estado`);
}

function refPrivado(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/privados/${playerId}`);
}

function refEventoPrivadoLido(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/privados/${playerId}/eventoPrivado/lido`);
}

function refNoiteControle(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/noiteControle`);
}

function refNoiteAcao(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/noite/${playerId}`);
}

function refNoiteTodas(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/noite`);
}

function refVotoPrivado(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/votosPrivados/${playerId}`);
}

function refVotosTodos(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/votosPrivados`);
}

function refVotantesConfirmados(codigo: RoomCode) {
  return ref(
    getRealtimeDb(),
    `${PASTA}/${codigo}/estado/votacaoAtual/votantesConfirmados`,
  );
}

function refPresencaJogador(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/jogadores/${playerId}/estaConectado`);
}

function refJogador(codigo: RoomCode, playerId: PlayerId) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/jogadores/${playerId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  TIPOS PÚBLICOS DO SERVIÇO
// ─────────────────────────────────────────────────────────────────────────────

/** Função de cancelamento de um observer onValue. */
export type Cancelar = () => void;

/**
 * Resultado de uma ação de jogador.
 *
 * 'ok'          — ação registrada com sucesso.
 * 'erro_rede'   — falha de IO após timeout.
 * 'ja_votou'    — tentativa de voto duplicado no mesmo loop.
 * 'fase_errada' — ação submetida fora da sub-fase correta.
 */
export type ResultadoAcao = 'ok' | 'erro_rede' | 'ja_votou' | 'fase_errada';

/**
 * Contexto restaurado pelo host ao reconectar.
 * Lido via lerEstadoCompletoHost() para retomar o engine com estado consistente.
 */
export interface ContextoRestauradoHost {
  readonly estado: EstadoFirebaseInquisicao;
  readonly controle: ControleNoiteInquisicao;
  readonly privados: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  InquisicaoRealtimeService
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serviço de tempo real para uma sala de Inquisição.
 *
 * Uma instância por sala por dispositivo — nunca reutilizar entre salas.
 * Chamar limpar() ao desmontar o componente ou ao sair da sala.
 */
export class InquisicaoRealtimeService implements EngineCallbacks {
  private readonly _codigo: RoomCode;
  private readonly _anfitriaoId: PlayerId;

  /** Canceladores de todos os observers ativos. */
  private readonly _canceladores = new Set<Cancelar>();

  /** Handle do setInterval do timer de fase. null = sem timer ativo. */
  private _timerFaseHandle: ReturnType<typeof setInterval> | null = null;

  constructor(codigo: RoomCode, anfitriaoId: PlayerId) {
    this._codigo = codigo;
    this._anfitriaoId = anfitriaoId;
  }

  // ─── §4.1  EngineCallbacks — escritas do host ───────────────────────────────

  /**
   * Aplica patch parcial em /salas/{codigo}/estado (merge — nunca substituição total).
   * Usado pelo engine para atualizar campos individuais do estado público.
   */
  async escreverEstadoPublico(
    patch: Partial<EstadoFirebaseInquisicao>,
  ): Promise<void> {
    await comTimeout(
      update(refEstado(this._codigo), patch as Record<string, unknown>),
      WRITE_TIMEOUT_MS,
      'Falha ao atualizar estado público.',
    );
  }

  /**
   * Aplica patch parcial em /salas/{codigo}/privados/{id}.
   * Sempre chamado um jogador por vez — nunca o mapa completo.
   */
  async escreverPrivado(
    id: PlayerId,
    patch: Partial<EstadoPrivadoInquisicao>,
  ): Promise<void> {
    await comTimeout(
      update(refPrivado(this._codigo, id), patch as Record<string, unknown>),
      WRITE_TIMEOUT_MS,
      `Falha ao atualizar estado privado de ${id}.`,
    );
  }

  /**
   * Sobrescreve /salas/{codigo}/noiteControle completamente.
   * Exclusivo do host — protegido por Security Rules.
   */
  async escreverControle(controle: ControleNoiteInquisicao): Promise<void> {
    await comTimeout(
      set(refNoiteControle(this._codigo), controle),
      WRITE_TIMEOUT_MS,
      'Falha ao escrever controle da noite.',
    );
  }

  /**
   * Escreve /estado e /noiteControle ATOMICAMENTE via multi-path update.
   *
   * Implementação: converte o patch de estado em caminhos dotados
   * ('estado/subFase', 'estado/loop', etc.) para que o Firebase execute
   * um único multi-path update — ou tudo persiste, ou nada persiste.
   *
   * Esta é a garantia central de crash-safety:
   *   Crash ANTES desta linha → lock expira em 10s, outro host retenta.
   *   Crash APÓS esta linha   → público + controle estão consistentes.
   *
   * Nota: patches de /privados/{id} são escritos DEPOIS desta chamada
   * (não fazem parte da atomicidade). Se perdidos por crash, o jogo
   * avança corretamente — jogadores apenas não veem a mensagem de conversão.
   */
  async escreverEstadoEControleAtomico(
    estadoPatch: Partial<EstadoFirebaseInquisicao>,
    controle: ControleNoiteInquisicao,
  ): Promise<void> {
    // Flatten o patch em caminhos dotados para garantir merge (não substituição)
    // do nó /estado durante o multi-path update.
    const multiPath: Record<string, unknown> = {
      noiteControle: controle,
    };

    for (const [chave, valor] of Object.entries(estadoPatch)) {
      if (valor !== undefined) {
        multiPath[`estado/${chave}`] = valor;
      }
    }

    await comTimeout(
      update(refRaiz(this._codigo), multiPath),
      WRITE_TIMEOUT_MS,
      'Falha na escrita atômica de estado + controle da noite.',
    );
  }

  // ─── §4.2  EngineCallbacks — leituras do host ───────────────────────────────

  /** Lê todas as ações noturnas em /noite/*. Retorna [] se nenhuma foi submetida. */
  async lerAcoesNoturnas(): Promise<readonly AcaoNoturna[]> {
    const snap = await comTimeout(
      get(refNoiteTodas(this._codigo)),
      READ_TIMEOUT_MS,
      'Falha ao ler ações noturnas.',
    );
    if (!snap.exists()) return [];
    const raw = snap.val() as Record<PlayerId, AcaoNoturna>;
    return Object.values(raw);
  }

  /** Deleta /noite/* inteiro após resolução da noite. */
  async deletarAcoesNoturnas(): Promise<void> {
    await comTimeout(
      remove(refNoiteTodas(this._codigo)),
      WRITE_TIMEOUT_MS,
      'Falha ao deletar ações noturnas.',
    );
  }

  /** Lê todos os votos em /votosPrivados/*. Retorna {} se nenhum foi submetido. */
  async lerVotosPrivados(): Promise<Record<PlayerId, VotoPrivado>> {
    const snap = await comTimeout(
      get(refVotosTodos(this._codigo)),
      READ_TIMEOUT_MS,
      'Falha ao ler votos privados.',
    );
    if (!snap.exists()) return {};
    return snap.val() as Record<PlayerId, VotoPrivado>;
  }

  /** Deleta /votosPrivados/* inteiro após publicar resultado da votação. */
  async deletarVotosPrivados(): Promise<void> {
    await comTimeout(
      remove(refVotosTodos(this._codigo)),
      WRITE_TIMEOUT_MS,
      'Falha ao deletar votos privados.',
    );
  }

  // ─── §4.3  EngineCallbacks — lock otimista ──────────────────────────────────

  /**
   * Tenta adquirir o lock de resolução noturna via runTransaction.
   *
   * Condições para adquirir:
   *   (a) tentandoResolver === false, OU
   *   (b) tentandoResolver === true E o lock expirou (> LOCK_TIMEOUT_MS)
   *
   * Se o nó /noiteControle não existir (antes da primeira noite), retorna false
   * — o host deve ter inicializado o controle antes de chamar este método.
   *
   * @param agora Timestamp atual em ms (Date.now()). Injetado para testabilidade.
   * @returns true se o lock foi adquirido; false caso contrário.
   */
  async adquirirLockNoite(agora: number): Promise<boolean> {
    let adquirido = false;

    await comTimeout(
      runTransaction(
        refNoiteControle(this._codigo),
        (controleAtual: ControleNoiteInquisicao | null) => {
          // Aborta se o nó não existe — estado inconsistente, não tentar.
          if (controleAtual === null) return undefined;

          const lockAtivo = controleAtual.tentandoResolver;
          const lockExpirado = agora - controleAtual.tentativaEm > LOCK_TIMEOUT_MS;

          if (lockAtivo && !lockExpirado) {
            // Outro host está resolvendo ativamente — não sobrescrever.
            return undefined; // undefined = abort (Firebase não escreve)
          }

          adquirido = true;
          return {
            ...controleAtual,
            tentandoResolver: true,
            tentativaEm: agora,
          };
        },
      ),
      WRITE_TIMEOUT_MS,
      'Falha ao adquirir lock da noite.',
    );

    return adquirido;
  }

  // ─── §4.4  Observadores de estado ───────────────────────────────────────────

  /**
   * Observa /salas/{codigo}/estado em tempo real.
   * Chama callback imediatamente com o valor atual e a cada mudança.
   *
   * Uso: todos os clientes (host e jogadores) chamam este método para
   * renderizar o estado público da partida.
   *
   * @returns Cancelar — chamar ao desmontar o componente.
   */
  observarEstadoPublico(
    callback: (estado: EstadoFirebaseInquisicao | null) => void,
  ): Cancelar {
    const cancelar = onValue(refEstado(this._codigo), (snap) => {
      callback(snap.exists() ? (snap.val() as EstadoFirebaseInquisicao) : null);
    });
    return this._registrarCancelador(cancelar);
  }

  /**
   * Observa /salas/{codigo}/privados/{playerId} em tempo real.
   *
   * Deve ser chamado apenas pelo próprio jogador (ou pelo host para monitorar).
   * Security Rules bloqueiam outros jogadores de ler este nó.
   *
   * @returns Cancelar — chamar ao desmontar o componente.
   */
  observarPrivado(
    playerId: PlayerId,
    callback: (privado: EstadoPrivadoInquisicao | null) => void,
  ): Cancelar {
    const cancelar = onValue(refPrivado(this._codigo, playerId), (snap) => {
      callback(snap.exists() ? (snap.val() as EstadoPrivadoInquisicao) : null);
    });
    return this._registrarCancelador(cancelar);
  }

  /**
   * Observa /salas/{codigo}/noiteControle em tempo real.
   *
   * Uso exclusivo do host — Security Rules bloqueiam outros jogadores.
   * Necessário para o host restaurar estado após reconexão sem precisar
   * de um get() explícito (o observer já entrega o valor atual).
   *
   * @returns Cancelar — chamar ao desmontar o componente.
   */
  observarControle(
    callback: (controle: ControleNoiteInquisicao | null) => void,
  ): Cancelar {
    const cancelar = onValue(refNoiteControle(this._codigo), (snap) => {
      callback(snap.exists() ? (snap.val() as ControleNoiteInquisicao) : null);
    });
    return this._registrarCancelador(cancelar);
  }

  /**
   * Observa a presença do anfitrião atual.
   *
   * Deve ser chamado por todos os clientes para detectar quando o host
   * desconecta — o próximo host elegível (menor entrouEm entre ativos)
   * chama assumirAnfitriania() para garantir continuidade da partida.
   *
   * @param anfitriaoId ID do anfitrião a monitorar.
   * @param callback    Recebe true (conectado) ou false (desconectado).
   * @returns Cancelar.
   */
  observarPresencaAnfitriao(
    anfitriaoId: PlayerId,
    callback: (conectado: boolean) => void,
  ): Cancelar {
    const cancelar = onValue(
      refPresencaJogador(this._codigo, anfitriaoId),
      (snap) => {
        callback(snap.val() === true);
      },
    );
    return this._registrarCancelador(cancelar);
  }

  // ─── §4.5  Timer de fase ─────────────────────────────────────────────────────

  /**
   * Inicia o polling do timer de fase no lado do host.
   *
   * Quando prazoFaseEm < Date.now(), chama onExpirado uma única vez e para.
   * Substitui qualquer timer anterior que estivesse ativo.
   *
   * IMPORTANTE: apenas o host deve chamar este método. Clientes não-host
   * leem prazoFaseEm via observarEstadoPublico() e renderizam a contagem
   * regressiva — não precisam de um timer local de resolução.
   *
   * @param prazoFaseEm Timestamp Unix (ms) de encerramento da fase.
   * @param onExpirado  Callback disparado quando o prazo é atingido.
   */
  iniciarTimerFase(prazoFaseEm: number, onExpirado: () => void): void {
    this._pararTimerFase();
    this._timerFaseHandle = setInterval(() => {
      if (Date.now() >= prazoFaseEm) {
        this._pararTimerFase();
        onExpirado();
      }
    }, POLL_TIMER_MS);
  }

  /** Cancela o timer de fase ativo (se houver). */
  pararTimerFase(): void {
    this._pararTimerFase();
  }

  // ─── §4.6  Presença do host ──────────────────────────────────────────────────

  /**
   * Configura onDisconnect para o host atual.
   *
   * Registra no servidor: se o host desconectar inesperadamente,
   * Firebase marca estaConectado = false automaticamente.
   * A cada reconexão, re-agenda o onDisconnect e restaura estaConectado = true.
   *
   * Deve ser chamado pelo host assim que assumir a anfitriania.
   * Retorna função de cleanup para saída intencional (cancela o onDisconnect
   * para não sujar o estado após logout voluntário).
   *
   * @returns Cancelar — chamar ao sair intencionalmente da sala.
   */
  configurarPresencaHost(): Cancelar {
    const db = getRealtimeDb();
    const presencaRef = refPresencaJogador(this._codigo, this._anfitriaoId);
    const jogadorRef = refJogador(this._codigo, this._anfitriaoId);
    const connectedRef = ref(db, '.info/connected');

    const cancelarObservador = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;

      // Re-agenda a cada reconexão — garantia de que o servidor sempre tem
      // o onDisconnect mais recente mesmo após quedas múltiplas.
      void onDisconnect(presencaRef).set(false).catch(() => {});

      // Restaura flag de conexão imediatamente após reconectar.
      void update(jogadorRef, { estaConectado: true }).catch(() => {});
    });

    this._canceladores.add(cancelarObservador);

    return () => {
      cancelarObservador();
      this._canceladores.delete(cancelarObservador);
      // Saída intencional: cancela o agendamento de disconnect pendente
      // para não marcar o jogador como offline após um logout limpo.
      void onDisconnect(presencaRef).cancel().catch(() => {});
    };
  }

  // ─── §4.7  Fallback de host ──────────────────────────────────────────────────

  /**
   * Promove um novo jogador a anfitrião no Firebase.
   *
   * Chamado pelo próximo host elegível após detectar desconexão do anterior.
   * Atualiza /anfitriaoId + flags ehAnfitriao dos dois jogadores em uma
   * única operação de update (não atômica, mas idempotente).
   *
   * Fluxo completo de fallback (responsabilidade do caller):
   *   1. observarPresencaAnfitriao() detecta estaConectado = false
   *   2. Determinar próximo host: menor entrouEm entre jogadores ativos
   *   3. Se auth.uid === próximo host: chamar assumirAnfitriania()
   *   4. Instanciar novo InquisicaoRealtimeService com novo anfitriaoId
   *   5. lerEstadoCompletoHost() para restaurar contexto
   *   6. Chamar engine.iniciar() com contexto restaurado
   *   7. configurarPresencaHost() para registrar novo onDisconnect
   *
   * @param novoAnfitriaoId  ID do jogador que vai assumir.
   * @param antigoAnfitriaoId  ID do host que desconectou.
   */
  async assumirAnfitriania(
    novoAnfitriaoId: PlayerId,
    antigoAnfitriaoId: PlayerId,
  ): Promise<void> {
    const agora = Date.now();
    await comTimeout(
      update(refRaiz(this._codigo), {
        anfitriaoId: novoAnfitriaoId,
        [`jogadores/${novoAnfitriaoId}/ehAnfitriao`]: true,
        [`jogadores/${antigoAnfitriaoId}/ehAnfitriao`]: false,
        atualizadoEm: agora,
      }),
      WRITE_TIMEOUT_MS,
      'Falha ao assumir anfitriania.',
    );
  }

  /**
   * Lê o estado completo necessário para o host restaurar a sessão.
   *
   * Faz uma única leitura (get) da sala inteira — mais eficiente do que
   * três leituras separadas durante a reconexão.
   *
   * Retorna null se a sala não existir ou estiver corrompida.
   */
  async lerEstadoCompletoHost(): Promise<ContextoRestauradoHost | null> {
    const snap = await comTimeout(
      get(refRaiz(this._codigo)),
      READ_TIMEOUT_MS,
      'Falha ao ler estado completo da sala.',
    );

    if (!snap.exists()) return null;

    const raw = snap.val() as {
      estado?: EstadoFirebaseInquisicao;
      noiteControle?: ControleNoiteInquisicao;
      privados?: Record<PlayerId, EstadoPrivadoInquisicao>;
    };

    if (!raw.estado || !raw.noiteControle) return null;

    return {
      estado: raw.estado,
      controle: raw.noiteControle,
      privados: raw.privados ?? {},
    };
  }

  /**
   * Lê /noiteControle uma única vez.
   *
   * Alternativa a lerEstadoCompletoHost() quando o host só precisa restaurar
   * o controle da noite (ex.: após crash durante resolução noturna).
   *
   * Retorna null se o nó não existir.
   */
  async lerControle(): Promise<ControleNoiteInquisicao | null> {
    const snap = await comTimeout(
      get(refNoiteControle(this._codigo)),
      READ_TIMEOUT_MS,
      'Falha ao ler controle da noite.',
    );
    return snap.exists() ? (snap.val() as ControleNoiteInquisicao) : null;
  }

  // ─── §4.8  Ações de jogadores ────────────────────────────────────────────────

  /**
   * Submete um voto durante subFase 'votando'.
   *
   * Fluxo (conforme documentado em VotoPrivado):
   *   1. Escreve VotoPrivado em /votosPrivados/{jogadorId}
   *   2. Confirma em /estado/votacaoAtual/votantesConfirmados/{jogadorId} via transaction
   *      — garante que a contagem de "X de N votaram" seja sempre consistente,
   *        mesmo se dois jogadores votam simultaneamente.
   *
   * Se o jogador já tiver confirmado neste loop, retorna 'ja_votou'.
   * O voto privado ainda é sobrescrito (mudança de alvo antes do reveal).
   */
  async submeterVoto(
    jogadorId: PlayerId,
    alvoId: PlayerId,
    loop: number,
  ): Promise<ResultadoAcao> {
    const agora = Date.now();

    const voto: VotoPrivado = {
      alvoId,
      loop,
      registradoEm: agora,
    };

    try {
      // Passo 1: escreve o alvo real (privado, apenas o host lê).
      await comTimeout(
        set(refVotoPrivado(this._codigo, jogadorId), voto),
        WRITE_TIMEOUT_MS,
        'Falha ao registrar voto.',
      );

      // Passo 2: confirma a presença do voto (quem votou — nunca em quem).
      let jaVotou = false;

      await comTimeout(
        runTransaction(
          refVotantesConfirmados(this._codigo),
          (confirmados: Record<PlayerId, true> | null) => {
            const atual = confirmados ?? {};
            if (atual[jogadorId]) {
              jaVotou = true;
              return undefined; // abort — confirmação já registrada
            }
            return { ...atual, [jogadorId]: true as const };
          },
        ),
        WRITE_TIMEOUT_MS,
        'Falha ao confirmar voto.',
      );

      return jaVotou ? 'ja_votou' : 'ok';
    } catch {
      return 'erro_rede';
    }
  }

  /**
   * Submete ou atualiza uma ação noturna durante subFase 'noite'.
   *
   * A última escrita sobrescreve a anterior — o jogador pode mudar
   * de alvo até o timer da fase expirar (comportamento intencional).
   *
   * Security Rules: apenas o próprio jogador pode escrever em /noite/{id}.
   * O host lê todas as ações via lerAcoesNoturnas().
   */
  async submeterAcaoNoturna(
    jogadorId: PlayerId,
    tipo: TipoAcaoNoturna,
    alvoId: PlayerId,
    loop: number,
  ): Promise<ResultadoAcao> {
    const acao: AcaoNoturna = {
      tipo,
      alvoId,
      loop,
      jogadorId,
      registradaEm: Date.now(),
    };

    try {
      await comTimeout(
        set(refNoiteAcao(this._codigo, jogadorId), acao),
        WRITE_TIMEOUT_MS,
        'Falha ao registrar ação noturna.',
      );
      return 'ok';
    } catch {
      return 'erro_rede';
    }
  }

  /**
   * Marca mensagemPrivada como lida pelo próprio jogador.
   *
   * O host escreve mensagemPrivada + mensagemLida=false quando notifica.
   * O jogador confirma leitura escrevendo mensagemLida=true em seu próprio nó.
   *
   * Falhas silenciosas: uma leitura não confirmada apenas mantém a mensagem
   * visível — não bloqueia o jogo.
   */
  async marcarMensagemLida(jogadorId: PlayerId): Promise<void> {
    await comTimeout(
      update(refPrivado(this._codigo, jogadorId), { mensagemLida: true }),
      WRITE_TIMEOUT_MS,
      'Falha ao marcar mensagem como lida.',
    ).catch(() => {
      // Falha silenciosa — não bloquear a UI.
    });
  }

  /**
   * Marca eventoPrivado.lido como true pelo próprio jogador.
   *
   * Escreve em /privados/{id}/eventoPrivado/lido (campo aninhado).
   * Falhas silenciosas por design.
   */
  async marcarEventoPrivadoLido(jogadorId: PlayerId): Promise<void> {
    await comTimeout(
      set(refEventoPrivadoLido(this._codigo, jogadorId), true),
      WRITE_TIMEOUT_MS,
      'Falha ao marcar evento privado como lido.',
    ).catch(() => {
      // Falha silenciosa — não bloquear a UI.
    });
  }

  // ─── §4.9  Cleanup ───────────────────────────────────────────────────────────

  /**
   * Cancela todos os observers e para o timer de fase.
   *
   * Deve ser chamado:
   *   - Quando o componente React que instanciou o serviço desmonta.
   *   - Quando o jogador sai da sala (antes de sairDaSala() do roomService).
   *   - Quando o host sofre fallback e instancia um novo serviço.
   *
   * Após limpar(), o serviço não deve ser reutilizado.
   */
  limpar(): void {
    this._pararTimerFase();
    for (const cancelar of this._canceladores) {
      cancelar();
    }
    this._canceladores.clear();
  }

  // ─── Privado ─────────────────────────────────────────────────────────────────

  private _pararTimerFase(): void {
    if (this._timerFaseHandle !== null) {
      clearInterval(this._timerFaseHandle);
      this._timerFaseHandle = null;
    }
  }

  /**
   * Registra um cancelador no conjunto interno e retorna uma versão
   * que também remove do conjunto ao ser chamada.
   */
  private _registrarCancelador(cancelar: Cancelar): Cancelar {
    this._canceladores.add(cancelar);
    return () => {
      cancelar();
      this._canceladores.delete(cancelar);
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  FACTORY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria uma instância do serviço de tempo real para uma sala de Inquisição.
 *
 * Uma instância por sala por dispositivo.
 * Chamar limpar() ao sair da sala ou ao desmontar o componente raiz da partida.
 *
 * @param codigo      Código da sala (ex.: "ABCD").
 * @param anfitriaoId ID do anfitrião atual (atualizado após fallback de host).
 */
export function criarInquisicaoRealtime(
  codigo: RoomCode,
  anfitriaoId: PlayerId,
): InquisicaoRealtimeService {
  return new InquisicaoRealtimeService(codigo, anfitriaoId);
}
