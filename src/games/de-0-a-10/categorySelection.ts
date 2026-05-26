// ─── De 0 a 10 — Seleção de Categorias ───────────────────────────────────────
//
// Regras por rodada (3 categorias fixas):
//   • Sempre 1 categoria Tier S (garante debate)
//   • Resto preenchido com A/B em ordem aleatória
//   • Sem repetição dentro da sessão (pool reinicia apenas quando esgota)
//   • Categorias +18 filtradas se incluirMais18 = false
//   • Resultado embaralhado para evitar padrão previsível

import { CATEGORIAS, getCategoria, sortearPergunta } from './categories';
import type { CategoriaId } from './types';

const QTD_CATEGORIAS_POR_RODADA = 3;

function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

function sortear<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function selecionarCategorias(
  categoriasUsadasNaSessao: CategoriaId[],
  incluirMais18: boolean,
): CategoriaId[] {
  const usadas = new Set(categoriasUsadasNaSessao);

  // Pool de disponíveis para esta rodada (excluindo já usadas na sessão)
  const disponiveis = CATEGORIAS.filter(
    (c) => !usadas.has(c.id) && (incluirMais18 || !c.mais18),
  );

  // Fallback: esgotou o pool → reseta (mas mantém filtro +18)
  const pool =
    disponiveis.length >= QTD_CATEGORIAS_POR_RODADA
      ? disponiveis
      : CATEGORIAS.filter((c) => incluirMais18 || !c.mais18);

  // Separa por tier
  const tierS = pool.filter((c) => c.tier === 'S');

  const resultado: CategoriaId[] = [];

  // Garante pelo menos 1 Tier S (se houver)
  if (tierS.length > 0) {
    resultado.push(sortear(tierS).id);
  }

  // Preenche com categorias restantes (excluindo já adicionadas)
  const restante = pool
    .filter((c) => !resultado.includes(c.id))
    .sort(() => Math.random() - 0.5);

  for (const cat of restante) {
    if (resultado.length >= QTD_CATEGORIAS_POR_RODADA) break;
    resultado.push(cat.id);
  }

  // Embaralha posição final para Tier S não ficar sempre primeiro
  return embaralhar(resultado);
}

/**
 * Para cada categoria selecionada na rodada, sorteia uma pergunta aleatória.
 * Retorna um mapa de categoriaId → pergunta para uso na UI.
 */
export function selecionarPerguntasPorCategoria(
  categorias: CategoriaId[],
): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const id of categorias) {
    const cat = getCategoria(id);
    resultado[id] = sortearPergunta(cat);
  }
  return resultado;
}

// Retorna apenas os IDs das categorias usadas nesta rodada para marcar na sessão
export function marcarCategoriasUsadas(
  categoriasUsadasNaSessao: CategoriaId[],
  novasUsadas: CategoriaId[],
): CategoriaId[] {
  return [...categoriasUsadasNaSessao, ...novasUsadas];
}
