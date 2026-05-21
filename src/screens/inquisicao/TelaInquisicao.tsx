/**
 * TelaInquisicao — Orquestrador principal do jogo Inquisição.
 *
 * Responsabilidades:
 *  - Observar sala e estado público/privado via Firebase
 *  - Inicializar e restaurar o engine (apenas host)
 *  - Rastrear confirmações de papel visto e despachar ao engine
 *  - Roteador de sub-fases → componentes filhos
 *  - [DEV] Integrar debug panel e pacing tracker
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { onValue, ref, set } from 'firebase/database';

import type { PlayerId, Player, RoomCode } from '@/engine/types';
import { inquisicaoEngine } from '@/games/inquisicao/engine';
import type { EstadoFirebaseInquisicao, EstadoPrivadoInquisicao } from '@/games/inquisicao/types';
import { getRealtimeDb } from '@/services/firebase';
import { criarInquisicaoRealtime } from '@/services/inquisicaoRealtime';
import type { InquisicaoRealtimeService } from '@/services/inquisicaoRealtime';
import { observarSala } from '@/services/roomService';
import { __dev__setTemperaturaCallback } from '@/session/emotionalTracker';
import { cores } from '@/theme/colors';

import { TelaDistribuindoPapeis } from './TelaDistribuindoPapeis';
import { TelaDia } from './TelaDia';
import { TelaVotacaoInquisicao } from './TelaVotacaoInquisicao';
import { TelaResultadoVotacao } from './TelaResultadoVotacao';
import { TelaNoite } from './TelaNoite';
import { TelaFinalizado } from './TelaFinalizado';

// Debug imports — tree-shaken em produção via __DEV__ guards internos
import { DebugPanelInquisicao } from '@/debug/inquisicao/DebugPanelInquisicao';
import { adicionarEmocionalLog } from '@/debug/inquisicao/debugStore';
import { logMudancaSubFase, resetPhaseLogger } from '@/debug/inquisicao/phaseLogger';
import {
  finalizarSubFase,
  iniciarSubFase,
  registrarJogoFinalizado,
  registrarReplay,
  resetPacingTracker,
} from '@/debug/inquisicao/pacingTracker';
import { processarEstadoParaReplay, resetLoopReplay } from '@/debug/inquisicao/loopReplay';
import { resetDebugSession } from '@/debug/inquisicao/debugStore';

interface Props {
  roomCode: RoomCode;
  jogoId: string;
  jogadorId: PlayerId;
  /** Navegar para a tela inicial após o jogo terminar. */
  onJogarDeNovo: () => void;
  /** Voltar para a seleção de jogos. */
  onVoltar: () => void;
}

export function TelaInquisicao({ roomCode, jogadorId, onVoltar }: Props) {
  const [anfitriaoId, setAnfitriaoId] = useState<PlayerId | null>(null);
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [estadoPublico, setEstadoPublico] = useState<EstadoFirebaseInquisicao | null>(null);
  const [estadoPrivado, setEstadoPrivado] = useState<EstadoPrivadoInquisicao | null>(null);

  const realtimeRef = useRef<InquisicaoRealtimeService | null>(null);
  const engineIniciadoRef = useRef(false);
  const papelVistoSetRef = useRef<Set<PlayerId>>(new Set());
  const subFaseAnteriorRef = useRef<string | null>(null);

  const isHost = anfitriaoId !== null && jogadorId === anfitriaoId;

  // Mapa nome por id — passado a todos os filhos
  const mapaNomes = useMemo<Map<PlayerId, string>>(() => {
    const m = new Map<PlayerId, string>();
    jogadores.forEach((j) => m.set(j.id, j.nome));
    return m;
  }, [jogadores]);

  // ── Debug: conectar callback de temperatura emocional ──────────────────────
  useEffect(() => {
    if (!__DEV__) return;

    __dev__setTemperaturaCallback((temperatura, momento) => {
      adicionarEmocionalLog({ timestamp: Date.now(), temperatura, momento });
    });

    // Reset de estado ao montar uma nova sessão de debug
    resetDebugSession();
    resetPhaseLogger();
    resetPacingTracker();
    resetLoopReplay();

    return () => {
      __dev__setTemperaturaCallback(null);
    };
  }, []);

  // ── Debug: rastrear mudanças de sub-fase ───────────────────────────────────
  useEffect(() => {
    if (!__DEV__ || !estadoPublico) return;

    const subFase = estadoPublico.subFase;
    const loop = estadoPublico.loop;
    const anterior = subFaseAnteriorRef.current;

    if (subFase !== anterior) {
      // Finalizar sub-fase anterior
      if (anterior) {
        finalizarSubFase(anterior, loop);
      }

      // Iniciar nova sub-fase
      logMudancaSubFase(subFase, loop);
      iniciarSubFase(subFase, loop);

      // Eventos especiais
      if (subFase === 'finalizado') {
        registrarJogoFinalizado();
      }

      subFaseAnteriorRef.current = subFase;
    }

    // Processar para replay (roda a cada update, não só em mudança de fase)
    processarEstadoParaReplay(estadoPublico);
  }, [estadoPublico]);

  // ── Observar sala ────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = observarSala(roomCode, (sala) => {
      if (!sala) return;
      setAnfitriaoId(sala.anfitriaoId);
      setJogadores(Object.values(sala.jogadores));
    });
    return () => unsub();
  }, [roomCode]);

  // ── Criar serviço realtime quando anfitriaoId conhecido ─────────────────────
  useEffect(() => {
    if (!anfitriaoId) return;
    const svc = criarInquisicaoRealtime(roomCode, anfitriaoId);
    realtimeRef.current = svc;

    // Observar estado público
    const unsubPub = svc.observarEstadoPublico((e) => setEstadoPublico(e));

    // Observar estado privado do próprio jogador
    const unsubPriv = svc.observarPrivado(jogadorId, (p) => setEstadoPrivado(p));

    return () => {
      unsubPub();
      unsubPriv();
    };
  }, [anfitriaoId, roomCode, jogadorId]);

  // ── Lógica exclusiva do host ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isHost || !realtimeRef.current || engineIniciadoRef.current) return;
    const realtime = realtimeRef.current;

    engineIniciadoRef.current = true;

    (async () => {
      const contexto = await realtime.lerEstadoCompletoHost();
      if (!contexto) return;

      const estadoInquisicao = {
        fase: 'playing' as const,
        rodada: 0 as const,
        jogadorAtualId: null,
        estadoPublico: contexto.estado,
        estadosPrivados: contexto.privados,
        vencedorIds: [],
        iniciadoEm: contexto.estado.iniciadoEm,
        atualizadoEm: contexto.estado.atualizadoEm,
      };

      inquisicaoEngine.iniciar(estadoInquisicao, contexto.controle, realtime);
    })();

    // Configurar presença do host
    const limparPresenca = realtime.configurarPresencaHost();

    // Observar papelVisto para disparar confirmar_papel_visto
    const papelVistoRef = ref(getRealtimeDb(), `salas/${roomCode}/papelVisto`);
    const unsubPapelVisto = onValue(papelVistoRef, (snap) => {
      if (!snap.exists()) return;
      const dados = snap.val() as Record<PlayerId, boolean>;
      Object.entries(dados).forEach(([pid, visto]) => {
        if (visto && !papelVistoSetRef.current.has(pid)) {
          papelVistoSetRef.current.add(pid);
          // Pegar estado atual do público via realtime (pode ser null ainda)
          realtime.lerEstadoCompletoHost().then((ctx) => {
            if (!ctx) return;
            const estadoRestaurado = {
              fase: 'playing' as const,
              rodada: 0 as const,
              jogadorAtualId: null,
              estadoPublico: ctx.estado,
              estadosPrivados: ctx.privados,
              vencedorIds: [],
              iniciadoEm: ctx.estado.iniciadoEm,
              atualizadoEm: ctx.estado.atualizadoEm,
            };
            inquisicaoEngine.processarAcao(estadoRestaurado, {
              tipo: 'confirmar_papel_visto',
              jogadorId: pid,
              payload: {},
              em: Date.now(),
            });
          });
        }
      });
    });

    return () => {
      limparPresenca();
      unsubPapelVisto();
    };
  }, [isHost, roomCode]);

  // ── Cleanup ao desmontar ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      inquisicaoEngine.parar();
      realtimeRef.current?.limpar();
    };
  }, []);

  // ── Handler: jogador confirmou ver o papel ───────────────────────────────────
  const handlePronto = useCallback(async () => {
    const papelVistoRef = ref(getRealtimeDb(), `salas/${roomCode}/papelVisto/${jogadorId}`);
    await set(papelVistoRef, true);
  }, [roomCode, jogadorId]);

  // ── Handler: nova partida — registra replay antes de navegar ─────────────────
  const handleVoltar = useCallback(() => {
    if (__DEV__) registrarReplay();
    onVoltar();
  }, [onVoltar]);

  // ── Aguardar estado mínimo ───────────────────────────────────────────────────
  // Tela escura enquanto Firebase sincroniza — sem loader visível.
  // O fundo do jogo já é cores.fundo; o silêncio é o estado de loading.
  if (!estadoPublico || !estadoPrivado || !realtimeRef.current) {
    return <View style={estilos.container} />;
  }

  const realtime = realtimeRef.current;
  const subFase = estadoPublico.subFase;

  // ── Roteamento de sub-fases ──────────────────────────────────────────────────
  return (
    <View style={estilos.container}>
      {subFase === 'revelando_papeis' && (
        <TelaDistribuindoPapeis
          estadoPrivado={estadoPrivado}
          jogadorId={jogadorId}
          mapaNomes={mapaNomes}
          onPronto={handlePronto}
        />
      )}

      {subFase === 'conversa' && (
        <TelaDia
          estadoPublico={estadoPublico}
          estadoPrivado={estadoPrivado}
          jogadorId={jogadorId}
          realtime={realtime}
        />
      )}

      {subFase === 'votando' && (
        <TelaVotacaoInquisicao
          estadoPublico={estadoPublico}
          jogadorId={jogadorId}
          mapaNomes={mapaNomes}
          realtime={realtime}
        />
      )}

      {subFase === 'apurando' && (
        <TelaResultadoVotacao
          estadoPublico={estadoPublico}
          mapaNomes={mapaNomes}
        />
      )}

      {subFase === 'noite' && (
        <TelaNoite
          estadoPublico={estadoPublico}
          estadoPrivado={estadoPrivado}
          jogadorId={jogadorId}
          mapaNomes={mapaNomes}
          realtime={realtime}
        />
      )}

      {subFase === 'finalizado' && (
        <TelaFinalizado
          estadoPublico={estadoPublico}
          jogadores={jogadores}
          jogadorId={jogadorId}
          onVoltar={handleVoltar}
        />
      )}

      {/* Painel de debug — renderizado apenas em __DEV__ */}
      {__DEV__ && (
        <DebugPanelInquisicao
          estadoPublico={estadoPublico}
          anfitriaoId={anfitriaoId}
          roomCode={roomCode}
          jogadores={jogadores}
          isHost={isHost}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
});
