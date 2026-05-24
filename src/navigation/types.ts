import type { CategoriaIdNPL } from '@/games/na-ponta-da-lingua/types';
import type { CategoriaFazAiId, IntensidadeSocial } from '@/games/faz-ai/types';
import type {
  ConfiguracaoAlianca,
  JogadorAlianca,
} from '@/games/alianca/local/types';
import type {
  ConfiguracaoLocal,
  JogadorLocal,
} from '@/games/inquisicao/local/types';
import type {
  ConfiguracaoVMC,
  JogadorVMC,
} from '@/games/voce-me-conhece/local/types';
import type { GameId, PlayerId, RoomCode } from '@/engine/types';

export type RootStackParamList = {
  Intro: undefined;
  Inicio: undefined;
  SelecaoJogo: undefined;
  DetalhesJogo: { jogoId: GameId };
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
  ConfiguracaoLocalNaPontaDaLingua: undefined;
  ConfiguracaoLocalInquisicao: undefined;
  JogoLocalInquisicao: {
    jogadores: JogadorLocal[];
    config: ConfiguracaoLocal;
  };
  ConfiguracaoLocalVMC: undefined;
  ConfiguracaoLocalFazAi: undefined;
  ConfiguracaoLocalAlianca: undefined;
  JogoLocalAlianca: {
    jogadores: JogadorAlianca[];
    config: ConfiguracaoAlianca;
  };
  JogoLocalVMC: {
    jogadores: JogadorVMC[];
    config: ConfiguracaoVMC;
  };
  JogoLocalFazAi: {
    jogadores: { id: string; nome: string }[];
    duracaoSegundos: 20 | 30 | 45;
    rodadasPorJogador: number;
    categorias: CategoriaFazAiId[] | 'todas';
    intensidade: IntensidadeSocial | 'todas';
  };
  JogoLocalNaPontaDaLingua: {
    jogadores: { id: string; nome: string }[];
    duracaoSegundos: 45 | 60 | 90;
    rodadasPorJogador: number;
    dificuldade: 'facil' | 'medio' | 'dificil' | 'colapso' | 'todas';
    categorias: CategoriaIdNPL[] | 'todas';
    modoJogo: 'individual' | 'todos_juntos' | 'time_vs_time';
    times?: { nomeA: string; idsA: string[]; nomeB: string; idsB: string[] };
  };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
