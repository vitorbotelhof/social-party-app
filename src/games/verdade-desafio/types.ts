// ─── Verdade ou Desafio — Types ──────────────────────────────────────────────
//
// Jogo turn-based para grupos de 2–10 pessoas.
// Cada jogador escolhe: Verdade (confissão) ou Desafio (ação).
// O app sorteia a carta do tipo escolhido e controla a progressão.

export type TipoCartaVD = 'verdade' | 'desafio';

export type CategoriaVDId =
  | 'autoconhecimento'   // verdade: quem você é por dentro
  | 'relacionamentos'    // verdade: namoro, ficada, ex
  | 'grupo'             // verdade: sobre quem está na sala
  | 'vergonha'          // verdade: momentos constrangedores
  | 'coragem'           // verdade: medos e limites
  | 'desafio_social'    // desafio: ação digital/interação social
  | 'desafio_fisico'    // desafio: ação corporal, performance
  | 'desafio_caotico';  // desafio: missões que envolvem o grupo todo

export type IntensidadeVD = 'leve' | 'social' | 'pesado' | 'caotico';

export type FaseVD = 'aquecimento' | 'subida' | 'pico' | 'release';

export interface CategoriaVD {
  id: CategoriaVDId;
  nome: string;
  descricao: string;
  emoji: string;
  tipo: TipoCartaVD | 'ambos'; // a qual tipo pertence
  temMais18: boolean;
}

export interface CartaVD {
  id: string;
  tipo: TipoCartaVD;
  texto: string;
  categoria: CategoriaVDId;
  intensidade: IntensidadeVD;
  mais18: boolean;
  fase: FaseVD;
}

export interface ConfiguracaoVD {
  jogadores: { id: string; nome: string }[];
  intensidade: IntensidadeVD | 'todas';
  categorias: CategoriaVDId[] | 'todas';
  incluirMais18: boolean;
}

// Estado do turno atual
export type SubFaseVD =
  | 'escolhendo'   // jogador decide: verdade ou desafio
  | 'executando'   // carta mostrada, aguardando resolução
  | 'entre_turnos' // breve intervalo, próximo jogador
  | 'finalizado';

export interface TurnoVD {
  jogadorId: string;
  jogadorNome: string;
  tipoEscolhido: TipoCartaVD | null;
  carta: CartaVD | null;
  resultado: 'cumpriu' | 'passou' | null;
}

export interface SessaoVD {
  config: ConfiguracaoVD;
  subFase: SubFaseVD;
  indiceTurno: number;          // qual jogador é a vez
  totalTurnos: number;          // turnos completos jogados
  turnoAtual: TurnoVD;
  cartasUsadas: string[];
  historico: Array<Omit<TurnoVD, 'carta'> & { cartaId: string | null }>;
  iniciouEm: number;
}
