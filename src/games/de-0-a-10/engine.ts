// ─── De 0 a 10 — Engine de Sessão ────────────────────────────────────────────
//
// Máquina de estados da sessão local.
// Fluxo por rodada:
//   vez_de → nota_secreta → debate → palpites → reveal → (próximo) → vez_de

import {
  marcarCategoriasUsadas,
  selecionarCategorias,
  selecionarPerguntasPorCategoria,
} from './categorySelection';
import { selecionarNota } from './noteSelection';
import type {
  ConfiguracaoDe0a10,
  NotaDe0a10,
  PlacarJogador,
  RespostaCategoria,
  ResultadoRodada,
  RodadaAtual,
  SessaoDe0a10,
} from './types';

// ─── Criação de sessão ────────────────────────────────────────────────────────

export function criarSessao(config: ConfiguracaoDe0a10): SessaoDe0a10 {
  return {
    jogadores: config.jogadores,
    voltas: config.voltas,
    modoCompetitivo: config.modoCompetitivo,
    incluirMais18: config.incluirMais18,
    subFase: 'vez_de',
    indiceRespondenteAtual: 0,
    rodadaAtual: null,
    categoriasUsadasNaSessao: [],
    notasUsadasPorJogador: Object.fromEntries(
      config.jogadores.map((j) => [j.id, []]),
    ),
    historico: [],
    placar: config.jogadores.map((j) => ({
      jogadorId: j.id,
      nome: j.nome,
      pontosAdivinhador: 0,
      pontosRespondente: 0,
      total: 0,
    })),
    rodadasCompletas: 0,
    totalRodadas: config.jogadores.length * config.voltas,
    iniciouEm: Date.now(),
  };
}

// ─── Início de rodada ─────────────────────────────────────────────────────────
// Chamado quando o respondente toca "estou com o celular" na tela VezDe.

export function iniciarRodada(sessao: SessaoDe0a10): SessaoDe0a10 {
  const respondente = sessao.jogadores[sessao.indiceRespondenteAtual]!;

  const nota = selecionarNota(
    sessao.notasUsadasPorJogador[respondente.id] ?? [],
    sessao.rodadasCompletas,
  );

  const categorias = selecionarCategorias(
    sessao.categoriasUsadasNaSessao,
    sessao.incluirMais18,
  );

  const perguntasPorCategoria = selecionarPerguntasPorCategoria(categorias);

  const adivinhadores = sessao.jogadores.filter((j) => j.id !== respondente.id);

  const rodadaAtual: RodadaAtual = {
    respondente,
    nota,
    categorias,
    perguntasPorCategoria,
    respostas: [],
    palpites: [],
    adivinhadores,
    indiceAdivinhandoAtual: 0,
  };

  return {
    ...sessao,
    subFase: 'nota_secreta',
    rodadaAtual,
  };
}

// ─── Registro de respostas ────────────────────────────────────────────────────
// Chamado quando o respondente confirma suas respostas e passa para o grupo.

export function registrarRespostas(
  sessao: SessaoDe0a10,
  respostas: RespostaCategoria[],
): SessaoDe0a10 {
  if (!sessao.rodadaAtual) return sessao;

  return {
    ...sessao,
    subFase: 'debate',
    rodadaAtual: {
      ...sessao.rodadaAtual,
      respostas,
    },
  };
}

// ─── Início da fase de palpites ───────────────────────────────────────────────
// Chamado quando o grupo termina de debater e toca "iniciar votação".

export function iniciarPalpites(sessao: SessaoDe0a10): SessaoDe0a10 {
  return { ...sessao, subFase: 'palpites' };
}

// ─── Registro de palpite individual ──────────────────────────────────────────
// Chamado por cada adivinhador na passação. Avança para reveal quando todos votam.

export function registrarPalpite(
  sessao: SessaoDe0a10,
  jogadorId: string,
  nota: NotaDe0a10,
): SessaoDe0a10 {
  if (!sessao.rodadaAtual) return sessao;

  const novosPalpites = [
    ...sessao.rodadaAtual.palpites,
    { jogadorId, nota },
  ];

  const todosVotaram =
    novosPalpites.length >= sessao.rodadaAtual.adivinhadores.length;

  return {
    ...sessao,
    subFase: todosVotaram ? 'reveal' : 'palpites',
    rodadaAtual: {
      ...sessao.rodadaAtual,
      palpites: novosPalpites,
      indiceAdivinhandoAtual: sessao.rodadaAtual.indiceAdivinhandoAtual + 1,
    },
  };
}

// ─── Cálculo de resultado ─────────────────────────────────────────────────────

export function calcularResultadoRodada(
  sessao: SessaoDe0a10,
): ResultadoRodada | null {
  const rodada = sessao.rodadaAtual;
  if (!rodada || rodada.palpites.length === 0) return null;

  const notas: number[] = rodada.palpites.map((p) => p.nota);
  const soma = notas.reduce((a, b) => a + b, 0);
  const media = soma / notas.length;
  const minNota = Math.min(...notas);
  const maxNota = Math.max(...notas);
  const divergencia = maxNota - minNota;

  // Adivinhadores:
  //   erro = 0 (exato) → 2 pts
  //   erro = 1 (beirada) → 1 pt
  //   erro ≥ 2 → 0 pts
  const pontosPorAdivinhador: Record<string, 0 | 1 | 2> = {};
  for (const palpite of rodada.palpites) {
    const erro = Math.abs(palpite.nota - rodada.nota);
    pontosPorAdivinhador[palpite.jogadorId] =
      erro === 0 ? 2 : erro === 1 ? 1 : 0;
  }

  // Respondente ganha 1 pt por cada adivinhador que acertou dentro de ±1
  const pontosRespondente = rodada.palpites.filter(
    (p) => Math.abs(p.nota - rodada.nota) <= 1,
  ).length;

  return {
    respondente: rodada.respondente,
    notaReal: rodada.nota,
    categorias: rodada.categorias,
    respostas: rodada.respostas,
    palpites: rodada.palpites,
    mediaGuesses: Math.round(media * 10) / 10,
    divergencia,
    pontosRespondente,
    pontosPorAdivinhador,
  };
}

// ─── Avanço de rodada ─────────────────────────────────────────────────────────
// Chamado após o reveal. Aplica pontuação, avança respondente, prepara próxima.

export function avancarRodada(
  sessao: SessaoDe0a10,
  resultado: ResultadoRodada,
): SessaoDe0a10 {
  const rodada = sessao.rodadaAtual;
  if (!rodada) return sessao;

  // Atualiza placar
  const novoPlacar: PlacarJogador[] = sessao.placar.map((entrada) => {
    const pontosAdivinhador =
      resultado.pontosPorAdivinhador[entrada.jogadorId] ?? 0;
    const pontosRespondente =
      entrada.jogadorId === resultado.respondente.id
        ? resultado.pontosRespondente
        : 0;
    const novoTotal =
      entrada.total + pontosAdivinhador + pontosRespondente;
    return {
      ...entrada,
      pontosAdivinhador: entrada.pontosAdivinhador + pontosAdivinhador,
      pontosRespondente: entrada.pontosRespondente + pontosRespondente,
      total: novoTotal,
    };
  });

  // Marca notas e categorias como usadas
  const novasNotasJogador = {
    ...sessao.notasUsadasPorJogador,
    [rodada.respondente.id]: [
      ...(sessao.notasUsadasPorJogador[rodada.respondente.id] ?? []),
      rodada.nota,
    ],
  };

  const novasCategorias = marcarCategoriasUsadas(
    sessao.categoriasUsadasNaSessao,
    rodada.categorias,
  );

  // Avança para o próximo respondente (circular por voltas)
  const totalJogadores = sessao.jogadores.length;
  const proximoIndice =
    (sessao.indiceRespondenteAtual + 1) % totalJogadores;

  const novasRodadasCompletas = sessao.rodadasCompletas + 1;

  return {
    ...sessao,
    subFase: 'vez_de',
    indiceRespondenteAtual: proximoIndice,
    rodadaAtual: null,
    categoriasUsadasNaSessao: novasCategorias,
    notasUsadasPorJogador: novasNotasJogador,
    historico: [...sessao.historico, resultado],
    placar: novoPlacar,
    rodadasCompletas: novasRodadasCompletas,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function jogoEncerrado(sessao: SessaoDe0a10): boolean {
  return sessao.rodadasCompletas >= sessao.totalRodadas;
}

export function respondenteDaRodada(sessao: SessaoDe0a10): {
  id: string;
  nome: string;
} {
  return sessao.jogadores[sessao.indiceRespondenteAtual]!;
}

// Adivinhador atual na passação de palpites
export function adivinhandorAtual(
  sessao: SessaoDe0a10,
): { id: string; nome: string } | null {
  const rodada = sessao.rodadaAtual;
  if (!rodada) return null;
  return rodada.adivinhadores[rodada.indiceAdivinhandoAtual] ?? null;
}
