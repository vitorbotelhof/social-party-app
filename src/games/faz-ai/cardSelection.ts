import {
  CARTAS_FAZ_AI,
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

const ORDEM_INTENSIDADE: IntensidadeSocial[] = [
  'leve',
  'social',
  'caotica',
  'absurda',
];

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

function scoreCarta(carta: CartaFazAi, fase: FaseAdaptativaFazAi): number {
  const energia = pesoEnergia(carta.energiaRodada);
  const vergonha = pesoVergonha(carta.intensidadeSocial);
  const dificuldade = pesoDificuldade(carta.dificuldadeAtuacao);
  const intensidadeIndex = ORDEM_INTENSIDADE.indexOf(carta.intensidadeSocial);

  if (fase === 'aquecimento') {
    return Math.max(1, 10 - dificuldade * 2 - intensidadeIndex);
  }
  if (fase === 'crescendo') {
    return 4 + energia + vergonha - Math.max(0, dificuldade - 2);
  }
  if (fase === 'pico') {
    return 3 + energia * 2 + vergonha;
  }
  return 2 + energia * 2 + vergonha * 2 + dificuldade;
}

function sortearPonderado(
  candidatos: readonly CartaFazAi[],
  fase: FaseAdaptativaFazAi,
): CartaFazAi {
  const pesos = candidatos.map((carta) => scoreCarta(carta, fase));
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
): CartaFazAi {
  const fase = calcularFaseAdaptativaFazAi(turnosJogados, totalTurnos);
  const usadas = new Set(cartasUsadas);

  const candidatos = CARTAS_FAZ_AI.filter(
    (carta) =>
      !usadas.has(carta.id) &&
      categoriaPermitida(carta, categorias) &&
      intensidadePermitida(carta, intensidade, fase),
  );

  if (candidatos.length > 0) return sortearPonderado(candidatos, fase);

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
