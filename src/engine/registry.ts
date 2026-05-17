import type { GameEngine } from '@/engine/GameEngine';
import type { GameId } from '@/engine/types';

const registroDeJogos = new Map<GameId, GameEngine>();

/**
 * Registra um engine de jogo. Idempotente: registrar a mesma instância
 * duas vezes é seguro (HMR), mas registrar um engine diferente com o
 * mesmo id é considerado bug e lança erro.
 */
export function registrarJogo(engine: GameEngine): void {
  const existente = registroDeJogos.get(engine.config.id);
  if (existente && existente !== engine) {
    throw new Error(
      `Jogo "${engine.config.id}" já registrado por outra implementação.`,
    );
  }
  registroDeJogos.set(engine.config.id, engine);
}

/** Retorna o engine pelo id, ou `undefined` se não existir. */
export function obterJogo(id: GameId): GameEngine | undefined {
  return registroDeJogos.get(id);
}

/** Lista todos os jogos registrados (útil para a tela de seleção). */
export function listarJogos(): GameEngine[] {
  return Array.from(registroDeJogos.values());
}
