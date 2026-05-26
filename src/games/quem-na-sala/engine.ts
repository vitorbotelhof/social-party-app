// ─── Quem na Sala? — Engine de Sessão ────────────────────────────────────────
//
// Controla o estado da sessão local:
// pergunta → passando_para → votando → (próximo jogador) → revelacao → pergunta

import type {
  CartaQNS,
  ConfiguracaoQNS,
  JogadorQNS,
  ResultadoRodada,
  SessaoQNS,
  VotosRodada,
} from './types';

export function criarSessao(config: ConfiguracaoQNS): SessaoQNS {
  return {
    config,
    subFase: 'pergunta',
    cartaAtual: null,
    cartasUsadas: [],
    totalRodadas: 0,
    indiceVotanteAtual: 0,
    votosRodadaAtual: {},
    historico: [],
    iniciouEm: Date.now(),
  };
}

export function calcularResultado(
  carta: CartaQNS,
  votos: VotosRodada,
  jogadores: JogadorQNS[],
): ResultadoRodada {
  // Conta votos por jogador
  const contagem: Record<string, number> = {};
  for (const j of jogadores) contagem[j.id] = 0;
  for (const votadoId of Object.values(votos)) {
    contagem[votadoId] = (contagem[votadoId] ?? 0) + 1;
  }

  const maxVotos = Math.max(0, ...Object.values(contagem));
  const vencedores = jogadores.filter(
    (j) => (contagem[j.id] ?? 0) === maxVotos,
  );

  const empate = vencedores.length > 1;
  const vencedorId = empate ? null : (vencedores[0]?.id ?? null);

  const votosContagem = jogadores
    .map((j) => ({ jogadorId: j.id, nome: j.nome, votos: contagem[j.id] ?? 0 }))
    .sort((a, b) => b.votos - a.votos);

  return {
    cartaId: carta.id,
    complemento: carta.complemento,
    votosContagem,
    vencedorId,
    empate,
  };
}
