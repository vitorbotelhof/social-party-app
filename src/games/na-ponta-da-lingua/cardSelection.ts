import { CARTAS } from '@/games/na-ponta-da-lingua/prompts';
import type { CategoriaIdNPL, Carta, DificuldadeNPL, FaseAdaptativaNPL, TipoCognitivoNPL } from '@/games/na-ponta-da-lingua/types';
import { calcularFaseAdaptativa } from '@/games/na-ponta-da-lingua/types';
import { sortearUm } from '@/utils/random';

// ─── Defaults ────────────────────────────────────────────────────────────────

function defaultEnergia(dificuldade: DificuldadeNPL): 1 | 2 | 3 | 4 | 5 {
  if (dificuldade === 'facil') return 2;
  if (dificuldade === 'medio') return 3;
  if (dificuldade === 'dificil') return 4;
  return 5; // colapso
}

function defaultVelocidade(dificuldade: DificuldadeNPL): 1 | 2 | 3 | 4 | 5 {
  if (dificuldade === 'facil') return 4;
  if (dificuldade === 'medio') return 3;
  if (dificuldade === 'dificil') return 2;
  return 1; // colapso — conceitos lentos, pesados
}

function getEnergia(c: Carta): 1 | 2 | 3 | 4 | 5 {
  return c.energiaEmocional ?? defaultEnergia(c.dificuldade);
}

function getVelocidade(c: Carta): 1 | 2 | 3 | 4 | 5 {
  return c.velocidadeCognitiva ?? defaultVelocidade(c.dificuldade);
}

// ─── Session context extraction ───────────────────────────────────────────────

interface SessionContext {
  categoriasRecentes: Set<CategoriaIdNPL>;  // last 7 turns
  tiposRecentes: Set<TipoCognitivoNPL>;      // last 4 turns
  energiasRecentes: (1 | 2 | 3 | 4 | 5)[];  // last 5 turns
  ultimaVelocidade: number | null;
  ultimaEnergia: number | null;
  precisaRecuperacao: boolean;               // 2+ consecutive energia 4–5
  streakMesmaEnergia: number;               // how many in a row with same energy
}

function buildSessionContext(cartasUsadas: string[]): SessionContext {
  const JANELA_CATEGORIA = 7;
  const JANELA_TIPO = 4;
  const JANELA_ENERGIA = 5;

  const idsRecentes = cartasUsadas.slice(-Math.max(JANELA_CATEGORIA, JANELA_ENERGIA));
  const recentes = idsRecentes
    .map((id) => CARTAS.find((c) => c.id === id))
    .filter(Boolean) as Carta[];

  const categoriasRecentes = new Set(
    recentes.slice(-JANELA_CATEGORIA).map((c) => c.categoria),
  );

  const tiposRecentes = new Set(
    recentes.slice(-JANELA_TIPO)
      .map((c) => c.tipo)
      .filter(Boolean) as TipoCognitivoNPL[],
  );

  const energiasRecentes = recentes.slice(-JANELA_ENERGIA).map(getEnergia);

  const ultima = recentes[recentes.length - 1] ?? null;
  const penultima = recentes[recentes.length - 2] ?? null;

  const ultimaVelocidade = ultima ? getVelocidade(ultima) : null;
  const ultimaEnergia = ultima ? getEnergia(ultima) : null;

  const precisaRecuperacao =
    ultima != null &&
    penultima != null &&
    getEnergia(ultima) >= 4 &&
    getEnergia(penultima) >= 4;

  // Count how many of the last N cards share the same energy as the last card
  let streakMesmaEnergia = 0;
  if (energiasRecentes.length > 0) {
    const alvo = energiasRecentes[energiasRecentes.length - 1]!;
    for (let i = energiasRecentes.length - 1; i >= 0; i--) {
      if (energiasRecentes[i] === alvo) streakMesmaEnergia++;
      else break;
    }
  }

  return {
    categoriasRecentes,
    tiposRecentes,
    energiasRecentes,
    ultimaVelocidade,
    ultimaEnergia,
    precisaRecuperacao,
    streakMesmaEnergia,
  };
}

// ─── Energy targeting ─────────────────────────────────────────────────────────

/**
 * Energia alvo por fase + dificuldade configurada.
 * colapso mode → sempre [5]. dificil → pressão alta desde o começo.
 * Outras dificuldades seguem a progressão da sessão.
 */
function energiaAlvoPorFase(
  fase: FaseAdaptativaNPL,
  dificuldade: DificuldadeNPL | 'todas',
): (1 | 2 | 3 | 4 | 5)[] {
  if (dificuldade === 'colapso') return [5];
  if (dificuldade === 'dificil') return [3, 4, 5];

  switch (fase) {
    case 'warmup':    return [1, 2];
    case 'crescendo': return [2, 3, 4];
    case 'pico':      return [3, 4, 5];
    case 'colapso':   return [4, 5];
  }
}

/**
 * Ajusta energia alvo baseado no contexto da sessão.
 * Força recuperação após dois picos seguidos.
 * Evita mais de 2 cartas iguais em energia.
 */
function ajustarEnergiaAlvo(
  energiaBase: (1 | 2 | 3 | 4 | 5)[],
  ctx: SessionContext,
  dificuldade: DificuldadeNPL | 'todas',
): (1 | 2 | 3 | 4 | 5)[] {
  // colapso mode never recovers
  if (dificuldade === 'colapso') return energiaBase;

  // Force recovery after 2 consecutive high-energy cards
  if (ctx.precisaRecuperacao) return [2, 3];

  // Prevent 3+ same energy in a row
  if (ctx.streakMesmaEnergia >= 2 && ctx.ultimaEnergia != null) {
    return energiaBase.filter((e) => e !== ctx.ultimaEnergia);
  }

  return energiaBase;
}

// ─── Velocity targeting ───────────────────────────────────────────────────────

/**
 * Velocidade cognitiva alvo baseada na última carta jogada.
 * Ritmo: rápido → devagar → rápido cria contraste perceptual.
 * null = sem preferência (início de sessão ou carta sem velocidade definida).
 */
function velocidadeAlvo(ctx: SessionContext): (1 | 2 | 3 | 4 | 5)[] | null {
  const v = ctx.ultimaVelocidade;
  if (v === null) return null;
  if (v >= 4) return [1, 2, 3]; // após rápida → prefere lenta/média
  if (v <= 2) return [3, 4, 5]; // após lenta → prefere rápida/média
  return null;                   // média → sem preferência forte
}

// ─── Main selection function ──────────────────────────────────────────────────

/**
 * Seleção inteligente e adaptativa de cartas.
 *
 * Sistema multi-dimensional com 7 níveis de fallback progressivo:
 *
 * 1. Critérios completos: energia + categoria + tipo + velocidade + anti-streak
 * 2. Sem velocidade: relaxa alternância de velocidade
 * 3. Sem anti-streak de energia: mantém energia alvo sem restrição de repetição
 * 4. Sem tipo: remove cooldown de tipo cognitivo
 * 5. Sem categoria: mantém só energia alvo
 * 6. Pool base: qualquer carta não usada no pool configurado
 * 7. Restart completo: reinicia deck quando esgotado
 *
 * Garante:
 * ✓ Anti-repetição (cartasUsadas global)
 * ✓ Cooldown de categoria (7 turnos)
 * ✓ Cooldown de tipo cognitivo (4 turnos)
 * ✓ Alternância de velocidade cognitiva (rítmo lento/rápido)
 * ✓ Pacing emocional por fase da sessão (warmup → colapso)
 * ✓ Recuperação emocional (após 2 picos → força descanso)
 * ✓ Anti-streak de energia (máx 2 do mesmo nível seguidos)
 * ✓ Warm-up invisível (primeiros 3 turnos → energia 1–2)
 */
export function selecionarCartaInteligente(
  cartasUsadas: string[],
  dificuldade: DificuldadeNPL | 'todas',
  categorias: CategoriaIdNPL[] | 'todas',
  turnosJogados: number,
  totalTurnos: number,
): Carta {
  const fase = calcularFaseAdaptativa(turnosJogados, totalTurnos);
  const ctx = buildSessionContext(cartasUsadas);

  const energiaBase = energiaAlvoPorFase(fase, dificuldade);
  const energiaAlvo = ajustarEnergiaAlvo(energiaBase, ctx, dificuldade);
  const velAlvo = velocidadeAlvo(ctx);

  // ── Pool base: não usadas, dificuldade e categorias configuradas ──
  const poolBase = CARTAS.filter((c) => {
    if (cartasUsadas.includes(c.id)) return false;
    if (dificuldade !== 'todas' && c.dificuldade !== dificuldade) return false;
    if (categorias !== 'todas' && !categorias.includes(c.categoria)) return false;
    return true;
  });

  // ── Tentativa 1: critérios completos ──
  let candidatos = poolBase.filter((c) => {
    const energia = getEnergia(c);
    const vel = getVelocidade(c);
    return (
      energiaAlvo.includes(energia) &&
      !ctx.categoriasRecentes.has(c.categoria) &&
      (c.tipo == null || !ctx.tiposRecentes.has(c.tipo)) &&
      (velAlvo == null || velAlvo.includes(vel))
    );
  });

  // ── Tentativa 2: relaxa velocidade ──
  if (candidatos.length < 3) {
    candidatos = poolBase.filter((c) => {
      const energia = getEnergia(c);
      return (
        energiaAlvo.includes(energia) &&
        !ctx.categoriasRecentes.has(c.categoria) &&
        (c.tipo == null || !ctx.tiposRecentes.has(c.tipo))
      );
    });
  }

  // ── Tentativa 3: relaxa anti-streak energia, mantém energia alvo base ──
  if (candidatos.length < 3) {
    candidatos = poolBase.filter((c) => {
      const energia = getEnergia(c);
      return energiaBase.includes(energia) && !ctx.categoriasRecentes.has(c.categoria);
    });
  }

  // ── Tentativa 4: relaxa tipo ──
  if (candidatos.length < 3) {
    candidatos = poolBase.filter((c) => {
      const energia = getEnergia(c);
      return energiaBase.includes(energia);
    });
  }

  // ── Tentativa 5: relaxa categoria, mantém energia alvo base ──
  if (candidatos.length < 3) {
    candidatos = poolBase.filter((c) => {
      const energia = getEnergia(c);
      return energiaBase.includes(energia);
    });
  }

  // ── Tentativa 6: qualquer carta não usada do pool ──
  if (candidatos.length === 0) {
    candidatos = poolBase;
  }

  // ── Fallback 7: restart completo ──
  if (candidatos.length === 0) {
    const fonteRecuperacao = CARTAS.filter(
      (c) =>
        (dificuldade === 'todas' || c.dificuldade === dificuldade) &&
        (categorias === 'todas' || categorias.includes(c.categoria)),
    );
    candidatos = fonteRecuperacao.length > 0 ? fonteRecuperacao : [...CARTAS];
  }

  return sortearUm(candidatos);
}
