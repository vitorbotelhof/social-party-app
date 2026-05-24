import { useEffect, useState } from 'react';

import { ControleEncerrarJogo, TelaCarregamento } from '@/components';
import type {
  GameId,
  GameState,
  Player,
  PlayerId,
  RoomCode,
} from '@/engine/types';
import type {
  MostLikelyPrivateState,
  MostLikelyPublicState,
} from '@/games/most-likely-to/types';
import { setPartidaAtiva } from '@/services/partidaAtiva';
import { configurarPresenca } from '@/services/presenca';
import { encerrarPartidaRealtime } from '@/services/encerrarPartida';
import {
  observarEstadoDoJogo,
  observarJogadores,
} from '@/services/roomService';

import { TelaPromptMostLikely } from '@/screens/TelaPromptMostLikely';
import { TelaResultadoMostLikely } from '@/screens/TelaResultadoMostLikely';
import { TelaRevealMostLikely } from '@/screens/TelaRevealMostLikely';

type EstadoMLT = GameState<MostLikelyPublicState, MostLikelyPrivateState>;

interface Props {
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  onJogarDeNovo?: () => void;
  onVoltar?: () => void;
}

export function GameScreenMostLikely({
  roomCode,
  jogoId,
  jogadorId,
  onJogarDeNovo,
  onVoltar,
}: Props) {
  const [estado, setEstado] = useState<EstadoMLT | null>(null);
  const [jogadores, setJogadores] = useState<Player[]>([]);

  useEffect(
    () =>
      observarEstadoDoJogo(roomCode, (e) => {
        setEstado(e as EstadoMLT | null);
      }),
    [roomCode],
  );

  useEffect(() => observarJogadores(roomCode, setJogadores), [roomCode]);

  useEffect(() => {
    setPartidaAtiva({ roomCode, jogoId, jogadorId });
    return () => setPartidaAtiva(null);
  }, [roomCode, jogoId, jogadorId]);

  useEffect(
    () => configurarPresenca(roomCode, jogadorId),
    [roomCode, jogadorId],
  );

  useEffect(() => {
    if (estado?.fase === 'lobby') {
      onVoltar?.();
    }
  }, [estado?.fase, onVoltar]);

  async function encerrarJogo() {
    await encerrarPartidaRealtime({
      roomCode,
      jogadorId,
      ehAnfitriao:
        jogadores.find((jogador) => jogador.id === jogadorId)?.ehAnfitriao ??
        false,
    });
    onJogarDeNovo?.();
  }

  if (!estado) {
    return <TelaCarregamento mensagem="Carregando partida..." />;
  }

  const props = { estado, roomCode, jogoId, jogadorId, jogadores };

  switch (estado.estadoPublico.subFase) {
    case 'votando':
      return (
        <ControleEncerrarJogo onConfirmar={encerrarJogo}>
          <TelaPromptMostLikely {...props} />
        </ControleEncerrarJogo>
      );
    case 'reveal':
      return (
        <ControleEncerrarJogo onConfirmar={encerrarJogo}>
          <TelaRevealMostLikely {...props} />
        </ControleEncerrarJogo>
      );
    case 'finalizado':
      return (
        <TelaResultadoMostLikely
          estado={estado}
          jogadores={jogadores}
          jogadorId={jogadorId}
          onJogarDeNovo={onJogarDeNovo}
          onVoltar={onVoltar}
        />
      );
  }
}
