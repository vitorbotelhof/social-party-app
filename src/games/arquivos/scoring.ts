import type { PlayerId } from '@/engine/types';
import type {
  ArquivosCase,
  ArquivosCollectiveGrade,
  ArquivosCollectiveResult,
  ArquivosIndividualResult,
  ArquivosPrivateState,
  ArquivosQuestionScore,
  ArquivosVerdict,
  ArquivosVerdictAnswerValue,
} from './types';

export function calcularResultadoColetivo(
  caso: ArquivosCase,
  verdict: ArquivosVerdict,
): ArquivosCollectiveResult {
  const questionScores: ArquivosQuestionScore[] = caso.verdictQuestions.map(
    (question) => {
      const answer = verdict.answers.find(
        (item) => item.questionId === question.id,
      );
      const acertou = answer
        ? respostasEquivalentes(answer.value, question.respostaCorreta)
        : false;
      return {
        questionId: question.id,
        acertou,
        pontosPossiveis: question.peso,
        pontosObtidos: acertou ? question.peso : 0,
        explicacao: acertou
          ? 'Resposta correta.'
          : `Resposta esperada: ${question.respostaCorreta}.`,
      };
    },
  );
  const pontosObtidos = questionScores.reduce(
    (total, score) => total + score.pontosObtidos,
    0,
  );
  const pontosPossiveis = questionScores.reduce(
    (total, score) => total + score.pontosPossiveis,
    0,
  );
  const aproveitamento =
    pontosPossiveis === 0 ? 0 : pontosObtidos / pontosPossiveis;

  return {
    grade: calcularGrade(aproveitamento),
    pontosObtidos,
    pontosPossiveis,
    questionScores,
    resumo: montarResumoColetivo(aproveitamento),
    pistasDecisivasUsadas: caso.truth.documentosDecisivos,
    pistasIgnoradas: [],
  };
}

export function calcularResultadosIndividuais(
  caso: ArquivosCase,
  privateStates: Readonly<Record<PlayerId, ArquivosPrivateState>>,
  collectiveResult: ArquivosCollectiveResult,
): ArquivosIndividualResult[] {
  const responsavelScore = collectiveResult.questionScores.find(
    (s) => s.questionId === 'q-responsavel',
  );
  const segredoScore = collectiveResult.questionScores.find(
    (s) => s.questionId === 'q-segredo-central',
  );
  const motivacaoScore = collectiveResult.questionScores.find(
    (s) => s.questionId === 'q-motivacao',
  );
  const grupoIdentificouResponsavel = responsavelScore?.acertou ?? false;
  const grupoDescobrituSegredo = segredoScore?.acertou ?? false;
  const grupoEntendeuMotivacao = motivacaoScore?.acertou ?? false;

  const titlesByCharacter: Readonly<Record<string, string>> = {
    'char-clara': caso.finalTitles[0] ?? 'A Chave do Caso',
    'char-rafael': caso.finalTitles[1] ?? 'O Omitidor Convicto',
    'char-davi': caso.finalTitles[2] ?? 'A Pessoa Que Sabia Demais',
    'char-bianca': caso.finalTitles[3] ?? 'A Teoria Perigosa',
    'char-nanda': caso.finalTitles[4] ?? 'A Testemunha Incômoda',
    'char-marina': caso.finalTitles[5] ?? 'A Guardiã da Sala',
  };

  return Object.values(privateStates).map((privateState) => {
    const charId = privateState.character.id;
    const completedActions = privateState.completedSecretActions.length;

    const { status, segredoExposto, resumo } = avaliarObjetivoIndividual(
      charId,
      collectiveResult,
      grupoIdentificouResponsavel,
      grupoDescobrituSegredo,
      grupoEntendeuMotivacao,
      completedActions,
    );

    const tituloPosJogo =
      titlesByCharacter[charId] ??
      caso.finalTitles[0] ??
      'Peça do Caso';

    return {
      playerId: privateState.playerId,
      characterId: charId,
      objectiveId: privateState.character.objetivoIndividual.id,
      status,
      segredoExposto,
      tituloPosJogo,
      resumo,
    };
  });
}

function avaliarObjetivoIndividual(
  charId: string,
  collectiveResult: ArquivosCollectiveResult,
  grupoIdentificouResponsavel: boolean,
  grupoDescobrituSegredo: boolean,
  grupoEntendeuMotivacao: boolean,
  completedActions: number,
): {
  status: ArquivosIndividualResult['status'];
  segredoExposto: boolean;
  resumo: string;
} {
  const fracasso = collectiveResult.grade === 'fracasso_investigativo';

  switch (charId) {
    case 'char-clara': {
      // Objetivo: não ser identificada como responsável pelo sumiço
      const foiAcusada =
        grupoIdentificouResponsavel === false &&
        collectiveResult.grade !== 'caso_resolvido' &&
        collectiveResult.grade !== 'caso_quase_resolvido';
      const segredoExposto = grupoDescobrituSegredo;
      if (fracasso) {
        return {
          status: 'parcial',
          segredoExposto,
          resumo:
            'A investigação não chegou a uma conclusão clara. Sua estratégia ficou sem veredicto.',
        };
      }
      if (grupoIdentificouResponsavel && !foiAcusada) {
        return {
          status: 'alcancado',
          segredoExposto,
          resumo:
            'O grupo identificou o responsável correto sem apontar para você. Sua reputação sobreviveu à investigação.',
        };
      }
      return {
        status: 'parcial',
        segredoExposto,
        resumo:
          'O pedido de versão favorável foi percebido pelo grupo, mas você não foi identificada como a principal responsável.',
      };
    }

    case 'char-rafael': {
      // Objetivo: fazer o grupo entender as métricas infladas sem parecer sabotagem
      const segredoExposto = grupoIdentificouResponsavel;
      if (grupoDescobrituSegredo && grupoEntendeuMotivacao) {
        return {
          status: 'alcancado',
          segredoExposto,
          resumo:
            'O grupo descobriu o problema das métricas e entendeu sua motivação como proteção, não sabotagem.',
        };
      }
      if (grupoDescobrituSegredo || grupoEntendeuMotivacao) {
        return {
          status: 'parcial',
          segredoExposto,
          resumo:
            'O grupo encontrou parte da verdade, mas sua motivação ficou ambígua na mesa.',
        };
      }
      return {
        status: 'falhou',
        segredoExposto,
        resumo:
          'O segredo das métricas não foi descoberto. Sua ação pareceu sabotagem sem propósito claro.',
      };
    }

    case 'char-davi': {
      // Objetivo: não ser confundido como manipulador dos dados
      const segredoExposto = grupoDescobrituSegredo;
      if (fracasso) {
        return {
          status: 'parcial',
          segredoExposto,
          resumo:
            'A investigação não fechou. A suspeita sobre sua participação nos dados ficou em aberto.',
        };
      }
      if (grupoIdentificouResponsavel && grupoDescobrituSegredo) {
        return {
          status: 'alcancado',
          segredoExposto,
          resumo:
            'O grupo entendeu quem era o responsável real e o papel das métricas sem te apontar como manipulador.',
        };
      }
      return {
        status: 'parcial',
        segredoExposto,
        resumo:
          'Houve suspeita sobre sua participação técnica, mas você não foi o foco central da acusação.',
      };
    }

    case 'char-bianca': {
      // Objetivo: não vazar informações e sair sem danos reputacionais
      const segredoExposto =
        completedActions === 0 && collectiveResult.grade !== 'fracasso_investigativo';
      if (fracasso) {
        return {
          status: 'parcial',
          segredoExposto,
          resumo:
            'A investigação não chegou a uma conclusão. Sua relação com a imprensa ficou fora do radar.',
        };
      }
      if (!segredoExposto) {
        return {
          status: 'alcancado',
          segredoExposto,
          resumo:
            'Você navegou pela investigação sem se tornar o foco da suspeita. Seus contatos na imprensa ficaram fora do jogo.',
        };
      }
      return {
        status: 'parcial',
        segredoExposto,
        resumo:
          'O grupo percebeu algo suspeito no seu comportamento, mas não conseguiu provar nada concreto.',
      };
    }

    case 'char-nanda': {
      // Objetivo: proteger a empresa de um escândalo público
      const segredoExposto = grupoDescobrituSegredo && grupoIdentificouResponsavel;
      if (grupoIdentificouResponsavel && grupoEntendeuMotivacao) {
        return {
          status: 'alcancado',
          segredoExposto,
          resumo:
            'A investigação encontrou a verdade sem criar um escândalo público. O caso ficou dentro do grupo.',
        };
      }
      if (fracasso) {
        return {
          status: 'falhou',
          segredoExposto,
          resumo:
            'A investigação ficou sem conclusão. O risco de escândalo continuou indefinido.',
        };
      }
      return {
        status: 'parcial',
        segredoExposto,
        resumo:
          'O grupo chegou perto da verdade, mas a narrativa do caso ainda pode alimentar rumores.',
      };
    }

    case 'char-marina': {
      // Objetivo: não ser apontada como responsável pela falha operacional
      const segredoExposto = false;
      if (grupoIdentificouResponsavel) {
        return {
          status: 'alcancado',
          segredoExposto,
          resumo:
            'O grupo encontrou o responsável correto e não apontou para uma falha sua. Sua operação da sala ficou fora do centro.',
        };
      }
      if (fracasso) {
        return {
          status: 'parcial',
          segredoExposto,
          resumo:
            'A investigação não fechou. A questão de quem controlava a sala ficou sem resposta.',
        };
      }
      return {
        status: 'parcial',
        segredoExposto,
        resumo:
          'Houve questionamentos sobre o acesso à sala, mas você não foi apontada como a principal responsável.',
      };
    }

    default: {
      const status =
        fracasso ? 'falhou' : completedActions > 0 ? 'alcancado' : 'parcial';
      return {
        status,
        segredoExposto: false,
        resumo:
          status === 'alcancado'
            ? 'Você avançou seu objetivo pessoal sem perder o foco da investigação.'
            : status === 'parcial'
              ? 'Seu objetivo pessoal ficou em aberto, mas ainda influenciou a mesa.'
              : 'Seu objetivo pessoal foi prejudicado pelo rumo da investigação.',
      };
    }
  }
}

function calcularGrade(aproveitamento: number): ArquivosCollectiveGrade {
  if (aproveitamento >= 1) return 'caso_resolvido';
  if (aproveitamento >= 0.75) return 'caso_quase_resolvido';
  if (aproveitamento >= 0.5) return 'parcialmente_resolvido';
  if (aproveitamento > 0) return 'verdade_distorcida';
  return 'fracasso_investigativo';
}

function montarResumoColetivo(aproveitamento: number): string {
  if (aproveitamento >= 1) {
    return 'O grupo reconstruiu a verdade do caso. Todas as perguntas centrais foram respondidas corretamente.';
  }
  if (aproveitamento >= 0.75) {
    return 'O grupo chegou muito perto. A investigação foi bem — mas faltou fechar uma peça.';
  }
  if (aproveitamento >= 0.5) {
    return 'O grupo encontrou parte da verdade, mas a versão final ainda tem lacunas importantes.';
  }
  if (aproveitamento > 0) {
    return 'O grupo captou alguns fatos reais, mas montou uma narrativa que não se sustenta.';
  }
  return 'O grupo não conseguiu reconstruir a verdade do caso. As pistas estavam lá.';
}

function respostasEquivalentes(
  answer: ArquivosVerdictAnswerValue,
  correctAnswer: string,
): boolean {
  const normalizedCorrect = normalizarResposta(correctAnswer);
  if (typeof answer === 'string') {
    return normalizarResposta(answer) === normalizedCorrect;
  }
  return answer.some((item) => normalizarResposta(item) === normalizedCorrect);
}

function normalizarResposta(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
