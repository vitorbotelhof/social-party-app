import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { TelaCarregamento } from '@/components';
import type { GameState, Player, PlayerId } from '@/engine/types';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { TelaPalpiteMrWhite } from '@/screens/TelaPalpiteMrWhite';
import { TelaResultado } from '@/screens/TelaResultado';
import { TelaRodada } from '@/screens/TelaRodada';
import { TelaVotacao } from '@/screens/TelaVotacao';
import { TelaWordReveal } from '@/screens/TelaWordReveal';
import { setPartidaAtiva } from '@/services/partidaAtiva';
import {
  observarEstadoDoJogo,
  observarJogadores,
} from '@/services/roomService';
import { cores, espacamento, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;
type EtapaTransicao =
  | { tipo: 'apurando' }
  | { tipo: 'empate'; nomeEliminado: string | null }
  | { tipo: 'descoberto'; nomeMrWhite: string | null }
  | null;

const MS_APURANDO = 2000;
const MS_EMPATE = 1500;
const MS_DESCOBERTO = 3000;

export function GameScreen({ navigation, route }: Props) {
  const { roomCode, jogoId, jogadorId } = route.params;
  const [estado, setEstado] = useState<EstadoMrWhite | null>(null);
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [transicao, setTransicao] = useState<EtapaTransicao>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const subFaseAnterior = useRef<string | null>(null);

  useEffect(
    () =>
      observarEstadoDoJogo(roomCode, (e) => {
        setEstado(e as EstadoMrWhite | null);
      }),
    [roomCode],
  );

  useEffect(
    () => observarJogadores(roomCode, setJogadores),
    [roomCode],
  );

  useEffect(() => {
    setPartidaAtiva({ roomCode, jogoId, jogadorId });
    return () => setPartidaAtiva(null);
  }, [roomCode, jogoId, jogadorId]);

  useEffect(() => {
    if (estado?.fase === 'lobby') {
      navigation.replace('Lobby', { roomCode, jogoId, jogadorId });
    }
  }, [estado?.fase, navigation, roomCode, jogoId, jogadorId]);

  const mapaNomes = useMemo(() => {
    const m = new Map<PlayerId, string>();
    for (const j of jogadores) m.set(j.id, j.nome);
    return m;
  }, [jogadores]);

  // Detecta transição saindo da votação e encadeia: apurando → empate? → descoberto?
  useEffect(() => {
    const sub = estado?.estadoPublico.subFase;
    if (!estado || !sub) return;
    const anterior = subFaseAnterior.current;
    subFaseAnterior.current = sub;
    if (anterior !== 'votando' || sub === 'votando') return;

    const empate = temEmpate(estado.estadoPublico.votos);
    const ultimoEliminado =
      estado.estadoPublico.eliminadosIds[
        estado.estadoPublico.eliminadosIds.length - 1
      ] ?? null;
    const nomeEliminado = ultimoEliminado
      ? mapaNomes.get(ultimoEliminado) ?? null
      : null;

    const sequencia: EtapaTransicao[] = [{ tipo: 'apurando' }];
    if (empate) {
      sequencia.push({ tipo: 'empate', nomeEliminado });
    }
    if (sub === 'palpite_final') {
      const mrWhiteId = estado.estadoPublico.jogadorAdivinhandoId;
      const nomeMrWhite = mrWhiteId
        ? mapaNomes.get(mrWhiteId) ?? null
        : null;
      sequencia.push({ tipo: 'descoberto', nomeMrWhite });
    }

    setTransicao(sequencia[0] ?? null);
    let acumulado = 0;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    sequencia.forEach((etapa, i) => {
      const ms =
        etapa?.tipo === 'apurando'
          ? MS_APURANDO
          : etapa?.tipo === 'empate'
            ? MS_EMPATE
            : MS_DESCOBERTO;
      acumulado += ms;
      const proxima = sequencia[i + 1] ?? null;
      const id = setTimeout(() => setTransicao(proxima), acumulado);
      timersRef.current.push(id);
    });
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [estado, mapaNomes]);

  if (!estado) {
    return <TelaCarregamento mensagem="Carregando partida..." />;
  }

  if (transicao) {
    return (
      <OverlayTransicao
        etapa={transicao}
        onPular={() => {
          timersRef.current.forEach(clearTimeout);
          timersRef.current = [];
          setTransicao(null);
        }}
      />
    );
  }

  const props = { estado, roomCode, jogoId, jogadorId };

  switch (estado.estadoPublico.subFase) {
    case 'revelando':
      return <TelaWordReveal {...props} jogadores={jogadores} />;
    case 'dando_dicas':
      return <TelaRodada {...props} jogadores={jogadores} />;
    case 'votando':
      return <TelaVotacao {...props} jogadores={jogadores} />;
    case 'palpite_final':
      return <TelaPalpiteMrWhite {...props} />;
    case 'finalizado':
      return <TelaResultado {...props} />;
  }
}

function temEmpate(votos: Record<PlayerId, PlayerId>): boolean {
  const contagem = new Map<PlayerId, number>();
  for (const alvo of Object.values(votos)) {
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
  }
  let max = 0;
  let countMax = 0;
  for (const c of contagem.values()) {
    if (c > max) {
      max = c;
      countMax = 1;
    } else if (c === max) {
      countMax += 1;
    }
  }
  return countMax > 1 && max > 0;
}

function OverlayTransicao({
  etapa,
  onPular,
}: {
  etapa: NonNullable<EtapaTransicao>;
  onPular: () => void;
}) {
  const pulso = useRef(new Animated.Value(0.4)).current;
  const escala = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (etapa.tipo === 'apurando') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulso, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulso, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulso.setValue(1);
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      tension: 70,
      friction: 6,
    }).start();
    return undefined;
  }, [escala, etapa.tipo, pulso]);

  return (
    <Pressable style={estilosOverlay.overlay} onPress={onPular}>
      {etapa.tipo === 'apurando' && (
        <Animated.View style={{ opacity: pulso }}>
          <Text style={estilosOverlay.apurandoEmoji}>🗳️</Text>
          <Text style={estilosOverlay.apurandoTexto}>apurando os votos...</Text>
        </Animated.View>
      )}
      {etapa.tipo === 'empate' && (
        <Animated.View
          style={[estilosOverlay.bloco, { transform: [{ scale: escala }] }]}
        >
          <Text style={estilosOverlay.titulo}>EMPATE!</Text>
          <Text style={estilosOverlay.subtitulo}>
            o mais antigo na sala foi eliminado
          </Text>
          {etapa.nomeEliminado && (
            <Text style={estilosOverlay.nomeAcento}>
              {etapa.nomeEliminado}
            </Text>
          )}
        </Animated.View>
      )}
      {etapa.tipo === 'descoberto' && (
        <Animated.View
          style={[estilosOverlay.bloco, { transform: [{ scale: escala }] }]}
        >
          <Text style={estilosOverlay.emojiDescoberto}>👁</Text>
          <Text style={estilosOverlay.nomeDescoberto}>
            {etapa.nomeMrWhite ?? '...'}
          </Text>
          <Text style={estilosOverlay.tituloDescoberto}>
            era o MR WHITE!
          </Text>
          <Text style={estilosOverlay.subtituloDescoberto}>
            ele ainda tem uma última chance...
          </Text>
        </Animated.View>
      )}
      <Text style={estilosOverlay.dicaPular}>toque para pular</Text>
    </Pressable>
  );
}

const estilosOverlay = StyleSheet.create({
  apurandoEmoji: {
    fontSize: 64,
    marginBottom: espacamento.lg,
    textAlign: 'center',
  },
  apurandoTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  bloco: {
    alignItems: 'center',
    paddingHorizontal: espacamento.lg,
  },
  dicaPular: {
    bottom: espacamento.xl,
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    position: 'absolute',
  },
  emojiDescoberto: {
    fontSize: 72,
    marginBottom: espacamento.md,
  },
  nomeAcento: {
    color: cores.acento,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  nomeDescoberto: {
    color: cores.acento,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMaior,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  subtituloDescoberto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  titulo: {
    color: cores.alerta,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  tituloDescoberto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
});
