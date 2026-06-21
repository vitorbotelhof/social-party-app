// Gerador offline de puzzles Shikaku com solução única garantida.
// Self-contained (sem TS/aliases). RNG com seed → saída determinística.

const fs = require('fs');

// ─── RNG determinístico (mulberry32) ───────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Geometria ─────────────────────────────────────────────────────
function contemCelula(r, l, c) {
  return (
    l >= r.linhaInicio &&
    l <= r.linhaFim &&
    c >= r.colunaInicio &&
    c <= r.colunaFim
  );
}
function area(r) {
  return (r.linhaFim - r.linhaInicio + 1) * (r.colunaFim - r.colunaInicio + 1);
}

// ─── Solver: conta soluções até `limite` ───────────────────────────
function contarSolucoes(linhas, colunas, pistas, limite = 2) {
  const grade = Array.from({ length: linhas }, () =>
    new Array(colunas).fill(0),
  );
  let total = 0;

  function primeiraLivre() {
    for (let l = 0; l < linhas; l++)
      for (let c = 0; c < colunas; c++) if (grade[l][c] === 0) return [l, c];
    return null;
  }
  function pistasNo(r) {
    return pistas.filter((p) => contemCelula(r, p.linha, p.coluna));
  }
  function livre(r) {
    for (let l = r.linhaInicio; l <= r.linhaFim; l++)
      for (let c = r.colunaInicio; c <= r.colunaFim; c++)
        if (grade[l][c] !== 0) return false;
    return true;
  }
  function marcar(r, v) {
    for (let l = r.linhaInicio; l <= r.linhaFim; l++)
      for (let c = r.colunaInicio; c <= r.colunaFim; c++) grade[l][c] = v;
  }
  function resolver() {
    if (total >= limite) return;
    const f = primeiraLivre();
    if (!f) {
      total++;
      return;
    }
    const [l0, c0] = f;
    for (const pista of pistas) {
      for (let h = 1; h <= linhas - l0; h++) {
        for (let w = 1; w <= colunas - c0; w++) {
          if (h * w !== pista.valor) continue;
          const r = {
            linhaInicio: l0,
            colunaInicio: c0,
            linhaFim: l0 + h - 1,
            colunaFim: c0 + w - 1,
          };
          if (!contemCelula(r, pista.linha, pista.coluna)) continue;
          if (pistasNo(r).length !== 1) continue;
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

// ─── Gera um tiling aleatório que preenche a grade ─────────────────
function gerarTiling(linhas, colunas, maxSide, maxArea, rng) {
  const grade = Array.from({ length: linhas }, () =>
    new Array(colunas).fill(false),
  );
  const rects = [];
  function primeiraLivre() {
    for (let l = 0; l < linhas; l++)
      for (let c = 0; c < colunas; c++) if (!grade[l][c]) return [l, c];
    return null;
  }
  let cell;
  while ((cell = primeiraLivre())) {
    const [l0, c0] = cell;
    const cands = [];
    for (let h = 1; h <= Math.min(maxSide, linhas - l0); h++) {
      for (let w = 1; w <= Math.min(maxSide, colunas - c0); w++) {
        if (h * w > maxArea) continue;
        let ok = true;
        for (let l = l0; l < l0 + h && ok; l++)
          for (let c = c0; c < c0 + w && ok; c++) if (grade[l][c]) ok = false;
        if (ok) cands.push([h, w]);
      }
    }
    const naoTriviais = cands.filter(([h, w]) => h * w > 1);
    let escolha;
    if (naoTriviais.length && rng() < 0.85) {
      escolha = naoTriviais[Math.floor(rng() * naoTriviais.length)];
    } else {
      escolha = cands[Math.floor(rng() * cands.length)];
    }
    const [h, w] = escolha;
    for (let l = l0; l < l0 + h; l++)
      for (let c = c0; c < c0 + w; c++) grade[l][c] = true;
    rects.push({
      linhaInicio: l0,
      colunaInicio: c0,
      linhaFim: l0 + h - 1,
      colunaFim: c0 + w - 1,
    });
  }
  return rects;
}

function escolherPista(r, rng) {
  const h = r.linhaFim - r.linhaInicio + 1;
  const w = r.colunaFim - r.colunaInicio + 1;
  return {
    linha: r.linhaInicio + Math.floor(rng() * h),
    coluna: r.colunaInicio + Math.floor(rng() * w),
  };
}

function gerarPuzzles(cfg, rng) {
  const { linhas, colunas, qtd, maxSide, maxArea, prefixo, dificuldade } = cfg;
  const out = [];
  const vistos = new Set();
  let tentativas = 0;
  while (out.length < qtd && tentativas < 500000) {
    tentativas++;
    const rects = gerarTiling(linhas, colunas, maxSide, maxArea, rng);
    if (rects.length < cfg.minRects) continue;
    const triviais = rects.filter((r) => area(r) === 1).length;
    if (triviais > rects.length * 0.3) continue;
    const solucao = rects.map((r) => {
      const p = escolherPista(r, rng);
      return { ...r, pistaLinha: p.linha, pistaColuna: p.coluna };
    });
    const pistas = solucao.map((r) => ({
      linha: r.pistaLinha,
      coluna: r.pistaColuna,
      valor: area(r),
    }));
    if (contarSolucoes(linhas, colunas, pistas, 2) !== 1) continue;
    const sig = JSON.stringify(
      pistas
        .map((p) => `${p.linha},${p.coluna},${p.valor}`)
        .sort(),
    );
    if (vistos.has(sig)) continue;
    vistos.add(sig);
    out.push({ id: `${prefixo}-${out.length + 1}`, dificuldade, linhas, colunas, solucao });
  }
  if (out.length < qtd) {
    throw new Error(`Só gerei ${out.length}/${qtd} para ${prefixo} em ${tentativas} tentativas`);
  }
  return out;
}

// ─── Configuração das dificuldades ─────────────────────────────────
const rng = mulberry32(20260617);

const facil = gerarPuzzles(
  { linhas: 5, colunas: 5, qtd: 10, maxSide: 4, maxArea: 6, minRects: 6, prefixo: 'facil', dificuldade: 'facil' },
  rng,
);
const medio = gerarPuzzles(
  { linhas: 7, colunas: 7, qtd: 10, maxSide: 5, maxArea: 8, minRects: 11, prefixo: 'medio', dificuldade: 'medio' },
  rng,
);
const dificil = gerarPuzzles(
  { linhas: 9, colunas: 9, qtd: 10, maxSide: 5, maxArea: 9, minRects: 18, prefixo: 'dificil', dificuldade: 'dificil' },
  rng,
);

const todos = [...facil, ...medio, ...dificil];

// ─── Estatísticas (stderr) ─────────────────────────────────────────
for (const grupo of [['facil', facil], ['medio', medio], ['dificil', dificil]]) {
  const [nome, lista] = grupo;
  const rectsCount = lista.map((p) => p.solucao.length);
  console.error(
    `${nome}: ${lista.length} puzzles, rects ${Math.min(...rectsCount)}–${Math.max(...rectsCount)}`,
  );
}

// ─── Serialização TS ───────────────────────────────────────────────
function serRect(r) {
  return `    { linhaInicio: ${r.linhaInicio}, colunaInicio: ${r.colunaInicio}, linhaFim: ${r.linhaFim}, colunaFim: ${r.colunaFim}, pistaLinha: ${r.pistaLinha}, pistaColuna: ${r.pistaColuna} },`;
}
function serPuzzle(p) {
  const linhas = [
    `  {`,
    `    id: '${p.id}',`,
    `    dificuldade: '${p.dificuldade}',`,
    `    linhas: ${p.linhas},`,
    `    colunas: ${p.colunas},`,
    `    solucao: [`,
    ...p.solucao.map(serRect),
    `    ],`,
    `  },`,
  ];
  return linhas.join('\n');
}

const conteudo = `import type { DificuldadeSolo } from '@/games/solo/types';
import type { PuzzleShikaku } from './types';

// ⚙️ Gerado offline (scripts/gen-shikaku) com solução única verificada por solver.
// Não editar à mão — regerar caso precise de novos puzzles.

export const PUZZLES_SHIKAKU: PuzzleShikaku[] = [
${todos.map(serPuzzle).join('\n')}
];

// ─── Acesso ─────────────────────────────────────────────────────────────────

export function puzzlesPorDificuldade(
  dificuldade: DificuldadeSolo,
): PuzzleShikaku[] {
  return PUZZLES_SHIKAKU.filter((p) => p.dificuldade === dificuldade);
}

export function buscarPuzzle(id: string): PuzzleShikaku | null {
  return PUZZLES_SHIKAKU.find((p) => p.id === id) ?? null;
}
`;

const destino = process.argv[2];
fs.writeFileSync(destino, conteudo);
console.error(`\nEscrito: ${destino} (${todos.length} puzzles)`);
