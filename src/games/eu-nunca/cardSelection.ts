// ─── Eu Nunca — Seleção de Cartas ────────────────────────────────────────────
//
// Motor editorial de progressão emocional.
// Começa no aquecimento (leve), sobe gradualmente para pico (pessoal/caotico).
// Evita repetição e respeita filtros de categoria, intensidade e +18.

import { CARTAS_EU_NUNCA, pesoIntensidade } from './cards';
import type {
  CartaEuNunca,
  CategoriaEuNuncaId,
  FaseEuNunca,
  IntensidadeEuNunca,
} from './types';

// Progressão de fase por % de cartas vistas na sessão
function calcularFase(totalExibidas: number): FaseEuNunca {
  if (totalExibidas < 4) return 'aquecimento';
  if (totalExibidas < 10) return 'subida';
  if (totalExibidas < 18) return 'pico';
  return 'release';
}

// Filtra e pesa as cartas disponíveis de acordo com a fase atual
function cartasElegiveis(
  cartasUsadas: string[],
  categorias: CategoriaEuNuncaId[] | 'todas',
  intensidade: IntensidadeEuNunca | 'todas',
  incluirMais18: boolean,
  faseAtual: FaseEuNunca,
): CartaEuNunca[] {
  const usadas = new Set(cartasUsadas);
  const categoriasSet =
    categorias === 'todas' ? null : new Set(categorias);

  return CARTAS_EU_NUNCA.filter((carta) => {
    // Já usada
    if (usadas.has(carta.id)) return false;
    // Categoria
    if (categoriasSet && !categoriasSet.has(carta.categoria)) return false;
    // +18
    if (!incluirMais18 && carta.mais18) return false;
    // Intensidade máxima por fase (progressão gradual)
    const pesoMax = pesoMaxPorFase(faseAtual);
    if (pesoIntensidade(carta.intensidade) > pesoMax) return false;
    // Filtro de intensidade do usuário
    if (intensidade !== 'todas' && carta.intensidade !== intensidade)
      return false;
    return true;
  });
}

function pesoMaxPorFase(fase: FaseEuNunca): number {
  // aquecimento: leve (1) | subida: social (2) | pico: pessoal (3) | release: caotico (4)
  const pesosPorFase: Record<FaseEuNunca, number> = {
    aquecimento: 1,
    subida: 2,
    pico: 3,
    release: 4,
  };
  return pesosPorFase[fase];
}

// Embaralha array — Fisher-Yates
function embaralhar<T>(arr: T[]): T[] {
  const resultado = [...arr];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j]!, resultado[i]!];
  }
  return resultado;
}

// Prefere cartas da fase atual; se não houver, aceita qualquer elegível
function selecionarComFase(
  elegiveis: CartaEuNunca[],
  faseAtual: FaseEuNunca,
): CartaEuNunca | null {
  const dafase = elegiveis.filter((c) => c.fase === faseAtual);
  const pool = dafase.length > 0 ? dafase : elegiveis;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function selecionarCartaEuNunca(
  cartasUsadas: string[],
  categorias: CategoriaEuNuncaId[] | 'todas',
  intensidade: IntensidadeEuNunca | 'todas',
  incluirMais18: boolean,
  totalExibidas: number,
): CartaEuNunca | null {
  const fase = calcularFase(totalExibidas);

  // Tenta selecionar da fase atual
  let elegiveis = cartasElegiveis(
    cartasUsadas,
    categorias,
    intensidade,
    incluirMais18,
    fase,
  );

  let carta = selecionarComFase(elegiveis, fase);
  if (carta) return carta;

  // Fallback: aceita qualquer intensidade disponível (sem restrição de fase)
  const semFiltroFase = CARTAS_EU_NUNCA.filter((c) => {
    if (cartasUsadas.includes(c.id)) return false;
    if (categorias !== 'todas' && !categorias.includes(c.categoria))
      return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    return true;
  });

  if (semFiltroFase.length > 0) {
    return semFiltroFase[Math.floor(Math.random() * semFiltroFase.length)]!;
  }

  // Cartas esgotadas: reinicia o deck (exclui apenas a carta atual se houver)
  const ultimaUsada = cartasUsadas.at(-1);
  const reembaralhadas = CARTAS_EU_NUNCA.filter((c) => {
    if (c.id === ultimaUsada) return false;
    if (categorias !== 'todas' && !categorias.includes(c.categoria))
      return false;
    if (!incluirMais18 && c.mais18) return false;
    if (intensidade !== 'todas' && c.intensidade !== intensidade) return false;
    return true;
  });

  elegiveis = embaralhar(reembaralhadas);
  carta = selecionarComFase(elegiveis, fase);
  return carta ?? elegiveis[0] ?? null;
}

export { calcularFase };
