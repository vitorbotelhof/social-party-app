/**
 * INQUISIÇÃO — RESOLUÇÃO DA FASE NOTURNA
 *
 * Módulo puro de resolução: sem Firebase, sem efeitos colaterais.
 * Recebe o estado atual e as ações recebidas, retorna exatamente o que escrever.
 *
 * ─── Responsabilidades ────────────────────────────────────────────────────────
 *
 * ✓ Validar ações recebidas (loop stale, alvo eliminado, tipo incompatível)
 * ✓ Selecionar ação efetiva dos corrompidos (eliminar > contaminar)
 * ✓ Resolver proteção do guardião (bloqueia eliminar E contaminar)
 * ✓ Aplicar eliminação noturna
 * ✓ Aplicar corrupção silenciosa (se elegível e não protegida)
 * ✓ Verificar condição de vitória
 * ✓ Gerar mensagem pública ambígua (pool neutro, jamais correlacionado ao resultado)
 * ✓ Construir patches privados individuais (nunca em batch)
 * ✓ Construir novoControleNoite com lock liberado
 * ✓ Suportar lock otimista (reconnect-safe)
 * ✓ Expor helpers de trigger antecipado (todos agiram → resolver antes do timer)
 *
 * ─── NÃO é responsabilidade deste módulo ─────────────────────────────────────
 *
 * ✗ Escrever no Firebase (service layer)
 * ✗ Adquirir o lock (service layer usa criarAquisicaoDeLock + runTransaction)
 * ✗ Gerenciar timers (host engine)
 * ✗ Selecionar ou emitir eventos sociais (socialEvents.ts)
 * ✗ Decidir quando chamar resolverNoite (host engine)
 *
 * ─── Segurança de informação ──────────────────────────────────────────────────
 *
 * atualizacaoPublica NUNCA contém:
 *   - papéis ou conversões de jogadores
 *   - número real de corrompidos
 *   - quem foi alvo de qualquer ação
 *   - se houve proteção ou não (houveMudanca proibido)
 *
 * patchesPrivados são entregues como ReadonlyMap<PlayerId, patch>:
 *   O caller DEVE escrever cada entrada individualmente em /privados/{id}.
 *   Escrever o mapa inteiro em /privados expõe dados privados de todos.
 *
 * ─── Compatibilidade com analytics e replay ───────────────────────────────────
 *
 * resolucaoInterna em ResultadoResolucaoNoite contém o resultado completo
 * e pode ser persistido internamente pelo host para analytics/replay.
 * NUNCA deve ser escrito em nós públicos do Firebase.
 *
 * ─── Ordem de resolução (canônica) ───────────────────────────────────────────
 *
 *   0. Pre-condições verificadas pelo caller (lock adquirido, jaFoiResolvida = false)
 *   1. Validar todas as ações brutas → filtrar inválidas silenciosamente
 *   2. Selecionar ação efetiva dos corrompidos (eliminar > contaminar, por registradaEm)
 *   3. Selecionar ação do guardião ('proteger', ou null se ausente)
 *   4. Verificar elegibilidade de corrupção (antes de saber se será protegida)
 *   5. Resolver proteção (guardião.alvo === corrompidos.alvo → bloqueia qualquer tipo)
 *   6. Aplicar eliminação (se não protegida)
 *   7. Aplicar corrupção (se não protegida E elegível — mutuamente exclusiva com eliminação)
 *   8. Selecionar mensagem pública ambígua (pool neutro, seleção aleatória ponderada)
 *   9. Construir novoControleNoite (lock liberado + corrompidosAtuais atualizados)
 *  10. Construir patches privados (convertido + corrompidos afetados, um a um)
 *  11. Verificar vitória com estado pós-noite
 *  12. Construir atualizacaoPublica (nunca vaza informação privada)
 */

import type { PlayerId } from '@/engine/types';
import {
  criarAtualizacaoFase,
  obterIdsDosVencedores,
  verificarCondicaoVitoria,
} from '@/games/inquisicao/initialState';
import type { ExtrasTransicaoFase } from '@/games/inquisicao/initialState';
import { sortearFraseNoite, sortearMensagemCorrupcao } from '@/games/inquisicao/eventos';
import { sortearProximoLoopDeCorrupcao } from '@/games/inquisicao/roleDistribution';
import { derivarAcoesNoturnas, derivarFaccao } from '@/games/inquisicao/types';
import type {
  AcaoNoturna,
  ConfiguracaoPartida,
  ContextoResolucaoHost,
  ControleNoiteInquisicao,
  EliminacaoRecord,
  EstadoFirebaseInquisicao,
  EstadoPrivadoInquisicao,
  PapelFinalRevelado,
  RevelacaoFinalRecord,
  ResolucaoNoiteInterna,
  ResultadoPartida,
  TipoAcaoNoturna,
} from '@/games/inquisicao/types';

// ─────────────────────────────────────────────────────────────────────────────
// §1  CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Timeout do lock otimista de resolução (ms).
 *
 * Se tentandoResolver === true e (agora - tentativaEm) > este valor,
 * o host anterior travou — o lock pode ser sobrescrito com segurança.
 *
 * 10 segundos: grande o suficiente para resolver (operação leva < 1s),
 * pequeno o suficiente para não bloquear uma partida por um crash.
 */
export const DURACAO_LOCK_EXPIRADO_MS = 10_000;

// Mensagens de corrupção e frases pós-noite provêm do banco canônico em eventos.ts.
// sortearMensagemCorrupcao() — 5 variações ponderadas, entregue ao convertido.
// sortearFraseNoite(ultimaFrase) — 10 variações ponderadas, anti-repetição consecutiva.

// ─────────────────────────────────────────────────────────────────────────────
// §2  TIPOS INTERNOS E EXPORTADOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ação noturna que passou por todas as validações.
 *
 * A existência deste tipo garante, em tempo de compilação, que qualquer
 * processamento posterior opera apenas sobre ações já verificadas.
 */
interface AcaoValidada {
  readonly acao: AcaoNoturna;
  readonly estadoPrivadoAtor: EstadoPrivadoInquisicao;
}

/**
 * Resultado completo da resolução de uma noite.
 *
 * O caller (host engine) usa cada campo da seguinte forma:
 *
 *   resolucaoInterna:   analytics/replay — NUNCA escrever em nó público do Firebase
 *   atualizacaoPublica: Firebase update() em /estado (atomicamente com novoControleNoite)
 *   patchesPrivados:    Firebase set() em /privados/{id} — UM POR UM, nunca em batch
 *   novoControleNoite:  Firebase set() em /noiteControle (atomicamente com atualizacaoPublica)
 *
 * Ordem de escrita recomendada:
 *   1. Multi-path update atomizando /estado + /noiteControle
 *   2. Loop sobre patchesPrivados: set() individual por playerId
 *   3. Deletar /noite/* (cleanup de ações usadas)
 */
export interface ResultadoResolucaoNoite {
  /**
   * Resultado interno completo — para analytics, replay, debugging.
   * Contém: eliminado, convertido, flags de proteção, mensagem.
   * NUNCA escrever diretamente em nó público do Firebase.
   */
  readonly resolucaoInterna: ResolucaoNoiteInterna;

  /**
   * Atualização parcial para /estado.
   *
   * Contém sempre: subFase, loop+1, prazoFaseEm, jogadoresAtivos, eliminados,
   *                mensagemDoSistema, votacaoAtual=null, eventoAtivo=null, atualizadoEm.
   * Contém ao fim de jogo: vencedor, vencedorIds, revelacaoFinal, fase='results'.
   *
   * NUNCA contém: papéis de jogadores, conversões, contagem de corrompidos, alvos de ação.
   */
  readonly atualizacaoPublica: Partial<EstadoFirebaseInquisicao>;

  /**
   * Patches de estado privado indexados por PlayerId.
   *
   * ⚠ ESCREVER UM A UM — NUNCA EM BATCH:
   *   CORRETO: for (const [id, patch] of patchesPrivados) {
   *              await set(ref(db, `/salas/${codigo}/privados/${id}`), patch);
   *            }
   *   ERRADO:  await set(ref(db, `/salas/${codigo}/privados`),
   *              Object.fromEntries(patchesPrivados));  ← expõe dados de todos
   *
   * Conteúdo gerado em dois cenários:
   *   Conversão: patch para o convertido + patch para cada corrompido existente
   *   Eliminação de corrompido: patch para cada corrompido sobrevivente
   */
  readonly patchesPrivados: ReadonlyMap<PlayerId, Partial<EstadoPrivadoInquisicao>>;

  /**
   * Novo estado de /noiteControle.
   * Escrito ATOMICAMENTE com atualizacaoPublica (mesmo multi-path update).
   * Contém: lock liberado, corrompidosAtuais atualizado, resolvidoLoop = loop resolvido.
   */
  readonly novoControleNoite: ControleNoiteInquisicao;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  HELPERS DE LOCK OTIMISTA (exported)
//
// O service layer é responsável por adquirir o lock antes de chamar resolverNoite.
// Estes helpers encapsulam toda a lógica de lock sem depender do Firebase.
//
// Fluxo de uso:
//   1. if (jaFoiResolvida(controle, loop)) return;  // já resolvida — skip
//   2. if (!podeTentarResolver(controle, agora)) return;  // outro host resolvendo
//   3. await runTransaction(noiteControleRef, () => criarAquisicaoDeLock(agora));
//   4. const resultado = resolverNoite(acoes, ctx, agora);
//   5. Escrever resultado no Firebase (novoControleNoite já libera o lock)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se a noite deste loop já foi resolvida com sucesso.
 *
 * Deve ser verificado ANTES de tentar adquirir o lock.
 * Se true: skip — a resolução já ocorreu, o estado já foi escrito.
 *
 * Esta verificação é a primeira linha de defesa contra double-resolution.
 */
export function jaFoiResolvida(
  controle: ControleNoiteInquisicao,
  loop: number,
): boolean {
  return controle.resolvidoLoop === loop;
}

/**
 * Verifica se o host pode tentar adquirir o lock de resolução.
 *
 * Retorna true se:
 *   (a) O lock não está ativo (tentandoResolver === false), ou
 *   (b) O lock está ativo mas expirou há > DURACAO_LOCK_EXPIRADO_MS ms
 *       (host anterior crashou com o lock adquirido)
 *
 * Retorna false se o lock está ativo e ainda fresco — outra instância
 * do host está em processo de resolução, aguardar.
 */
export function podeTentarResolver(
  controle: ControleNoiteInquisicao,
  agora: number,
): boolean {
  if (!controle.tentandoResolver) return true;
  return agora - controle.tentativaEm > DURACAO_LOCK_EXPIRADO_MS;
}

/**
 * Cria o patch de aquisição do lock para /noiteControle.
 *
 * Usado pelo service layer em Firebase runTransaction:
 *
 *   const lockPatch = criarAquisicaoDeLock(agora);
 *   await runTransaction(noiteControleRef, (current) => {
 *     if (!podeTentarResolver(current, agora)) return; // abort
 *     return { ...current, ...lockPatch };
 *   });
 *
 * Após adquirir o lock com sucesso, chamar resolverNoite().
 * O novoControleNoite retornado já inclui tentandoResolver: false — o
 * lock é liberado automaticamente na escrita do resultado.
 */
export function criarAquisicaoDeLock(
  agora: number,
): Pick<ControleNoiteInquisicao, 'tentandoResolver' | 'tentativaEm'> {
  return { tentandoResolver: true, tentativaEm: agora };
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  VALIDAÇÃO DE AÇÕES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida uma única ação noturna contra o estado atual.
 *
 * Motivos de rejeição (ordem de verificação — da mais barata à mais cara):
 *   1. Loop stale: ação de noite anterior que sobreviveu no Firebase
 *   2. Ator eliminado: jogador fora do jogo não pode agir
 *   3. Alvo eliminado: alvo não existe mais em jogadoresAtivos
 *   4. Auto-alvo: proibido para qualquer tipo de ação
 *   5. Contaminar alvo já corrompido: ação sem efeito, descartada para consistência
 *   6. Estado privado do ator ausente: dado incompleto — não pode validar papel
 *   7. Tipo incompatível com papel atual derivado do ator
 *   8. 'proteger' sem guardião habilitado na configuração
 *
 * @returns AcaoValidada se válida, null caso contrário (rejeição silenciosa).
 */
function validarAcao(
  acao: AcaoNoturna,
  ctx: ContextoResolucaoHost,
): AcaoValidada | null {
  const { estadoPublico, estadosPrivados, controleNoite } = ctx;

  // 1. Loop stale — ação de noite anterior que sobreviveu a crash ou reconexão
  if (acao.loop !== estadoPublico.loop) return null;

  // 2. Ator eliminado — não pode agir fora do jogo
  if (!estadoPublico.jogadoresAtivos.includes(acao.jogadorId)) return null;

  // 3. Alvo eliminado — alvo não existe mais
  if (!estadoPublico.jogadoresAtivos.includes(acao.alvoId)) return null;

  // 4. Auto-alvo proibido para qualquer tipo
  if (acao.alvoId === acao.jogadorId) return null;

  // 5. Contaminar alvo já corrompido — sem efeito mecânico, descartado
  if (
    acao.tipo === 'contaminar' &&
    controleNoite.corrompidosAtuais.includes(acao.alvoId)
  ) {
    return null;
  }

  // 6. Estado privado do ator deve existir
  const estadoPrivadoAtor = estadosPrivados[acao.jogadorId];
  if (estadoPrivadoAtor === undefined) return null;

  // 7. Tipo de ação compatível com papel atual derivado
  const acoesPermitidas: readonly TipoAcaoNoturna[] = derivarAcoesNoturnas(estadoPrivadoAtor);
  if (!acoesPermitidas.includes(acao.tipo)) return null;

  // 8. 'proteger' requer guardião habilitado na configuração desta partida
  if (acao.tipo === 'proteger' && !estadoPublico.configuracao.temGuardiao) return null;

  return { acao, estadoPrivadoAtor };
}

/**
 * Filtra e valida todas as ações brutas recebidas.
 * Ações inválidas são silenciosamente descartadas — sem log, sem feedback ao cliente.
 */
function validarAcoes(
  acoes: readonly AcaoNoturna[],
  ctx: ContextoResolucaoHost,
): readonly AcaoValidada[] {
  const resultado: AcaoValidada[] = [];
  for (const acao of acoes) {
    const validada = validarAcao(acao, ctx);
    if (validada !== null) resultado.push(validada);
  }
  return resultado;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  IDENTIFICAÇÃO DE ATORES E TRIGGER DE RESOLUÇÃO ANTECIPADA (exported)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Identifica os jogadores elegíveis para agir nesta noite.
 *
 * Elegíveis:
 *   - Todos os corrompidosAtuais que ainda estão em jogadoresAtivos
 *   - O guardião ativo não convertido (se configuracao.temGuardiao === true)
 *
 * Usado por todosAtoresElegiveisAgiram e para UX do host.
 */
function identificarAtoresElegiveis(
  ctx: ContextoResolucaoHost,
): readonly PlayerId[] {
  const { estadoPublico, estadosPrivados, controleNoite } = ctx;
  const { jogadoresAtivos, configuracao } = estadoPublico;

  const atores: PlayerId[] = [];

  // Corrompidos ativos (vivos na partida)
  for (const id of controleNoite.corrompidosAtuais) {
    if (jogadoresAtivos.includes(id)) {
      atores.push(id);
    }
  }

  // Guardião ativo não convertido (no máximo um por partida)
  if (configuracao.temGuardiao) {
    for (const [id, privado] of Object.entries(estadosPrivados)) {
      if (
        privado.papelOriginal === 'guardiao' &&
        derivarFaccao(privado) === 'inocentes' &&
        jogadoresAtivos.includes(id)
      ) {
        atores.push(id);
        break; // apenas um guardião possível por partida
      }
    }
  }

  return atores;
}

/**
 * Verifica se todos os atores elegíveis desta noite já submeteram uma ação.
 *
 * Quando retorna true, o host pode resolver a noite IMEDIATAMENTE
 * sem esperar o timer de duracaoNoiteMaxSegundos expirar.
 *
 * O host deve invocar esta verificação toda vez que uma nova ação
 * chegar em /noite/* (via onChildAdded). O timer permanece como fallback.
 *
 * Nota: verifica apenas a presença de ação (por jogadorId), não a validade.
 * A validação completa ocorre dentro de resolverNoite.
 *
 * @param acoes Ações brutas em /noite/* (podem incluir ações inválidas)
 * @param ctx   Contexto atual do host
 */
export function todosAtoresElegiveisAgiram(
  acoes: readonly AcaoNoturna[],
  ctx: ContextoResolucaoHost,
): boolean {
  const atores = identificarAtoresElegiveis(ctx);

  // Sem atores elegíveis: vitória dos inocentes iminente (verificarCondicaoVitoria
  // detectará logo, mas o trigger aqui evita espera desnecessária).
  if (atores.length === 0) return true;

  // Filtra ações do loop atual — ignora ações stale de loops anteriores
  const acoesDoLoop = acoes.filter((a) => a.loop === ctx.estadoPublico.loop);
  const atoresQueAgiram = new Set(acoesDoLoop.map((a) => a.jogadorId));

  return atores.every((id) => atoresQueAgiram.has(id));
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  SELEÇÃO DE AÇÕES EFETIVAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seleciona a ação efetiva dos corrompidos a partir das ações válidas.
 *
 * Os corrompidos atuam coletivamente, mas submetem ações independentemente.
 * Esta função implementa a regra de prioridade determinística:
 *
 *   eliminar > contaminar
 *
 *   - Se qualquer corrompido submeteu 'eliminar' → essa ação vence
 *   - Se nenhuma 'eliminar' mas há 'contaminar' → contaminar vence
 *   - Empate dentro do mesmo tipo → menor registradaEm (mais rápido)
 *
 * Rationale da prioridade:
 *   1. Determinismo: sem ambiguidade quando tipos diferentes são submetidos
 *   2. Eliminação é irreversível — prioridade correta emocionalmente
 *   3. Corrompidos que desejam contaminar coordenam via conversa prévia
 *
 * @returns AcaoValidada selecionada, ou null se nenhum corrompido agiu.
 */
function selecionarAcaoCorrompidos(
  acoesValidadas: readonly AcaoValidada[],
  corrompidosAtuais: readonly PlayerId[],
): AcaoValidada | null {
  // Filtra apenas ações de membros da facção corrompidos
  const acoesDeCorrompidos = acoesValidadas.filter((av) =>
    corrompidosAtuais.includes(av.acao.jogadorId),
  );

  if (acoesDeCorrompidos.length === 0) return null;

  // Candidato 'eliminar': mais rápido por registradaEm
  const candidatoEliminar = acoesDeCorrompidos
    .filter((av) => av.acao.tipo === 'eliminar')
    .sort((a, b) => a.acao.registradaEm - b.acao.registradaEm)[0];

  if (candidatoEliminar !== undefined) return candidatoEliminar;

  // Candidato 'contaminar': mais rápido por registradaEm (só chega aqui sem eliminar)
  const candidatoContaminar = acoesDeCorrompidos
    .filter((av) => av.acao.tipo === 'contaminar')
    .sort((a, b) => a.acao.registradaEm - b.acao.registradaEm)[0];

  return candidatoContaminar ?? null;
}

/**
 * Seleciona a ação do guardião a partir das ações válidas.
 *
 * 'proteger' só pode vir de um guardião de facção inocentes — validarAcao já garantiu.
 * Aqui apenas filtramos pelo tipo e retornamos o primeiro encontrado.
 *
 * @returns AcaoValidada do guardião, ou null se o guardião não agiu no tempo.
 */
function selecionarAcaoGuardiao(
  acoesValidadas: readonly AcaoValidada[],
): AcaoValidada | null {
  return acoesValidadas.find((av) => av.acao.tipo === 'proteger') ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  SELEÇÃO DE MENSAGEM PÚBLICA AMBÍGUA
//
// Delegada a sortearFraseNoite(ultimaFrase, aleatorio) de eventos.ts.
// 10 frases ponderadas com anti-repetição consecutiva — banco canônico único.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// §8  RESOLUÇÃO INTERNA (função pura central)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o resultado interno da noite — função pura, determinística, sem efeitos.
 *
 * ─── Sequência de resolução ───────────────────────────────────────────────
 *
 *   1. Verificar elegibilidade de corrupção (antes da proteção — o ator não
 *      recebe feedback sobre qual mecanismo bloqueou sua ação)
 *   2. Verificar proteção: guardião.alvo === corrompidos.alvo → bloqueia tudo
 *   3. Resolver eliminação (se não protegida)
 *   4. Resolver corrupção (se não protegida E elegível)
 *   5. Selecionar mensagem ambígua
 *
 * ─── Invariante de exclusividade ──────────────────────────────────────────
 *
 *   eliminado e convertido NUNCA são ambos não-null.
 *   Garantido estruturalmente: acaoCorrompidos é um único tipo (eliminar OU contaminar).
 *   O assert ao final valida em desenvolvimento.
 */
function calcularResolucaoInterna(
  acaoCorrompidos: AcaoValidada | null,
  acaoGuardiao: AcaoValidada | null,
  controle: ControleNoiteInquisicao,
  configuracao: ConfiguracaoPartida,
  loop: number,
  ultimaFrase: string | null,
  aleatorio: () => number,
): ResolucaoNoiteInterna {
  // ── 1. Elegibilidade de corrupção ────────────────────────────────────────
  // Verificada ANTES de calcular a proteção. O corrompido não sabe o motivo
  // pelo qual sua contaminação não funcionou — só sabe que não funcionou.
  const corrupcaoElegivel =
    configuracao.intensidade !== 'leve' &&
    controle.totalCorrupcoes < configuracao.maxCorrupcoes &&
    controle.proximoLoopDeCorrupcao !== null &&
    loop >= controle.proximoLoopDeCorrupcao;

  // ── 2. Proteção ──────────────────────────────────────────────────────────
  // O guardião protege contra QUALQUER tipo de ação (eliminar e contaminar).
  // Proteção é total — sem exceções, sem tipos específicos.
  const alvoCorr: PlayerId | null = acaoCorrompidos?.acao.alvoId ?? null;
  const alvoGuard: PlayerId | null = acaoGuardiao?.acao.alvoId ?? null;
  const acaoEstaProtegida: boolean = alvoCorr !== null && alvoCorr === alvoGuard;

  // ── 3. Eliminação ────────────────────────────────────────────────────────
  const tentouEliminar: boolean = acaoCorrompidos?.acao.tipo === 'eliminar';
  const eliminacaoProtegida: boolean = tentouEliminar && acaoEstaProtegida;
  const eliminado: PlayerId | null =
    tentouEliminar && !acaoEstaProtegida ? alvoCorr : null;

  // ── 4. Corrupção ─────────────────────────────────────────────────────────
  // Mutuamente exclusiva com eliminação: acaoCorrompidos é sempre UM tipo.
  // Um corrompido que submete eliminar nunca contamina na mesma noite.
  const tentouContaminar: boolean = acaoCorrompidos?.acao.tipo === 'contaminar';
  const corrupcaoProtegida: boolean = tentouContaminar && acaoEstaProtegida;
  const convertido: PlayerId | null =
    tentouContaminar && !acaoEstaProtegida && corrupcaoElegivel ? alvoCorr : null;

  // ── Assertion de exclusividade (detecta bugs em desenvolvimento) ──────────
  if (eliminado !== null && convertido !== null) {
    throw new Error(
      `[NightPhase] Invariante violado: eliminado=${eliminado} e convertido=${convertido} ` +
      `não podem ser ambos não-null. Loop=${loop}. Indica bug na seleção de acaoCorrompidos.`,
    );
  }

  // ── 5. Mensagem pública ambígua ───────────────────────────────────────────
  // Anti-repetição: sortearFraseNoite filtra a frase da noite anterior.
  return {
    eliminado,
    convertido,
    eliminacaoProtegida,
    corrupcaoProtegida,
    mensagemDoSistema: sortearFraseNoite(ultimaFrase, aleatorio),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  CONSTRUÇÃO DE PATCHES PRIVADOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constrói os patches de estado privado resultantes da noite.
 *
 * Gera patches em dois cenários mutuamente exclusivos:
 *
 * ─── Cenário A: corrupção ocorreu (resolucao.convertido !== null) ──────────
 *   - Patch para o convertido:
 *       convertidoNoLoop, corrompidosConhecidos atualizados, mensagemPrivada, mensagemLida=false
 *   - Patch para cada corrompido existente:
 *       corrompidosConhecidos atualizados (inclui o novo membro)
 *
 * ─── Cenário B: corrompido foi eliminado (eliminado está em corrompidosAtuais) ─
 *   - Patch para cada corrompido sobrevivente:
 *       corrompidosConhecidos atualizados (remove o eliminado)
 *
 * ─── Cenário C: nenhum dos acima → mapa vazio ───────────────────────────────
 *
 * ⚠ O caller DEVE escrever cada entrada individualmente em /privados/{playerId}.
 *   NUNCA escrever Object.fromEntries(patchesPrivados) em /privados — exporia
 *   dados de todos os jogadores no mesmo nó.
 */
function construirPatchesPrivados(
  resolucao: ResolucaoNoiteInterna,
  controle: ControleNoiteInquisicao,
  estadosPrivados: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
  loop: number,
  agora: number,
  aleatorio: () => number,
): ReadonlyMap<PlayerId, Partial<EstadoPrivadoInquisicao>> {
  const patches = new Map<PlayerId, Partial<EstadoPrivadoInquisicao>>();
  const { convertido, eliminado } = resolucao;

  if (convertido !== null) {
    // ── Cenário A: conversão ocorreu ──────────────────────────────────────

    // Nova facção corrompidos: todos os atuais + recém-convertido
    // (eliminado === null aqui — invariante de exclusividade garantido)
    const todosCorrompidos: readonly PlayerId[] = [
      ...controle.corrompidosAtuais,
      convertido,
    ];

    // Patch para o jogador convertido — mensagem selecionada do banco ponderado
    patches.set(convertido, {
      convertidoNoLoop: loop,
      corrompidosConhecidos: todosCorrompidos.filter((id) => id !== convertido),
      mensagemPrivada: sortearMensagemCorrupcao(aleatorio),
      mensagemLida: false,
      atualizadaEm: agora,
    });

    // Patch para cada corrompido existente — precisam conhecer o novo aliado
    for (const corrId of controle.corrompidosAtuais) {
      const estadoPrivado = estadosPrivados[corrId];
      if (estadoPrivado === undefined) continue; // defensive

      patches.set(corrId, {
        corrompidosConhecidos: todosCorrompidos.filter((id) => id !== corrId),
        atualizadaEm: agora,
      });
    }
  } else if (eliminado !== null && controle.corrompidosAtuais.includes(eliminado)) {
    // ── Cenário B: corrompido foi eliminado ───────────────────────────────
    // Sobreviventes precisam atualizar sua lista de aliados

    const corrompidosSobreviventes = controle.corrompidosAtuais.filter(
      (id) => id !== eliminado,
    );

    for (const corrId of corrompidosSobreviventes) {
      const estadoPrivado = estadosPrivados[corrId];
      if (estadoPrivado === undefined) continue; // defensive

      patches.set(corrId, {
        corrompidosConhecidos: corrompidosSobreviventes.filter((id) => id !== corrId),
        atualizadaEm: agora,
      });
    }
  }
  // Cenário C: mapa permanece vazio

  return patches;
}

// ─────────────────────────────────────────────────────────────────────────────
// §10  CONSTRUÇÃO DO NOITECONTROLE ATUALIZADO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constrói o novo ControleNoiteInquisicao após a resolução.
 *
 * Mudanças aplicadas:
 *   resolvidoLoop:        loop (marca noite como resolvida — chave anti-double-resolution)
 *   tentandoResolver:     false (lock liberado)
 *   tentativaEm:          preservado (para auditoria de quando o lock foi adquirido)
 *   corrompidosAtuais:    remove eliminado (se era corrompido) + adiciona convertido (se aplicável)
 *   totalCorrupcoes:      incrementado se houve conversão
 *   proximoLoopDeCorrupcao: agendado para próxima conversão ou null se limite atingido
 *   totalCorrompidosInicial: imutável (não muda após distribuição inicial)
 *
 * ─── Lógica de proximoLoopDeCorrupcao ────────────────────────────────────────
 *   Não houve conversão:   mantém o valor atual (janela ainda aberta para próxima noite)
 *   Houve conversão + mais conversões disponíveis + paranoia: agenda próxima via sortear...()
 *   Houve conversão + limite atingido: null (sem mais conversões)
 *   Houve conversão + modo padrão (máx 1): null
 */
function construirNovoControleNoite(
  resolucao: ResolucaoNoiteInterna,
  controle: ControleNoiteInquisicao,
  configuracao: ConfiguracaoPartida,
  loop: number,
): ControleNoiteInquisicao {
  const { eliminado, convertido } = resolucao;
  const houveConversao = convertido !== null;

  // ── corrompidosAtuais atualizado ─────────────────────────────────────────
  let novosCorrompidos = [...controle.corrompidosAtuais];

  if (eliminado !== null) {
    // Remove o eliminado (pode ou não ser corrompido — o filter é seguro em ambos os casos)
    novosCorrompidos = novosCorrompidos.filter((id) => id !== eliminado);
  }

  if (convertido !== null) {
    // Invariante: convertido não estava em corrompidosAtuais antes (validarAcao garantiu via
    // "contaminar alvo já corrompido → descarta"). Adição segura.
    novosCorrompidos.push(convertido);
  }

  // ── totalCorrupcoes atualizado ────────────────────────────────────────────
  const novoTotalCorrupcoes = controle.totalCorrupcoes + (houveConversao ? 1 : 0);

  // ── proximoLoopDeCorrupcao ────────────────────────────────────────────────
  let proximoLoopFinal: number | null;

  if (!houveConversao) {
    // Nenhuma conversão esta noite — janela ainda aberta para noites futuras
    proximoLoopFinal = controle.proximoLoopDeCorrupcao;
  } else {
    const maisConversoesDisponiveis = novoTotalCorrupcoes < configuracao.maxCorrupcoes;

    if (maisConversoesDisponiveis && configuracao.intensidade === 'paranoia') {
      // Paranoia com 2ª conversão disponível — agendar próxima janela
      proximoLoopFinal = sortearProximoLoopDeCorrupcao(loop);
    } else {
      // Limite atingido (padrão: 1/paranoia: 2) ou modo não-paranoia — encerrar
      proximoLoopFinal = null;
    }
  }

  return {
    resolvidoLoop:           loop,        // chave de idempotência — escrito com /estado
    tentandoResolver:        false,       // lock liberado
    tentativaEm:             controle.tentativaEm, // preservado para auditoria

    corrompidosAtuais:       novosCorrompidos,
    totalCorrompidosInicial: controle.totalCorrompidosInicial, // imutável
    totalCorrupcoes:         novoTotalCorrupcoes,
    proximoLoopDeCorrupcao:  proximoLoopFinal,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §11  GERAÇÃO DA REVELAÇÃO FINAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Gera o RevelacaoFinalRecord ao fim da partida.
 *
 * Inclui TODOS os jogadores (ativos + eliminados), com papéis completos.
 * Em modo paranoia: esta é a primeira vez que qualquer papel é revelado.
 * Nunca deve retornar null — só é chamada quando vencedor !== null.
 *
 * ─── Ajuste para convertido desta noite ──────────────────────────────────────
 *
 * O estado privado em Firebase ainda não foi atualizado quando esta função roda
 * (o patch ainda não foi escrito). Para que o reveal seja preciso, aplicamos
 * convertidoNoLoop manualmente para o jogador convertido nesta noite.
 *
 * @param vencedor        Facção vencedora (não-null — chamar só após vitória)
 * @param resolucao       Resultado desta noite (para ajustar convertidoNoLoop)
 * @param novoControle    Controle atualizado desta noite (totalCorrupcoes correto)
 * @param loop            Loop sendo resolvido (= último loop da partida)
 * @param agora           Timestamp de geração
 * @param estadosPrivados Estado privado de todos os jogadores (ativos + eliminados)
 */
function gerarRevelacaoFinal(
  vencedor: ResultadoPartida,
  resolucao: ResolucaoNoiteInterna,
  novoControle: ControleNoiteInquisicao,
  loop: number,
  agora: number,
  estadosPrivados: Readonly<Record<PlayerId, EstadoPrivadoInquisicao>>,
): RevelacaoFinalRecord {
  const papeisPorJogador: Record<PlayerId, PapelFinalRevelado> = {};

  for (const [id, privado] of Object.entries(estadosPrivados)) {
    // Para o convertido desta noite: convertidoNoLoop ainda é null no Firebase
    // (patch ainda não escrito). Corrigimos aqui para o reveal ser tecnicamente correto.
    const convertidoNoLoop: number | null =
      id === resolucao.convertido ? loop : privado.convertidoNoLoop;

    papeisPorJogador[id] = {
      papelOriginal: privado.papelOriginal,
      convertidoNoLoop,
    };
  }

  return {
    papeisPorJogador,
    vencedor,
    totalLoops: loop, // último loop que rodou — o incremento (loop+1) ainda não ocorreu
    totalCorrupcoes: novoControle.totalCorrupcoes,
    geradaEm: agora,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §12  CONSTRUÇÃO DA ATUALIZAÇÃO PÚBLICA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Constrói a atualização parcial para /estado.
 *
 * Aplica a resolução ao estado público:
 *   - Remove eliminado de jogadoresAtivos e adiciona a eliminados[]
 *   - Incrementa loop (N → N+1)
 *   - Define subFase ('conversa' ou 'finalizado')
 *   - Define mensagemDoSistema (ambígua, não derivável ao resultado)
 *   - Limpa votacaoAtual e eventoAtivo
 *   - Se vitória: adiciona vencedor, vencedorIds, revelacaoFinal, fase='results'
 *
 * ─── O que NUNCA aparece aqui ─────────────────────────────────────────────
 *   - papelOriginal de qualquer jogador
 *   - convertidoNoLoop de qualquer jogador
 *   - totalCorrompidos ou qualquer contagem de corrompidos
 *   - quem foi alvo de eliminação ou contaminação
 *   - se houve proteção (houveMudanca proibido)
 */
function construirAtualizacaoPublica(
  resolucao: ResolucaoNoiteInterna,
  ctx: ContextoResolucaoHost,
  novoControle: ControleNoiteInquisicao,
  agora: number,
): Partial<EstadoFirebaseInquisicao> {
  const { estadoPublico, estadosPrivados } = ctx;
  const { configuracao } = estadoPublico;
  const loop = estadoPublico.loop;

  // ── jogadoresAtivos pós-noite ────────────────────────────────────────────
  const jogadoresAtivosPosNoite: PlayerId[] =
    resolucao.eliminado !== null
      ? estadoPublico.jogadoresAtivos.filter((id) => id !== resolucao.eliminado)
      : [...estadoPublico.jogadoresAtivos];

  // ── histórico de eliminações ─────────────────────────────────────────────
  const eliminadosPosNoite: EliminacaoRecord[] = [...estadoPublico.eliminados];

  if (resolucao.eliminado !== null) {
    const estadoPrivadoEliminado = estadosPrivados[resolucao.eliminado];

    // papelRevelado: exposto em modos leve e padrão, oculto em paranoia.
    // Convertidos aparecem como 'corrompido' — facção real no momento da eliminação.
    const papelRevelado =
      configuracao.revelarPapelAoEliminar && estadoPrivadoEliminado !== undefined
        ? (estadoPrivadoEliminado.convertidoNoLoop !== null
            ? 'corrompido'
            : estadoPrivadoEliminado.papelOriginal)
        : null;

    eliminadosPosNoite.push({
      jogadorId: resolucao.eliminado,
      loop,
      causa: 'noite',
      papelRevelado,
      eliminadoEm: agora,
    } satisfies EliminacaoRecord);
  }

  // ── condição de vitória ──────────────────────────────────────────────────
  // novoControle.corrompidosAtuais já reflete a eliminação e a conversão desta noite.
  // Verificação correta: aplica todas as mudanças ANTES de checar.
  const vencedor: ResultadoPartida | null = verificarCondicaoVitoria(
    jogadoresAtivosPosNoite,
    novoControle.corrompidosAtuais,
  );

  const proximaSubFase = vencedor !== null ? 'finalizado' : 'conversa';
  const novoLoop = loop + 1;

  // ── vencedorIds e revelação final (se houver vitória) ────────────────────
  const todosJogadorIds = Object.keys(estadosPrivados) as PlayerId[];
  const vencedorIds: PlayerId[] =
    vencedor !== null
      ? obterIdsDosVencedores(vencedor, novoControle.corrompidosAtuais, todosJogadorIds)
      : [];

  const revelacaoFinal: RevelacaoFinalRecord | null =
    vencedor !== null
      ? gerarRevelacaoFinal(
          vencedor,
          resolucao,
          novoControle,
          loop,
          agora,
          estadosPrivados,
        )
      : null;

  // ── montar extras para criarAtualizacaoFase ───────────────────────────────
  const extras: ExtrasTransicaoFase = {
    loop:              novoLoop,
    votacaoAtual:      null,
    eventoAtivo:       null,
    mensagemDoSistema: resolucao.mensagemDoSistema,
    jogadoresAtivos:   jogadoresAtivosPosNoite,
    eliminados:        eliminadosPosNoite,
  };

  if (vencedor !== null) {
    extras.vencedor       = vencedor;
    extras.vencedorIds    = vencedorIds;
    extras.revelacaoFinal = revelacaoFinal;
  }

  const atualizacao = criarAtualizacaoFase(proximaSubFase, configuracao, agora, extras);

  // 'fase' muda de 'playing' → 'results' ao finalizar.
  // criarAtualizacaoFase não lida com 'fase' — adicionamos manualmente.
  if (vencedor !== null) {
    (atualizacao as Record<string, unknown>)['fase'] = 'results';
  }

  return atualizacao;
}

// ─────────────────────────────────────────────────────────────────────────────
// §13  FUNÇÃO PRINCIPAL — resolverNoite (exported)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve completamente a fase noturna a partir do estado atual e das ações recebidas.
 *
 * Produz um resultado determinístico dado o mesmo conjunto de entradas —
 * com uma única exceção proposital: a mensagem pública é selecionada de forma
 * aleatória ponderada para evitar correlação com o resultado real.
 * Esse não-determinismo é um requisito do design emocional do jogo.
 *
 * ─── Pré-condições (responsabilidade do caller) ───────────────────────────
 *
 * O caller DEVE verificar antes de chamar esta função:
 *   1. jaFoiResolvida(controle, loop) === false     ← idempotência
 *   2. Lock adquirido (criarAquisicaoDeLock + runTransaction bem-sucedida)
 *   3. estadoPublico.subFase === 'noite'            ← fase correta
 *   4. ctx.estadosPrivados contém todos os jogadores
 *
 * Violações dessas pré-condições não são validadas aqui para manter a função
 * pura e sem acoplamento ao Firebase. São invariantes de responsabilidade do
 * host engine.
 *
 * ─── Pós-condições garantidas ────────────────────────────────────────────
 *
 *   novoControleNoite.resolvidoLoop === estadoPublico.loop
 *   novoControleNoite.tentandoResolver === false
 *   atualizacaoPublica nunca contém papéis, conversões ou contagem de corrompidos
 *   resolucaoInterna.eliminado e .convertido são mutuamente exclusivos
 *   patchesPrivados.size <= corrompidosAtuais.length + 1
 *
 * ─── Escrita recomendada pelo caller ─────────────────────────────────────
 *
 *   // 1. Multi-path atômico (inclui lock liberado)
 *   await update(ref(db, `/salas/${codigo}`), {
 *     estado:        resultado.atualizacaoPublica,
 *     noiteControle: resultado.novoControleNoite,
 *   });
 *
 *   // 2. Patches privados — um a um
 *   for (const [id, patch] of resultado.patchesPrivados) {
 *     await set(ref(db, `/salas/${codigo}/privados/${id}`), patch);
 *   }
 *
 *   // 3. Cleanup de ações usadas
 *   await remove(ref(db, `/salas/${codigo}/noite`));
 *
 * @param acoes     Ações brutas recebidas em /noite/* (podem incluir inválidas)
 * @param ctx       Contexto completo do host (estado público + privados + controle)
 * @param agora     Timestamp Unix ms (injetável para testes, default: Date.now())
 * @param aleatorio Função aleatória para mensagem (injetável para testes, default: Math.random)
 */
export function resolverNoite(
  acoes: readonly AcaoNoturna[],
  ctx: ContextoResolucaoHost,
  agora: number = Date.now(),
  aleatorio: () => number = Math.random,
): ResultadoResolucaoNoite {
  const { controleNoite, estadoPublico } = ctx;
  const loop = estadoPublico.loop;

  // ── Etapa 1: validar ações brutas ─────────────────────────────────────────
  const acoesValidadas = validarAcoes(acoes, ctx);

  // ── Etapa 2: selecionar ações efetivas ───────────────────────────────────
  const acaoCorrompidos = selecionarAcaoCorrompidos(
    acoesValidadas,
    controleNoite.corrompidosAtuais,
  );
  const acaoGuardiao = selecionarAcaoGuardiao(acoesValidadas);

  // ── Etapa 3: resolução interna (proteção → eliminação → corrupção) ────────
  // ultimaFrase: anti-repetição de mensagem pós-noite (nunca a mesma noite seguida)
  const ultimaFrase = ctx.estadoPublico.mensagemDoSistema ?? null;
  const resolucaoInterna = calcularResolucaoInterna(
    acaoCorrompidos,
    acaoGuardiao,
    controleNoite,
    estadoPublico.configuracao,
    loop,
    ultimaFrase,
    aleatorio,
  );

  // ── Etapa 4: novoControleNoite (lock liberado + corrompidos atualizados) ──
  const novoControleNoite = construirNovoControleNoite(
    resolucaoInterna,
    controleNoite,
    estadoPublico.configuracao,
    loop,
  );

  // ── Etapa 5: patches privados (patches individuais, nunca em batch) ───────
  const patchesPrivados = construirPatchesPrivados(
    resolucaoInterna,
    controleNoite,
    ctx.estadosPrivados,
    loop,
    agora,
    aleatorio,
  );

  // ── Etapa 6: atualização pública (vitória, novo loop, mensagem, limpeza) ──
  const atualizacaoPublica = construirAtualizacaoPublica(
    resolucaoInterna,
    ctx,
    novoControleNoite,
    agora,
  );

  return {
    resolucaoInterna,
    atualizacaoPublica,
    patchesPrivados,
    novoControleNoite,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// §14  HELPERS DE CONSULTA E INTROSPECÇÃO (exported)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se um jogador pode submeter ação noturna dado o estado atual.
 *
 * Combina verificação de eliminação + derivação de ações disponíveis.
 * Usado pelo host para validar ações recebidas antes da resolução completa,
 * e pela UI para decidir se exibe o painel de ação noturna ao jogador.
 *
 * @param jogadorId ID do jogador a verificar
 * @param ctx       Contexto atual de resolução
 */
export function jogadorPodeAgirNaNoite(
  jogadorId: PlayerId,
  ctx: ContextoResolucaoHost,
): boolean {
  if (!ctx.estadoPublico.jogadoresAtivos.includes(jogadorId)) return false;

  const privado = ctx.estadosPrivados[jogadorId];
  if (privado === undefined) return false;

  return derivarAcoesNoturnas(privado).length > 0;
}

/**
 * Retorna as ações noturnas disponíveis para um jogador.
 *
 * Wrapper conveniente sobre derivarAcoesNoturnas de types.ts.
 * Usado pela UI do jogador para montar a tela de seleção de ação noturna.
 * O resultado é derivado — nunca persistir.
 *
 * @param jogadorId ID do jogador
 * @param ctx       Contexto atual
 * @returns Ações disponíveis, ou array vazio se jogador não pode agir
 */
export function obterAcoesNaturnaDisponiveis(
  jogadorId: PlayerId,
  ctx: ContextoResolucaoHost,
): readonly TipoAcaoNoturna[] {
  const privado = ctx.estadosPrivados[jogadorId];
  if (privado === undefined) return [];
  return derivarAcoesNoturnas(privado);
}

/**
 * Retorna os IDs de corrompidos ativos (vivos) nesta noite.
 *
 * Intersecção entre corrompidosAtuais (privado do host) e jogadoresAtivos (público).
 * Usado pelo host para lógica interna — NUNCA expor no estado público.
 *
 * @param ctx Contexto atual de resolução
 */
export function obterCorrompidosAtivosVivos(
  ctx: ContextoResolucaoHost,
): readonly PlayerId[] {
  return ctx.controleNoite.corrompidosAtuais.filter((id) =>
    ctx.estadoPublico.jogadoresAtivos.includes(id),
  );
}

/**
 * Verifica se a corrupção está elegível para ocorrer no loop especificado.
 *
 * Verdadeiro quando TODAS as condições são atendidas:
 *   - Intensidade não é 'leve'
 *   - totalCorrupcoes < maxCorrupcoes (limite não atingido)
 *   - proximoLoopDeCorrupcao não é null (ainda há janela agendada)
 *   - loop >= proximoLoopDeCorrupcao (janela aberta)
 *
 * Útil para o host decidir se deve exibir 'contaminar' como opção destacada
 * na UI dos corrompidos. Não expor ao grupo — informação interna.
 *
 * @param ctx  Contexto atual de resolução
 * @param loop Loop atual (normalmenteestadoPublico.loop)
 */
export function corrupcaoElegivelNoLoop(
  ctx: ContextoResolucaoHost,
  loop: number,
): boolean {
  const { controleNoite, estadoPublico } = ctx;
  const { configuracao } = estadoPublico;

  return (
    configuracao.intensidade !== 'leve' &&
    controleNoite.totalCorrupcoes < configuracao.maxCorrupcoes &&
    controleNoite.proximoLoopDeCorrupcao !== null &&
    loop >= controleNoite.proximoLoopDeCorrupcao
  );
}
