import {
  get,
  onValue,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';

import { obterJogo } from '@/engine/registry';
import type {
  GameState,
  Player,
  PlayerId,
  Room,
  RoomCode,
} from '@/engine/types';
import { comTimeout } from '@/services/comTimeout';
import { getRealtimeDb } from '@/services/firebase';
import { normalizarEstado } from '@/services/normalizacao';
import {
  RoomServiceError,
  type CriarSalaInput,
  type EntrarNaSalaInput,
  type RoomListener,
  type Unsubscribe,
} from '@/types/room';

// ============================================================
//  Refs
// ============================================================

const PASTA = 'salas';

function refSala(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}`);
}

function refEstado(codigo: RoomCode) {
  return ref(getRealtimeDb(), `${PASTA}/${codigo}/estado`);
}

// ============================================================
//  Geração de código único
// ============================================================

const LETRAS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const TAMANHO_CODIGO = 4;

function gerarCodigo(): RoomCode {
  let codigo = '';
  for (let i = 0; i < TAMANHO_CODIGO; i += 1) {
    codigo += LETRAS[Math.floor(Math.random() * LETRAS.length)];
  }
  return codigo;
}

async function gerarCodigoUnico(): Promise<RoomCode> {
  for (let i = 0; i < 20; i += 1) {
    const candidato = gerarCodigo();
    const snap = await get(refSala(candidato));
    if (!snap.exists()) return candidato;
  }
  throw new RoomServiceError(
    'codigo_indisponivel',
    'Não foi possível gerar um código de sala único.',
  );
}

function normalizarSala(raw: unknown): Room | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const estado = normalizarEstado(r.estado);
  if (!estado) return null;
  return {
    codigo: r.codigo as RoomCode,
    jogoId: r.jogoId as string,
    anfitriaoId: r.anfitriaoId as PlayerId,
    jogadores: (r.jogadores as Record<PlayerId, Player>) ?? {},
    estado,
    criadoEm: (r.criadoEm as number) ?? 0,
    atualizadoEm: (r.atualizadoEm as number) ?? 0,
  };
}

// ============================================================
//  API pública
// ============================================================

export async function criarSala(input: CriarSalaInput): Promise<Room> {
  if (!obterJogo(input.jogoId)) {
    throw new RoomServiceError(
      'jogo_nao_encontrado',
      `Jogo "${input.jogoId}" não está registrado.`,
    );
  }

  const codigo = await gerarCodigoUnico();
  const agora = Date.now();

  const anfitriao: Player = {
    id: input.anfitriao.id,
    nome: input.anfitriao.nome,
    papelSecreto: null,
    ehAnfitriao: true,
    estaConectado: true,
    entrouEm: agora,
  };

  const estadoInicial: GameState = {
    fase: 'lobby',
    rodada: 0,
    jogadorAtualId: null,
    estadoPublico: {},
    estadosPrivados: {},
    vencedorIds: [],
    iniciadoEm: 0,
    atualizadoEm: agora,
  };

  const sala: Room = {
    codigo,
    jogoId: input.jogoId,
    anfitriaoId: anfitriao.id,
    jogadores: { [anfitriao.id]: anfitriao },
    estado: estadoInicial,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  await comTimeout(set(refSala(codigo), sala));
  return sala;
}

export async function obterSala(codigo: RoomCode): Promise<Room | null> {
  const snap = await get(refSala(codigo));
  if (!snap.exists()) return null;
  return normalizarSala(snap.val());
}

export async function entrarNaSala(input: EntrarNaSalaInput): Promise<Room> {
  const snap = await get(refSala(input.codigo));
  if (!snap.exists()) {
    throw new RoomServiceError(
      'sala_nao_encontrada',
      `Sala ${input.codigo} não existe.`,
    );
  }
  const sala = normalizarSala(snap.val());
  if (!sala) {
    throw new RoomServiceError(
      'sala_nao_encontrada',
      `Sala ${input.codigo} está corrompida.`,
    );
  }

  const engine = obterJogo(sala.jogoId);
  if (!engine) {
    throw new RoomServiceError(
      'jogo_nao_encontrado',
      `Jogo "${sala.jogoId}" não está registrado.`,
    );
  }

  if (sala.estado.fase !== 'lobby') {
    throw new RoomServiceError(
      'partida_ja_iniciada',
      'A partida já começou; não é possível entrar agora.',
    );
  }

  const jogadoresAtuais = sala.jogadores ?? {};
  if (Object.keys(jogadoresAtuais).length >= engine.config.maxJogadores) {
    throw new RoomServiceError(
      'sala_cheia',
      `Sala cheia (máximo de ${engine.config.maxJogadores} jogadores).`,
    );
  }

  if (jogadoresAtuais[input.jogador.id]) {
    throw new RoomServiceError(
      'jogador_ja_na_sala',
      'Você já está dentro desta sala.',
    );
  }

  const agora = Date.now();
  const jogador: Player = {
    id: input.jogador.id,
    nome: input.jogador.nome,
    papelSecreto: null,
    ehAnfitriao: false,
    estaConectado: true,
    entrouEm: agora,
  };

  await comTimeout(
    update(refSala(input.codigo), {
      [`jogadores/${jogador.id}`]: jogador,
      atualizadoEm: agora,
    }),
  );

  return {
    ...sala,
    jogadores: { ...jogadoresAtuais, [jogador.id]: jogador },
    atualizadoEm: agora,
  };
}

export async function sairDaSala(
  codigo: RoomCode,
  jogadorId: PlayerId,
): Promise<void> {
  const snap = await get(refSala(codigo));
  if (!snap.exists()) return;
  const sala = normalizarSala(snap.val());
  if (!sala) return;

  const restantes = { ...(sala.jogadores ?? {}) };
  delete restantes[jogadorId];

  if (Object.keys(restantes).length === 0) {
    await remove(refSala(codigo));
    return;
  }

  let novoAnfitriaoId = sala.anfitriaoId;
  let jogadoresAtualizados = restantes;

  if (sala.anfitriaoId === jogadorId) {
    const proximo = Object.values(restantes).sort(
      (a, b) => a.entrouEm - b.entrouEm,
    )[0];
    if (proximo) {
      novoAnfitriaoId = proximo.id;
      jogadoresAtualizados = {
        ...restantes,
        [proximo.id]: { ...proximo, ehAnfitriao: true },
      };
    }
  }

  await update(refSala(codigo), {
    anfitriaoId: novoAnfitriaoId,
    jogadores: jogadoresAtualizados,
    atualizadoEm: Date.now(),
  });
}

export async function iniciarJogo(
  codigo: RoomCode,
  anfitriaoId: PlayerId,
  opcoes?: unknown,
): Promise<void> {
  const snap = await get(refSala(codigo));
  if (!snap.exists()) {
    throw new RoomServiceError(
      'sala_nao_encontrada',
      `Sala ${codigo} não existe.`,
    );
  }
  const sala = normalizarSala(snap.val());
  if (!sala) {
    throw new RoomServiceError(
      'sala_nao_encontrada',
      `Sala ${codigo} está corrompida.`,
    );
  }

  if (sala.anfitriaoId !== anfitriaoId) {
    throw new RoomServiceError(
      'nao_eh_anfitriao',
      'Apenas o anfitrião pode iniciar a partida.',
    );
  }
  if (sala.estado.fase !== 'lobby') {
    throw new RoomServiceError(
      'partida_ja_iniciada',
      'A partida já foi iniciada.',
    );
  }

  const engine = obterJogo(sala.jogoId);
  if (!engine) {
    throw new RoomServiceError(
      'jogo_nao_encontrado',
      `Jogo "${sala.jogoId}" não está registrado.`,
    );
  }

  const jogadores = Object.values(sala.jogadores ?? {});
  if (jogadores.length < engine.config.minJogadores) {
    throw new RoomServiceError(
      'jogadores_insuficientes',
      `O jogo precisa de pelo menos ${engine.config.minJogadores} jogadores.`,
    );
  }

  const novoEstado = engine.criarEstadoInicial(
    jogadores,
    sala.anfitriaoId,
    opcoes,
  );

  await comTimeout(
    update(refSala(codigo), {
      estado: novoEstado,
      atualizadoEm: Date.now(),
    }),
  );
}

export async function resetarJogo(
  codigo: RoomCode,
  jogadorId: PlayerId,
): Promise<void> {
  const snap = await get(refSala(codigo));
  if (!snap.exists()) {
    throw new RoomServiceError(
      'sala_nao_encontrada',
      `Sala ${codigo} não existe.`,
    );
  }
  const sala = normalizarSala(snap.val());
  if (!sala) {
    throw new RoomServiceError(
      'sala_nao_encontrada',
      `Sala ${codigo} está corrompida.`,
    );
  }

  if (sala.anfitriaoId !== jogadorId) {
    throw new RoomServiceError(
      'nao_eh_anfitriao',
      'Apenas o anfitrião pode reiniciar a partida.',
    );
  }

  const agora = Date.now();
  const jogadoresLimpos: Record<PlayerId, Player> = {};
  for (const [id, j] of Object.entries(sala.jogadores ?? {})) {
    jogadoresLimpos[id] = { ...j, papelSecreto: null };
  }

  await update(refSala(codigo), {
    jogadores: jogadoresLimpos,
    estado: {
      fase: 'lobby',
      rodada: 0,
      jogadorAtualId: null,
      estadoPublico: {},
      estadosPrivados: {},
      vencedorIds: [],
      iniciadoEm: 0,
      atualizadoEm: agora,
    },
    atualizadoEm: agora,
  });
}

// ============================================================
//  Observadores (onValue)
// ============================================================

export function observarSala(
  codigo: RoomCode,
  callback: RoomListener<Room | null>,
): Unsubscribe {
  return onValue(refSala(codigo), (snap) => {
    callback(snap.exists() ? normalizarSala(snap.val()) : null);
  });
}

export function observarJogadores(
  codigo: RoomCode,
  callback: RoomListener<Player[]>,
): Unsubscribe {
  return onValue(refSala(codigo), (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    const sala = normalizarSala(snap.val());
    callback(Object.values(sala?.jogadores ?? {}));
  });
}

export function observarEstadoDoJogo(
  codigo: RoomCode,
  callback: RoomListener<GameState | null>,
): Unsubscribe {
  return onValue(refEstado(codigo), (snap) => {
    callback(snap.exists() ? normalizarEstado(snap.val()) : null);
  });
}
