import {
  onDisconnect,
  onValue,
  ref,
  update,
} from 'firebase/database';

import { getRealtimeDb } from '@/services/firebase';

/**
 * Configura o sistema de presença pra um jogador dentro de uma sala.
 *
 * - Observa `.info/connected`. Quando conecta: marca `estaConectado: true`
 *   no jogador e agenda `onDisconnect` para virar `false` se cair.
 * - Quando desconecta: `.info/connected` emite false; o agendamento já
 *   registrado no servidor cuida de marcar o jogador como offline.
 *
 * Retorna função de cleanup que cancela o `onDisconnect` (uso intencional:
 * o jogador está saindo, não queremos sujar a sala depois).
 */
export function configurarPresenca(
  codigo: string,
  jogadorId: string,
): () => void {
  const db = getRealtimeDb();
  const jogadorRef = ref(db, `salas/${codigo}/jogadores/${jogadorId}`);
  const connectedRef = ref(db, '.info/connected');

  const cancelarObservador = onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;
    // Re-agenda o onDisconnect a cada reconexão.
    void onDisconnect(jogadorRef)
      .update({ estaConectado: false })
      .catch(() => {});
    // Marca como conectado agora.
    void update(jogadorRef, { estaConectado: true }).catch(() => {});
  });

  return () => {
    cancelarObservador();
    // Saída intencional: cancela o agendamento pendente.
    void onDisconnect(jogadorRef).cancel().catch(() => {});
  };
}
