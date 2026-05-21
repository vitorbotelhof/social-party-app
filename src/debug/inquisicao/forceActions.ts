/**
 * forceActions — Escreve diretamente no Firebase para forçar estados de jogo.
 *
 * Todas as funções são no-ops em produção (__DEV__ guard).
 * Requerem anfitriaoId porque os nós do Inquisição são keyed por ele.
 *
 * Uso:
 *   - avancarFaseImediatamente() → reseta prazoFaseEm no passado (host lê e avança)
 *   - forçarEventoPublico()      → injeta texto no eventoAtivo da tela de conversa
 *   - forçarPapelJogador()       → sobrescreve papel no nó privado
 *   - pularRevelacaoPapeis()     → marca todos como papelVisto=true
 *   - simularVotacaoEmLote()     → submete votos em nome de múltiplos jogadores
 */

import { ref, set, update } from 'firebase/database';

import type { PlayerId } from '@/engine/types';
import type { PapelInquisicao } from '@/games/inquisicao/types';
import { getRealtimeDb } from '@/services/firebase';

export interface ForceParams {
  roomCode: string;
  anfitriaoId: PlayerId;
}

// ── Timer ─────────────────────────────────────────────────────────────────────

/**
 * Avança a fase imediatamente escrevendo prazoFaseEm 10s no passado.
 * O host polling do engine vai detectar o prazo expirado e chamar avancar_fase.
 */
export async function avancarFaseImediatamente({ roomCode, anfitriaoId }: ForceParams): Promise<void> {
  if (!__DEV__) return;
  const prazoRef = ref(
    getRealtimeDb(),
    `salas/${roomCode}/inquisicao/${anfitriaoId}/estado/prazoFaseEm`,
  );
  await set(prazoRef, Date.now() - 10_000);
}

// ── Eventos ───────────────────────────────────────────────────────────────────

/**
 * Injeta um evento público com texto personalizado na tela de conversa.
 * Persiste 5s e some (mesmo comportamento do engine).
 */
export async function forçarEventoPublico(
  { roomCode, anfitriaoId }: ForceParams,
  texto: string,
): Promise<void> {
  if (!__DEV__) return;
  const eventoRef = ref(
    getRealtimeDb(),
    `salas/${roomCode}/inquisicao/${anfitriaoId}/estado/eventoAtivo`,
  );
  await set(eventoRef, { id: `debug_${Date.now()}`, texto, categoria: 'caos_social' });
}

/**
 * Remove eventoAtivo (testa o silêncio como estado dominante).
 */
export async function limparEventoPublico({ roomCode, anfitriaoId }: ForceParams): Promise<void> {
  if (!__DEV__) return;
  const eventoRef = ref(
    getRealtimeDb(),
    `salas/${roomCode}/inquisicao/${anfitriaoId}/estado/eventoAtivo`,
  );
  await set(eventoRef, null);
}

// ── Corrupção ─────────────────────────────────────────────────────────────────

/**
 * Força o papel de um jogador sobrescrevendo o nó privado.
 * ATENÇÃO: não recalcula corrompidosAtivos nem atualiza o controle do host.
 * Usar apenas para testar visualmente a UI — não para testar lógica de engine.
 */
export async function forçarPapelJogador(
  { roomCode, anfitriaoId }: ForceParams,
  jogadorId: PlayerId,
  papel: PapelInquisicao,
): Promise<void> {
  if (!__DEV__) return;
  const privRef = ref(
    getRealtimeDb(),
    `salas/${roomCode}/inquisicao/${anfitriaoId}/privados/${jogadorId}`,
  );
  await update(privRef, {
    papelOriginal: papel,
    papelAtual: papel,
    convertidoNoLoop: papel === 'corrompido' ? 1 : null,
  });
}

// ── Revelação ─────────────────────────────────────────────────────────────────

/**
 * Marca todos os jogadores como papelVisto=true.
 * Útil para pular a fase de revelação durante testes repetidos.
 */
export async function pularRevelacaoPapeis(
  { roomCode }: ForceParams,
  jogadorIds: PlayerId[],
): Promise<void> {
  if (!__DEV__) return;
  const updates: Record<string, boolean> = {};
  jogadorIds.forEach((id) => {
    updates[`salas/${roomCode}/papelVisto/${id}`] = true;
  });
  await update(ref(getRealtimeDb(), '/'), updates);
}

// ── Votação ───────────────────────────────────────────────────────────────────

/**
 * Submete votos unânimes em nome de todos os jogadores listados.
 * Simula o cenário de paranoia total onde todos apontam para um alvo.
 */
export async function simularVotacaoUnânime(
  { roomCode, anfitriaoId }: ForceParams,
  votantesIds: PlayerId[],
  alvoId: PlayerId,
): Promise<void> {
  if (!__DEV__) return;
  const base = `salas/${roomCode}/inquisicao/${anfitriaoId}/estado/votacaoAtual`;
  const updates: Record<string, unknown> = {};

  votantesIds
    .filter((id) => id !== alvoId)
    .forEach((id) => {
      updates[`${base}/votos/${id}`] = alvoId;
      updates[`${base}/votantesConfirmados/${id}`] = true;
    });

  await update(ref(getRealtimeDb(), '/'), updates);
}

/**
 * Limpa votos ativos — retorna votação ao estado em_andamento vazio.
 * Útil para testar empate e segundo turno.
 */
export async function limparVotacaoAtual({ roomCode, anfitriaoId }: ForceParams): Promise<void> {
  if (!__DEV__) return;
  const votRef = ref(
    getRealtimeDb(),
    `salas/${roomCode}/inquisicao/${anfitriaoId}/estado/votacaoAtual`,
  );
  await update(votRef, { votos: null, votantesConfirmados: null });
}
