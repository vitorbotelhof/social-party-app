import type {
  ConfiguracaoSincronia,
  DuplaSincronia,
  EstadoJogoSincronia,
  FaseSincronia,
  PlacarDupla,
  ResultadoRodadaSincronia,
} from './types';
import { montarBaralho } from './palavras';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function criarPlacarInicial(
  duplas: DuplaSincronia[],
): Record<string, PlacarDupla> {
  const placar: Record<string, PlacarDupla> = {};
  for (const dupla of duplas) {
    placar[dupla.id] = {
      duplaId: dupla.id,
      pontos: 0,
      acertos: 0,
      infracoes: 0,
      skips: 0,
    };
  }
  return placar;
}

function formarDuplas(
  jogadores: { id: string; nome: string }[],
): DuplaSincronia[] {
  const duplas: DuplaSincronia[] = [];
  for (let i = 0; i + 1 < jogadores.length; i += 2) {
    duplas.push({
      id: `dupla-${i / 2}`,
      jogador0: jogadores[i]!,
      jogador1: jogadores[i + 1]!,
    });
  }
  return duplas;
}

function proximaPalavra(estado: EstadoJogoSincronia): string | null {
  if (estado.indicePalavra >= estado.baralho.length) return null;
  return estado.baralho[estado.indicePalavra] ?? null;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Cria o estado inicial do jogo. */
export function criarEstadoInicial(
  config: ConfiguracaoSincronia,
): EstadoJogoSincronia {
  const duplas = formarDuplas(config.jogadores);
  const baralho = montarBaralho(config.incluirDificil);

  const estado: EstadoJogoSincronia = {
    config,
    duplas,
    fase: 'vez_de',
    duplaIndice: 0,
    voltaAtual: 1,
    palavraAtual: null,
    skipsUsados: 0,
    acertosRodada: 0,
    infracoesRodada: 0,
    palavrasJogadas: [],
    ultimoResultado: null,
    placar: criarPlacarInicial(duplas),
    baralho,
    indicePalavra: 0,
    contagemAtual: null,
  };

  return estado;
}

/** Inicia a contagem regressiva (transição de vez_de → contagem). */
export function iniciarContagem(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia {
  return {
    ...estado,
    fase: 'contagem',
    contagemAtual: 3,
    // Reset rodada state
    palavraAtual: null,
    skipsUsados: 0,
    acertosRodada: 0,
    infracoesRodada: 0,
    palavrasJogadas: [],
    ultimoResultado: null,
  };
}

/** Atualiza o número da contagem regressiva. */
export function tickContagem(
  estado: EstadoJogoSincronia,
  valor: number,
): EstadoJogoSincronia {
  return { ...estado, contagemAtual: valor };
}

/** Inicia a rodada ativa (contagem chegou a 0). */
export function iniciarRodada(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia {
  const palavra = proximaPalavra(estado);
  return {
    ...estado,
    fase: 'rodada_ativa',
    contagemAtual: null,
    palavraAtual: palavra,
    indicePalavra: estado.indicePalavra + (palavra ? 1 : 0),
  };
}

/** Registra um acerto na rodada atual. */
export function registrarAcerto(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia {
  const proximaP = proximaPalavra({
    ...estado,
    indicePalavra: estado.indicePalavra,
  });

  const palavrasJogadas = [
    ...estado.palavrasJogadas,
    { palavra: estado.palavraAtual ?? '', resultado: 'acerto' as const },
  ];

  return {
    ...estado,
    acertosRodada: estado.acertosRodada + 1,
    palavraAtual: proximaP,
    indicePalavra: estado.indicePalavra + (proximaP ? 1 : 0),
    palavrasJogadas,
  };
}

/** Registra uma infração na rodada atual. */
export function registrarInfracao(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia {
  const proximaP = proximaPalavra({
    ...estado,
    indicePalavra: estado.indicePalavra,
  });

  const palavrasJogadas = [
    ...estado.palavrasJogadas,
    { palavra: estado.palavraAtual ?? '', resultado: 'infracao' as const },
  ];

  return {
    ...estado,
    infracoesRodada: estado.infracoesRodada + 1,
    palavraAtual: proximaP,
    indicePalavra: estado.indicePalavra + (proximaP ? 1 : 0),
    palavrasJogadas,
  };
}

/** Pula a palavra atual (se houver skips disponíveis). Retorna null se não puder pular. */
export function registrarSkip(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia | null {
  const limite = estado.config.skipsPorRodada;
  if (limite !== null && estado.skipsUsados >= limite) return null;

  const proximaP = proximaPalavra({
    ...estado,
    indicePalavra: estado.indicePalavra,
  });

  const palavrasJogadas = [
    ...estado.palavrasJogadas,
    { palavra: estado.palavraAtual ?? '', resultado: 'skip' as const },
  ];

  return {
    ...estado,
    skipsUsados: estado.skipsUsados + 1,
    palavraAtual: proximaP,
    indicePalavra: estado.indicePalavra + (proximaP ? 1 : 0),
    palavrasJogadas,
  };
}

/** Encerra a rodada por tempo ou por qualquer outra razão. */
export function encerrarRodada(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia {
  // Registrar palavra não concluída como 'tempo' se houver
  const palavrasFinais =
    estado.palavraAtual
      ? [
          ...estado.palavrasJogadas,
          { palavra: estado.palavraAtual, resultado: 'tempo' as const },
        ]
      : estado.palavrasJogadas;

  const pontosGanhos = Math.max(
    0,
    estado.acertosRodada * 2 - estado.infracoesRodada,
  );

  const resultado: ResultadoRodadaSincronia = {
    acertos: estado.acertosRodada,
    infracoes: estado.infracoesRodada,
    skips: estado.skipsUsados,
    pontosGanhos,
    palavrasJogadas: palavrasFinais,
  };

  // Atualizar placar da dupla atual
  const duplaAtual = estado.duplas[estado.duplaIndice];
  const placarAtualizado = { ...estado.placar };
  if (duplaAtual) {
    const placarDupla = placarAtualizado[duplaAtual.id] ?? {
      duplaId: duplaAtual.id,
      pontos: 0,
      acertos: 0,
      infracoes: 0,
      skips: 0,
    };
    placarAtualizado[duplaAtual.id] = {
      ...placarDupla,
      pontos: placarDupla.pontos + pontosGanhos,
      acertos: placarDupla.acertos + estado.acertosRodada,
      infracoes: placarDupla.infracoes + estado.infracoesRodada,
      skips: placarDupla.skips + estado.skipsUsados,
    };
  }

  return {
    ...estado,
    fase: 'resultado_rodada',
    palavraAtual: null,
    palavrasJogadas: palavrasFinais,
    ultimoResultado: resultado,
    placar: placarAtualizado,
  };
}

/** Avança para a próxima dupla/volta (ou encerra o jogo se acabou). */
export function avancarTurno(
  estado: EstadoJogoSincronia,
): EstadoJogoSincronia {
  const { duplas, duplaIndice, voltaAtual, config } = estado;
  const proximaDuplaIndice = duplaIndice + 1;

  if (proximaDuplaIndice < duplas.length) {
    // Ainda há duplas para jogar nesta volta
    return {
      ...estado,
      fase: 'vez_de',
      duplaIndice: proximaDuplaIndice,
      palavrasJogadas: [],
      ultimoResultado: null,
    };
  }

  // Todas as duplas jogaram esta volta
  const proximaVolta = voltaAtual + 1;
  if (proximaVolta <= config.voltasPorDupla) {
    // Começa a próxima volta do zero
    return {
      ...estado,
      fase: 'vez_de',
      duplaIndice: 0,
      voltaAtual: proximaVolta,
      palavrasJogadas: [],
      ultimoResultado: null,
    };
  }

  // Jogo encerrado
  return { ...estado, fase: 'encerrado' };
}

/** Retorna qual jogador está dando dicas nesta volta. */
export function quemDaDica(
  dupla: DuplaSincronia,
  voltaAtual: number,
): { id: string; nome: string } {
  // Volta 1 → jogador0 dá dica; volta 2 → jogador1; volta 3 → jogador0; etc.
  return voltaAtual % 2 === 1 ? dupla.jogador0 : dupla.jogador1;
}

/** Retorna qual jogador está adivinhando nesta volta. */
export function quemAdivinha(
  dupla: DuplaSincronia,
  voltaAtual: number,
): { id: string; nome: string } {
  return voltaAtual % 2 === 1 ? dupla.jogador1 : dupla.jogador0;
}

/** Ranking ordenado por pontos (decrescente). */
export function getRanking(
  estado: EstadoJogoSincronia,
): { dupla: DuplaSincronia; placar: PlacarDupla }[] {
  return [...estado.duplas]
    .map((dupla) => ({
      dupla,
      placar: estado.placar[dupla.id] ?? {
        duplaId: dupla.id,
        pontos: 0,
        acertos: 0,
        infracoes: 0,
        skips: 0,
      },
    }))
    .sort((a, b) => b.placar.pontos - a.placar.pontos);
}

/** Verifica se a dupla pode pular a palavra atual. */
export function podeSkip(estado: EstadoJogoSincronia): boolean {
  const limite = estado.config.skipsPorRodada;
  return limite === null || estado.skipsUsados < limite;
}

/** Calcula o total de turnos no jogo. */
export function totalTurnos(estado: EstadoJogoSincronia): number {
  return estado.duplas.length * estado.config.voltasPorDupla;
}

/** Calcula o turno atual (1-based). */
export function turnoAtual(estado: EstadoJogoSincronia): number {
  return (
    (estado.voltaAtual - 1) * estado.duplas.length + estado.duplaIndice + 1
  );
}
