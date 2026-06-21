import type {
  EstadoShikaku,
  PistaShikaku,
  PuzzleShikaku,
  RetanguloShikaku,
} from './types';

// ─── Geometria básica ─────────────────────────────────────────────────────────

/** Área (número de células) de um retângulo. */
export function areaRetangulo(r: RetanguloShikaku): number {
  return (r.linhaFim - r.linhaInicio + 1) * (r.colunaFim - r.colunaInicio + 1);
}

/** Constrói um retângulo normalizado a partir de duas células quaisquer. */
export function normalizarRetangulo(
  linhaA: number,
  colunaA: number,
  linhaB: number,
  colunaB: number,
): RetanguloShikaku {
  return {
    linhaInicio: Math.min(linhaA, linhaB),
    colunaInicio: Math.min(colunaA, colunaB),
    linhaFim: Math.max(linhaA, linhaB),
    colunaFim: Math.max(colunaA, colunaB),
  };
}

/** Verdadeiro se a célula (linha, coluna) está dentro do retângulo. */
export function contemCelula(
  r: RetanguloShikaku,
  linha: number,
  coluna: number,
): boolean {
  return (
    linha >= r.linhaInicio &&
    linha <= r.linhaFim &&
    coluna >= r.colunaInicio &&
    coluna <= r.colunaFim
  );
}

/** Verdadeiro se dois retângulos compartilham ao menos uma célula. */
export function sobrepoe(a: RetanguloShikaku, b: RetanguloShikaku): boolean {
  return (
    a.linhaInicio <= b.linhaFim &&
    a.linhaFim >= b.linhaInicio &&
    a.colunaInicio <= b.colunaFim &&
    a.colunaFim >= b.colunaInicio
  );
}

/** Verdadeiro se dois retângulos cobrem exatamente a mesma área. */
export function mesmoRetangulo(
  a: RetanguloShikaku,
  b: RetanguloShikaku,
): boolean {
  return (
    a.linhaInicio === b.linhaInicio &&
    a.colunaInicio === b.colunaInicio &&
    a.linhaFim === b.linhaFim &&
    a.colunaFim === b.colunaFim
  );
}

// ─── Pistas ───────────────────────────────────────────────────────────────────

/** Lista de pistas (números) do puzzle, derivada da solução. */
export function pistasDoPuzzle(puzzle: PuzzleShikaku): PistaShikaku[] {
  return puzzle.solucao.map((r) => ({
    linha: r.pistaLinha,
    coluna: r.pistaColuna,
    valor: areaRetangulo(r),
  }));
}

/** Pistas contidas dentro de um retângulo. */
function pistasDentro(
  puzzle: PuzzleShikaku,
  r: RetanguloShikaku,
): PistaShikaku[] {
  return pistasDoPuzzle(puzzle).filter((p) =>
    contemCelula(r, p.linha, p.coluna),
  );
}

/**
 * Um retângulo é "válido" isoladamente quando contém exatamente uma pista
 * e sua área é igual ao valor dessa pista. Não considera sobreposições.
 */
export function retanguloValido(
  puzzle: PuzzleShikaku,
  r: RetanguloShikaku,
): boolean {
  const pistas = pistasDentro(puzzle, r);
  if (pistas.length !== 1) return false;
  return areaRetangulo(r) === pistas[0].valor;
}

// ─── Estado de jogo ───────────────────────────────────────────────────────────

export function criarEstadoInicial(puzzle: PuzzleShikaku): EstadoShikaku {
  return { puzzle, retangulos: [], concluido: false };
}

/**
 * Adiciona um retângulo desenhado pelo jogador.
 * Remove quaisquer retângulos existentes que se sobreponham ao novo
 * (UX permissiva: redesenhar por cima substitui).
 */
export function adicionarRetangulo(
  estado: EstadoShikaku,
  novo: RetanguloShikaku,
): EstadoShikaku {
  const restantes = estado.retangulos.filter((r) => !sobrepoe(r, novo));
  const retangulos = [...restantes, novo];
  return {
    ...estado,
    retangulos,
    concluido: verificarVitoria(estado.puzzle, retangulos),
  };
}

/** Remove o retângulo que cobre a célula tocada (se houver). */
export function removerRetanguloEm(
  estado: EstadoShikaku,
  linha: number,
  coluna: number,
): EstadoShikaku {
  const retangulos = estado.retangulos.filter(
    (r) => !contemCelula(r, linha, coluna),
  );
  if (retangulos.length === estado.retangulos.length) return estado;
  return { ...estado, retangulos, concluido: false };
}

/** Remove todos os retângulos do jogador. */
export function reiniciarEstado(estado: EstadoShikaku): EstadoShikaku {
  return { ...estado, retangulos: [], concluido: false };
}

// ─── Condição de vitória ──────────────────────────────────────────────────────

/**
 * A grade está resolvida quando todos os retângulos são válidos e
 * cada célula da grade está coberta por exatamente um retângulo.
 */
export function verificarVitoria(
  puzzle: PuzzleShikaku,
  retangulos: RetanguloShikaku[],
): boolean {
  const cobertura: number[][] = Array.from({ length: puzzle.linhas }, () =>
    new Array<number>(puzzle.colunas).fill(0),
  );

  for (const r of retangulos) {
    if (!retanguloValido(puzzle, r)) return false;
    for (let l = r.linhaInicio; l <= r.linhaFim; l++) {
      for (let c = r.colunaInicio; c <= r.colunaFim; c++) {
        cobertura[l][c]++;
      }
    }
  }

  for (let l = 0; l < puzzle.linhas; l++) {
    for (let c = 0; c < puzzle.colunas; c++) {
      if (cobertura[l][c] !== 1) return false;
    }
  }
  return true;
}

// ─── Dica ─────────────────────────────────────────────────────────────────────

/**
 * Retorna um retângulo correto da solução que o jogador ainda não posicionou
 * exatamente. Retorna null se todos já estão no lugar.
 */
export function obterDica(estado: EstadoShikaku): RetanguloShikaku | null {
  for (const sol of estado.puzzle.solucao) {
    const bounds: RetanguloShikaku = {
      linhaInicio: sol.linhaInicio,
      colunaInicio: sol.colunaInicio,
      linhaFim: sol.linhaFim,
      colunaFim: sol.colunaFim,
    };
    const jaPosicionado = estado.retangulos.some((r) =>
      mesmoRetangulo(r, bounds),
    );
    if (!jaPosicionado) return bounds;
  }
  return null;
}

/** Aplica uma dica: posiciona o retângulo correto, limpando sobreposições. */
export function aplicarDica(estado: EstadoShikaku): EstadoShikaku {
  const dica = obterDica(estado);
  if (!dica) return estado;
  return adicionarRetangulo(estado, dica);
}

// ─── Progresso ────────────────────────────────────────────────────────────────

/** Quantos retângulos válidos o jogador tem, sobre o total esperado. */
export function progresso(estado: EstadoShikaku): {
  validos: number;
  total: number;
} {
  const validos = estado.retangulos.filter((r) =>
    retanguloValido(estado.puzzle, r),
  ).length;
  return { validos, total: estado.puzzle.solucao.length };
}

// ─── Solver (usado na geração/verificação de puzzles) ─────────────────────────

/**
 * Conta o número de soluções de um puzzle (para no máximo `limite`).
 * Backtracking: cobre sempre a primeira célula livre (varredura top-left).
 * Usado offline para garantir que cada puzzle tem solução única.
 */
export function contarSolucoes(
  linhas: number,
  colunas: number,
  pistas: PistaShikaku[],
  limite = 2,
): number {
  const grade: number[][] = Array.from({ length: linhas }, () =>
    new Array<number>(colunas).fill(0),
  );
  let total = 0;

  function primeiraLivre(): [number, number] | null {
    for (let l = 0; l < linhas; l++) {
      for (let c = 0; c < colunas; c++) {
        if (grade[l][c] === 0) return [l, c];
      }
    }
    return null;
  }

  function pistasNoRetangulo(r: RetanguloShikaku): PistaShikaku[] {
    return pistas.filter((p) => contemCelula(r, p.linha, p.coluna));
  }

  function livre(r: RetanguloShikaku): boolean {
    for (let l = r.linhaInicio; l <= r.linhaFim; l++) {
      for (let c = r.colunaInicio; c <= r.colunaFim; c++) {
        if (grade[l][c] !== 0) return false;
      }
    }
    return true;
  }

  function marcar(r: RetanguloShikaku, valor: number): void {
    for (let l = r.linhaInicio; l <= r.linhaFim; l++) {
      for (let c = r.colunaInicio; c <= r.colunaFim; c++) {
        grade[l][c] = valor;
      }
    }
  }

  function resolver(): void {
    if (total >= limite) return;
    const livre0 = primeiraLivre();
    if (!livre0) {
      total++;
      return;
    }
    const [l0, c0] = livre0;

    // Enumera todos os retângulos que cobrem (l0, c0), contêm exatamente
    // uma pista e têm área igual ao valor dessa pista.
    for (const pista of pistas) {
      // O retângulo deve conter a pista e a célula (l0, c0).
      // (l0, c0) é a célula livre mais ao topo-esquerda, então o retângulo
      // tem (l0, c0) como seu canto superior-esquerdo.
      for (let altura = 1; altura <= linhas - l0; altura++) {
        for (let largura = 1; largura <= colunas - c0; largura++) {
          if (altura * largura !== pista.valor) continue;
          const r: RetanguloShikaku = {
            linhaInicio: l0,
            colunaInicio: c0,
            linhaFim: l0 + altura - 1,
            colunaFim: c0 + largura - 1,
          };
          if (!contemCelula(r, pista.linha, pista.coluna)) continue;
          if (pistasNoRetangulo(r).length !== 1) continue;
          if (!livre(r)) continue;

          marcar(r, 1);
          resolver();
          marcar(r, 0);
          if (total >= limite) return;
        }
      }
    }
  }

  resolver();
  return total;
}
