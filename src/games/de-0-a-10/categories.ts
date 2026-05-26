// ─── De 0 a 10 — Pool de Categorias ─────────────────────────────────────────
//
// 22 categorias regulares (Tier S/A/B) + 2 adultas (+18).
// Critérios de qualidade de uma boa categoria:
//   1. Mapeamento emocional claro (respostas soam high ou low para a maioria)
//   2. Resposta instintiva (player responde em <3s)
//   3. Interpretabilidade coletiva (o grupo consegue debater)

import type { Categoria, CategoriaId } from './types';

export const CATEGORIAS: ReadonlyArray<Categoria> = [
  // ── Tier S ─────────────────────────────────────────────────────────────────

  {
    id: 'filme',
    emoji: '🎬',
    nome: 'filme',
    instrucao: 'um filme',
    tier: 'S',
  },
  {
    id: 'profissao',
    emoji: '💼',
    nome: 'profissão',
    instrucao: 'uma profissão',
    tier: 'S',
  },
  {
    id: 'animal',
    emoji: '🦊',
    nome: 'animal',
    instrucao: 'um animal',
    tier: 'S',
  },
  {
    id: 'sabor',
    emoji: '👅',
    nome: 'sabor',
    instrucao: 'um sabor',
    tier: 'S',
  },
  {
    id: 'bebida',
    emoji: '🥤',
    nome: 'bebida',
    instrucao: 'uma bebida',
    tier: 'S',
  },
  {
    id: 'red_flag',
    emoji: '🚩',
    nome: 'red flag',
    instrucao: 'uma red flag',
    tier: 'S',
  },
  {
    id: 'ex',
    emoji: '💔',
    nome: 'ex',
    instrucao: 'um tipo de ex',
    tier: 'S',
  },

  // ── Tier A ─────────────────────────────────────────────────────────────────

  {
    id: 'comida',
    emoji: '🍕',
    nome: 'comida',
    instrucao: 'uma comida',
    tier: 'A',
  },
  {
    id: 'serie',
    emoji: '📺',
    nome: 'série',
    instrucao: 'uma série',
    tier: 'A',
  },
  {
    id: 'superpoder',
    emoji: '⚡',
    nome: 'superpoder',
    instrucao: 'um superpoder',
    tier: 'A',
  },
  {
    id: 'emoji',
    emoji: '😶',
    nome: 'emoji',
    instrucao: 'um emoji',
    tier: 'A',
  },
  {
    id: 'cidade',
    emoji: '🌆',
    nome: 'cidade',
    instrucao: 'uma cidade',
    tier: 'A',
  },
  {
    id: 'cantor',
    emoji: '🎤',
    nome: 'cantor',
    instrucao: 'um cantor ou banda',
    tier: 'A',
  },
  {
    id: 'cor',
    emoji: '🎨',
    nome: 'cor',
    instrucao: 'uma cor',
    tier: 'A',
  },
  {
    id: 'frase',
    emoji: '💬',
    nome: 'frase',
    instrucao: 'uma frase',
    tier: 'A',
  },
  {
    id: 'viagem',
    emoji: '✈️',
    nome: 'destino',
    instrucao: 'um destino de viagem',
    tier: 'A',
  },
  {
    id: 'marca',
    emoji: '🏷️',
    nome: 'marca',
    instrucao: 'uma marca',
    tier: 'A',
  },

  // ── Tier B ─────────────────────────────────────────────────────────────────

  {
    id: 'dia_da_semana',
    emoji: '📅',
    nome: 'dia da semana',
    instrucao: 'um dia da semana',
    tier: 'B',
    // Excelente para calibração: segunda = nota baixa, sexta = nota alta (para maioria)
  },
  {
    id: 'esporte',
    emoji: '⚽',
    nome: 'esporte',
    instrucao: 'um esporte',
    tier: 'B',
  },
  {
    id: 'app',
    emoji: '📱',
    nome: 'app',
    instrucao: 'um app',
    tier: 'B',
  },
  {
    id: 'famoso',
    emoji: '⭐',
    nome: 'famoso',
    instrucao: 'um famoso',
    tier: 'B',
  },
  {
    id: 'clima',
    emoji: '⛅',
    nome: 'clima',
    instrucao: 'um tipo de clima',
    tier: 'B',
  },

  // ── +18 (apenas com incluirMais18 ativo) ──────────────────────────────────

  {
    id: 'fantasia',
    emoji: '🌙',
    nome: 'fantasia',
    instrucao: 'uma fantasia',
    tier: 'A',
    mais18: true,
  },
  {
    id: 'pecado',
    emoji: '😈',
    nome: 'pecado favorito',
    instrucao: 'um pecado favorito',
    tier: 'A',
    mais18: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCategoria(id: CategoriaId): Categoria {
  const cat = CATEGORIAS.find((c) => c.id === id);
  if (!cat) throw new Error(`Categoria não encontrada: ${id}`);
  return cat;
}

// Pool filtrado por tier — usado na seleção
export function getCategoriasPorTier(
  tier: Categoria['tier'],
  incluirMais18: boolean,
): Categoria[] {
  return CATEGORIAS.filter(
    (c) => c.tier === tier && (incluirMais18 || !c.mais18),
  );
}
