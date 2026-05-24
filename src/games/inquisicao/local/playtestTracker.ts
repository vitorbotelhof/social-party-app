/**
 * INQUISIÇÃO LOCAL — PLAYTEST TRACKER
 *
 * Coleta métricas silenciosas durante a partida para análise pós-jogo.
 * Invisível durante o gameplay. Ativo apenas em __DEV__.
 *
 * Dados coletados:
 *   — Timestamps de início/fim de cada fase, por loop
 *   — Qualidade da noite (ação registrada, bloqueio, contaminação)
 *   — Qualidade da votação (falsos positivos = inocentes eliminados)
 *   — Duração total e por loop
 *   — Recomendações acionáveis para calibragem após playtest
 *
 * Hipóteses validadas:
 *   H1 — Noite imperceptível: duração total noite+leitura < 45s
 *   H2 — Discussão orgânica: dia médio > 45s
 *   H3 — Ação noturna frequente: corrompido age em >70% dos loops
 *   H4 — Paranoia equilibrada: 25%–65% de eliminações são inocentes
 *   H5 — Duração de festa: partida entre 10–30 minutos
 *   H6 — Votação sem delay: host decide em <30s após "apontar"
 *   H7 — Corrupção calibrada: conversões existem sem dominar a partida
 */

import type { FaseLocal, ModoLocal } from './types';
import type { LoopLocalResolvido, ResultadoLocalFinalizado } from './types';
import type { EstadoLocalPublico } from './types';

// ─── Tipos internos de coleta ─────────────────────────────────────────────────

interface PhaseEntry {
  fase: FaseLocal;
  loop: number;
  startMs: number;
  durationMs: number | null;
}

interface NightLoopData {
  loop: number;
  corrompidoAgiu: boolean;
  bloqueado: boolean;
  contaminacao: boolean;
  eliminarAlvoId: string | null;
  eliminadoId: string | null;
  eliminadoEraPapel: string | null;
}

// ─── Tipos do relatório público ───────────────────────────────────────────────

export interface LoopRelatorio {
  numero: number;
  /** Duração total do loop (ms). Null se loop interrompido por fim de jogo. */
  duracaoTotalMs: number | null;
  /** Duração da fase de discussão (dia). */
  duracaoDiaMs: number | null;
  /** Tempo entre "apontar" e o host selecionar o eliminado. */
  duracaoVotacaoMs: number | null;
  /** Duração da noite (corrompidos + guardiões, com handoff manual). */
  duracaoNoiteMs: number | null;
  /** Tempo que o host ficou na tela de mensagem antes de continuar. */
  duracaoMensagemMs: number | null;
  /** Corrompido registrou ação durante a microfase. */
  corrompidoAgiu: boolean | null;
  /** Guardião bloqueou a ação do corrompido. */
  bloqueioGuardiao: boolean | null;
  /** Houve contaminação registrada neste loop. */
  contaminacao: boolean | null;
  /** Eliminado por votação neste loop. */
  eliminadoId: string | null;
  /** Papel do eliminado (para detectar falsos positivos). */
  eliminadoEraPapel: string | null;
}

export type StatusHipotese =
  | 'validada'
  | 'alerta'
  | 'refutada'
  | 'inconclusiva';

export interface HipoteseResult {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusHipotese;
  /** Valor medido. Ex: "47.3s" ou "62%". */
  valorMedido: string;
  /** O que seria esperado. */
  esperado: string;
}

export interface RecomendacaoPlaytest {
  id: string;
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  acao: string;
  motivo: string;
}

export interface Metricas {
  duracaoTotalMs: number;
  totalLoops: number;
  duracaoMediaLoopMs: number;
  duracaoMediaDiaMs: number;
  duracaoMediaVotacaoMs: number;
  /** Média da fase noite (corrompidos + guardiões). */
  duracaoMediaNoiteMs: number;
  /** Média do tempo de leitura da mensagem pelo host. */
  duracaoMediaMensagemMs: number;
  /** Proporção de loops onde corrompido agiu (0–1). */
  taxaAcaoNoturna: number;
  /** Proporção de eliminações de inocentes/guardiões (0–1). */
  taxaFalsosPositivos: number;
  /** Loops com dia > 5 minutos (sinal de tempo morto). */
  loopsComDiaLongo: number;
  /** Loops sem ação noturna registrada. */
  loopsSemAcao: number;
  /** Loops com contaminação. */
  loopsComContaminacao: number;
  /** Proporção de loops noturnos com contaminação (0–1). */
  taxaContaminacao: number;
}

export interface PlaytestReport {
  versao: '1.1';
  geradoEm: number;
  modo: ModoLocal;
  numJogadores: number;
  vencedor: 'inocentes' | 'corrompidos' | null;
  loops: LoopRelatorio[];
  metricas: Metricas;
  hipoteses: HipoteseResult[];
  /** Anomalias detectadas — descrições em texto para o facilitador. */
  anomalias: string[];
  /** Recomendações acionáveis para a próxima iteração de design. */
  recomendacoes: RecomendacaoPlaytest[];
}

// ─── Tracker ──────────────────────────────────────────────────────────────────

export class PlaytestTracker {
  private readonly _modo: ModoLocal;
  private readonly _numJogadores: number;
  private readonly _inicioJogoMs: number;

  private _fases: PhaseEntry[] = [];
  private _nightData: Map<number, NightLoopData> = new Map();
  private _faseAtual: FaseLocal | null = null;

  private _vencedor: 'inocentes' | 'corrompidos' | null = null;
  private _report: PlaytestReport | null = null;

  constructor(numJogadores: number, modo: ModoLocal) {
    this._numJogadores = numJogadores;
    this._modo = modo;
    this._inicioJogoMs = Date.now();
  }

  // ── Hooks chamados pelo orquestrador ──────────────────────────────────────

  onEstadoMudou(estado: EstadoLocalPublico): void {
    const novaFase = estado.fase;
    if (novaFase === this._faseAtual) return;

    const agora = Date.now();

    // Fechar fase anterior
    if (this._faseAtual !== null && this._fases.length > 0) {
      const ultima = this._fases[this._fases.length - 1];
      if (ultima && ultima.durationMs === null) {
        ultima.durationMs = agora - ultima.startMs;
      }
    }

    // Abrir nova fase
    this._fases.push({
      fase: novaFase,
      loop: estado.loop,
      startMs: agora,
      durationMs: null,
    });

    this._faseAtual = novaFase;
  }

  onLoopResolvido(loop: LoopLocalResolvido): void {
    this._nightData.set(loop.loop, {
      loop: loop.loop,
      corrompidoAgiu:
        loop.eliminarAlvoId !== null || loop.contaminados.length > 0,
      bloqueado: loop.eliminarBloqueado,
      contaminacao: loop.contaminados.length > 0,
      eliminarAlvoId: loop.eliminarAlvoId,
      eliminadoId: loop.eliminadoId,
      eliminadoEraPapel: loop.eliminadoEraPapel,
    });
  }

  onJogoFinalizado(resultado: ResultadoLocalFinalizado): void {
    this._vencedor = resultado.vencedor;

    // Fechar última fase aberta
    const agora = Date.now();
    const ultima = this._fases[this._fases.length - 1];
    if (ultima && ultima.durationMs === null) {
      ultima.durationMs = agora - ultima.startMs;
    }

    this._report = this._gerarRelatorio();
  }

  getReport(): PlaytestReport | null {
    return this._report;
  }

  // ── Geração de relatório ──────────────────────────────────────────────────

  private _gerarRelatorio(): PlaytestReport {
    const duracaoTotalMs = Date.now() - this._inicioJogoMs;
    const loops = this._gerarLoops();
    const metricas = this._calcularMetricas(loops, duracaoTotalMs);
    const hipoteses = this._avaliarHipoteses(metricas, loops);
    const anomalias = this._detectarAnomalias(loops, metricas);
    const recomendacoes = this._gerarRecomendacoes(
      metricas,
      hipoteses,
      anomalias,
    );

    return {
      versao: '1.1',
      geradoEm: Date.now(),
      modo: this._modo,
      numJogadores: this._numJogadores,
      vencedor: this._vencedor,
      loops,
      metricas,
      hipoteses,
      anomalias,
      recomendacoes,
    };
  }

  private _gerarLoops(): LoopRelatorio[] {
    // Agrupar fases por loop
    const fasesPorLoop = new Map<number, PhaseEntry[]>();

    for (const fase of this._fases) {
      const existentes = fasesPorLoop.get(fase.loop) ?? [];
      existentes.push(fase);
      fasesPorLoop.set(fase.loop, existentes);
    }

    const relatorios: LoopRelatorio[] = [];

    for (const [num, fasesDoLoop] of fasesPorLoop) {
      const get = (f: FaseLocal) =>
        fasesDoLoop.find((e) => e.fase === f)?.durationMs ?? null;

      const nightData = this._nightData.get(num) ?? null;

      // Duração total do loop = soma de todas as fases
      const duracoes = fasesDoLoop.map((e) => e.durationMs ?? 0);
      const duracaoTotalMs = duracoes.reduce((a, b) => a + b, 0) || null;

      // Noite = microfase dos corrompidos + microfase dos guardiões.
      const dCorr = get('noite_corrompidos');
      const dGuar = get('noite_guardioes');
      const duracaoNoiteMs =
        dCorr !== null && dGuar !== null ? dCorr + dGuar : null;

      relatorios.push({
        numero: num,
        duracaoTotalMs,
        duracaoDiaMs: get('dia'),
        duracaoVotacaoMs: get('chamando_votacao'),
        duracaoNoiteMs,
        duracaoMensagemMs: get('encerrando_noite'),
        corrompidoAgiu: nightData?.corrompidoAgiu ?? null,
        bloqueioGuardiao: nightData?.bloqueado ?? null,
        contaminacao: nightData?.contaminacao ?? null,
        eliminadoId: nightData?.eliminadoId ?? null,
        eliminadoEraPapel: nightData?.eliminadoEraPapel ?? null,
      });
    }

    return relatorios.sort((a, b) => a.numero - b.numero);
  }

  private _calcularMetricas(
    loops: LoopRelatorio[],
    duracaoTotalMs: number,
  ): Metricas {
    const media = (arr: (number | null)[]): number => {
      const vals = arr.filter((v): v is number => v !== null && v > 0);
      return vals.length === 0
        ? 0
        : vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    const totalLoops = loops.length;

    const loopsComNocao = loops.filter((l) => l.duracaoNoiteMs !== null);
    const loopsComEliminado = loops.filter((l) => l.eliminadoId !== null);
    const falsosPositivos = loopsComEliminado.filter(
      (l) =>
        l.eliminadoEraPapel === 'inocente' ||
        l.eliminadoEraPapel === 'guardiao',
    ).length;

    const loopsComAcao = loops.filter(
      (l) => l.corrompidoAgiu === true && l.duracaoNoiteMs !== null,
    ).length;
    const loopsComContaminacao = loops.filter(
      (l) => l.contaminacao === true,
    ).length;

    return {
      duracaoTotalMs,
      totalLoops,
      duracaoMediaLoopMs: media(loops.map((l) => l.duracaoTotalMs)),
      duracaoMediaDiaMs: media(loops.map((l) => l.duracaoDiaMs)),
      duracaoMediaVotacaoMs: media(loops.map((l) => l.duracaoVotacaoMs)),
      duracaoMediaNoiteMs: media(loopsComNocao.map((l) => l.duracaoNoiteMs)),
      duracaoMediaMensagemMs: media(loops.map((l) => l.duracaoMensagemMs)),
      taxaAcaoNoturna:
        loopsComNocao.length === 0 ? 0 : loopsComAcao / loopsComNocao.length,
      taxaFalsosPositivos:
        loopsComEliminado.length === 0
          ? 0
          : falsosPositivos / loopsComEliminado.length,
      loopsComDiaLongo: loops.filter((l) => (l.duracaoDiaMs ?? 0) > 300_000)
        .length,
      loopsSemAcao: loopsComNocao.filter((l) => l.corrompidoAgiu === false)
        .length,
      loopsComContaminacao,
      taxaContaminacao:
        loopsComNocao.length === 0
          ? 0
          : loopsComContaminacao / loopsComNocao.length,
    };
  }

  private _avaliarHipoteses(
    m: Metricas,
    loops: LoopRelatorio[],
  ): HipoteseResult[] {
    const s = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
    const p = (r: number) => `${(r * 100).toFixed(0)}%`;
    const min = (ms: number) => `${(ms / 60_000).toFixed(1)}min`;

    const hipoteses: HipoteseResult[] = [];

    // H1 — Noite imperceptível
    // Esperado: handoff + ação + leitura ainda parecem rápidos.
    const totalNoiteMs = m.duracaoMediaNoiteMs + m.duracaoMediaMensagemMs;
    hipoteses.push({
      id: 'H1',
      titulo: 'Noite imperceptível',
      descricao: 'A transição noturna não quebra o ritmo social.',
      status:
        totalNoiteMs === 0
          ? 'inconclusiva'
          : totalNoiteMs < 45_000
            ? 'validada'
            : totalNoiteMs < 70_000
              ? 'alerta'
              : 'refutada',
      valorMedido:
        totalNoiteMs === 0
          ? '—'
          : `${s(m.duracaoMediaNoiteMs)} noite + ${s(m.duracaoMediaMensagemMs)} leitura`,
      esperado: 'handoff + ação + leitura <45s',
    });

    // H2 — Discussão orgânica
    // Esperado: dia médio > 45s (grupo realmente discute antes de apontar)
    hipoteses.push({
      id: 'H2',
      titulo: 'Discussão orgânica',
      descricao: 'O grupo discute sem depender do celular.',
      status:
        m.duracaoMediaDiaMs === 0
          ? 'inconclusiva'
          : m.duracaoMediaDiaMs > 45_000
            ? 'validada'
            : m.duracaoMediaDiaMs > 20_000
              ? 'alerta'
              : 'refutada',
      valorMedido: m.duracaoMediaDiaMs === 0 ? '—' : s(m.duracaoMediaDiaMs),
      esperado: '>45s de discussão por loop',
    });

    // H3 — Ação noturna frequente
    // Esperado: corrompido age em >70% dos loops (mecânica está fluindo)
    hipoteses.push({
      id: 'H3',
      titulo: 'Noite produtiva',
      descricao: 'Corrompido consegue agir sem travar a passagem do celular.',
      status:
        m.taxaAcaoNoturna === 0 && loops.every((l) => l.duracaoNoiteMs === null)
          ? 'inconclusiva'
          : m.taxaAcaoNoturna >= 0.7
            ? 'validada'
            : m.taxaAcaoNoturna >= 0.5
              ? 'alerta'
              : 'refutada',
      valorMedido: p(m.taxaAcaoNoturna),
      esperado: '>70% dos loops com ação registrada',
    });

    // H4 — Paranoia equilibrada
    // Esperado: 25%–65% dos eliminados são inocentes (tensão sem injustiça)
    hipoteses.push({
      id: 'H4',
      titulo: 'Paranoia equilibrada',
      descricao:
        'Eliminações erradas indicam tensão real, mas não desequilíbrio.',
      status: loops.every((l) => l.eliminadoId === null)
        ? 'inconclusiva'
        : m.taxaFalsosPositivos >= 0.25 && m.taxaFalsosPositivos <= 0.65
          ? 'validada'
          : m.taxaFalsosPositivos < 0.15
            ? 'alerta' // grupo muito certeiro = sem tensão
            : m.taxaFalsosPositivos > 0.8
              ? 'alerta' // grupo perdido = frustração
              : 'alerta',
      valorMedido: p(m.taxaFalsosPositivos),
      esperado: '25%–65% de inocentes eliminados',
    });

    // H5 — Duração de festa
    // Esperado: 10–30 minutos (nem curto demais nem longo demais)
    hipoteses.push({
      id: 'H5',
      titulo: 'Duração de festa',
      descricao: 'A partida cabe numa sessão social sem desgastar.',
      status:
        m.duracaoTotalMs < 600_000
          ? 'alerta' // <10min = muito curto
          : m.duracaoTotalMs <= 1_800_000
            ? 'validada' // 10-30min = ideal
            : m.duracaoTotalMs <= 2_700_000
              ? 'alerta' // 30-45min = longo
              : 'refutada', // >45min = desgasta
      valorMedido: min(m.duracaoTotalMs),
      esperado: '10–30 minutos',
    });

    // H6 — Votação sem delay
    // Esperado: host decide em <30s após "apontar" (apontamento físico é rápido)
    hipoteses.push({
      id: 'H6',
      titulo: 'Votação sem delay',
      descricao: 'Host registra o eliminado rapidamente após o apontamento.',
      status:
        m.duracaoMediaVotacaoMs === 0
          ? 'inconclusiva'
          : m.duracaoMediaVotacaoMs < 15_000
            ? 'validada'
            : m.duracaoMediaVotacaoMs < 30_000
              ? 'alerta'
              : 'refutada',
      valorMedido:
        m.duracaoMediaVotacaoMs === 0 ? '—' : s(m.duracaoMediaVotacaoMs),
      esperado: '<15s entre apontar e registrar eliminado',
    });

    // H7 — Corrupção calibrada
    // Esperado: conversões aparecem, mas não tornam dedução inútil.
    hipoteses.push({
      id: 'H7',
      titulo: 'Corrupção calibrada',
      descricao: 'A corrupção muda alianças sem parecer aleatória demais.',
      status:
        this._modo === 'leve'
          ? m.loopsComContaminacao === 0
            ? 'validada'
            : 'refutada'
          : m.taxaContaminacao === 0
            ? 'alerta'
            : m.taxaContaminacao <= 0.4
              ? 'validada'
              : m.taxaContaminacao <= 0.65
                ? 'alerta'
                : 'refutada',
      valorMedido:
        this._modo === 'leve'
          ? `${m.loopsComContaminacao} contaminações`
          : `${p(m.taxaContaminacao)} das noites`,
      esperado:
        this._modo === 'leve'
          ? '0 contaminações no modo leve'
          : '1–40% das noites com contaminação',
    });

    return hipoteses;
  }

  private _detectarAnomalias(loops: LoopRelatorio[], m: Metricas): string[] {
    const anomalias: string[] = [];

    // Loops sem noite (jogo muito curto)
    if (loops.every((l) => l.duracaoNoiteMs === null)) {
      anomalias.push(
        'Nenhum loop chegou à fase noturna. Verifique o fluxo de votação.',
      );
    }

    // Dia muito curto em todos os loops
    const diasValidos = loops.filter((l) => (l.duracaoDiaMs ?? 0) > 0);
    if (diasValidos.length > 0 && m.duracaoMediaDiaMs < 10_000) {
      anomalias.push(
        `Dia médio muito curto (${(m.duracaoMediaDiaMs / 1000).toFixed(0)}s). ` +
          'O grupo votou sem discussão real.',
      );
    }

    // Loops com dia longo demais
    if (m.loopsComDiaLongo > 0) {
      anomalias.push(
        `${m.loopsComDiaLongo} loop(s) com discussão >5min. ` +
          'Energia caiu ou grupo ficou travado.',
      );
    }

    // Corrompido nunca agiu
    if (
      m.taxaAcaoNoturna < 0.3 &&
      loops.some((l) => l.duracaoNoiteMs !== null)
    ) {
      anomalias.push(
        `Corrompido agiu em apenas ${(m.taxaAcaoNoturna * 100).toFixed(0)}% das noites. ` +
          'O protocolo de passagem pode estar confuso ou discreto demais.',
      );
    }

    // Mensagem muito longa
    if (m.duracaoMediaMensagemMs > 20_000) {
      anomalias.push(
        `Host levou em média ${(m.duracaoMediaMensagemMs / 1000).toFixed(0)}s na tela de mensagem. ` +
          'Está esperando algo ou a mensagem está confusa.',
      );
    }

    // Jogo com 1 único loop
    if (loops.length === 1) {
      anomalias.push(
        'Jogo durou apenas 1 loop. Pode indicar desequilíbrio severo de papéis.',
      );
    }

    // Sem eliminações
    if (loops.every((l) => l.eliminadoId === null)) {
      anomalias.push(
        'Nenhum jogador foi eliminado por votação. Votação física pode não ter funcionado.',
      );
    }

    return anomalias;
  }

  private _gerarRecomendacoes(
    m: Metricas,
    hipoteses: HipoteseResult[],
    anomalias: string[],
  ): RecomendacaoPlaytest[] {
    const recomendacoes: RecomendacaoPlaytest[] = [];
    const buscar = (id: string) => hipoteses.find((h) => h.id === id);
    const adicionar = (rec: Omit<RecomendacaoPlaytest, 'id'>): void => {
      recomendacoes.push({
        id: `R${recomendacoes.length + 1}`,
        ...rec,
      });
    };

    const noite = buscar('H1');
    if (noite?.status === 'refutada' || noite?.status === 'alerta') {
      adicionar({
        prioridade: noite.status === 'refutada' ? 'alta' : 'media',
        titulo: 'encurtar noite',
        acao: 'reduzir texto, remover hesitação no handoff e testar nomes maiores na tela escura.',
        motivo: noite.valorMedido,
      });
    }

    const discussao = buscar('H2');
    if (discussao?.status === 'refutada' || discussao?.status === 'alerta') {
      adicionar({
        prioridade: discussao.status === 'refutada' ? 'alta' : 'media',
        titulo: 'aumentar conversa',
        acao: 'fortalecer eventos de dia e orientar o host a só tocar em apontar depois da primeira acusação real.',
        motivo: discussao.valorMedido,
      });
    }

    const acaoNoturna = buscar('H3');
    if (acaoNoturna?.status === 'refutada' || m.loopsSemAcao > 0) {
      adicionar({
        prioridade: 'alta',
        titulo: 'clarear ação noturna',
        acao: 'testar se o jogador entende que deve escolher ação e alvo antes de baixar o celular.',
        motivo: `${m.loopsSemAcao} noite(s) sem ação registrada`,
      });
    }

    const corrupcao = buscar('H7');
    if (corrupcao?.status === 'refutada' || corrupcao?.status === 'alerta') {
      adicionar({
        prioridade: corrupcao.status === 'refutada' ? 'alta' : 'media',
        titulo: 'recalibrar corrupção',
        acao:
          m.taxaContaminacao === 0
            ? 'permitir uma contaminação mais cedo no modo padrão/paranoia.'
            : 'reduzir frequência de contaminação ou atrasar a primeira conversão.',
        motivo: corrupcao.valorMedido,
      });
    }

    if (anomalias.length > 0 && recomendacoes.length === 0) {
      adicionar({
        prioridade: 'baixa',
        titulo: 'revisar anomalias',
        acao: 'assistir ao replay verbal do grupo e classificar se foi problema de regra, UI ou facilitação.',
        motivo: `${anomalias.length} sinal(is) detectado(s)`,
      });
    }

    if (recomendacoes.length === 0) {
      adicionar({
        prioridade: 'baixa',
        titulo: 'rodar novo grupo',
        acao: 'repetir o teste com jogadores diferentes para validar se a tensão se sustenta sem explicação extra.',
        motivo: 'nenhum sinal crítico nesta partida',
      });
    }

    return recomendacoes;
  }
}
