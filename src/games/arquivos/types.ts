// ─── Arquivos — Contratos de Domínio ─────────────────────────────────────────

import type { PlayerId, RoomCode } from '@/engine/types';

export type ArquivosCaseId = string;
export type ArquivosCharacterId = string;
export type ArquivosFileId = string;
export type ArquivosEvidenceId = string;
export type ArquivosSecretActionId = string;
export type ArquivosTimelineEventId = string;
export type ArquivosQuestionId = string;
export type ArquivosObjectiveId = string;

export type ArquivosPhase =
  | 'lobby'
  | 'apresentacao_caso'
  | 'leitura_privada'
  | 'investigacao_inicial'
  | 'nova_evidencia'
  | 'confronto'
  | 'veredito'
  | 'revelacao_resultados'
  | 'finalizado';

export type ArquivosCaseTone =
  | 'corporativo_leve'
  | 'familiar'
  | 'amizades'
  | 'casal'
  | 'festa'
  | 'viagem';

export type ArquivosIncidentType =
  | 'desaparecimento'
  | 'fraude'
  | 'sabotagem'
  | 'chantagem'
  | 'vazamento'
  | 'roubo'
  | 'acidente'
  | 'escandalo_corporativo'
  | 'heranca_contestada'
  | 'manipulacao_financeira'
  | 'objeto_sumido'
  | 'exposicao_publica'
  | 'quebra_de_confianca';

export type ArquivosFileType =
  | 'mensagem'
  | 'email'
  | 'foto'
  | 'recibo'
  | 'noticia'
  | 'gravacao'
  | 'registro'
  | 'relatorio'
  | 'documento'
  | 'print'
  | 'alerta'
  | 'anotacao';

export type ArquivosEvidenceKind =
  | 'essencial'
  | 'apoio'
  | 'ambigua'
  | 'distracao'
  | 'reputacional'
  | 'social';

export type ArquivosEvidenceVisibility =
  | 'publica'
  | 'privada'
  | 'grupo_especifico';

export type ArquivosSecretActionType =
  | 'comportamento_fisico_leve'
  | 'pergunta_social'
  | 'omissao_controlada'
  | 'defesa_publica'
  | 'pedido_de_informacao'
  | 'troca_de_lugar'
  | 'frase_gatilho';

export type ArquivosSecretActionStatus =
  | 'pendente'
  | 'concluida'
  | 'recusada'
  | 'substituida'
  | 'expirada';

export type ArquivosRewardType =
  | 'arquivo_extra'
  | 'detalhe_linha_do_tempo'
  | 'metainformacao'
  | 'confirmacao_parcial';

export type ArquivosVerdictQuestionType =
  | 'responsavel'
  | 'motivacao'
  | 'segredo_central'
  | 'documento_decisivo'
  | 'manipulacao'
  | 'erro_de_interpretacao';

export type ArquivosCollectiveGrade =
  | 'caso_resolvido'
  | 'caso_quase_resolvido'
  | 'parcialmente_resolvido'
  | 'verdade_distorcida'
  | 'fracasso_investigativo';

export type ArquivosIndividualObjectiveStatus =
  | 'alcancado'
  | 'parcial'
  | 'falhou';

export interface ArquivosPlayerRef {
  readonly id: PlayerId;
  readonly nome: string;
}

export interface ArquivosCaseConfig {
  readonly minPlayers: number;
  readonly targetPlayers: number;
  readonly maxPlayers: number;
  readonly targetDurationMinutes: {
    readonly min: number;
    readonly max: number;
  };
  readonly supportedPlayerCounts: readonly number[];
}

export interface ArquivosCaseIntro {
  readonly titulo: string;
  readonly subtitulo: string;
  readonly incidente: string;
  readonly resumoPublico: string;
  readonly tom: readonly ArquivosCaseTone[];
  readonly tipoIncidente: ArquivosIncidentType;
}

export interface ArquivosTimelineEvent {
  readonly id: ArquivosTimelineEventId;
  readonly horario: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly envolvidos: readonly ArquivosCharacterId[];
  readonly evidenceIds: readonly ArquivosEvidenceId[];
}

export interface ArquivosTruth {
  readonly resumo: string;
  readonly responsavelCharacterId: ArquivosCharacterId;
  readonly motivacaoPrincipal: string;
  readonly segredoCentral: string;
  readonly linhaDoTempoReal: readonly ArquivosTimelineEvent[];
  readonly documentosDecisivos: readonly ArquivosEvidenceId[];
  readonly errosDeInterpretacaoComuns: readonly string[];
}

export interface ArquivosRelationship {
  readonly characterId: ArquivosCharacterId;
  readonly descricao: string;
  readonly tensao: 'baixa' | 'media' | 'alta';
  readonly publico: boolean;
}

export interface ArquivosPersonalSecret {
  readonly titulo: string;
  readonly descricao: string;
  readonly riscoReputacional: 'baixo' | 'medio' | 'alto';
  readonly relacionadoAoCaso: boolean;
}

export interface ArquivosIndividualObjective {
  readonly id: ArquivosObjectiveId;
  readonly titulo: string;
  readonly descricao: string;
  readonly criteriosSucesso: readonly string[];
  readonly criteriosFalha: readonly string[];
}

export interface ArquivosCharacter {
  readonly id: ArquivosCharacterId;
  readonly nome: string;
  readonly papelNoCaso: string;
  readonly resumoPublico: string;
  readonly contextoPrivado: string;
  readonly conhecimentos: readonly string[];
  readonly segredo: ArquivosPersonalSecret;
  readonly objetivoIndividual: ArquivosIndividualObjective;
  readonly relacoes: readonly ArquivosRelationship[];
  readonly initialFileIds: readonly ArquivosFileId[];
}

export interface ArquivosFileAttachment {
  readonly tipo: 'imagem' | 'audio' | 'video' | 'documento';
  readonly assetPath: string;
  readonly descricaoAcessivel: string;
}

export interface ArquivosPrivateFile {
  readonly id: ArquivosFileId;
  readonly tipo: ArquivosFileType;
  readonly titulo: string;
  readonly corpo: string;
  readonly recebidoEm: ArquivosPhase;
  readonly evidenceIds: readonly ArquivosEvidenceId[];
  readonly desbloqueadoPorActionId?: ArquivosSecretActionId;
  readonly anexo?: ArquivosFileAttachment;
}

export interface ArquivosEvidence {
  readonly id: ArquivosEvidenceId;
  readonly titulo: string;
  readonly descricao: string;
  readonly tipo: ArquivosEvidenceKind;
  readonly visibilidade: ArquivosEvidenceVisibility;
  readonly phaseAvailable: ArquivosPhase;
  readonly relatedCharacterIds: readonly ArquivosCharacterId[];
  readonly sourceFileIds: readonly ArquivosFileId[];
  readonly isEssential: boolean;
}

export interface ArquivosSecretActionReward {
  readonly tipo: ArquivosRewardType;
  readonly titulo: string;
  readonly descricao: string;
  readonly fileId?: ArquivosFileId;
  readonly evidenceId?: ArquivosEvidenceId;
  readonly timelineEventId?: ArquivosTimelineEventId;
}

export interface ArquivosSecretActionAlternative {
  readonly instrucao: string;
  readonly reward: ArquivosSecretActionReward;
}

export interface ArquivosSecretAction {
  readonly id: ArquivosSecretActionId;
  readonly tipo: ArquivosSecretActionType;
  readonly phaseAvailable: ArquivosPhase;
  readonly recipientCharacterIds: readonly ArquivosCharacterId[];
  readonly titulo: string;
  readonly instrucaoPrivada: string;
  readonly textoAoRecusar: string;
  readonly reward: ArquivosSecretActionReward;
  readonly alternativaAcessivel: ArquivosSecretActionAlternative;
  readonly metainfoForCharacterIds: readonly ArquivosCharacterId[];
}

export interface ArquivosVerdictQuestion {
  readonly id: ArquivosQuestionId;
  readonly tipo: ArquivosVerdictQuestionType;
  readonly pergunta: string;
  readonly obrigatoria: boolean;
  readonly opcoes?: readonly string[];
  readonly respostaCorreta: string;
  readonly peso: number;
}

export interface ArquivosCase {
  readonly id: ArquivosCaseId;
  readonly intro: ArquivosCaseIntro;
  readonly config: ArquivosCaseConfig;
  readonly truth: ArquivosTruth;
  readonly characters: readonly ArquivosCharacter[];
  readonly files: readonly ArquivosPrivateFile[];
  readonly evidences: readonly ArquivosEvidence[];
  readonly secretActions: readonly ArquivosSecretAction[];
  readonly verdictQuestions: readonly ArquivosVerdictQuestion[];
  readonly finalTitles: readonly string[];
}

export interface ArquivosCharacterAssignment {
  readonly playerId: PlayerId;
  readonly characterId: ArquivosCharacterId;
}

export interface ArquivosPublicEvidenceRecord {
  readonly evidenceId: ArquivosEvidenceId;
  readonly titulo: string;
  readonly liberadaEm: number;
  readonly phase: ArquivosPhase;
}

export interface ArquivosPhaseProgress {
  readonly readyPlayerIds: readonly PlayerId[];
  readonly totalExpected: number;
}

export interface ArquivosSecretActionPublicRecord {
  readonly actionId: ArquivosSecretActionId;
  readonly playerId: PlayerId;
  readonly status: ArquivosSecretActionStatus;
  readonly updatedAt: number;
}

export type ArquivosVerdictAnswerValue = string | readonly string[];

export interface ArquivosVerdictAnswer {
  readonly questionId: ArquivosQuestionId;
  readonly value: ArquivosVerdictAnswerValue;
  readonly answeredByPlayerId: PlayerId;
  readonly answeredAt: number;
}

export interface ArquivosVerdict {
  readonly submittedByPlayerId: PlayerId;
  readonly submittedAt: number;
  readonly answers: readonly ArquivosVerdictAnswer[];
}

export interface ArquivosPublicState {
  readonly caseId: ArquivosCaseId;
  readonly roomCode: RoomCode;
  readonly phase: ArquivosPhase;
  readonly phaseStartedAt: number;
  readonly hostPlayerId: PlayerId;
  readonly players: readonly ArquivosPlayerRef[];
  readonly assignments: readonly ArquivosCharacterAssignment[];
  readonly releasedPublicEvidences: readonly ArquivosPublicEvidenceRecord[];
  readonly secretActionProgress: readonly ArquivosSecretActionPublicRecord[];
  readonly phaseProgress: ArquivosPhaseProgress;
  readonly verdict: ArquivosVerdict | null;
  readonly collectiveResult: ArquivosCollectiveResult | null;
  readonly startedAt: number | null;
  readonly finishedAt: number | null;
  readonly updatedAt: number;
}

export interface ArquivosPrivateSecretActionState {
  readonly action: ArquivosSecretAction;
  readonly status: ArquivosSecretActionStatus;
  readonly rewardRevealed: boolean;
  readonly reward: ArquivosSecretActionReward | null;
  readonly updatedAt: number;
}

export interface ArquivosPrivateState {
  readonly playerId: PlayerId;
  readonly character: ArquivosCharacter;
  readonly initialFiles: readonly ArquivosPrivateFile[];
  readonly unlockedFiles: readonly ArquivosPrivateFile[];
  readonly visibleEvidenceIds: readonly ArquivosEvidenceId[];
  readonly activeSecretAction: ArquivosPrivateSecretActionState | null;
  readonly completedSecretActions: readonly ArquivosPrivateSecretActionState[];
  readonly individualResult: ArquivosIndividualResult | null;
  readonly updatedAt: number;
}

export interface ArquivosQuestionScore {
  readonly questionId: ArquivosQuestionId;
  readonly acertou: boolean;
  readonly pontosPossiveis: number;
  readonly pontosObtidos: number;
  readonly explicacao: string;
}

export interface ArquivosCollectiveResult {
  readonly grade: ArquivosCollectiveGrade;
  readonly pontosObtidos: number;
  readonly pontosPossiveis: number;
  readonly questionScores: readonly ArquivosQuestionScore[];
  readonly resumo: string;
  readonly pistasDecisivasUsadas: readonly ArquivosEvidenceId[];
  readonly pistasIgnoradas: readonly ArquivosEvidenceId[];
}

export interface ArquivosIndividualResult {
  readonly playerId: PlayerId;
  readonly characterId: ArquivosCharacterId;
  readonly objectiveId: ArquivosObjectiveId;
  readonly status: ArquivosIndividualObjectiveStatus;
  readonly segredoExposto: boolean;
  readonly tituloPosJogo: string;
  readonly resumo: string;
}

export interface ArquivosFinalReveal {
  readonly caseId: ArquivosCaseId;
  readonly truth: ArquivosTruth;
  readonly collectiveResult: ArquivosCollectiveResult;
  readonly individualResults: readonly ArquivosIndividualResult[];
}

export interface ArquivosGameState {
  readonly publicState: ArquivosPublicState;
  readonly privateStates: Readonly<Record<PlayerId, ArquivosPrivateState>>;
  readonly events: readonly ArquivosEvent[];
}

export interface ArquivosEngineResult {
  readonly state: ArquivosGameState;
  readonly events: readonly ArquivosEvent[];
}

export type ArquivosAction =
  | {
      readonly tipo: 'marcar_leitura_concluida';
      readonly playerId: PlayerId;
    }
  | {
      readonly tipo: 'avancar_fase';
      readonly playerId: PlayerId;
      readonly targetPhase: ArquivosPhase;
    }
  | {
      readonly tipo: 'concluir_acao_secreta';
      readonly playerId: PlayerId;
      readonly actionId: ArquivosSecretActionId;
    }
  | {
      readonly tipo: 'recusar_acao_secreta';
      readonly playerId: PlayerId;
      readonly actionId: ArquivosSecretActionId;
    }
  | {
      readonly tipo: 'registrar_veredito';
      readonly playerId: PlayerId;
      readonly verdict: ArquivosVerdict;
    };

export type ArquivosEvent =
  | {
      readonly tipo: 'partida_iniciada';
      readonly caseId: ArquivosCaseId;
      readonly at: number;
    }
  | {
      readonly tipo: 'fase_alterada';
      readonly from: ArquivosPhase;
      readonly to: ArquivosPhase;
      readonly at: number;
    }
  | {
      readonly tipo: 'leitura_concluida';
      readonly playerId: PlayerId;
      readonly at: number;
    }
  | {
      readonly tipo: 'evidencia_liberada';
      readonly evidenceId: ArquivosEvidenceId;
      readonly at: number;
    }
  | {
      readonly tipo: 'acao_secreta_resolvida';
      readonly actionId: ArquivosSecretActionId;
      readonly playerId: PlayerId;
      readonly status: ArquivosSecretActionStatus;
      readonly at: number;
    }
  | {
      readonly tipo: 'veredito_registrado';
      readonly at: number;
    }
  | {
      readonly tipo: 'caso_revelado';
      readonly grade: ArquivosCollectiveGrade;
      readonly at: number;
    }
  | {
      readonly tipo: 'objetivo_individual_resolvido';
      readonly playerId: PlayerId;
      readonly status: ArquivosIndividualObjectiveStatus;
      readonly at: number;
    }
  | {
      readonly tipo: 'momento_memoravel';
      readonly texto: string;
      readonly at: number;
    };
