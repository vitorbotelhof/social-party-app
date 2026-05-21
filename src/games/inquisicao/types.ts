/**
 * INQUISIÇÃO — CONTRATO DE ESTADO (v1 — versão definitiva de produção)
 *
 * Este arquivo é a fonte da verdade para o engine, a UI, o Firebase e o SessionStore.
 *
 * Arquitetura de nós Firebase:
 *   /salas/{codigo}/estado             → EstadoFirebaseInquisicao   (todos leem)
 *   /salas/{codigo}/privados/{id}      → EstadoPrivadoInquisicao    (host + próprio)
 *   /salas/{codigo}/noite/{id}         → AcaoNoturna                (host lê, jogador escreve)
 *   /salas/{codigo}/votosPrivados/{id} → VotoPrivado                (host lê, jogador escreve)
 *   /salas/{codigo}/noiteControle      → ControleNoiteInquisicao    (host exclusivo)
 *
 * Princípios deste contrato:
 *   1. Campos deriváveis NÃO são armazenados — usar helpers exportados.
 *   2. faccaoAtual é SEMPRE derivada via derivarFaccao() — nunca persistida.
 *   3. totalCorrompidos NÃO está em estado público — evita dedução lógica.
 *   4. houveMudanca NÃO está em estado público — evita inferência sobre guardião.
 *   5. Votos privados existem em nó separado — reveal é sempre simultâneo.
 */

import type { GameAction, PlayerId } from '@/engine/types';

// ─────────────────────────────────────────────────────────────────────────────
// §1  PRIMITIVOS DE DOMÍNIO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Papel atribuído ao jogador na distribuição inicial.
 * IMUTÁVEL durante toda a partida — corrupção muda a facção, não o papel.
 *
 * guardiao: sub-papel dos inocentes com ação noturna de proteção.
 *   Se corrompido (convertidoNoLoop !== null), age como corrompido.
 */
export type PapelInquisicao = 'inocente' | 'corrompido' | 'guardiao';

/**
 * Facção atual do jogador — DERIVADA, nunca armazenada.
 * Usar sempre derivarFaccao(privado).
 *
 * Regra de derivação:
 *   papelOriginal === 'corrompido' → 'corrompidos' (sempre)
 *   convertidoNoLoop !== null      → 'corrompidos' (foi convertido)
 *   caso contrário                 → 'inocentes'
 */
export type FaccaoInquisicao = 'inocentes' | 'corrompidos';

/**
 * Intensidade escolhida pelo host antes do início.
 *
 * leve:    sem corrupção, papel revelado ao eliminar, rounds mais longos.
 * padrao:  1 conversão possível, revelação com delay dramático.
 * paranoia: até 2 conversões, papel nunca revelado mid-game.
 */
export type IntensidadeInquisicao = 'leve' | 'padrao' | 'paranoia';

/**
 * Sub-fase granular do loop de jogo.
 *
 * Fluxo: revelando_papeis → conversa → votando → apurando → noite → conversa → …
 *                                                                       ↓
 *                                                                  finalizado
 */
export type SubFaseInquisicao =
  | 'revelando_papeis' // visualização individual do papel (início de partida)
  | 'conversa'         // fase livre de interação + evento social ativo
  | 'votando'          // coleta silenciosa de votos (reveal simultâneo)
  | 'apurando'         // resultado da votação exibido, eliminação processada
  | 'noite'            // ações noturnas de corrompidos e guardião
  | 'finalizado';      // partida encerrada, revelação completa disponível

/**
 * Tipo de ação noturna.
 *
 * Corrompido (original ou convertido): 'eliminar' | 'contaminar'
 * Guardião não convertido:             'proteger'
 * Guardião convertido:                 'eliminar' | 'contaminar' (age como corrompido)
 * Inocente:                            sem ação
 */
export type TipoAcaoNoturna = 'eliminar' | 'contaminar' | 'proteger';

/** Facção vencedora ao fim da partida. */
export type ResultadoPartida = 'inocentes' | 'corrompidos';

/**
 * Categoria emocional de um evento social.
 *
 * Nota: 'informacao_parcial' é EXCLUSIVA de EventoPrivado.
 * EventoPublico nunca usa esta categoria.
 */
export type CategoriaEvento =
  | 'suspeita'           // "alguém hesitou."
  | 'informacao_parcial' // info privada — apenas em EventoPrivado
  | 'corrupcao'          // "a influência se espalhou."
  | 'pressao_social'     // "acuse alguém agora."
  | 'caos_social';       // "duas versões da história surgiram."

// ─────────────────────────────────────────────────────────────────────────────
// §2  CONFIGURAÇÃO DA PARTIDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configuração pública — informações que o grupo pode conhecer.
 * Escrita pelo host em criarEstadoInicial, nunca alterada depois.
 * Vive em /estado/configuracao.
 *
 * Nota de segurança: totalCorrompidos NÃO está aqui.
 *   Expor o número exato de corrompidos transforma paranoia social em
 *   dedução lógica — destrói a experiência emocional central do jogo.
 *   O número real vive em ControleNoiteInquisicao (privado do host).
 */
export interface ConfiguracaoPartida {
  readonly intensidade: IntensidadeInquisicao;
  readonly totalJogadores: number;

  /** Se há um guardião nesta partida. Verdadeiro para 6+ jogadores. */
  readonly temGuardiao: boolean;

  /**
   * Quantas conversões por corrupção são permitidas no total da partida.
   * leve=0, padrao=1, paranoia=2.
   */
  readonly maxCorrupcoes: number;

  /**
   * Se o papel é exibido publicamente no momento da eliminação (mid-game).
   * leve=true, padrao=true (com delay), paranoia=false.
   * O reveal final SEMPRE mostra tudo, independente deste valor.
   */
  readonly revelarPapelAoEliminar: boolean;

  /**
   * Delay em ms antes de exibir o papel na eliminação.
   * 0 = imediato (modo leve), 2000 = suspense dramático (modo padrão).
   * Irrelevante quando revelarPapelAoEliminar = false.
   */
  readonly delayRevelacaoMs: number;

  /** Duração da fase de conversa em segundos (30–50). */
  readonly duracaoConversaSegundos: number;

  /** Duração máxima da fase noturna em segundos (8–20, absoluto = 20). */
  readonly duracaoNoiteMaxSegundos: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  REGISTROS IMUTÁVEIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registro permanente de uma eliminação.
 * Imutável após criação. Acumula em /estado/eliminados.
 *
 * papelRevelado:
 *   Modo leve/padrão: PapelInquisicao — exposto no momento da eliminação.
 *   Modo paranoia:    null — papel permanece oculto durante a partida.
 *   Reveal final:     sempre preenchido em RevelacaoFinalRecord, mesmo em paranoia.
 */
export interface EliminacaoRecord {
  readonly jogadorId: PlayerId;
  readonly loop: number;
  readonly causa: 'votacao' | 'noite';
  readonly papelRevelado: PapelInquisicao | null;
  readonly eliminadoEm: number; // Unix timestamp ms
}

/**
 * Evento social exibido publicamente para todo o grupo.
 * Máximo 7 palavras. Ambíguo por design — não nomeia jogadores.
 *
 * Categorias permitidas: suspeita, corrupcao, pressao_social, caos_social.
 * 'informacao_parcial' NUNCA aparece aqui — vai para EventoPrivado.
 *
 * Vive em /estado/eventoAtivo (current) — substituído a cada loop.
 */
export interface EventoPublico {
  readonly id: string; // formato: `${loop}-${categoria}-${timestamp}`
  readonly categoria: Exclude<CategoriaEvento, 'informacao_parcial'>;
  readonly texto: string; // ex: "alguém hesitou." / "o grupo está dividido."
  readonly loop: number;
  readonly exibidoEm: number; // Unix timestamp ms
}

/**
 * Evento privado entregue a um único jogador.
 * Categoria sempre 'informacao_parcial'.
 * Vive em /privados/{playerId}/eventoPrivado.
 *
 * ex: "você ouviu algo." / "você foi observado." / "você não deveria confiar em alguém."
 */
export interface EventoPrivado {
  readonly id: string;
  readonly categoria: 'informacao_parcial';
  readonly texto: string;
  readonly loop: number;
  readonly exibidoEm: number; // Unix timestamp ms
  /** Controlado pelo próprio jogador. Host escreve false; jogador escreve true ao visualizar. */
  lido: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  ESTADO DE VOTAÇÃO
//
// Separação explícita de dois estados temporais:
//   VotacaoEmAndamento — durante subFase 'votando' (votos chegando)
//   VotacaoResolvida   — durante subFase 'apurando' (resultado público)
//
// votacaoAtual em /estado é a union dos dois.
// Limpo (null) ao entrar em nova conversa.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado da votação enquanto votos ainda estão sendo coletados.
 * votantesConfirmados mostra QUEM votou — nunca em quem.
 * Os alvos reais ficam em /votosPrivados/{id} (somente host lê).
 */
export interface VotacaoEmAndamento {
  readonly tipo: 'em_andamento';
  readonly loop: number;

  /**
   * Registro de quem já confirmou seu voto. Valor sempre true.
   * Atualizado via runTransaction quando cada jogador submete.
   * UI exibe: "X de N votaram" — nunca os alvos.
   */
  votantesConfirmados: Readonly<Record<PlayerId, true>>;

  /** Total de jogadores que devem votar neste loop. */
  readonly totalEsperado: number;
}

/** Estado da votação após resolução pelo host. */
export interface VotacaoResolvida {
  readonly tipo: 'resolvida';
  readonly loop: number;

  /**
   * Jogador eliminado. null em caso de empate.
   * Empate: ninguém sai + sistema emite mensagem que aumenta tensão.
   */
  readonly eliminadoId: PlayerId | null;

  readonly foiEmpate: boolean;

  /**
   * Papel do eliminado — conforme configuracao.revelarPapelAoEliminar.
   * null em modo paranoia durante a partida.
   */
  readonly papelRevelado: PapelInquisicao | null;

  readonly resolvidaEm: number; // Unix timestamp ms
}

/** Estado atual da votação em /estado/votacaoAtual. */
export type VotacaoAtual = VotacaoEmAndamento | VotacaoResolvida | null;

// ─────────────────────────────────────────────────────────────────────────────
// §5  REVELAÇÃO FINAL
// ─────────────────────────────────────────────────────────────────────────────

/** Dados de um jogador no reveal final. Sempre completo, mesmo em modo paranoia. */
export interface PapelFinalRevelado {
  readonly papelOriginal: PapelInquisicao;

  /**
   * Loop em que a conversão aconteceu.
   * null se o jogador nunca foi convertido.
   * Para corrompidos originais: null (sempre foram corrompidos — distinguir via papelOriginal).
   *
   * Invariante: convertidoNoLoop !== null → papelOriginal !== 'corrompido'
   */
  readonly convertidoNoLoop: number | null;
}

/**
 * Revelação completa gerada ao fim da partida.
 * Sempre exibida após vencedor !== null.
 * Em modo paranoia: só aparece agora, pela primeira vez.
 * Escrita pelo host ao finalizar. Vive em /estado/revelacaoFinal.
 */
export interface RevelacaoFinalRecord {
  readonly papeisPorJogador: Readonly<Record<PlayerId, PapelFinalRevelado>>;
  readonly vencedor: ResultadoPartida;
  readonly totalLoops: number;
  readonly totalCorrupcoes: number; // quantas conversões ocorreram
  readonly geradaEm: number; // Unix timestamp ms
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  ESTADO FIREBASE  (/estado)
//
// Tipo exato do nó /salas/{codigo}/estado.
// Visível para todos os clientes via onValue.
//
// NUNCA incluir aqui:
//   - papelOriginal de qualquer jogador
//   - convertidoNoLoop de qualquer jogador
//   - totalCorrompidos (vaza informação estratégica)
//   - houveMudanca após a noite (permite inferência sobre guardião)
//   - alvos de votos ou ações noturnas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado público completo do Inquisição.
 * Serializado em /salas/{codigo}/estado.
 *
 * Inquisição não usa GameState<TPublic, TPrivate> do engine genérico
 * porque estados privados ficam em nós separados (Security Rules reais).
 * Este tipo substitui o GameState para este jogo.
 */
export interface EstadoFirebaseInquisicao {
  // ── Compatibilidade com roomService ────────────────────────────────────────

  /**
   * Fase macro — compatibilidade com GamePhase e roomService.
   * 'lobby' → 'playing' → 'results'
   */
  fase: 'lobby' | 'playing' | 'results';

  /**
   * Sempre 0 no Inquisição — o conceito de "rodada" é substituído por "loop".
   * Campo mantido para compatibilidade com a estrutura do engine.
   */
  rodada: 0;

  /** Não utilizado no Inquisição — todas as fases são coletivas. */
  jogadorAtualId: null;

  /** Sem estados privados neste nó — eles vivem em /privados/{id}. */
  estadosPrivados: Record<string, never>;

  // ── Configuração ───────────────────────────────────────────────────────────

  /** Configuração imutável definida antes do início. */
  readonly configuracao: ConfiguracaoPartida;

  // ── Progressão ─────────────────────────────────────────────────────────────

  /** Loop atual (1-indexed). Cresce monotonicamente. Invariante: nunca decresce. */
  loop: number;

  /** Sub-fase granular do loop atual. */
  subFase: SubFaseInquisicao;

  // ── Jogadores ──────────────────────────────────────────────────────────────

  /**
   * IDs de jogadores ainda na partida.
   * Derivável de (todos os jogadores) - eliminados, mas armazenado
   * por conveniência do engine e da UI.
   * Atualizado pelo host após cada eliminação.
   */
  jogadoresAtivos: PlayerId[];

  /**
   * Histórico imutável de eliminações.
   * Cresce a cada eliminação (votação ou noite). Nunca decresce.
   */
  eliminados: readonly EliminacaoRecord[];

  // ── Votação ────────────────────────────────────────────────────────────────

  /**
   * Estado da votação atual.
   * null: fora das subFases 'votando' e 'apurando'.
   * VotacaoEmAndamento: durante coleta de votos.
   * VotacaoResolvida: após resolução do host.
   * Limpo para null ao iniciar nova conversa.
   */
  votacaoAtual: VotacaoAtual;

  // ── Eventos ────────────────────────────────────────────────────────────────

  /**
   * Evento social ativo no momento.
   * Exibido pelo app durante ~5 segundos, depois some.
   * null entre eventos. Só eventos públicos — eventos privados em /privados/{id}.
   */
  eventoAtivo: EventoPublico | null;

  // ── Comunicação do sistema ─────────────────────────────────────────────────

  /**
   * Mensagem ambígua do sistema. Curta, emocional, nunca identificadora.
   * ex: "algo mudou." / "a influência se espalhou." / "ninguém saiu." / "o grupo piscou."
   * null quando não há mensagem ativa.
   *
   * Regra: NUNCA revelar quem foi alvo, quem agiu ou o que aconteceu.
   * O host escolhe com base em lógica interna — não derivável pelo cliente.
   */
  mensagemDoSistema: string | null;

  // ── Timers ─────────────────────────────────────────────────────────────────

  /**
   * Timestamp Unix (ms) de encerramento da fase atual.
   * null = sem timer (fase encerra por ação completa).
   * Host avança a fase quando o timer expira (setInterval local).
   * Clientes usam para exibir contagem regressiva.
   */
  prazoFaseEm: number | null;

  // ── Fim de partida ─────────────────────────────────────────────────────────

  /**
   * Vencedor da partida. null enquanto em andamento.
   * Invariante: vencedor !== null → subFase === 'finalizado'.
   */
  vencedor: ResultadoPartida | null;

  /**
   * IDs dos jogadores da facção vencedora.
   * Compatibilidade com GameState.vencedorIds do engine.
   */
  vencedorIds: PlayerId[];

  /**
   * Revelação completa ao fim da partida.
   * null enquanto vencedor === null.
   * Invariante: revelacaoFinal !== null ↔ vencedor !== null.
   */
  revelacaoFinal: RevelacaoFinalRecord | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────

  iniciadoEm: number; // Unix timestamp ms
  atualizadoEm: number; // Unix timestamp ms
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  ESTADO PRIVADO  (/privados/{playerId})
//
// Campos que não devem ser acessíveis por outros jogadores.
// Protegido por Firebase Security Rules (auth.uid === playerId || isHost).
//
// Não armazenar aqui:
//   - faccaoAtual (derivável — risco de desync)
//   - acoesDisponiveis (derivável — risco de desync)
//   - podeAgirNaNoite (derivável — risco de desync)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado privado por jogador. Serializado em /privados/{playerId}.
 *
 * Lido por: próprio jogador + host.
 * Escrito por: host (exceto mensagemLida e eventoPrivado.lido).
 */
export interface EstadoPrivadoInquisicao {
  // ── Identidade (imutável após atribuição inicial) ──────────────────────────

  /**
   * Papel atribuído na distribuição. Nunca alterado, mesmo após corrupção.
   * A corrupção muda a facção (derivada), não este campo.
   */
  readonly papelOriginal: PapelInquisicao;

  // ── Corrupção ──────────────────────────────────────────────────────────────

  /**
   * Loop em que este jogador foi convertido.
   * null = nunca convertido (ou corrompido original — ver papelOriginal).
   *
   * Para distinguir os casos:
   *   papelOriginal === 'corrompido' && convertidoNoLoop === null → corrompido original
   *   papelOriginal !== 'corrompido' && convertidoNoLoop === null → nunca convertido
   *   convertidoNoLoop !== null                                   → convertido naquele loop
   *
   * Invariante: se papelOriginal === 'corrompido' → convertidoNoLoop === null sempre.
   * (Corrompidos originais não são "convertidos" — já são corrompidos.)
   */
  convertidoNoLoop: number | null;

  // ── Conhecimento ───────────────────────────────────────────────────────────

  /**
   * IDs dos outros corrompidos conhecidos por este jogador.
   *
   * Corrompidos originais: lista com aliados na distribuição inicial.
   * Após conversão: lista atualizada pelo host com todos os corrompidos atuais.
   * Inocentes e guardiões não convertidos: [] (array vazio).
   *
   * Inclui corrompidos originais + convertidos acumulados.
   * Nunca inclui o próprio jogador.
   */
  corrompidosConhecidos: readonly PlayerId[];

  // ── Notificação de corrupção ───────────────────────────────────────────────

  /**
   * Mensagem privada do sistema para este jogador.
   * Usada principalmente para notificar conversão: "você mudou."
   * null = sem mensagem pendente.
   *
   * Host escreve. Jogador lê e confirma via mensagemLida = true.
   */
  mensagemPrivada: string | null;

  /**
   * Se o jogador visualizou mensagemPrivada.
   * Host escreve false ao criar/atualizar mensagemPrivada.
   * Jogador escreve true ao confirmar leitura.
   */
  mensagemLida: boolean;

  // ── Evento privado ─────────────────────────────────────────────────────────

  /**
   * Evento de informação parcial endereçado exclusivamente a este jogador.
   * ex: "você ouviu algo." / "você foi observado."
   * null = sem evento pendente.
   * Host escreve. Jogador confirma leitura via eventoPrivado.lido = true.
   */
  eventoPrivado: EventoPrivado | null;

  // ── Timestamps ─────────────────────────────────────────────────────────────

  /** Quando o host escreveu este estado pela última vez. */
  atualizadaEm: number; // Unix timestamp ms
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  AÇÕES NOTURNAS EFÊMERAS  (/noite/{playerId})
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ação noturna submetida durante subFase 'noite'.
 * Serializada em /salas/{codigo}/noite/{playerId}.
 *
 * Escrita pelo jogador (corrompido ou guardião não convertido).
 * Lida somente pelo host.
 * Deletada pelo host imediatamente após resolução.
 *
 * Proteção anti-stale: host rejeita ações com loop !== estadoAtual.loop.
 */
export interface AcaoNoturna {
  readonly tipo: TipoAcaoNoturna;

  /**
   * Alvo da ação. Deve estar em jogadoresAtivos.
   * Host valida na resolução — ação com alvo inválido é descartada.
   */
  readonly alvoId: PlayerId;

  /** Validação de loop — protege contra ações de noites anteriores. */
  readonly loop: number;

  /** Redundante com o path do Firebase, mas facilita validação no host. */
  readonly jogadorId: PlayerId;

  readonly registradaEm: number; // Unix timestamp ms
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  VOTOS PRIVADOS  (/votosPrivados/{playerId})
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Voto privado durante subFase 'votando'.
 * Serializado em /salas/{codigo}/votosPrivados/{playerId}.
 *
 * Escrito pelo jogador ao votar (em paralelo com confirmar em votantesConfirmados).
 * Lido somente pelo host para resolução.
 * Deletado pelo host após publicar VotacaoResolvida.
 *
 * Fluxo ao votar:
 *   1. Jogador escreve VotoPrivado em /votosPrivados/{id}
 *   2. Jogador escreve runTransaction em /estado/votacaoAtual/votantesConfirmados/{id}: true
 *   3. Host detecta votantesConfirmados.size === totalEsperado
 *   4. Host lê todos /votosPrivados/*, resolve, publica resultado
 *   5. Host deleta /votosPrivados/*
 */
export interface VotoPrivado {
  readonly alvoId: PlayerId;
  readonly loop: number; // validação anti-stale
  readonly registradoEm: number; // Unix timestamp ms
}

// ─────────────────────────────────────────────────────────────────────────────
// §10  CONTROLE DA NOITE  (/noiteControle)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Nó de controle exclusivo do host.
 * Serializado em /salas/{codigo}/noiteControle.
 *
 * Protegido por Security Rules: somente o host (anfitriaoId) lê e escreve.
 *
 * Funções:
 *   1. Lock otimista — previne double-resolution da fase noturna
 *   2. Persistência privada do host — sobrevive a disconnects e reconnects
 *   3. Tracking de corrompidos — estado que não pode estar em nó público
 */
export interface ControleNoiteInquisicao {
  // ── Lock de resolução ──────────────────────────────────────────────────────

  /**
   * Último loop cuja noite foi resolvida com sucesso.
   * null = nenhuma noite resolvida ainda.
   * Host verifica: resolvidoLoop === loop atual → skip (já resolvido).
   */
  resolvidoLoop: number | null;

  /**
   * Lock otimista de resolução.
   * true = host está ativamente resolvendo a noite.
   * Host adquire via runTransaction. Libera após escrever resultado.
   * Se true por mais de 10s: lock expirado (host anterior crashou), pode sobrescrever.
   */
  tentandoResolver: boolean;

  /** Timestamp de aquisição do lock. Para detectar locks expirados (> 10s). */
  tentativaEm: number; // Unix timestamp ms

  // ── Estado privado do host ─────────────────────────────────────────────────

  /**
   * IDs de TODOS os jogadores atualmente na facção corrompidos.
   * Inclui corrompidos originais + todos os convertidos até agora.
   * Atualizado após cada conversão.
   *
   * Separado do estado público para evitar inferência sobre quantos são corrompidos.
   * Persistido aqui para sobreviver a host disconnects e reconnects.
   */
  corrompidosAtuais: PlayerId[];

  /**
   * Número total de corrompidos na distribuição inicial.
   * Nunca exposto em estado público (evita dedução lógica durante a partida).
   * Usado pelo host para calcular vitória: corrompidosVivos >= inocentesVivos.
   */
  totalCorrompidosInicial: number;

  /**
   * Loop planejado para a próxima conversão por corrupção.
   * Gerado randomicamente pelo host no início da partida (range: loops 2–4).
   * Persistido para sobreviver a reconnects.
   * null = sem mais conversões disponíveis (maxCorrupcoes atingido ou modo leve).
   */
  proximoLoopDeCorrupcao: number | null;

  /** Quantas conversões ocorreram até agora. Comparado com configuracao.maxCorrupcoes. */
  totalCorrupcoes: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §11  AÇÕES DO JOGADOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * União de todas as ações despachadas por jogadores ou pelo host.
 * Segue o padrão GameAction<TPayload> do engine.
 *
 * [JOGADOR]: pode ser disparado por qualquer participante.
 * [HOST]:    exclusivo do anfitrião. Engine/host valida a origem.
 */
export type AcaoInquisicaoJogador =
  // ── Confirmações do jogador ─────────────────────────────────────────────────
  | (GameAction<Record<string, never>> & {
      tipo: 'confirmar_papel_visto'; // [JOGADOR] Saiu da tela de revelação de papel.
    })
  | (GameAction<Record<string, never>> & {
      tipo: 'marcar_mensagem_lida'; // [JOGADOR] Confirmou leitura de mensagemPrivada.
    })
  | (GameAction<Record<string, never>> & {
      tipo: 'marcar_evento_privado_lido'; // [JOGADOR] Confirmou leitura de eventoPrivado.
    })

  // ── Votação ─────────────────────────────────────────────────────────────────
  | (GameAction<{ alvoId: PlayerId }> & {
      tipo: 'votar'; // [JOGADOR] Registra VotoPrivado + confirma em votantesConfirmados.
    })

  // ── Fase noturna ────────────────────────────────────────────────────────────
  | (GameAction<{ tipo: TipoAcaoNoturna; alvoId: PlayerId }> & {
      tipo: 'acao_noturna'; // [JOGADOR — corrompido/guardião] Submete AcaoNoturna.
    })

  // ── Controle de fase (HOST) ──────────────────────────────────────────────────
  | (GameAction<Record<string, never>> & {
      tipo: 'avancar_fase'; // [HOST] Avança subFase programaticamente (timer expirou).
    })
  | (GameAction<{ resultado: VotacaoResolvida }> & {
      tipo: 'publicar_resultado_votacao'; // [HOST] Publica resolução após ler votosPrivados.
    })
  | (GameAction<{ mensagem: string }> & {
      tipo: 'publicar_resultado_noite'; // [HOST] Publica mensagem ambígua pós-noite.
    })
  | (GameAction<{ revelacao: RevelacaoFinalRecord; vencedor: ResultadoPartida }> & {
      tipo: 'finalizar_partida'; // [HOST] Encerra jogo e publica reveal completo.
    });

// ─────────────────────────────────────────────────────────────────────────────
// §12  FUNÇÕES DERIVADORAS (helpers exportados)
//
// Derivam estado a partir do contrato — nunca armazenar os resultados.
// São a alternativa a campos derivados que causariam desync.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deriva a facção atual de um jogador a partir do estado privado.
 *
 * Regras:
 *   papelOriginal === 'corrompido' → 'corrompidos' (sempre)
 *   convertidoNoLoop !== null      → 'corrompidos' (foi convertido)
 *   caso contrário                 → 'inocentes'
 */
export function derivarFaccao(privado: EstadoPrivadoInquisicao): FaccaoInquisicao {
  if (privado.papelOriginal === 'corrompido' || privado.convertidoNoLoop !== null) {
    return 'corrompidos';
  }
  return 'inocentes';
}

/**
 * Deriva as ações noturnas disponíveis para um jogador.
 *
 * Regras:
 *   faccao === 'corrompidos'                              → ['eliminar', 'contaminar']
 *   papelOriginal === 'guardiao' && faccao === 'inocentes' → ['proteger']
 *   papelOriginal === 'inocente' && faccao === 'inocentes' → []
 */
export function derivarAcoesNoturnas(
  privado: EstadoPrivadoInquisicao,
): readonly TipoAcaoNoturna[] {
  const faccao = derivarFaccao(privado);
  if (faccao === 'corrompidos') return ['eliminar', 'contaminar'] as const;
  if (privado.papelOriginal === 'guardiao') return ['proteger'] as const;
  return [] as const;
}

/**
 * Verifica se um jogador pode submeter ação noturna neste loop.
 *
 * @param privado    Estado privado do jogador.
 * @param jogadorId  ID do próprio jogador (não derivável de privado).
 * @param eliminados Lista de eliminações da partida.
 */
export function podeAgirNaNoite(
  privado: EstadoPrivadoInquisicao,
  jogadorId: PlayerId,
  eliminados: readonly EliminacaoRecord[],
): boolean {
  const estaEliminado = eliminados.some((e) => e.jogadorId === jogadorId);
  if (estaEliminado) return false;
  return derivarAcoesNoturnas(privado).length > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// §13  TIPOS INTERNOS DO HOST (nunca serializados em estado público)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contexto completo disponível ao host durante resolução de noite ou votação.
 * Agregação em memória — NUNCA escrever este objeto inteiro no Firebase.
 *
 * Nomeado "Contexto" (não "Snapshot") para evitar confusão com snapshots do Firebase.
 */
export interface ContextoResolucaoHost {
  readonly estadoPublico: EstadoFirebaseInquisicao;
  readonly estadosPrivados: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>;
  readonly controleNoite: ControleNoiteInquisicao;
}

/**
 * Resultado intermediário da resolução noturna.
 * Calculado internamente pelo host antes de escrever em /estado.
 * Nunca serializado no Firebase.
 *
 * Invariante de design: no máximo 1 eliminação e 1 conversão por noite.
 * (Múltiplos corrompidos coordenam: o host usa a primeira ação do tipo recebida.)
 */
export interface ResolucaoNoiteInterna {
  /**
   * Jogador eliminado esta noite. null = nenhuma eliminação.
   * Tipo singular (não array) — força o invariante de 1 eliminação máxima por noite.
   */
  readonly eliminado: PlayerId | null;

  /**
   * Jogador convertido esta noite. null = nenhuma conversão.
   * Tipo singular — 1 conversão máxima por noite.
   */
  readonly convertido: PlayerId | null;

  /** Se a ação de eliminação foi bloqueada pelo guardião. */
  readonly eliminacaoProtegida: boolean;

  /** Se a ação de contaminação foi bloqueada pelo guardião. */
  readonly corrupcaoProtegida: boolean;

  /**
   * Mensagem do sistema a exibir publicamente após a noite.
   * Sempre ambígua — escolhida pelo host com base no resultado real.
   * Nunca derivável pelo cliente a partir do estado público.
   *
   * ex: "algo mudou." / "a noite passou." / "o grupo ainda respira."
   */
  readonly mensagemDoSistema: string;
}
