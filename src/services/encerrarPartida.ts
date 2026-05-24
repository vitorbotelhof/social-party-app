import type { PlayerId, RoomCode } from '@/engine/types';
import { limparPartida, setPartidaAtiva } from '@/services/partidaAtiva';
import { resetarJogo, sairDaSala } from '@/services/roomService';

interface EncerrarPartidaRealtimeInput {
  roomCode: RoomCode;
  jogadorId: PlayerId;
  ehAnfitriao: boolean;
}

export async function encerrarPartidaRealtime({
  roomCode,
  jogadorId,
  ehAnfitriao,
}: EncerrarPartidaRealtimeInput): Promise<void> {
  setPartidaAtiva(null);
  await limparPartida();

  if (ehAnfitriao) {
    await resetarJogo(roomCode, jogadorId);
    return;
  }

  await sairDaSala(roomCode, jogadorId);
}
