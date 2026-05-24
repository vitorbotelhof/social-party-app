/**
 * VOCÊ ME CONHECE? — TIPOS (modo 1 celular)
 *
 * Mecânica central:
 *   O ranqueador recebe 4 opções e escolhe em segredo:
 *     TOP 1  → o que você escolheria PRIMEIRO?
 *     LAST   → o que você deixaria por ÚLTIMO?
 *   O grupo tenta prever. Reveal instantâneo.
 *   O valor está em discutir — não em acertar.
 *
 * Anti-leak: escolhaDoRanqueador NUNCA entra em EstadoVMCPublico
 * antes da fase 'revelando'. Previsões individuais também não.
 */

// ─────────────────────────────────────────────────────────────────────────────
// §1  PRIMITIVOS
// ─────────────────────────────────────────────────────────────────────────────

export type PlayerId = string;

/** Temperatura emocional da categoria — define intensidade do conteúdo. */
export type TemperaturaVMC = 'leve' | 'social' | 'pessoal' | 'intenso';

/** Qual extremo o ranqueador escolhe. */
export type TipoEscolha = 'top1' | 'last';

export type CategoriaVMCId = string;

export type TagEditorialVMC =
  | 'comportamento'
  | 'preferencia'
  | 'grupo'
  | 'conflito'
  | 'intimidade'
  | 'rotina'
  | 'dinheiro'
  | 'amor'
  | 'amizade'
  | 'trabalho'
  | 'familia'
  | 'autoimagem'
  | 'decisao'
  | 'vergonha-leve'
  | 'valor-pessoal'
  | 'festa'
  | 'viagem'
  | 'digital'
  | 'cuidado'
  | 'controle';

export type FamiliaEditorialVMC =
  | 'quebra-gelo'
  | 'preferencias'
  | 'leitura-social'
  | 'vida-pratica'
  | 'valores';

export type IntensidadeEditorialVMC = 'baixa' | 'media' | 'alta';

export type RiscoRepeticaoVMC = 'baixo' | 'medio' | 'alto';

export type ModoEscolhaRecomendadoVMC = 'top1' | 'ambos';

export interface MetadadosEditoriaisVMC {
  /** Família usada pelo futuro seletor para variar a sensação das rodadas. */
  familia: FamiliaEditorialVMC;
  /** Tags flexíveis para recomendação, anti-repetição e curadoria. */
  tags: TagEditorialVMC[];
  /** Peso editorial, não necessariamente igual à temperatura da categoria. */
  intensidade: IntensidadeEditorialVMC;
  /** Risco de cansar se aparecer perto de cartas parecidas. */
  riscoRepeticao: RiscoRepeticaoVMC;
  /** Modo mais fluido para a carta, mesmo quando o card ainda permite ambos. */
  modoRecomendado: ModoEscolhaRecomendadoVMC;
}

// ─────────────────────────────────────────────────────────────────────────────
// §2  ENTIDADES
// ─────────────────────────────────────────────────────────────────────────────

export interface JogadorVMC {
  id: PlayerId;
  nome: string;
}

/** Card com 4 opções. O ranqueador escolhe o extremo pedido pelo tipo. */
export interface CartaoVMC {
  id: string;
  categoriaId: CategoriaVMCId;
  temperatura: TemperaturaVMC;
  editorial: MetadadosEditoriaisVMC;
  /** Exatamente 4. Curtas: 1–4 palavras cada. */
  opcoes: [string, string, string, string];
  /**
   * 'top1'  → pergunta sempre "o que você escolheria PRIMEIRO?"
   * 'last'  → pergunta sempre "o que você deixaria por ÚLTIMO?"
   * 'ambos' → engine sorteia top1 ou last a cada rodada
   */
  tipoEscolha: 'top1' | 'last' | 'ambos';
}

export interface CategoriaVMC {
  id: CategoriaVMCId;
  nome: string;
  temperatura: TemperaturaVMC;
  /** Uma linha. Ex: "o que vale mais pra você?" */
  descricao: string;
}

export interface ConfiguracaoVMC {
  categorias: CategoriaVMCId[];
  /** Multiplicador: totalRodadas = rodadasPorJogador × numJogadores */
  rodadasPorJogador: 1 | 2 | 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3  ESTADO DA COLETA DE PREVISÕES
// ─────────────────────────────────────────────────────────────────────────────

export interface EstadoColetandoPrevisoes {
  /** Índice do previsor atual na ordemJogadores (0-based). */
  indiceAtual: number;
  /** IDs dos não-ranqueadores em ordem de passagem do celular. */
  ordemJogadores: PlayerId[];
  /** IDs que já previram — para o indicador de progresso. */
  previstoPor: PlayerId[];
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  FRAMING EMOCIONAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Leitura do grupo sobre o ranqueador após o reveal.
 * Calculada pela proporção de previsões corretas.
 */
export type LeituraVMC =
  | 'leitura_perfeita' // todos acertaram
  | 'sincronizados' // maioria acertou
  | 'divididos' // metade acertou (apenas quando total par)
  | 'surpresa' // minoria acertou
  | 'leitura_solo' // exatamente uma pessoa acertou
  | 'desconhecido'; // ninguém acertou

// ─────────────────────────────────────────────────────────────────────────────
// §5  FASES DO JOGO
// ─────────────────────────────────────────────────────────────────────────────

export type FaseVMC =
  | 'aguardando_ranqueador' // "passe o celular para [nome]"
  | 'ranqueador_escolhendo' // ranqueador vê card e escolhe em segredo
  | 'coletando_previsoes' // cada não-ranqueador prevê sequencialmente
  | 'revelando' // resposta aparece com framing emocional
  | 'resultado_rodada' // placar leve, botão "próxima"
  | 'finalizado'; // jogo encerrado

// ─────────────────────────────────────────────────────────────────────────────
// §6  HISTÓRICO POR RODADA
// ─────────────────────────────────────────────────────────────────────────────

export interface RodadaHistoricoVMC {
  numero: number;
  ranqueadorId: PlayerId;
  cartaoId: string;
  tipoEscolha: TipoEscolha;
  escolha: string;
  acertos: PlayerId[];
  leitura: LeituraVMC;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  ESTADO PÚBLICO (lido pelo UI sem restrição)
// ─────────────────────────────────────────────────────────────────────────────

export interface EstadoVMCPublico {
  fase: FaseVMC;
  rodadaAtual: number;
  totalRodadas: number;

  /** ID do ranqueador desta rodada. */
  ranqueadorId: PlayerId;

  /** Card ativo — null em aguardando_ranqueador. */
  cartaoAtual: CartaoVMC | null;

  /** Tipo de escolha sorteado para esta rodada — null em aguardando_ranqueador. */
  tipoEscolhaNaRodada: TipoEscolha | null;

  /** Presente apenas em coletando_previsoes. */
  coletandoPrevisoes: EstadoColetandoPrevisoes | null;

  /**
   * Populated apenas em 'revelando' e 'resultado_rodada'.
   * NUNCA exposto antes.
   */
  escolhaRevelada: string | null;
  acertosRevelados: PlayerId[] | null;
  leituraRevelada: LeituraVMC | null;

  historico: RodadaHistoricoVMC[];
  configuracao: ConfiguracaoVMC;
}

// ─────────────────────────────────────────────────────────────────────────────
// §8  CALLBACKS
// ─────────────────────────────────────────────────────────────────────────────

export interface RodadaResolvida {
  numero: number;
  ranqueadorId: PlayerId;
  cartaoId: string;
  tipoEscolha: TipoEscolha;
  escolha: string;
  previsoes: Record<PlayerId, string>;
  acertos: PlayerId[];
  leitura: LeituraVMC;
}

export interface ResultadoVMCFinalizado {
  totalRodadas: number;
  totalJogadores: number;
  /** Total de previsões corretas por jogador (como previsor). */
  acertosPorJogador: Record<PlayerId, number>;
  /** Total de vezes que o grupo acertou quando este jogador era ranqueador. */
  acertosComoRanqueador: Record<PlayerId, number>;
  /** Jogador com mais acertos como previsor. null se empate entre todos. */
  melhorLeitorId: PlayerId | null;
  /** Ranqueador que o grupo menos acertou (mais surpreendente). */
  menosPrevistoId: PlayerId | null;
  leiturasPerfeitasTotal: number;
  desconhecidosTotal: number;
}

export interface VMCCallbacks {
  onRodadaResolvida?: (rodada: RodadaResolvida) => void;
  onJogoFinalizado?: (resultado: ResultadoVMCFinalizado) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  FACTORY
// ─────────────────────────────────────────────────────────────────────────────

export function criarConfiguracaoVMC(
  categorias: CategoriaVMCId[],
  rodadasPorJogador: 1 | 2 | 3 = 2,
): ConfiguracaoVMC {
  return { categorias, rodadasPorJogador };
}
