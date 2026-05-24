import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { ControleEncerrarJogo, TelaCarregamento } from '@/components';
import type { GameState, Player, PlayerId } from '@/engine/types';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { TelaEntreRodadas } from '@/screens/TelaEntreRodadas';
import { TelaPalpiteMrWhite } from '@/screens/TelaPalpiteMrWhite';
import { TelaResultado } from '@/screens/TelaResultado';
import { TelaRodada } from '@/screens/TelaRodada';
import { TelaVotacao } from '@/screens/TelaVotacao';
import { TelaWordReveal } from '@/screens/TelaWordReveal';
import { setPartidaAtiva } from '@/services/partidaAtiva';
import { configurarPresenca } from '@/services/presenca';
import { encerrarPartidaRealtime } from '@/services/encerrarPartida';
import {
  observarEstadoDoJogo,
  observarJogadores,
} from '@/services/roomService';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;
type EtapaTransicao =
  | { tipo: 'apurando' }
  | { tipo: 'empate'; nomeEliminado: string | null }
  | { tipo: 'descoberto'; nomeMrWhite: string | null }
  | {
      tipo: 'eliminado';
      nomeEliminado: string | null;
      eraMrWhite: boolean | null;
    }
  | null;

const MS_APURANDO = 2000;
const MS_EMPATE = 1500;
const MS_DESCOBERTO = 3000;
const MS_ELIMINADO = 2500;

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

  useEffect(() => observarJogadores(roomCode, setJogadores), [roomCode]);

  useEffect(() => {
    setPartidaAtiva({ roomCode, jogoId, jogadorId });
    return () => setPartidaAtiva(null);
  }, [roomCode, jogoId, jogadorId]);

  useEffect(
    () => configurarPresenca(roomCode, jogadorId),
    [roomCode, jogadorId],
  );

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

  async function encerrarJogo() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setTransicao(null);
    await encerrarPartidaRealtime({
      roomCode,
      jogadorId,
      ehAnfitriao:
        jogadores.find((jogador) => jogador.id === jogadorId)?.ehAnfitriao ??
        false,
    });
    navigation.navigate('Inicio');
  }

  // Detecta transição saindo da votação e encadeia: apurando → empate? → descoberto?
  useEffect(() => {
    const sub = estado?.estadoPublico.subFase;
    if (!estado || !sub) return;
    const anterior = subFaseAnterior.current;
    subFaseAnterior.current = sub;
    if (anterior !== 'votando' || sub === 'votando') return;

    const empate = temEmpate(estado.estadoPublico.votos);
    const ultimoEliminado = estado.estadoPublico.ultimoEliminadoId;
    const nomeEliminado = ultimoEliminado
      ? (mapaNomes.get(ultimoEliminado) ?? null)
      : null;

    const sequencia: EtapaTransicao[] = [{ tipo: 'apurando' }];
    if (empate) {
      sequencia.push({ tipo: 'empate', nomeEliminado });
    }
    if (sub === 'palpite_final') {
      const mrWhiteId = estado.estadoPublico.jogadorAdivinhandoId;
      const nomeMrWhite = mrWhiteId ? (mapaNomes.get(mrWhiteId) ?? null) : null;
      sequencia.push({ tipo: 'descoberto', nomeMrWhite });
    }
    if (sub === 'entre_rodadas' && !empate) {
      const eraMrWhite = estado.estadoPublico.ultimoEliminadoEraMrWhite;
      sequencia.push({ tipo: 'eliminado', nomeEliminado, eraMrWhite });
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
            : etapa?.tipo === 'eliminado'
              ? MS_ELIMINADO
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
      <ControleEncerrarJogo onConfirmar={encerrarJogo}>
        <OverlayTransicao
          etapa={transicao}
          onPular={() => {
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
            setTransicao(null);
          }}
        />
      </ControleEncerrarJogo>
    );
  }

  const estadoAtual = estado;
  const props = { estado: estadoAtual, roomCode, jogoId, jogadorId };

  function renderFase() {
    switch (estadoAtual.estadoPublico.subFase) {
      case 'revelando':
        return <TelaWordReveal {...props} jogadores={jogadores} />;
      case 'dando_dicas':
        return <TelaRodada {...props} jogadores={jogadores} />;
      case 'votando':
        return <TelaVotacao {...props} jogadores={jogadores} />;
      case 'palpite_final':
        return <TelaPalpiteMrWhite {...props} />;
      case 'entre_rodadas':
        return <TelaEntreRodadas {...props} jogadores={jogadores} />;
      case 'finalizado':
        return <TelaResultado {...props} />;
    }
  }

  if (estadoAtual.estadoPublico.subFase === 'finalizado') {
    return renderFase();
  }

  return (
    <ControleEncerrarJogo onConfirmar={encerrarJogo}>
      {renderFase()}
    </ControleEncerrarJogo>
  );
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
  // apurando: single-element entrance
  const textoOpacidade = useRef(new Animated.Value(0)).current;
  const textoY = useRef(new Animated.Value(12)).current;

  // empate / descoberto: staggered three-beat reveal
  const labelOpacidade = useRef(new Animated.Value(0)).current;
  const labelY = useRef(new Animated.Value(8)).current;
  const hairlineOpacidade = useRef(new Animated.Value(0)).current;
  const nomeOpacidade = useRef(new Animated.Value(0)).current;
  const nomeEscala = useRef(new Animated.Value(0.88)).current;
  const subtextoOpacidade = useRef(new Animated.Value(0)).current;
  const subtextoY = useRef(new Animated.Value(6)).current;

  // hint: appears after main reveal settles
  const dicaOpacidade = useRef(new Animated.Value(0)).current;

  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    textoOpacidade.setValue(0);
    textoY.setValue(12);
    labelOpacidade.setValue(0);
    labelY.setValue(8);
    hairlineOpacidade.setValue(0);
    nomeOpacidade.setValue(0);
    nomeEscala.setValue(0.88);
    subtextoOpacidade.setValue(0);
    subtextoY.setValue(6);
    dicaOpacidade.setValue(0);

    animRef.current?.stop();

    const dicaEntrada = Animated.sequence([
      Animated.delay(180),
      Animated.timing(dicaOpacidade, {
        toValue: 0.55,
        duration: 220,
        useNativeDriver: true,
      }),
    ]);

    if (etapa.tipo === 'apurando') {
      // Snap direto — o grupo decidiu, sem suspense adicional
      animRef.current = Animated.parallel([
        Animated.parallel([
          Animated.timing(textoOpacidade, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(textoY, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
        dicaEntrada,
      ]);
    } else {
      // Three beats: context → identity → consequence — comprimido
      animRef.current = Animated.parallel([
        // Beat 1: label
        Animated.parallel([
          Animated.timing(labelOpacidade, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(labelY, {
            toValue: 0,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
        // Hairline
        Animated.sequence([
          Animated.delay(100),
          Animated.timing(hairlineOpacidade, {
            toValue: 0.4,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        // Beat 2: nome — o reveal
        Animated.sequence([
          Animated.delay(160),
          Animated.parallel([
            Animated.timing(nomeOpacidade, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.spring(nomeEscala, {
              toValue: 1,
              useNativeDriver: true,
              tension: 52,
              friction: 7,
            }),
          ]),
        ]),
        // Beat 3: consequência
        Animated.sequence([
          Animated.delay(280),
          Animated.parallel([
            Animated.timing(subtextoOpacidade, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.timing(subtextoY, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            }),
          ]),
        ]),
        dicaEntrada,
      ]);
    }

    animRef.current.start();

    return () => {
      animRef.current?.stop();
    };
  }, [
    etapa.tipo,
    textoOpacidade,
    textoY,
    labelOpacidade,
    labelY,
    hairlineOpacidade,
    nomeOpacidade,
    nomeEscala,
    subtextoOpacidade,
    subtextoY,
    dicaOpacidade,
  ]);

  return (
    <Pressable style={estilosOverlay.overlay} onPress={onPular}>
      {etapa.tipo === 'apurando' && (
        <Animated.Text
          style={[
            estilosOverlay.apurandoTexto,
            { opacity: textoOpacidade, transform: [{ translateY: textoY }] },
          ]}
        >
          {'o grupo\ndecidiu.'}
        </Animated.Text>
      )}

      {etapa.tipo === 'empate' && (
        <View style={estilosOverlay.bloco}>
          <Animated.Text
            style={[
              estilosOverlay.tituloEmpate,
              { opacity: labelOpacidade, transform: [{ translateY: labelY }] },
            ]}
          >
            empate.
          </Animated.Text>
          <Animated.View
            style={[estilosOverlay.hairline, { opacity: hairlineOpacidade }]}
          />
          <Animated.Text
            style={[
              estilosOverlay.nomeDestaque,
              estilosOverlay.nomeEmpate,
              { opacity: nomeOpacidade, transform: [{ scale: nomeEscala }] },
            ]}
          >
            {etapa.nomeEliminado ?? '...'}
          </Animated.Text>
          <Animated.Text
            style={[
              estilosOverlay.subtextoFinal,
              {
                opacity: subtextoOpacidade,
                transform: [{ translateY: subtextoY }],
              },
            ]}
          >
            o mais antigo na sala foi eliminado
          </Animated.Text>
        </View>
      )}

      {etapa.tipo === 'eliminado' && (
        <View style={estilosOverlay.bloco}>
          <Animated.Text
            style={[
              estilosOverlay.labelDescoberto,
              { opacity: labelOpacidade, transform: [{ translateY: labelY }] },
            ]}
          >
            {etapa.eraMrWhite ? 'o mr white era' : 'o inocente era'}
          </Animated.Text>
          <Animated.View
            style={[estilosOverlay.hairline, { opacity: hairlineOpacidade }]}
          />
          <Animated.Text
            style={[
              estilosOverlay.nomeDestaque,
              etapa.eraMrWhite && estilosOverlay.nomeEliminadoMrWhite,
              { opacity: nomeOpacidade, transform: [{ scale: nomeEscala }] },
            ]}
          >
            {etapa.nomeEliminado ?? '...'}
          </Animated.Text>
          <Animated.Text
            style={[
              estilosOverlay.subtextoFinal,
              {
                opacity: subtextoOpacidade,
                transform: [{ translateY: subtextoY }],
              },
            ]}
          >
            {etapa.eraMrWhite
              ? 'mas o jogo ainda não acabou.'
              : 'o jogo ainda não acabou.'}
          </Animated.Text>
        </View>
      )}

      {etapa.tipo === 'descoberto' && (
        <View style={estilosOverlay.bloco}>
          <Animated.Text
            style={[
              estilosOverlay.labelDescoberto,
              { opacity: labelOpacidade, transform: [{ translateY: labelY }] },
            ]}
          >
            o mr white era
          </Animated.Text>
          <Animated.View
            style={[estilosOverlay.hairline, { opacity: hairlineOpacidade }]}
          />
          <Animated.Text
            style={[
              estilosOverlay.nomeDestaque,
              { opacity: nomeOpacidade, transform: [{ scale: nomeEscala }] },
            ]}
          >
            {etapa.nomeMrWhite ?? '...'}
          </Animated.Text>
          <Animated.Text
            style={[
              estilosOverlay.subtextoFinal,
              {
                opacity: subtextoOpacidade,
                transform: [{ translateY: subtextoY }],
              },
            ]}
          >
            ele ainda tem uma última chance.
          </Animated.Text>
        </View>
      )}

      <Animated.Text
        style={[estilosOverlay.dicaPular, { opacity: dicaOpacidade }]}
      >
        toque para continuar
      </Animated.Text>
    </Pressable>
  );
}

const estilosOverlay = StyleSheet.create({
  apurandoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTitulo,
    letterSpacing: 0,
    lineHeight: 38,
    textAlign: 'center',
  },
  bloco: {
    alignItems: 'center',
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
  },
  dicaPular: {
    bottom: espacamento.xl,
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    position: 'absolute',
  },
  hairline: {
    backgroundColor: cores.borda,
    height: 1,
    width: 48,
  },
  labelDescoberto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  nomeDestaque: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTituloGrande,
    letterSpacing: 0,
    lineHeight: 44,
    textAlign: 'center',
  },
  nomeEmpate: {
    fontSize: tipografia.tamanhoSubtituloGrande,
    lineHeight: 32,
  },
  nomeEliminadoMrWhite: {
    color: cores.erro,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  subtextoFinal: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.2,
    lineHeight: 22,
    textAlign: 'center',
  },
  tituloEmpate: {
    color: cores.alerta,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTitulo,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
