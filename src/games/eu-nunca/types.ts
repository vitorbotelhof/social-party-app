// ─── Eu Nunca — Types ─────────────────────────────────────────────────────────
//
// Jogo confessional progressivo para grupos de 3–15 pessoas.
// Funciona em modo local (1 celular), anônimo (sem cadastro de jogadores).
// O app atua como diretor emocional da conversa.

export type CategoriaEuNuncaId =
  | 'vergonha'
  | 'internet'
  | 'relacionamentos'
  | 'ego'
  | 'vida_adulta'
  | 'segredos'
  | 'hipocrisia'
  | 'exposed';

export type IntensidadeEuNunca = 'leve' | 'social' | 'pessoal' | 'caotico';

// Fase da progressão emocional da sessão
export type FaseEuNunca = 'aquecimento' | 'subida' | 'pico' | 'release';

export interface CategoriaEuNunca {
  id: CategoriaEuNuncaId;
  nome: string;
  descricao: string;
  emoji: string;
  temMais18: boolean; // se true, categoria contém algumas cartas +18
}

export interface CartaEuNunca {
  id: string;
  // O complemento que vem após "Eu nunca..." na tela
  complemento: string;
  categoria: CategoriaEuNuncaId;
  intensidade: IntensidadeEuNunca;
  mais18: boolean;
  // Qual fase da sessão essa carta se encaixa melhor
  fase: FaseEuNunca;
}

export interface ConfiguracaoEuNunca {
  categorias: CategoriaEuNuncaId[] | 'todas';
  intensidade: IntensidadeEuNunca | 'todas';
  incluirMais18: boolean;
}

// Estado da sessão de jogo (local, anônimo)
export interface SessaoEuNunca {
  config: ConfiguracaoEuNunca;
  cartasUsadas: string[];   // IDs das cartas já exibidas
  cartaAtual: CartaEuNunca | null;
  totalCartasExibidas: number;
  fase: FaseEuNunca;
  iniciouEm: number;
}
