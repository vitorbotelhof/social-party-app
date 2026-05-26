// ─── De 0 a 10 — Seleção de Nota ─────────────────────────────────────────────
//
// A progressão pertence ao respondente, não à posição dele na roda:
//   • 1a resposta: calibração com notas legíveis
//   • 2a resposta: tensão com mais ambiguidade
//   • 3a resposta em diante: pico, com extremos raros possíveis
// O sorteio ainda evita repetição individual e equilibra faixas já vistas na sessão.

import type { FaseDe0a10, NotaDe0a10 } from './types';

export type GeradorAleatorio = () => number;

const POOL_CALIBRACAO: readonly NotaDe0a10[] = [2, 3, 7, 8];
const POOL_TENSAO: readonly NotaDe0a10[] = [1, 2, 3, 4, 6, 7, 8, 9];
const POOL_PICO: readonly NotaDe0a10[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type FaixaNota = 'baixa' | 'media' | 'alta';

function faixaDaNota(nota: NotaDe0a10): FaixaNota {
  if (nota <= 3) return 'baixa';
  if (nota <= 6) return 'media';
  return 'alta';
}

function poolDaFase(fase: FaseDe0a10): readonly NotaDe0a10[] {
  if (fase === 'calibracao') return POOL_CALIBRACAO;
  if (fase === 'tensao') return POOL_TENSAO;
  return POOL_PICO;
}

export function calcularFase(turnosRespondidos: number): FaseDe0a10 {
  if (turnosRespondidos === 0) return 'calibracao';
  if (turnosRespondidos === 1) return 'tensao';
  return 'pico';
}

export function podeSortearNotasExtremas(turnosRespondidos: number): boolean {
  return calcularFase(turnosRespondidos) === 'pico';
}

function pesoBase(nota: NotaDe0a10, fase: FaseDe0a10): number {
  if (nota === 0 || nota === 10) return 0.35;
  if (fase === 'calibracao') return 1;
  if (nota === 5) return 0.8;
  return 1;
}

function contarNotas(notas: readonly NotaDe0a10[]): Map<NotaDe0a10, number> {
  const frequencia = new Map<NotaDe0a10, number>();
  for (const nota of notas) {
    frequencia.set(nota, (frequencia.get(nota) ?? 0) + 1);
  }
  return frequencia;
}

function contarFaixas(notas: readonly NotaDe0a10[]): Record<FaixaNota, number> {
  const contagem: Record<FaixaNota, number> = {
    baixa: 0,
    media: 0,
    alta: 0,
  };
  for (const nota of notas) contagem[faixaDaNota(nota)] += 1;
  return contagem;
}

function escolherPonderado(
  candidatos: readonly NotaDe0a10[],
  pesos: readonly number[],
  aleatorio: GeradorAleatorio,
): NotaDe0a10 {
  const totalPeso = pesos.reduce((total, peso) => total + peso, 0);
  let sorteio = aleatorio() * totalPeso;

  for (let indice = 0; indice < candidatos.length; indice += 1) {
    sorteio -= pesos[indice]!;
    if (sorteio <= 0) return candidatos[indice]!;
  }

  return candidatos[candidatos.length - 1]!;
}

export function selecionarNota(
  notasUsadasPeloJogador: readonly NotaDe0a10[],
  notasDaSessao: readonly NotaDe0a10[],
  aleatorio: GeradorAleatorio = Math.random,
): NotaDe0a10 {
  const fase = calcularFase(notasUsadasPeloJogador.length);
  const pool = poolDaFase(fase);
  const usadasPeloJogador = new Set(notasUsadasPeloJogador);
  const semRepeticao = pool.filter((nota) => !usadasPeloJogador.has(nota));
  let candidatos = semRepeticao.length > 0 ? semRepeticao : [...pool];

  const notaAnterior = notasDaSessao[notasDaSessao.length - 1];
  const semRepeticaoImediata = candidatos.filter(
    (nota) => nota !== notaAnterior,
  );
  if (semRepeticaoImediata.length > 0) candidatos = semRepeticaoImediata;

  const frequenciaNotas = contarNotas(notasDaSessao);
  const frequenciaFaixas = contarFaixas(notasDaSessao);
  const pesos = candidatos.map((nota) => {
    const vezesNota = frequenciaNotas.get(nota) ?? 0;
    const vezesFaixa = frequenciaFaixas[faixaDaNota(nota)];
    return (
      pesoBase(nota, fase) *
      (1 / (1 + vezesNota * 1.8)) *
      (1 / (1 + vezesFaixa * 0.25))
    );
  });

  return escolherPonderado(candidatos, pesos, aleatorio);
}
