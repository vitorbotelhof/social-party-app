// ─── Tipos base para Jogos Solo ───────────────────────────────────────────────
//
// Jogos solo são experiências individuais de lógica/treino mental.
// Sem multiplayer, sem Firebase — estado e progresso 100% locais.

/** Identificador de um jogo solo registrado no app. */
export type JogoSoloId = 'shikaku' | 'codigo-secreto';

/** Dificuldade genérica compartilhada entre jogos solo. */
export type DificuldadeSolo = 'facil' | 'medio' | 'dificil';

/** Definição de catálogo de um jogo solo (exibido na TelaSoloHome). */
export interface DefinicaoJogoSolo {
  id: JogoSoloId;
  nome: string;
  slogan: string;
  descricao: string;
  /** Cor de identidade do jogo (hex). */
  cor: string;
  /** Se false, aparece como "em breve" e não é jogável. */
  disponivel: boolean;
}

/** Rótulos legíveis para cada dificuldade. */
export const LABEL_DIFICULDADE: Record<DificuldadeSolo, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};
