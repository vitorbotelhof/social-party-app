// ─── Quem na Sala? — Types ────────────────────────────────────────────────────
//
// Jogo de votação local para grupos de 4–8 pessoas.
// Modo local: 1 celular passado em roda — cada pessoa vota em privado.
// A pergunta é "Quem na sala..." + complemento. O grupo vota em alguém.
// O resultado revela quem recebeu mais votos (sem mostrar quem votou em quem).

export type CategoriaQNSId =
  | 'provavel' // quem provavelmente faria X
  | 'elogio' // qualidades genuínas do grupo
  | 'dinamica' // como o grupo funciona junto
  | 'exposicao' // julgamentos honestos sobre caráter
  | 'caos'; // perguntas que desestabilizam

export type IntensidadeQNS = 'leve' | 'social' | 'pesado' | 'caotico';

export type FaseQNS = 'aquecimento' | 'subida' | 'pico' | 'release';

export interface CategoriaQNS {
  id: CategoriaQNSId;
  nome: string;
  descricao: string;
  emoji: string;
  temMais18: boolean;
}

export interface CartaQNS {
  id: string;
  // Complemento: "Quem na sala..." + complemento
  complemento: string;
  categoria: CategoriaQNSId;
  intensidade: IntensidadeQNS;
  mais18: boolean;
  fase: FaseQNS;
}

export interface JogadorQNS {
  id: string;
  nome: string;
}

export interface ConfiguracaoQNS {
  jogadores: JogadorQNS[];
  intensidade: IntensidadeQNS | 'todas';
  categorias: CategoriaQNSId[] | 'todas';
  incluirMais18: boolean;
}

// Votos da rodada: chave = id do votante, valor = id do votado
export type VotosRodada = Record<string, string>;

// Subfases de uma rodada
export type SubFaseQNS =
  | 'pergunta' // mostra a pergunta pro grupo todo
  | 'passando_para' // instrução "passe o celular para [Nome]"
  | 'votando' // tela privada: o jogador escolhe em quem vota
  | 'revelacao'; // resultado final da rodada

export interface ResultadoRodada {
  cartaId: string;
  complemento: string;
  votosContagem: Array<{ jogadorId: string; nome: string; votos: number }>;
  vencedorId: string | null; // quem recebeu mais votos
  empate: boolean;
}

export interface SessaoQNS {
  config: ConfiguracaoQNS;
  subFase: SubFaseQNS;
  cartaAtual: CartaQNS | null;
  cartasUsadas: string[];
  totalRodadas: number; // rodadas completas jogadas
  // Votação em andamento
  indiceVotanteAtual: number; // qual jogador está votando agora
  votosRodadaAtual: VotosRodada;
  // Histórico
  historico: ResultadoRodada[];
  iniciouEm: number;
}
