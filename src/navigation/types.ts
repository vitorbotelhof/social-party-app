import type { GameId, PlayerId, RoomCode } from '@/engine/types';

export type RootStackParamList = {
  Intro: undefined;
  Inicio: undefined;
  SelecaoJogo: undefined;
  DetalhesJogo: { jogoId: GameId };
  SelecaoDinamica: { jogoId: GameId };
  Tutorial: { jogoId: GameId };
  CriarSala: { jogoId: GameId };
  EntrarSala: undefined;
  Lobby: { roomCode: RoomCode; jogoId: GameId; jogadorId: PlayerId };
  ConfiguracaoJogo: {
    roomCode: RoomCode;
    jogoId: GameId;
    jogadorId: PlayerId;
  };
  Game: { roomCode: RoomCode; jogoId: GameId; jogadorId: PlayerId };
  CadastroJogadores: { jogoId: GameId; opcoes: unknown };
  JogoLocal: undefined;
  ConfiguracaoLocal: undefined;
  ConfiguracaoLocalMostLikely: undefined;
  JogoLocalMostLikely: {
    jogadores: { id: string; nome: string }[];
    totalRodadas: number;
    modo: 'classico' | 'sincero';
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
