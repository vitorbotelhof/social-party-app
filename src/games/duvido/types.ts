/**
 * DUVIDO — TIPOS
 *
 * Mecânica central:
 *   O app sorteia um ranking objetivo com gabarito verificável.
 *   Jogadores se alternam dizendo itens que acreditam estar na lista.
 *   A cada item dito, o próximo jogador pode aceitar ou duvidar.
 *   Se duvidar: o app revela quem errou — e esse jogador é eliminado.
 *   Se aceitar: a pressão passa — quem aceitou agora precisa responder.
 *   Último sobrevivente vence o ranking.
 *
 * Princípio de informação:
 *   Tudo neste jogo é PÚBLICO — ranking, itens já ditos, quem está ativo.
 *   A única exceção: os itens reais da lista ficam ocultos durante o jogo.
 *   Eles só aparecem no EstadoDuvido em `rankingRevelado`, na fase reveal_final.
 *   Isso preserva o momento de reveal coletivo ao final de cada ranking.
 *
 * Arquitetura:
 *   - types.ts (este arquivo): contrato de dados — UI e engine lêem
 *   - engine.ts: lógica pura — verificação, normalização, progressão de estado
 *   - local/localEngine.ts: estado React via useReducer; chama callbacks de sessão
 *   - local/duviidoLocalAdapter.ts: traduz eventos em sinais para SessionStore
 *   - rankings/*.ts: conteúdo dos rankings por categoria
 */

// ─────────────────────────────────────────────────────────────────────────────
// §1  PRIMITIVOS
// ─────────────────────────────────────────────────────────────────────────────

export type PlayerId = string;

/** Nível de dificuldade do ranking. Determina quantos itens são reconhecíveis. */
export type DificuldadeDuvido = 1 | 2 | 3;

/** Tamanho possível da lista. Top 5 para intensidade máxima, Top 10 padrão. */
export type TamanhoRanking = 5 | 10;

/**
 * Categorias temáticas dos rankings.
 * Usadas na configuração e no seletor de conteúdo.
 */
export type CategoriaDuvido =
  | 'futebol'
  | 'musica'
  | 'cinema'
  | 'internet'
  | 'geografia'
  | 'marcas'
  | 'recordes'
  | 'cultura_pop'
  | 'brasil';

// ─────────────────────────────────────────────────────────────────────────────
// §2  FASES DO JOGO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Máquina de estados do engine local.
 *
 * Fluxo canônico de um ranking:
 *
 *   exibindo_ranking
 *     → aguardando_resposta         [jogadorAtivo pensa e diz um item]
 *     → aguardando_decisao          [proximoJogador: aceitar ou duvidar?]
 *     → [se aceitar]
 *         → aguardando_resposta     [quem aceitou vira jogadorAtivo]
 *     → [se duvidar]
 *         → revelando               [app verifica o item]
 *         → eliminando              [beat pós-reveal, 1 jogador sai]
 *         → aguardando_resposta     [jogo continua se >1 ativo]
 *         → reveal_final            [1 sobrevivente — lista completa exibida]
 *         → finalizado              [ranking encerrado]
 *
 * Caso especial — todos os itens esgotados (raro):
 *   aguardando_resposta → ranking_esgotado → reveal_final → finalizado
 *
 * Entre rankings (sessão com múltiplos rankings):
 *   finalizado → exibindo_ranking   [próximo ranking começa]
 *   finalizado → sessao_encerrada   [todos os rankings jogados]
 */
export type FaseDuvido =
  | 'exibindo_ranking'    // ranking sorteado, título e fonte visíveis para todos
  | 'aguardando_resposta' // jogadorAtivo formula e diz um item em voz alta
  | 'aguardando_decisao'  // proximoJogador tem ~5 segundos sociais para decidir
  | 'revelando'           // app verifica se o item está na lista — suspense visual
  | 'eliminando'          // resultado exibido, beat de reação coletiva
  | 'reveal_final'        // lista completa revelada — momento coletivo de reação
  | 'finalizado';         // ranking encerrado, vencedor declarado

// ─────────────────────────────────────────────────────────────────────────────
// §3  CONTEÚDO — RANKING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Contrato completo de um ranking — usado internamente pelo engine.
 * Os `itens` não são expostos ao estado público antes de reveal_final.
 *
 * Todos os campos obrigatórios — nenhum ranking entra sem preencher tudo.
 * Verificar DUVIDO_CONTENT_GUIDE.md antes de adicionar novos rankings.
 */
export interface RankingDuvido {
  /** Identificador único. Formato: 'categoria-descricao-ano' */
  id: string;

  /**
   * Título exibido ao grupo.
   * Deve incluir critério, escopo e período.
   * Exemplo: "Top 10 maiores artilheiros das Copas do Mundo"
   * Máximo: 65 caracteres.
   */
  titulo: string;

  /**
   * Fonte exibida abaixo do título — a âncora de autoridade do gabarito.
   * Exemplo: "FIFA" | "Forbes, 2024" | "Guinness"
   * O app é o árbitro. A fonte é a prova.
   */
  fonte: string;

  tamanho: TamanhoRanking;
  categoria: CategoriaDuvido;
  dificuldade: DificuldadeDuvido;

  /**
   * Lista real dos itens. Ordenada internamente (1° ao Nth).
   * O engine verifica presença, não posição.
   * NUNCA exposta ao estado público antes de reveal_final.
   * Mínimo: exatamente `tamanho` itens.
   */
  itens: string[];

  /**
   * Variantes aceitas por item — chave: item canônico, valor: aliases.
   * Engine normaliza (lowercase, sem acento) antes de comparar.
   * Exemplos: { "Cristiano Ronaldo": ["cr7", "cristiano", "ronaldo"] }
   */
  variantes: Record<string, string[]>;

  /**
   * Data de expiração ISO 8601.
   * null = ranking atemporal (nunca expira).
   * Rankings expirados não são sorteados — ficam no banco como histórico.
   */
  expiresAt: string | null;
}

/**
 * Versão pública do ranking — sem `itens` e sem `variantes`.
 * É o que o estado público expõe durante o jogo.
 * Preserva o momento de reveal coletivo no final.
 */
export interface RankingPublicoDuvido {
  id: string;
  titulo: string;
  fonte: string;
  tamanho: TamanhoRanking;
  categoria: CategoriaDuvido;
  dificuldade: DificuldadeDuvido;
}

// ─────────────────────────────────────────────────────────────────────────────
// §4  ENTIDADES
// ─────────────────────────────────────────────────────────────────────────────

export interface JogadorDuvido {
  id: PlayerId;
  nome: string;

  /** false quando eliminado. */
  ativo: boolean;

  /**
   * Posição fixa na roda — 0-based, imutável durante o ranking.
   * Usado para calcular "próximo ativo" na corrente de pressão.
   */
  posicaoCirculo: number;

  /**
   * Índice do ranking em que foi eliminado (0-based).
   * null = ainda ativo ou ainda não jogou.
   */
  eliminadoNoRanking: number | null;

  /** Qual fase estava em andamento quando foi eliminado. */
  eliminadoNaFase: 'revelando' | null;
}

export interface ConfiguracaoDuvido {
  /** Nomes dos jogadores — ordem define o círculo inicial. */
  jogadores: string[];

  /**
   * Categorias selecionadas na tela de configuração.
   * Engine sorteia apenas dentro dessas categorias.
   */
  categorias: CategoriaDuvido[];

  /** Filtra rankings no sorteio — só inclui rankings com dificuldade ≤ ao selecionado. */
  dificuldadeMaxima: DificuldadeDuvido;

  /** Total de rankings na sessão. */
  numeroDeRankings: 1 | 3 | 5;
}

// ─────────────────────────────────────────────────────────────────────────────
// §5  RESULTADO DE UMA DÚVIDA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resultado calculado pelo engine quando alguém duvida.
 * Produzido em `revelando`, mantido em `eliminando` para a UI animar.
 */
export interface ResultadoDuvida {
  /** Item como foi dito pelo jogador ativo (texto bruto, para exibição). */
  itemDito: string;

  /** Item após normalização — usado internamente na verificação. */
  itemNormalizado: string;

  /** O item estava na lista? true = respondedor sobrevive, duvidador sai. */
  valido: boolean;

  /** ID do jogador eliminado. */
  eliminadoId: PlayerId;

  /**
   * Quem foi eliminado — para a mensagem de reveal.
   * 'respondeu' = tentou bluffar ou errou. 'duvidou' = duvidou de item correto.
   */
  eliminadouPapel: 'respondeu' | 'duvidou';
}

// ─────────────────────────────────────────────────────────────────────────────
// §6  ESTADO PÚBLICO (lido pelo UI sem restrição)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estado completo que a UI consome.
 *
 * Regra de segurança de conteúdo:
 *   - `rankingPublico` está disponível a partir de `exibindo_ranking`.
 *   - `rankingRevelado` só é populado em `reveal_final` e `finalizado`.
 *     Antes disso, é null — a UI não tem acesso à lista de itens.
 *
 * Regra de corrente de pressão:
 *   - `jogadorAtivoId` = quem acabou de dizer um item (ou vai dizer o próximo).
 *   - `proximoJogadorId` = quem decide aceitar ou duvidar.
 *   Quando B aceita: B vira `jogadorAtivo`, próximo ativo após B vira `proximo`.
 *   Quando B duvida e ganha: B vira `jogadorAtivo` após eliminação de A.
 *   Quando B duvida e perde: A permanece `jogadorAtivo`, próximo ativo após B vira `proximo`.
 */
export interface EstadoDuvido {
  fase: FaseDuvido;

  /** Índice do ranking atual na sessão (0-based). */
  rankingAtual: number;

  /** Total de rankings nesta sessão. */
  totalRankings: number;

  /** Informação pública do ranking — sem itens. */
  rankingPublico: RankingPublicoDuvido;

  /**
   * Lista completa com os itens reais — populado apenas em reveal_final/finalizado.
   * null durante o jogo. A UI deve mostrar esta lista apenas nessas fases.
   */
  rankingRevelado: string[] | null;

  jogadores: JogadorDuvido[];

  /**
   * IDs dos jogadores ainda ativos, em ordem de círculo.
   * Derivável de jogadores[], mas pré-calculado para performance de UI.
   */
  jogadoresAtivos: PlayerId[];

  /**
   * Jogador que disse o último item — aguarda decisão do próximo.
   * Permanece populado durante aguardando_decisao, revelando e eliminando.
   */
  jogadorAtivoId: PlayerId;

  /**
   * Jogador que decide: aceitar ou duvidar.
   * É sempre o próximo ativo após jogadorAtivoId no círculo.
   */
  proximoJogadorId: PlayerId;

  /**
   * Itens já ditos neste ranking — exibidos em tela para todos.
   * Texto original como foi falado (não normalizado).
   * Cresce a cada item aceito ou confirmado válido após dúvida.
   */
  itensDitos: string[];

  /**
   * O último item dito — aguardando decisão do próximo jogador.
   * null durante exibindo_ranking e após eliminação ser processada.
   */
  ultimoItemDito: string | null;

  /**
   * Resultado da última dúvida — populado em revelando e eliminando.
   * null em todas as outras fases.
   */
  resultadoDuvida: ResultadoDuvida | null;

  /**
   * ID do vencedor do ranking atual.
   * Populado a partir de reveal_final.
   */
  vencedorId: PlayerId | null;

  /**
   * Histórico de vencedores por ranking nesta sessão.
   * Índice corresponde ao rankingAtual no momento da vitória.
   */
  historicoPorRanking: Array<{
    rankingId: string;
    vencedorId: PlayerId;
    totalEliminacoes: number;
    itensDitos: string[];
  }>;

  configuracao: ConfiguracaoDuvido;
}

// ─────────────────────────────────────────────────────────────────────────────
// §7  EVENTOS (discriminated union para o reducer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Eventos que o UI envia ao engine local.
 * O engine processa e retorna um novo EstadoDuvido.
 *
 * Fluxo de eventos por fase:
 *   exibindo_ranking    → IniciarRanking
 *   aguardando_resposta → ItemDito
 *   aguardando_decisao  → Aceito | Duvidado
 *   revelando           → (engine avança automaticamente após cálculo)
 *   eliminando          → ConfirmarEliminacao  (host toca pra continuar)
 *   reveal_final        → ConfirmarRevealFinal (host toca pra continuar)
 *   finalizado          → (sem eventos — sessão encerra ou próximo ranking)
 */
export type EventoDuvido =
  | {
      tipo: 'IniciarRanking';
    }
  | {
      tipo: 'ItemDito';
      /** Texto bruto como o jogador disse. Engine normaliza internamente. */
      item: string;
    }
  | {
      tipo: 'Aceito';
    }
  | {
      tipo: 'Duvidado';
    }
  | {
      /**
       * Host confirma que todos viram o resultado e o grupo está pronto.
       * Avança de eliminando → aguardando_resposta (ou reveal_final se 1 sobrou).
       */
      tipo: 'ConfirmarEliminacao';
    }
  | {
      /**
       * Host confirma que a lista completa foi vista pelo grupo.
       * Avança de reveal_final → finalizado.
       */
      tipo: 'ConfirmarRevealFinal';
    };

// ─────────────────────────────────────────────────────────────────────────────
// §8  CALLBACKS DE SESSÃO (SessionStore adapter)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Params emitidos quando um item é dito e aceito sem dúvida.
 * Sinal de baixa intensidade — não gera momento memorável.
 */
export interface ItemAceitoParams {
  rankingId: string;
  rankingAtual: number;
  jogadorAtivoId: PlayerId;
  proximoJogadorId: PlayerId;
  item: string;
  totalItensDitos: number;
}

/**
 * Params emitidos quando uma dúvida é resolvida (independente de quem errou).
 * Gera momento memorável dependendo do tipo.
 */
export interface DuvidaResolvidaParams {
  rankingId: string;
  rankingAtual: number;

  /** Quem disse o item. */
  respondeuId: PlayerId;

  /** Quem duvidou. */
  duvidouId: PlayerId;

  item: string;
  valido: boolean;
  eliminadoId: PlayerId;

  /**
   * Tipo de momento memorável:
   * - 'leitura_perfeita': duvidou e estava certo — leu o bluff corretamente
   * - 'bluff_sobreviveu': item incerto não foi duvidado no turno anterior (emitido retroativamente)
   * - 'aposta_errada': duvidou de item válido — perdeu
   */
  tipoMomento: 'leitura_perfeita' | 'aposta_errada';

  totalAtivos: number;
}

/**
 * Params emitidos ao final de cada ranking individual.
 * Alimenta stats por jogador e temperatura de sessão.
 */
export interface RankingFinalizadoParams {
  rankingId: string;
  rankingAtual: number;
  totalRankings: number;
  vencedorId: PlayerId;
  totalEliminacoes: number;
  totalItensDitos: number;

  /** Stats de cada jogador neste ranking. */
  statsPorJogador: Record<
    PlayerId,
    {
      itensDitos: number;
      dubidasCertas: number;    // duvidou e estava certo
      dubidasErradas: number;   // duvidou de item válido
      sobreviveu: boolean;
      posicaoEliminacao: number | null; // 1-based, null se sobreviveu
    }
  >;
}

/**
 * Params emitidos quando toda a sessão encerra (todos os rankings jogados).
 * Alimenta dossiê e temperatura final da sessão.
 */
export interface JogoFinalizadoParams {
  totalRankings: number;
  totalJogadores: number;

  /** Quantidade de rankings vencidos por jogador. */
  rankingsVencidosPorJogador: Record<PlayerId, number>;

  /** Jogador com mais dúvidas certas na sessão (melhor leitor). */
  melhorLeitorId: PlayerId | null;

  /** Jogador com mais bluffs bem-sucedidos (nunca duvidado). */
  maiorBlufferSemPunicaoId: PlayerId | null;

  /** Total de momentos de "duvido" na sessão. */
  totalDuvidas: number;

  /** Temperatura emocional sugerida para o SessionStore. */
  temperatura: 'competitivo' | 'caótico' | 'equilibrado';
}

/** Callbacks registrados pelo adapter de sessão no engine local. */
export interface DuvidoCallbacks {
  onItemAceito?: (params: ItemAceitoParams) => void;
  onDuvidaResolvida?: (params: DuvidaResolvidaParams) => void;
  onRankingFinalizado?: (params: RankingFinalizadoParams) => void;
  onJogoFinalizado?: (params: JogoFinalizadoParams) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// §9  FACTORY DE CONFIGURAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cria uma ConfiguracaoDuvido com defaults razoáveis.
 * Ponto de entrada canônico — evita configs inconsistentes.
 *
 * @param jogadores     Nomes dos jogadores em ordem de círculo
 * @param categorias    Categorias selecionadas (min. 1)
 * @param opcoes        Overrides opcionais
 */
export function criarConfiguracaoDuvido(
  jogadores: string[],
  categorias: CategoriaDuvido[],
  opcoes?: Partial<Pick<ConfiguracaoDuvido, 'dificuldadeMaxima' | 'numeroDeRankings'>>,
): ConfiguracaoDuvido {
  return {
    jogadores,
    categorias,
    dificuldadeMaxima: opcoes?.dificuldadeMaxima ?? 2,
    numeroDeRankings: opcoes?.numeroDeRankings ?? 3,
  };
}

/**
 * Cria a lista inicial de JogadorDuvido a partir de uma configuração.
 * Chamada pelo engine ao inicializar a sessão.
 */
export function criarJogadoresDuvido(
  configuracao: ConfiguracaoDuvido,
): JogadorDuvido[] {
  return configuracao.jogadores.map((nome, index) => ({
    id: `jogador-${index}`,
    nome,
    ativo: true,
    posicaoCirculo: index,
    eliminadoNoRanking: null,
    eliminadoNaFase: null,
  }));
}

/**
 * Retorna o próximo jogador ativo no círculo após `posicaoAtual`.
 * Percorre o array ciclicamente pulando jogadores inativos.
 * Retorna null se não houver outro jogador ativo além do atual.
 */
export function proximoAtivoNoCirculo(
  jogadores: JogadorDuvido[],
  posicaoAtual: number,
): JogadorDuvido | null {
  const total = jogadores.length;
  for (let i = 1; i < total; i++) {
    const candidato = jogadores[(posicaoAtual + i) % total];
    if (candidato.ativo) return candidato;
  }
  return null;
}
