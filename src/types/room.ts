// TODO(arch): /types não deve depender de /engine. Migrar GameId/PlayerId/Room/RoomCode
// de @/engine/types pra @/types como parte da consolidação de tipos.
// eslint-disable-next-line import/no-restricted-paths
import type { GameId, PlayerId, Room, RoomCode } from '@/engine/types';

/** Dados mínimos do jogador, fornecidos ao criar ou entrar em uma sala. */
export interface DadosJogador {
  id: PlayerId;
  nome: string;
}

export interface CriarSalaInput {
  jogoId: GameId;
  anfitriao: DadosJogador;
}

export interface EntrarNaSalaInput {
  codigo: RoomCode;
  jogador: DadosJogador;
}

/** Códigos de erro padronizados emitidos pelo roomService. */
export type RoomErrorCode =
  | 'sala_nao_encontrada'
  | 'sala_cheia'
  | 'jogo_nao_encontrado'
  | 'nao_eh_anfitriao'
  | 'partida_ja_iniciada'
  | 'jogadores_insuficientes'
  | 'jogador_ja_na_sala'
  | 'codigo_indisponivel';

export class RoomServiceError extends Error {
  readonly code: RoomErrorCode;

  constructor(code: RoomErrorCode, message: string) {
    super(message);
    this.name = 'RoomServiceError';
    this.code = code;
  }
}

/** Função de cancelamento retornada pelos observadores em tempo real. */
export type Unsubscribe = () => void;

/** Callback genérico para listeners do Realtime DB. */
export type RoomListener<T> = (dados: T) => void;

export type { Room, RoomCode };
