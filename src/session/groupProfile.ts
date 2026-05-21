/**
 * Group Profile — detecta o padrão dominante de comportamento do grupo.
 *
 * Identidades:
 *   caotico      → muitos momentos de caos, baixa previsibilidade
 *   competitivo  → votos concentrados, clutches frequentes
 *   silencioso   → poucos momentos, jogos lentos
 *   eficiente    → jogos concluídos rapidamente, poucos erros
 *   paranoico    → muitas votações, empates frequentes
 *   intimo       → unanimidades altas, grupo coeso
 *   destrutivo   → colapsos NPL, alta taxa de erro
 *
 * A detecção requer pelo menos 1 jogo completo para ser confiável.
 * Retorna null se não há dados suficientes.
 */

import {
  getJogosCompletos,
  contarMomentos,
  atualizarGrupoIdentidade,
} from './sessionStore';
import type { GrupoIdentidade } from './types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  caoticoMomentos: 3,       // 3+ momentos de caos → caótico
  competitivoClutch: 2,     // 2+ clutches → competitivo
  paranoicoVotacoes: 3,     // 3+ paranoia_total → paranoico
  intinoUnanimidades: 2,    // 2+ unanimidades → íntimo
  destivoColapsos: 2,       // 2+ colapsos NPL → destrutivo
  silenciosoMaxMomentos: 1, // ≤1 momento com 2+ jogos → silencioso
  minimoJogos: 1,           // mínimo para detectar identidade
} as const;

// ─── Pontuação por sinal ──────────────────────────────────────────────────────

interface PontuacaoIdentidade {
  identidade: GrupoIdentidade;
  pontos: number;
}

function pontuar(): PontuacaoIdentidade[] {
  const unanimidades = contarMomentos('unanimidade');
  const clutches = contarMomentos('clutch');
  const paranoia = contarMomentos('paranoia_total');
  const colapsos = contarMomentos('colapso_npl');
  const viradas = contarMomentos('virada');
  const sobreviventes = contarMomentos('sobrevivente');
  const perfeitos = contarMomentos('perfeito');

  // Inquisição
  const corrupcoes = contarMomentos('corrupcao_revelada');
  const inversoes = contarMomentos('inversao');
  const paranoia_max = contarMomentos('paranoia_maxima');
  const colapsos_inq = contarMomentos('colapso_inquisicao');

  const totalMomentos =
    unanimidades + clutches + paranoia + colapsos + viradas +
    sobreviventes + perfeitos + contarMomentos('julgamento') +
    contarMomentos('revelacao') +
    corrupcoes + inversoes + paranoia_max + colapsos_inq;

  const jogosCompletos = getJogosCompletos().length;

  const pontuacao: PontuacaoIdentidade[] = [
    {
      identidade: 'caotico',
      // Inquisição: grupo que elimina inocentes e não percebe corrupção é caótico
      pontos: paranoia * 2 + viradas * 2 + colapsos + colapsos_inq * 3 + corrupcoes,
    },
    {
      identidade: 'competitivo',
      pontos: clutches * 3 + sobreviventes * 2,
    },
    {
      identidade: 'silencioso',
      pontos: jogosCompletos >= 2 && totalMomentos <= THRESHOLDS.silenciosoMaxMomentos ? 5 : 0,
    },
    {
      identidade: 'eficiente',
      pontos: perfeitos * 3 + (jogosCompletos >= 2 && totalMomentos <= 2 ? 2 : 0),
    },
    {
      identidade: 'paranoico',
      // Inquisição: empates e votações espalhadas definem o grupo paranoico
      pontos: paranoia * 3 + paranoia_max * 3 + colapsos_inq,
    },
    {
      identidade: 'intimo',
      pontos: unanimidades * 3,
    },
    {
      identidade: 'destrutivo',
      // Inquisição: corrompidos vencendo e corrupções em cadeia → grupo destrutivo
      pontos: colapsos * 3 + viradas + inversoes * 3 + corrupcoes * 2,
    },
  ];

  return pontuacao.sort((a, b) => b.pontos - a.pontos);
}

// ─── Detecção ─────────────────────────────────────────────────────────────────

function detectar(): GrupoIdentidade | null {
  const jogosCompletos = getJogosCompletos().length;

  if (jogosCompletos < THRESHOLDS.minimoJogos) return null;

  const pontuacao = pontuar();
  const top = pontuacao[0];

  // Requer pontuação mínima para declarar identidade
  if (top.pontos < 2) return null;

  return top.identidade;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Reavalia e aplica a identidade do grupo.
 * Chamar após cada jogo finalizado ou momento relevante.
 */
export function reavaliarGrupo(): void {
  const identidade = detectar();
  atualizarGrupoIdentidade(identidade);
}

/**
 * Retorna a identidade detectada sem modificar o estado.
 */
export function detectarIdentidadeGrupo(): GrupoIdentidade | null {
  return detectar();
}
