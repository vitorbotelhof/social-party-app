import type { RankingDuvido, ConfiguracaoDuvido, CategoriaDuvido } from './types';
import { TODOS_OS_RANKINGS } from './rankings';

/**
 * Filtra rankings elegíveis com base na configuração da partida.
 *
 * Critérios de exclusão:
 *  1. Categoria não está nas categorias selecionadas.
 *  2. Dificuldade acima do máximo configurado.
 *  3. expiresAt no passado (ranking vencido).
 *  4. ID já jogado nesta sessão (playedIds).
 */
function filtrarElegiveis(
  todos: RankingDuvido[],
  configuracao: ConfiguracaoDuvido,
  playedIds: string[],
  agora: Date = new Date(),
): RankingDuvido[] {
  return todos.filter((r) => {
    // Categoria
    if (!configuracao.categorias.includes(r.categoria)) return false;

    // Dificuldade
    if (r.dificuldade > configuracao.dificuldadeMaxima) return false;

    // Validade temporal
    if (r.expiresAt !== null) {
      const expiracao = new Date(r.expiresAt);
      if (expiracao < agora) return false;
    }

    // Já jogado nesta sessão
    if (playedIds.includes(r.id)) return false;

    return true;
  });
}

/**
 * Embaralha um array usando Fisher-Yates.
 * Retorna uma nova cópia — não muta o original.
 */
function embaralhar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Seleciona N rankings para uma partida, com distribuição equilibrada por
 * dificuldade sempre que possível.
 *
 * Estratégia de distribuição para múltiplos rankings:
 *  - Se numeroDeRankings === 1: qualquer ranking elegível
 *  - Se numeroDeRankings === 3: prioriza 2 fácil/médio + 1 difícil
 *  - Se numeroDeRankings === 5: prioriza 2 fácil + 2 médio + 1 difícil
 *
 * Se não houver elegíveis suficientes com a distribuição ideal,
 * cai para seleção aleatória simples.
 */
export function selecionarRankings(
  configuracao: ConfiguracaoDuvido,
  playedIds: string[] = [],
  agora: Date = new Date(),
): RankingDuvido[] {
  const elegiveis = filtrarElegiveis(
    TODOS_OS_RANKINGS,
    configuracao,
    playedIds,
    agora,
  );

  const n = configuracao.numeroDeRankings;

  if (elegiveis.length === 0) return [];
  if (elegiveis.length <= n) return embaralhar(elegiveis);

  // Tentar distribuição equilibrada
  const faceis = embaralhar(elegiveis.filter((r) => r.dificuldade === 1));
  const medios = embaralhar(elegiveis.filter((r) => r.dificuldade === 2));
  const dificeis = embaralhar(elegiveis.filter((r) => r.dificuldade === 3));

  let selecionados: RankingDuvido[] = [];

  if (n === 1) {
    selecionados = embaralhar(elegiveis).slice(0, 1);
  } else if (n === 3) {
    // Ideal: 1 fácil + 1 médio + 1 difícil → fallback progressivo
    selecionados = _distribuir(
      [faceis, medios, dificeis],
      [1, 1, 1],
      elegiveis,
      3,
    );
  } else if (n === 5) {
    // Ideal: 2 fácil + 2 médio + 1 difícil → fallback progressivo
    selecionados = _distribuir(
      [faceis, medios, dificeis],
      [2, 2, 1],
      elegiveis,
      5,
    );
  }

  return selecionados;
}

/**
 * Tenta montar uma lista com a distribuição ideal por grupo.
 * Se algum grupo não tiver itens suficientes, completa com o pool geral.
 */
function _distribuir(
  grupos: RankingDuvido[][],
  cotas: number[],
  fallback: RankingDuvido[],
  total: number,
): RankingDuvido[] {
  const resultado: RankingDuvido[] = [];
  const usadosIds = new Set<string>();

  // Tentar preencher cada cota
  for (let i = 0; i < grupos.length; i++) {
    const grupo = grupos[i];
    const cota = cotas[i];
    let adicionados = 0;
    for (const r of grupo) {
      if (adicionados >= cota) break;
      if (!usadosIds.has(r.id)) {
        resultado.push(r);
        usadosIds.add(r.id);
        adicionados++;
      }
    }
  }

  // Completar com fallback se necessário
  if (resultado.length < total) {
    const restantes = embaralhar(fallback.filter((r) => !usadosIds.has(r.id)));
    for (const r of restantes) {
      if (resultado.length >= total) break;
      resultado.push(r);
    }
  }

  return embaralhar(resultado);
}

/**
 * Retorna todos os rankings de uma categoria específica, em ordem aleatória.
 * Útil para preview e configuração.
 */
export function rankingsPorCategoria(
  categoria: CategoriaDuvido,
  agora: Date = new Date(),
): RankingDuvido[] {
  return embaralhar(
    TODOS_OS_RANKINGS.filter(
      (r) =>
        r.categoria === categoria &&
        (r.expiresAt === null || new Date(r.expiresAt) >= agora),
    ),
  );
}

/**
 * Retorna a contagem de rankings elegíveis por dificuldade,
 * dado um conjunto de categorias. Útil para validar configuração antes de iniciar.
 */
export function contarElegiveisParaConfig(
  categorias: CategoriaDuvido[],
  dificuldadeMaxima: 1 | 2 | 3,
  agora: Date = new Date(),
): { total: number; porDificuldade: Record<1 | 2 | 3, number> } {
  const elegiveis = TODOS_OS_RANKINGS.filter(
    (r) =>
      categorias.includes(r.categoria) &&
      r.dificuldade <= dificuldadeMaxima &&
      (r.expiresAt === null || new Date(r.expiresAt) >= agora),
  );

  return {
    total: elegiveis.length,
    porDificuldade: {
      1: elegiveis.filter((r) => r.dificuldade === 1).length,
      2: elegiveis.filter((r) => r.dificuldade === 2).length,
      3: elegiveis.filter((r) => r.dificuldade === 3).length,
    },
  };
}
