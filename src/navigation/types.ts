import type { CategoriaIdNPL } from '@/games/na-ponta-da-lingua/types';
import type { ConfiguracaoDuvido, RankingDuvido } from '@/games/duvido/types';
import type { CategoriaFazAiId, IntensidadeSocial } from '@/games/faz-ai/types';
import type { CategoriaEuNuncaId, IntensidadeEuNunca } from '@/games/eu-nunca/types';
import type { CategoriaVDId, IntensidadeVD } from '@/games/verdade-desafio/types';
import type { CategoriaQNSId, IntensidadeQNS } from '@/games/quem-na-sala/types';
import type { ConfiguracaoDe0a10 } from '@/games/de-0-a-10/types';
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
import type { ConfiguracaoSincronia } from '@/games/sincronia/types';
import type { ConfiguracaoNMP } from '@/games/na-mesma-pagina/types';
import type { ConfiguracaoOR } from '@/games/operacao-resgate/types';
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
  ConfiguracaoLocalDuvido: undefined;
  JogoLocalDuvido: {
    configuracao: ConfiguracaoDuvido;
    rankingsSelecionados: RankingDuvido[];
  };
  ResultadoLocalDuvido: {
    jogadores: { id: string; nome: string }[];
    historicoPorRanking: Array<{
      rankingId: string;
      rankingTitulo: string;
      vencedorId: string;
      totalEliminacoes: number;
      itensDitos: string[];
    }>;
    totalRankings: number;
    temperatura: 'competitivo' | 'caótico' | 'equilibrado';
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
  ConfiguracaoLocalEuNunca: undefined;
  JogoLocalEuNunca: {
    categorias: CategoriaEuNuncaId[] | 'todas';
    intensidade: IntensidadeEuNunca | 'todas';
    incluirMais18: boolean;
    totalCartas: 10 | 20 | null;
  };
  ConfiguracaoLocalVerdadeDesafio: undefined;
  JogoLocalVerdadeDesafio: {
    jogadores: { id: string; nome: string }[];
    intensidade: IntensidadeVD | 'todas';
    categorias: CategoriaVDId[] | 'todas';
    incluirMais18: boolean;
    voltas: 1 | 2 | 3;
  };
  ConfiguracaoLocalDe0a10: undefined;
  JogoLocalDe0a10: ConfiguracaoDe0a10;
  ConfiguracaoLocalSincronia: undefined;
  JogoLocalSincronia: ConfiguracaoSincronia;
  ConfiguracaoLocalNaMesmaPagina: undefined;
  JogoLocalNaMesmaPagina: ConfiguracaoNMP;
  ConfiguracaoLocalOperacaoResgate: undefined;
  JogoLocalOperacaoResgate: ConfiguracaoOR;
  ListaEntrelinhas: undefined;
  JogoLocalEntrelinhas: { historiaId: string };
  ConfiguracaoLocalQuemNaSala: undefined;
  JogoLocalQuemNaSala: {
    jogadores: { id: string; nome: string }[];
    intensidade: IntensidadeQNS | 'todas';
    categorias: CategoriaQNSId[] | 'todas';
    incluirMais18: boolean;
    totalPerguntas: 5 | 8 | 12;
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
