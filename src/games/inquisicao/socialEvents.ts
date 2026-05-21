/**
 * INQUISIÇÃO — BANCO DE EVENTOS SOCIAIS
 *
 * Contém o banco editorial completo de eventos sociais do Inquisição,
 * o algoritmo de seleção com anti-repetição e alternância de categoria,
 * e funções de probabilidade para o engine decidir quando emitir.
 *
 * ─── Filosofia ───────────────────────────────────────────────────────────────
 *
 * Eventos NÃO são mecânicas. São perturbações.
 * Uma perturbação não resolve nada — cria a situação que o grupo vai resolver.
 *
 * Teste de validação editorial para qualquer evento:
 *   "isso faz pelo menos dois jogadores se olharem?"
 *   "isso parece observação ou parece sistema?"
 *   "isso criaria interpretação ou seria ignorado?"
 *
 * ─── Separação de responsabilidades ─────────────────────────────────────────
 *
 * Este módulo:
 *   ✓ armazena o banco de templates de eventos
 *   ✓ seleciona o melhor evento dado um contexto
 *   ✓ calcula a probabilidade de emitir um evento (pacing editorial)
 *
 * NÃO é responsabilidade deste módulo:
 *   ✗ decidir QUANDO emitir (engine usa as funções de probabilidade)
 *   ✗ decidir PARA QUAL jogador enviar evento privado (engine decide)
 *   ✗ escrever no Firebase (service layer decide)
 *
 * ─── Tracking de uso ─────────────────────────────────────────────────────────
 *
 * O engine é responsável por manter `idsTemplatesUsados` persistido.
 * Sugestão: armazenar em /noiteControle/eventosTemplatesUsados ou em memória.
 * Se o host reconectar e perder o Set, eventos podem repetir — aceitável.
 */

import type {
  CategoriaEvento,
  EventoPrivado,
  EventoPublico,
  IntensidadeInquisicao,
} from '@/games/inquisicao/types';

// Banco canônico de templates — fonte única de verdade para todos os eventos da partida.
// socialEvents.ts mantém a lógica de seleção; eventos.ts mantém os dados editoriais.
import { BANCO_PUBLICO, BANCO_PRIVADO } from '@/games/inquisicao/eventos';

// ─────────────────────────────────────────────────────────────────────────────
// §1  TIPOS INTERNOS DO BANCO
// ─────────────────────────────────────────────────────────────────────────────

/** Raridade editorial de um evento. Afeta a frequência de seleção. */
export type RaridadeEvento = 'comum' | 'incomum' | 'raro';

/**
 * Template de evento público — base para criação de EventoPublico em runtime.
 *
 * Diferença de EventoPublico (types.ts):
 *   - Template: entidade do banco, sem loop/timestamp (design time)
 *   - EventoPublico: instância em runtime, com loop/timestamp (runtime)
 */
export interface EventoPublicoTemplate {
  /** ID único do template. Usado para rastrear eventos já usados no jogo. */
  readonly id: string;

  /** Categoria emocional. 'informacao_parcial' NUNCA aparece em templates públicos. */
  readonly categoria: Exclude<CategoriaEvento, 'informacao_parcial'>;

  /**
   * Texto do evento. Regras editoriais:
   *   - Sempre minúsculas (nunca capitalizar)
   *   - 2–7 palavras (máximo absoluto: 9)
   *   - Ambíguo: interpretável de formas diferentes
   *   - Observação social, não instrução de sistema
   *   - Deve passar o teste do olhar: "alguém vai olhar pro lado?"
   */
  readonly texto: string;

  readonly raridade: RaridadeEvento;

  /**
   * Loop mínimo para este evento ser elegível.
   * 1 = disponível desde o início.
   * 2+ = requer contexto emocional estabelecido.
   */
  readonly loopMinimo: number;
}

/** Template de evento privado — base para EventoPrivado em runtime. */
export interface EventoPrivadoTemplate {
  readonly id: string;
  readonly categoria: 'informacao_parcial'; // sempre
  readonly texto: string; // endereçado em segunda pessoa: "você..."
  readonly raridade: RaridadeEvento;
  readonly loopMinimo: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  BANCO DE EVENTOS PÚBLICOS — importado de eventos.ts
//
// O banco canônico vive em eventos.ts (35 templates calibrados em v3).
// Este módulo importa BANCO_PUBLICO acima e aplica a lógica de seleção abaixo.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// §3  BANCO DE EVENTOS PRIVADOS — importado de eventos.ts
//
// O banco canônico vive em eventos.ts (9 templates calibrados em v3).
// Este módulo importa BANCO_PRIVADO acima e aplica a lógica de seleção abaixo.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// §4  PESOS DE RARIDADE E CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pesos de seleção por raridade.
 *
 * Proporção: comum sai 4x mais que incomum, 9x mais que raro.
 * Raro: pode ainda aparecer, mas a seleção ponderada tende a evitá-lo.
 * O limite de 2 raros por partida é a proteção adicional (§5).
 */
const PESOS_RARIDADE: Readonly<Record<RaridadeEvento, number>> = {
  comum:   9,
  incomum: 4,
  raro:    1,
};

/**
 * Fator de redução de peso quando a categoria coincide com a última usada.
 * 0.15 = redução de ~85% — fortemente desencorajado, mas não impossível.
 * Mantém leve possibilidade de repetição de categoria para casos em que
 * o pool de categorias disponíveis é muito restrito.
 */
const FATOR_REDUCAO_CATEGORIA_REPETIDA = 0.15;

/**
 * Máximo de eventos raros por partida (público + privado combinados).
 * Raros perdem impacto emocional se aparecerem mais de 2 vezes.
 */
const MAX_RAROS_POR_PARTIDA = 2;

// ─────────────────────────────────────────────────────────────────────────────
// §5  CONTEXTO DE SELEÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contexto fornecido pelo engine para seleção de evento público.
 *
 * O engine é responsável por manter idsTemplatesUsados persistido
 * entre loops. Sugestão: manter em memória no host ou em /noiteControle.
 */
export interface ContextoSelecaoPublico {
  /** Loop atual da partida (1-indexed). */
  readonly loop: number;

  /**
   * IDs de templates já selecionados nesta partida (públicos + privados).
   * Previne repetição do mesmo texto ao longo do jogo.
   * Exemplo: new Set(['sus-hesitou', 'prv-ouviu'])
   */
  readonly idsTemplatesUsados: ReadonlySet<string>;

  /**
   * Categoria do último evento público emitido.
   * null = nenhum evento público ainda.
   * Usado para alternância soft de categoria.
   */
  readonly ultimaCategoriaPublica: Exclude<CategoriaEvento, 'informacao_parcial'> | null;

  readonly intensidade: IntensidadeInquisicao;
}

/**
 * Contexto para seleção de evento privado.
 * Subconjunto de ContextoSelecaoPublico — privados não dependem de categoria anterior.
 */
export interface ContextoSelecaoPrivado {
  readonly loop: number;
  readonly idsTemplatesUsados: ReadonlySet<string>;
  readonly intensidade: IntensidadeInquisicao;
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  RESULTADO DE SELEÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resultado de uma seleção de evento.
 *
 * O engine usa:
 *   - resultado.evento → escrever em Firebase (/estado/eventoAtivo ou /privados/{id}/eventoPrivado)
 *   - resultado.templateId → adicionar a idsTemplatesUsados para anti-repetição
 */
export interface ResultadoSelecao<TEvento> {
  /** Evento pronto para escrita no Firebase. */
  readonly evento: TEvento;

  /**
   * ID do template usado — deve ser adicionado a idsTemplatesUsados pelo engine.
   * É o id do EventoPublicoTemplate ou EventoPrivadoTemplate, não o id do evento em runtime.
   */
  readonly templateId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  ALGORITMO DE SELEÇÃO INTERNA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seleciona um item de forma aleatória ponderada.
 *
 * Algoritmo: roleta ponderada com fallback de float.
 * Se todos os pesos forem 0, retorna null.
 */
function selecionarPonderado<T>(
  candidatos: ReadonlyArray<{ readonly item: T; readonly peso: number }>,
): T | null {
  const pesoTotal = candidatos.reduce((soma, c) => soma + c.peso, 0);
  if (pesoTotal <= 0) return null;

  let alvo = Math.random() * pesoTotal;
  for (const c of candidatos) {
    alvo -= c.peso;
    if (alvo <= 0) return c.item;
  }

  // Fallback: imprecisão de float — retornar último item com peso > 0
  for (let i = candidatos.length - 1; i >= 0; i--) {
    const c = candidatos[i];
    if (c !== undefined && c.peso > 0) return c.item;
  }
  return null;
}

/**
 * Conta quantos templates raros já foram usados nesta partida.
 * Combina banco público + privado para limite global.
 */
function contarRariosUsados(idsTemplatesUsados: ReadonlySet<string>): number {
  let count = 0;
  for (const id of idsTemplatesUsados) {
    const template =
      BANCO_PUBLICO.find((t) => t.id === id) ??
      BANCO_PRIVADO.find((t) => t.id === id);
    if (template?.raridade === 'raro') count++;
  }
  return count;
}

/**
 * Calcula o peso de seleção de um template público dado o contexto.
 *
 * Regras:
 *   1. Templates usados → peso 0 (anti-repetição absoluta)
 *   2. loopMinimo > loop → peso 0 (não elegível ainda)
 *   3. Raro com limite atingido → peso 0
 *   4. Mesma categoria que a última → redução de 85%
 */
function calcularPesoPublico(
  template: EventoPublicoTemplate,
  ctx: ContextoSelecaoPublico,
  rariosUsados: number,
): number {
  if (ctx.idsTemplatesUsados.has(template.id)) return 0;
  if (template.loopMinimo > ctx.loop) return 0;
  if (template.raridade === 'raro' && rariosUsados >= MAX_RAROS_POR_PARTIDA) return 0;

  let peso = PESOS_RARIDADE[template.raridade];

  if (template.categoria === ctx.ultimaCategoriaPublica) {
    peso *= FATOR_REDUCAO_CATEGORIA_REPETIDA;
  }

  return peso;
}

/**
 * Calcula o peso de seleção de um template privado dado o contexto.
 */
function calcularPesoPrivado(
  template: EventoPrivadoTemplate,
  idsTemplatesUsados: ReadonlySet<string>,
  loop: number,
  rariosUsados: number,
): number {
  if (idsTemplatesUsados.has(template.id)) return 0;
  if (template.loopMinimo > loop) return 0;
  if (template.raridade === 'raro' && rariosUsados >= MAX_RAROS_POR_PARTIDA) return 0;

  return PESOS_RARIDADE[template.raridade];
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  API PÚBLICA — SELEÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seleciona o melhor evento público dado o contexto atual da partida.
 *
 * Aplica:
 *   - Anti-repetição: nunca o mesmo template duas vezes
 *   - Filtro de loopMinimo: respeita maturidade emocional da partida
 *   - Limite de raros: máximo 2 raros (público + privado) por partida
 *   - Alternância suave de categoria: fortemente desencorajado repetir a última
 *   - Seleção ponderada: comuns aparecem ~9x mais que raros
 *
 * @returns ResultadoSelecao<EventoPublico> para escrita em Firebase e tracking,
 *          ou null se nenhum template elegível existe.
 */
export function selecionarEventoPublico(
  ctx: ContextoSelecaoPublico,
  agora: number,
): ResultadoSelecao<EventoPublico> | null {
  const rariosUsados = contarRariosUsados(ctx.idsTemplatesUsados);

  const candidatos = BANCO_PUBLICO.map((template) => ({
    item: template,
    peso: calcularPesoPublico(template, ctx, rariosUsados),
  }));

  const selecionado = selecionarPonderado(candidatos);
  if (!selecionado) return null;

  const evento: EventoPublico = {
    id: `${ctx.loop}-${selecionado.id}-${agora}`,
    categoria: selecionado.categoria,
    texto: selecionado.texto,
    loop: ctx.loop,
    exibidoEm: agora,
  };

  return { evento, templateId: selecionado.id };
}

/**
 * Seleciona um evento privado dado o contexto atual.
 *
 * Nota: o engine decide PARA QUAL jogador entregar — não é responsabilidade
 * deste módulo. Este módulo retorna apenas o conteúdo do evento.
 *
 * @returns ResultadoSelecao<EventoPrivado> ou null se nenhum template elegível.
 */
export function selecionarEventoPrivado(
  ctx: ContextoSelecaoPrivado,
  agora: number,
): ResultadoSelecao<EventoPrivado> | null {
  const rariosUsados = contarRariosUsados(ctx.idsTemplatesUsados);

  const candidatos = BANCO_PRIVADO.map((template) => ({
    item: template,
    peso: calcularPesoPrivado(
      template,
      ctx.idsTemplatesUsados,
      ctx.loop,
      rariosUsados,
    ),
  }));

  const selecionado = selecionarPonderado(candidatos);
  if (!selecionado) return null;

  const evento: EventoPrivado = {
    id: `${ctx.loop}-${selecionado.id}-${agora}`,
    categoria: 'informacao_parcial',
    texto: selecionado.texto,
    loop: ctx.loop,
    exibidoEm: agora,
    lido: false,
  };

  return { evento, templateId: selecionado.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  PROBABILIDADES DE EMISSÃO
//
// O engine chama estas funções para decidir se deve emitir um evento.
// São decisões editoriais de pacing — centralizadas aqui por serem parte
// da filosofia do banco, não da lógica do engine.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Probabilidade de emitir um evento PÚBLICO neste loop.
 *
 * Filosofia de pacing:
 *   Loop 1: sempre (1.0) — plantar primeira semente de suspeita
 *   Loop 2–3: frequente (~0.75–0.80)
 *   Loop 4–5: moderado (~0.55–0.65) — grupo gera paranoia própria
 *   Loop 6+: reduzido (~0.40) — colapso social dispensa provocação
 *
 * Paranoia recebe redução extra: o grupo em paranoia gera tensão orgânica.
 * Eventos frequentes competem com a tensão real e a enfraquecem.
 *
 * totalEventosPublicosUsados: guard contra spam em games muito longos.
 *
 * @returns probabilidade entre 0.0 e 1.0 — caller usa Math.random() < resultado
 */
export function calcularProbabilidadeEventoPublico(
  loop: number,
  intensidade: IntensidadeInquisicao,
  totalEventosPublicosUsados: number,
): number {
  // Loop 1: sempre emite — sem semente inicial, sem paranoia inicial
  if (loop === 1) return 1.0;

  // Probabilidade base por loop
  const BASE_POR_LOOP: Readonly<Record<number, number>> = {
    2: 0.80,
    3: 0.75,
    4: 0.65,
    5: 0.55,
    6: 0.50,
    7: 0.45,
    8: 0.40,
  };
  const base = BASE_POR_LOOP[loop] ?? 0.35;

  // Modificador de intensidade
  const MOD_INTENSIDADE: Readonly<Record<IntensidadeInquisicao, number>> = {
    leve:    1.00, // sem redução — grupo pode precisar de mais provocação
    padrao:  0.95,
    paranoia: 0.80, // grupo gera paranoia própria — menos intervenção
  };

  // Moderador de densidade: eventos demais diminuem o peso de cada um
  const modDensidade = totalEventosPublicosUsados >= 5 ? 0.75 : 1.0;

  return Math.min(1.0, base * MOD_INTENSIDADE[intensidade] * modDensidade);
}

/**
 * Probabilidade de emitir um evento PRIVADO neste loop.
 *
 * Filosofia:
 *   Leve: nunca (0.0) — sem corrupção nem assimetria de informação
 *   Padrão: máximo 1 evento privado por partida, melhor nos loops 2–4
 *   Paranoia: máximo 2, com probabilidade levemente maior
 *
 * eventosPrivadosJaUsados: contador de eventos privados desta partida.
 * Quando atingir o limite, retorna 0.
 *
 * @returns probabilidade entre 0.0 e 1.0
 */
export function calcularProbabilidadeEventoPrivado(
  loop: number,
  intensidade: IntensidadeInquisicao,
  eventosPrivadosJaUsados: number,
): number {
  // Leve: sem eventos privados — a mecânica de assimetria não existe neste modo
  if (intensidade === 'leve') return 0.0;

  // Limite por intensidade
  const maxPrivados = intensidade === 'paranoia' ? 2 : 1;
  if (eventosPrivadosJaUsados >= maxPrivados) return 0.0;

  // Primeiro loop: sem contexto emocional estabelecido
  if (loop < 2) return 0.0;

  // Janela ideal: loops 2–4 (grupo já tem alianças que a assimetria pode quebrar)
  const probabilidadeBase = loop <= 4 ? 0.35 : 0.15;

  const MOD_INTENSIDADE: Readonly<Record<IntensidadeInquisicao, number>> = {
    leve:    0.00, // já tratado acima
    padrao:  1.00,
    paranoia: 1.30, // paranoia incentiva mais assimetria de informação
  };

  return Math.min(1.0, probabilidadeBase * MOD_INTENSIDADE[intensidade]);
}

// ─────────────────────────────────────────────────────────────────────────────
// §10  HELPERS DE CONSULTA E INTROSPECÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna todos os templates públicos elegíveis dado o loop e templates usados.
 * Útil para testes, debugging e verificação de pool disponível.
 */
export function obterTemplatesPublicosElegiveis(
  loop: number,
  idsTemplatesUsados: ReadonlySet<string>,
): readonly EventoPublicoTemplate[] {
  return BANCO_PUBLICO.filter(
    (t) => !idsTemplatesUsados.has(t.id) && t.loopMinimo <= loop,
  );
}

/**
 * Retorna todos os templates privados elegíveis dado o loop e templates usados.
 */
export function obterTemplatesPrivadosElegiveis(
  loop: number,
  idsTemplatesUsados: ReadonlySet<string>,
): readonly EventoPrivadoTemplate[] {
  return BANCO_PRIVADO.filter(
    (t) => !idsTemplatesUsados.has(t.id) && t.loopMinimo <= loop,
  );
}

/**
 * Retorna o total de eventos no banco.
 * Útil para validar em testes que o banco tem o mínimo esperado.
 */
export function obterTotalDoBanco(): { publicos: number; privados: number; total: number } {
  return {
    publicos: BANCO_PUBLICO.length,
    privados: BANCO_PRIVADO.length,
    total: BANCO_PUBLICO.length + BANCO_PRIVADO.length,
  };
}

/**
 * Retorna o template pelo ID.
 * Null se não encontrado.
 * Útil para o engine reconstruir o contexto de um evento já emitido.
 */
export function obterTemplatePorId(
  id: string,
): EventoPublicoTemplate | EventoPrivadoTemplate | null {
  return (
    BANCO_PUBLICO.find((t) => t.id === id) ??
    BANCO_PRIVADO.find((t) => t.id === id) ??
    null
  );
}
