/**
 * mockPlayers — Gera e gerencia jogadores fictícios para testes solo.
 *
 * Adiciona entradas reais no Firebase em salas/{roomCode}/jogadores/.
 * O host os vê como jogadores normais — o engine os processa normalmente.
 *
 * Para simular ações desses jogadores (votar, confirmar papel, etc.)
 * use as funções de forceActions com os IDs retornados por gerarIdsMock().
 *
 * Convenção de ID: "mock_0", "mock_1", ... para fácil identificação.
 */

import { ref, remove, set } from 'firebase/database';

import type { PlayerId } from '@/engine/types';
import { getRealtimeDb } from '@/services/firebase';

// ── Banco de nomes para testes ────────────────────────────────────────────────

const NOMES_MOCK = [
  'Alice', 'Bruno', 'Carla', 'Diego', 'Elena',
  'Fábio', 'Giulia', 'Henrique', 'Isabela', 'Jorge',
] as const;

const MOCK_PREFIX = 'mock_';

// ── Utilitários ───────────────────────────────────────────────────────────────

export function gerarIdMock(index: number): PlayerId {
  return `${MOCK_PREFIX}${index}` as PlayerId;
}

export function isMockPlayer(id: PlayerId): boolean {
  return id.startsWith(MOCK_PREFIX);
}

export function gerarIdsMock(quantidade: number): PlayerId[] {
  return Array.from({ length: quantidade }, (_, i) => gerarIdMock(i));
}

export function gerarJogadoresMock(
  quantidade: number,
): Array<{ id: PlayerId; nome: string }> {
  return Array.from({ length: Math.min(quantidade, NOMES_MOCK.length) }, (_, i) => ({
    id: gerarIdMock(i),
    nome: NOMES_MOCK[i],
  }));
}

// ── Firebase ──────────────────────────────────────────────────────────────────

/**
 * Adiciona N jogadores mock à sala no Firebase.
 * Retorna os IDs criados para uso em forceActions.
 */
export async function adicionarMocksNaSala(
  roomCode: string,
  quantidade: number,
): Promise<PlayerId[]> {
  if (!__DEV__) return [];

  const jogadores = gerarJogadoresMock(quantidade);
  const db = getRealtimeDb();

  await Promise.all(
    jogadores.map((j) =>
      set(ref(db, `salas/${roomCode}/jogadores/${j.id}`), {
        id: j.id,
        nome: j.nome,
        conectado: true,
        entradaEm: Date.now(),
        _isMock: true,
      }),
    ),
  );

  return jogadores.map((j) => j.id);
}

/**
 * Remove todos os jogadores mock da sala.
 * Identifica por prefixo "mock_" — seguro para chamar mesmo sem mocks.
 */
export async function removerMocksDaSala(roomCode: string): Promise<void> {
  if (!__DEV__) return;

  const db = getRealtimeDb();
  await Promise.all(
    Array.from({ length: NOMES_MOCK.length }, (_, i) =>
      remove(ref(db, `salas/${roomCode}/jogadores/${gerarIdMock(i)}`)),
    ),
  );
}

/**
 * Simula confirmação de papelVisto para todos os mocks.
 * Útil para pular revelação quando há mocks na partida.
 */
export async function mocksPapelVisto(
  roomCode: string,
  quantidade: number,
): Promise<void> {
  if (!__DEV__) return;

  const db = getRealtimeDb();
  const ids = gerarIdsMock(quantidade);
  await Promise.all(
    ids.map((id) => set(ref(db, `salas/${roomCode}/papelVisto/${id}`), true)),
  );
}
