// ─── De 0 a 10 — Qualidade de Respostas ─────────────────────────────────────
//
// A rodada fica previsível quando a mesma pessoa recorre sempre às mesmas
// respostas. A regra é deliberadamente simples: repetição literal normalizada
// não entra; interpretações novas continuam livres.

import type { CategoriaId, RespostaCategoria, ResultadoRodada } from './types';

export interface RepeticoesResposta {
  naRodada: Set<CategoriaId>;
  naSessao: Set<CategoriaId>;
}

export function normalizarResposta(resposta: string): string {
  return resposta
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function avaliarRepeticoesResposta(
  respostas: readonly RespostaCategoria[],
  respondenteId: string,
  historico: readonly ResultadoRodada[],
): RepeticoesResposta {
  const naRodada = new Set<CategoriaId>();
  const naSessao = new Set<CategoriaId>();
  const categoriasPorResposta = new Map<string, CategoriaId[]>();

  for (const resposta of respostas) {
    if (!resposta.resposta) continue;
    const normalizada = normalizarResposta(resposta.resposta);
    if (!normalizada) continue;
    const categorias = categoriasPorResposta.get(normalizada) ?? [];
    categorias.push(resposta.categoriaId);
    categoriasPorResposta.set(normalizada, categorias);
  }

  for (const categorias of categoriasPorResposta.values()) {
    if (categorias.length < 2) continue;
    for (const categoria of categorias) naRodada.add(categoria);
  }

  const respostasAnteriores = new Set(
    historico
      .filter((rodada) => rodada.respondente.id === respondenteId)
      .flatMap((rodada) => rodada.respostas)
      .flatMap((resposta) =>
        resposta.resposta ? [normalizarResposta(resposta.resposta)] : [],
      )
      .filter(Boolean),
  );

  for (const resposta of respostas) {
    if (!resposta.resposta) continue;
    const normalizada = normalizarResposta(resposta.resposta);
    if (normalizada && respostasAnteriores.has(normalizada)) {
      naSessao.add(resposta.categoriaId);
    }
  }

  return { naRodada, naSessao };
}

export function respostasTemRepeticao(repeticoes: RepeticoesResposta): boolean {
  return repeticoes.naRodada.size > 0 || repeticoes.naSessao.size > 0;
}
