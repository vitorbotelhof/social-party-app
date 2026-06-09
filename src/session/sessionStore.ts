/**
 * Session Store — estado vivo da sessão social.
 *
 * Armazenamento in-memory com modelo pub/sub.
 * A sessão sobrevive enquanto o app está em foreground.
 * Persistência em AsyncStorage pode ser adicionada aqui futuramente.
 */

import type { Player, PlayerId, GameId } from '@/engine/types';
import type {
  SessionIdentity,
  SessaoJogador,
  JogoSessao,
  Momento,
  TipoMomento,
  TemperaturaEmocional,
  GrupoIdentidade,
  VibeId,
} from './types';

// ─── Estado interno ───────────────────────────────────────────────────────────

let sessaoAtual: SessionIdentity | null = null;
const ouvintes = new Set<(sessao: SessionIdentity | null) => void>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function notificar(): void {
  for (const cb of ouvintes) cb(sessaoAtual);
}

// ─── Ciclo de vida da sessão ──────────────────────────────────────────────────

/**
 * Inicia uma nova sessão social.
 * Deve ser chamado quando o grupo decide começar — antes do primeiro jogo.
 */
export function iniciarSessao(
  jogadores: Player[],
  vibe: VibeId | null = null,
): SessionIdentity {
  const sessaoJogadores: SessaoJogador[] = jogadores.map((j) => ({
    id: j.id,
    nome: j.nome,
    vezesJulgado: 0,
    vezesVotado: 0,
    clutchsMrWhite: 0,
    colapsos: 0,
    pontosTotais: 0,
    vezesEliminado: 0,
    vezesContaminado: 0,
    acoesCorrompidas: 0,
    acertosLeitura: 0,
    vezesDesconhecido: 0,
    acertosFazAi: 0,
    passesFazAi: 0,
    turnosCaoticosFazAi: 0,
    liderancasAlianca: 0,
    missoesAlianca: 0,
    vezesTraidorAlianca: 0,
    dubidasCertasDuvido: 0,
    rankingsVencidosDuvido: 0,
    objetivosArquivosAlcancados: 0,
    segredosExpostosArquivos: 0,
    acoesArquivosConcluidas: 0,
  }));

  sessaoAtual = {
    id: gerarId(),
    iniciadoEm: Date.now(),
    finalizadoEm: null,
    jogadores: sessaoJogadores,
    vibeSelecionada: vibe,
    vibeDetectada: null,
    temperatura: 'frio',
    grupoIdentidade: null,
    jogosDaSessao: [],
    momentosMemoraveis: [],
    callbacksUsados: [],
    totalRodadas: 0,
  };

  notificar();
  return sessaoAtual;
}

/**
 * Encerra a sessão e registra o timestamp final.
 */
export function finalizarSessao(): SessionIdentity | null {
  if (!sessaoAtual) return null;
  sessaoAtual = { ...sessaoAtual, finalizadoEm: Date.now() };
  notificar();
  return sessaoAtual;
}

/**
 * Limpa o estado da sessão completamente.
 */
export function resetarSessao(): void {
  sessaoAtual = null;
  notificar();
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

export function getSessaoAtual(): SessionIdentity | null {
  return sessaoAtual;
}

export function observarSessao(
  cb: (sessao: SessionIdentity | null) => void,
): () => void {
  ouvintes.add(cb);
  cb(sessaoAtual);
  return () => {
    ouvintes.delete(cb);
  };
}

// ─── Registro de jogos ────────────────────────────────────────────────────────

/**
 * Marca o início de um jogo dentro da sessão.
 */
export function registrarJogoIniciado(jogoId: GameId): void {
  if (!sessaoAtual) return;

  const jogoAtivo: JogoSessao = {
    jogoId,
    iniciadoEm: Date.now(),
    finalizadoEm: null,
    momentos: [],
  };

  sessaoAtual = {
    ...sessaoAtual,
    jogosDaSessao: [...sessaoAtual.jogosDaSessao, jogoAtivo],
  };
  notificar();
}

/**
 * Finaliza o jogo mais recente do tipo `jogoId` e adiciona dados estatísticos.
 */
export function registrarJogoFinalizado(
  jogoId: GameId,
  dados: Partial<
    Omit<JogoSessao, 'jogoId' | 'iniciadoEm' | 'finalizadoEm' | 'momentos'>
  >,
): void {
  if (!sessaoAtual) return;

  let atualizou = false;
  const jogosAtualizados = sessaoAtual.jogosDaSessao.map((j) => {
    if (j.jogoId === jogoId && j.finalizadoEm === null && !atualizou) {
      atualizou = true;
      return { ...j, ...dados, finalizadoEm: Date.now() };
    }
    return j;
  });

  sessaoAtual = { ...sessaoAtual, jogosDaSessao: jogosAtualizados };
  notificar();
}

// ─── Registro de momentos ─────────────────────────────────────────────────────

/**
 * Registra um momento memorável na sessão.
 * Retorna o momento criado com id e timestamp preenchidos.
 */
export function registrarMomento(
  momento: Omit<Momento, 'id' | 'timestamp'>,
): Momento {
  const m: Momento = {
    ...momento,
    id: gerarId(),
    timestamp: Date.now(),
  };

  if (!sessaoAtual) return m;

  let anexouAoJogo = false;
  const jogosDaSessao = [...sessaoAtual.jogosDaSessao]
    .reverse()
    .map((jogo) => {
      if (
        !anexouAoJogo &&
        jogo.jogoId === momento.jogoId &&
        jogo.finalizadoEm === null
      ) {
        anexouAoJogo = true;
        return { ...jogo, momentos: [...jogo.momentos, m] };
      }
      return jogo;
    })
    .reverse();

  sessaoAtual = {
    ...sessaoAtual,
    jogosDaSessao,
    momentosMemoraveis: [...sessaoAtual.momentosMemoraveis, m],
    totalRodadas: sessaoAtual.totalRodadas + 1,
  };
  notificar();
  return m;
}

// ─── Atualização de jogador ───────────────────────────────────────────────────

/**
 * Atualiza os sinais acumulados de um jogador na sessão.
 */
export function atualizarJogadorSessao(
  jogadorId: PlayerId,
  delta: Partial<SessaoJogador>,
): void {
  if (!sessaoAtual) return;

  sessaoAtual = {
    ...sessaoAtual,
    jogadores: sessaoAtual.jogadores.map((j) =>
      j.id === jogadorId ? { ...j, ...delta } : j,
    ),
  };
  notificar();
}

// ─── Estado emocional e identidade ───────────────────────────────────────────

export function atualizarTemperatura(temperatura: TemperaturaEmocional): void {
  if (!sessaoAtual || sessaoAtual.temperatura === temperatura) return;
  sessaoAtual = { ...sessaoAtual, temperatura };
  notificar();
}

export function atualizarGrupoIdentidade(
  identidade: GrupoIdentidade | null,
): void {
  if (!sessaoAtual || sessaoAtual.grupoIdentidade === identidade) return;
  sessaoAtual = { ...sessaoAtual, grupoIdentidade: identidade };
  notificar();
}

export function atualizarVibeDetectada(vibe: VibeId | null): void {
  if (!sessaoAtual || sessaoAtual.vibeDetectada === vibe) return;
  sessaoAtual = { ...sessaoAtual, vibeDetectada: vibe };
  notificar();
}

// ─── Callbacks ────────────────────────────────────────────────────────────────

/**
 * Marca um callback como usado — impede repetição na mesma sessão.
 */
export function marcarCallbackUsado(id: string): void {
  if (!sessaoAtual) return;
  if (sessaoAtual.callbacksUsados.includes(id)) return;
  sessaoAtual = {
    ...sessaoAtual,
    callbacksUsados: [...sessaoAtual.callbacksUsados, id],
  };
  // Não notifica — callback não precisa re-render de ninguém.
}

// ─── Helpers de leitura ───────────────────────────────────────────────────────

/**
 * Constrói o mapa nome por PlayerId da sessão atual.
 * Útil para callbacks e dossiê.
 */
export function construirMapaNomes(): Map<PlayerId, string> {
  const sessao = getSessaoAtual();
  if (!sessao) return new Map();
  return new Map(sessao.jogadores.map((j) => [j.id, j.nome]));
}

/**
 * Conta ocorrências de um tipo de momento na sessão atual.
 */
export function contarMomentos(tipo: TipoMomento): number {
  const sessao = getSessaoAtual();
  if (!sessao) return 0;
  return sessao.momentosMemoraveis.filter((m) => m.tipo === tipo).length;
}

/**
 * Retorna jogos concluídos da sessão.
 */
export function getJogosCompletos(): JogoSessao[] {
  const sessao = getSessaoAtual();
  if (!sessao) return [];
  return sessao.jogosDaSessao.filter((j) => j.finalizadoEm !== null);
}

// ─── Conveniência ─────────────────────────────────────────────────────────────

/**
 * Garante que a sessão está inicializada e registra o início de um jogo.
 *
 * Se não houver sessão ativa, cria uma nova com os jogadores fornecidos.
 * Se já houver, apenas registra o novo jogo — sem reset de dados.
 *
 * Chamado pelos fluxos de configuração local antes de iniciar o jogo.
 */
export function assegurarSessaoIniciada(
  jogadores: Array<{ id: string; nome: string }>,
  jogoId: GameId,
): void {
  if (!sessaoAtual) {
    const players: Player[] = jogadores.map((j, i) => ({
      id: j.id as PlayerId,
      nome: j.nome,
      papelSecreto: null,
      ehAnfitriao: i === 0,
      estaConectado: true,
      entrouEm: Date.now() + i,
    }));
    // Nota: iniciarSessao já garante os campos padrão de SessaoJogador,
    // incluindo os campos de Inquisição (vezesEliminado, vezesContaminado, acoesCorrompidas).
    iniciarSessao(players);
  } else if (sessaoAtual.jogadores.length === 0 && jogadores.length > 0) {
    // Sessões podem começar anonimamente em Eu Nunca e ganhar participantes
    // quando o grupo migra para um jogo nominal, preservando o histórico.
    sessaoAtual = {
      ...sessaoAtual,
      jogadores: jogadores.map((j) => ({
        id: j.id as PlayerId,
        nome: j.nome,
        vezesJulgado: 0,
        vezesVotado: 0,
        clutchsMrWhite: 0,
        colapsos: 0,
        pontosTotais: 0,
        vezesEliminado: 0,
        vezesContaminado: 0,
        acoesCorrompidas: 0,
        acertosLeitura: 0,
        vezesDesconhecido: 0,
        acertosFazAi: 0,
        passesFazAi: 0,
        turnosCaoticosFazAi: 0,
        liderancasAlianca: 0,
        missoesAlianca: 0,
        vezesTraidorAlianca: 0,
        dubidasCertasDuvido: 0,
        rankingsVencidosDuvido: 0,
        objetivosArquivosAlcancados: 0,
        segredosExpostosArquivos: 0,
        acoesArquivosConcluidas: 0,
      })),
    };
    notificar();
  }
  registrarJogoIniciado(jogoId);
}
