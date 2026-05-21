/**
 * TelaInquisicao — Orquestrador principal do jogo Inquisição.
 *
 * Responsabilidades:
 *  - Observar sala e estado público/privado via Firebase
 *  - Inicializar e restaurar o engine (apenas host)
 *  - Rastrear confirmações de papel visto e despachar ao engine
 *  - Roteador de sub-fases → componentes filhos
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
import { TelaCarregamento } from '@/components';
import { cores } from '@/theme/colors';

import { TelaDistribuindoPapeis } from './TelaDistribuindoPapeis';
import { TelaDia } from './TelaDia';
import { TelaVotacaoInquisicao } from './TelaVotacaoInquisicao';
import { TelaResultadoVotacao } from './TelaResultadoVotacao';
import { TelaNoite } from './TelaNoite';
import { TelaFinalizado } from './TelaFinalizado';

interface Props {
  roomCode: RoomCode;
  jogoId: string;
  jogadorId: PlayerId;
}

export function TelaInquisicao({ roomCode, jogadorId }: Props) {
  const [anfitriaoId, setAnfitriaoId] = useState<PlayerId | null>(null);
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [estadoPublico, setEstadoPublico] = useState<EstadoFirebaseInquisicao | null>(null);
  const [estadoPrivado, setEstadoPrivado] = useState<EstadoPrivadoInquisicao | null>(null);

  const realtimeRef = useRef<InquisicaoRealtimeService | null>(null);
  const engineIniciadoRef = useRef(false);
  const papelVistoSetRef = useRef<Set<PlayerId>>(new Set());

  const isHost = anfitriaoId !== null && jogadorId === anfitriaoId;

  // Mapa nome por id — passado a todos os filhos
  const mapaNomes = useMemo<Map<PlayerId, string>>(() => {
    const m = new Map<PlayerId, string>();
    jogadores.forEach((j) => m.set(j.id, j.nome));
    return m;
  }, [jogadores]);

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

  // ── Aguardar estado mínimo ───────────────────────────────────────────────────
  if (!estadoPublico || !estadoPrivado || !realtimeRef.current) {
    return <TelaCarregamento />;
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
          jogadoresAtivos={estadoPublico.jogadoresAtivos}
          mapaNomes={mapaNomes}
          loop={estadoPublico.loop}
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
          onVoltar={() => {/* navegação tratada pelo navigator */}}
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
