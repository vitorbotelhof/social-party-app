// ─── De 0 a 10 — Seleção de Categorias ───────────────────────────────────────
//
// Regras por rodada (3 categorias fixas):
//   • Sempre 1 categoria Tier S (garante debate)
//   • Menor frequência histórica vem primeiro; o trio recente é penalizado
//   • A pergunta de uma categoria não repete até seu mini-deck esgotar
//   • Exposição cresce por turno do respondente: leve → pessoal → íntima
//   • Categorias +18 filtradas se incluirMais18 = false
//   • Resultado embaralhado para evitar padrão previsível

import { CATEGORIAS, getCategoria, sortearPergunta } from './categories';
import type {
  Categoria,
  CategoriaId,
  ExposicaoCategoria,
  FaseExposicaoDe0a10,
  HistoricoPerguntasPorCategoria,
} from './types';

const QTD_CATEGORIAS_POR_RODADA = 3;

type GeradorAleatorio = () => number;

const EXPOSICOES_POR_FASE: Record<
  FaseExposicaoDe0a10,
  readonly ExposicaoCategoria[]
> = {
  aquecimento: ['leve'],
  conversa: ['leve', 'pessoal'],
  aberta: ['leve', 'pessoal', 'intima'],
};

export function calcularFaseExposicao(
  turnosRespondidos: number,
): FaseExposicaoDe0a10 {
  if (turnosRespondidos === 0) return 'aquecimento';
  if (turnosRespondidos === 1) return 'conversa';
  return 'aberta';
}

function embaralhar<T>(arr: readonly T[], aleatorio: GeradorAleatorio): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

function contarUso(
  categoriasUsadas: readonly CategoriaId[],
): Map<CategoriaId, number> {
  const frequencia = new Map<CategoriaId, number>();
  for (const id of categoriasUsadas) {
    frequencia.set(id, (frequencia.get(id) ?? 0) + 1);
  }
  return frequencia;
}

function ordenarPorRotacao(
  candidatas: readonly Categoria[],
  categoriasUsadas: readonly CategoriaId[],
  aleatorio: GeradorAleatorio,
): Categoria[] {
  const frequencia = contarUso(categoriasUsadas);
  const recentes = new Set(categoriasUsadas.slice(-QTD_CATEGORIAS_POR_RODADA));

  return embaralhar(candidatas, aleatorio).sort((a, b) => {
    const pesoA =
      (frequencia.get(a.id) ?? 0) * 10 + (recentes.has(a.id) ? 100 : 0);
    const pesoB =
      (frequencia.get(b.id) ?? 0) * 10 + (recentes.has(b.id) ? 100 : 0);
    return pesoA - pesoB;
  });
}

export function selecionarCategorias(
  categoriasUsadasNaSessao: readonly CategoriaId[],
  incluirMais18: boolean,
  faseExposicaoOuAleatorio: FaseExposicaoDe0a10 | GeradorAleatorio = 'aberta',
  aleatorio: GeradorAleatorio = Math.random,
): CategoriaId[] {
  const faseExposicao =
    typeof faseExposicaoOuAleatorio === 'function'
      ? 'aberta'
      : faseExposicaoOuAleatorio;
  const gerar =
    typeof faseExposicaoOuAleatorio === 'function'
      ? faseExposicaoOuAleatorio
      : aleatorio;
  const exposicoesPermitidas = EXPOSICOES_POR_FASE[faseExposicao];
  const elegiveis = CATEGORIAS.filter(
    (categoria) =>
      exposicoesPermitidas.includes(categoria.exposicao) &&
      (incluirMais18 || !categoria.mais18),
  );
  const tierS = ordenarPorRotacao(
    elegiveis.filter((categoria) => categoria.tier === 'S'),
    categoriasUsadasNaSessao,
    gerar,
  );
  const resultado = tierS.length > 0 ? [tierS[0]!.id] : [];
  const restante = ordenarPorRotacao(
    elegiveis.filter((categoria) => !resultado.includes(categoria.id)),
    categoriasUsadasNaSessao,
    gerar,
  );

  for (const categoria of restante) {
    if (resultado.length >= QTD_CATEGORIAS_POR_RODADA) break;
    resultado.push(categoria.id);
  }

  // Embaralha posição final para Tier S não ficar sempre primeiro
  return embaralhar(resultado, gerar);
}

/**
 * Para cada categoria selecionada na rodada, sorteia uma pergunta inédita
 * naquela categoria enquanto houver opções.
 * Retorna um mapa de categoriaId → pergunta para uso na UI.
 */
export function selecionarPerguntasPorCategoria(
  categorias: readonly CategoriaId[],
  perguntasUsadasPorCategoria: HistoricoPerguntasPorCategoria,
  aleatorio: GeradorAleatorio = Math.random,
): Partial<Record<CategoriaId, string>> {
  const resultado: Partial<Record<CategoriaId, string>> = {};
  for (const id of categorias) {
    const cat = getCategoria(id);
    resultado[id] = sortearPergunta(
      cat,
      perguntasUsadasPorCategoria[id] ?? [],
      aleatorio,
    );
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

export function marcarPerguntasUsadas(
  perguntasUsadas: HistoricoPerguntasPorCategoria,
  perguntasDaRodada: Partial<Record<CategoriaId, string>>,
): HistoricoPerguntasPorCategoria {
  const atualizadas: HistoricoPerguntasPorCategoria = {
    ...perguntasUsadas,
  };

  for (const id of Object.keys(perguntasDaRodada) as CategoriaId[]) {
    const pergunta = perguntasDaRodada[id];
    if (!pergunta) continue;
    atualizadas[id] = [...(atualizadas[id] ?? []), pergunta];
  }

  return atualizadas;
}
