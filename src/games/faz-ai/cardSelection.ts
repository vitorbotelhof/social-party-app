import {
  CARTAS_FAZ_AI,
  pesoAtuabilidade,
  pesoDificuldade,
  pesoEnergia,
  pesoVergonha,
} from '@/games/faz-ai/cards';
import type {
  CartaFazAi,
  CategoriaFazAiId,
  FaseAdaptativaFazAi,
  IntensidadeSocial,
} from '@/games/faz-ai/types';
import { sortearUm } from '@/utils/random';

export interface ContextoSelecaoFazAi {
  acertosTurnoAtual?: number;
  passesTurnoAtual?: number;
  streakTurnoAtual?: number;
}

export function calcularFaseAdaptativaFazAi(
  turnosJogados: number,
  totalTurnos: number,
): FaseAdaptativaFazAi {
  if (turnosJogados < 2) return 'aquecimento';
  const pct = totalTurnos > 0 ? turnosJogados / totalTurnos : 0;
  if (pct < 0.55) return 'crescendo';
  if (pct < 0.8) return 'pico';
  return 'colapso';
}

function intensidadePermitida(
  carta: CartaFazAi,
  intensidade: IntensidadeSocial | 'todas',
  fase: FaseAdaptativaFazAi,
): boolean {
  if (intensidade !== 'todas') return carta.intensidadeSocial === intensidade;
  if (fase === 'aquecimento') {
    return (
      carta.intensidadeSocial === 'leve' || carta.intensidadeSocial === 'social'
    );
  }
  if (fase === 'crescendo') {
    return carta.intensidadeSocial !== 'absurda';
  }
  return true;
}

function categoriaPermitida(
  carta: CartaFazAi,
  categorias: CategoriaFazAiId[] | 'todas',
): boolean {
  return categorias === 'todas' || categorias.includes(carta.categoria);
}

function scoreCarta(
  carta: CartaFazAi,
  fase: FaseAdaptativaFazAi,
  contexto: ContextoSelecaoFazAi,
): number {
  const energia = pesoEnergia(carta.energiaRodada);
  const vergonha = pesoVergonha(carta.intensidadeSocial);
  const dificuldade = pesoDificuldade(carta.dificuldadeAtuacao);
  const atuabilidade = pesoAtuabilidade(carta.atuabilidade);
  const bonusClassica = carta.tipo === 'classica' ? 4 : 0;
  const bonusDireta = carta.atuabilidade === 'direta' ? 3 : 0;
  const passes = contexto.passesTurnoAtual ?? 0;
  const streak = contexto.streakTurnoAtual ?? 0;
  const precisaResgate = passes >= 2;
  const grupoEngatou = streak >= 2;
  const ajusteResgate = precisaResgate
    ? Math.max(0, 5 - dificuldade - atuabilidade) * 3 + bonusClassica
    : 0;
  const ajusteStreak = grupoEngatou
    ? energia + vergonha - Math.max(0, atuabilidade - 2)
    : 0;

  if (fase === 'aquecimento') {
    return Math.max(
      1,
      14 +
        bonusClassica +
        bonusDireta +
        ajusteResgate +
        Math.max(0, ajusteStreak) -
        dificuldade * 2 -
        atuabilidade * 2,
    );
  }
  if (fase === 'crescendo') {
    return (
      5 +
      energia +
      vergonha +
      Math.max(0, 4 - atuabilidade) -
      Math.max(0, dificuldade - 2) +
      (carta.tipo === 'classica' ? 1 : 0) +
      ajusteResgate +
      ajusteStreak
    );
  }
  if (fase === 'pico') {
    return (
      3 +
      energia * 2 +
      vergonha +
      Math.max(0, 3 - atuabilidade) +
      ajusteResgate +
      ajusteStreak
    );
  }
  return 2 + energia * 2 + vergonha * 2 + dificuldade + ajusteResgate;
}

function cartaDeResgate(carta: CartaFazAi): boolean {
  return (
    carta.atuabilidade === 'direta' ||
    (carta.atuabilidade === 'boa' && carta.dificuldadeAtuacao !== 'surto')
  );
}

function sortearPonderado(
  candidatos: readonly CartaFazAi[],
  fase: FaseAdaptativaFazAi,
  contexto: ContextoSelecaoFazAi,
): CartaFazAi {
  const pesos = candidatos.map((carta) => scoreCarta(carta, fase, contexto));
  const total = pesos.reduce((acc, peso) => acc + peso, 0);
  let cursor = Math.random() * total;

  for (let i = 0; i < candidatos.length; i += 1) {
    cursor -= pesos[i]!;
    if (cursor <= 0) return candidatos[i]!;
  }

  return candidatos[candidatos.length - 1]!;
}

export function selecionarCartaFazAi(
  cartasUsadas: readonly string[],
  categorias: CategoriaFazAiId[] | 'todas',
  intensidade: IntensidadeSocial | 'todas',
  turnosJogados: number,
  totalTurnos: number,
  contexto: ContextoSelecaoFazAi = {},
): CartaFazAi {
  const fase = calcularFaseAdaptativaFazAi(turnosJogados, totalTurnos);
  const usadas = new Set(cartasUsadas);

  const candidatos = CARTAS_FAZ_AI.filter(
    (carta) =>
      !usadas.has(carta.id) &&
      categoriaPermitida(carta, categorias) &&
      intensidadePermitida(carta, intensidade, fase),
  );

  if (candidatos.length > 0) {
    const candidatosFinais =
      (contexto.passesTurnoAtual ?? 0) >= 2
        ? candidatos.filter(cartaDeResgate)
        : candidatos;

    return sortearPonderado(
      candidatosFinais.length > 0 ? candidatosFinais : candidatos,
      fase,
      contexto,
    );
  }

  const fallbackSemUso = CARTAS_FAZ_AI.filter(
    (carta) => !usadas.has(carta.id) && categoriaPermitida(carta, categorias),
  );
  if (fallbackSemUso.length > 0) return sortearUm(fallbackSemUso);

  const fallbackCategoria = CARTAS_FAZ_AI.filter((carta) =>
    categoriaPermitida(carta, categorias),
  );
  if (fallbackCategoria.length > 0) return sortearUm(fallbackCategoria);

  return sortearUm(CARTAS_FAZ_AI);
}
