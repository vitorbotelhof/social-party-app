import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario, BotaoSecundario } from '@/components';
import type {
  GameId,
  GameState,
  PlayerId,
  Room,
  RoomCode,
} from '@/engine/types';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { tocar } from '@/services/audio';
import { limparPartida } from '@/services/partidaAtiva';
import {
  observarSala,
  resetarJogo,
  sairDaSala,
} from '@/services/roomService';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
}

const ETAPA = {
  REVELANDO: 0,
  LEGENDA_MR_WHITE: 1,
  NOME_MR_WHITE: 2,
  BANNER: 3,
  CONTEUDO: 4,
} as const;

const TEMPOS: Record<keyof typeof ETAPA, number> = {
  REVELANDO: 0,
  LEGENDA_MR_WHITE: 1500,
  NOME_MR_WHITE: 2500,
  BANNER: 3500,
  CONTEUDO: 4500,
};

export function TelaResultado({
  estado,
  roomCode,
  jogoId,
  jogadorId,
}: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [sala, setSala] = useState<Room | null>(null);
  const [etapa, setEtapa] = useState<number>(ETAPA.REVELANDO);
  const [acaoEmCurso, setAcaoEmCurso] = useState(false);
  const [mostrarBotaoSair, setMostrarBotaoSair] = useState(false);

  useEffect(() => observarSala(roomCode, setSala), [roomCode]);

  const venci = estado.vencedorIds.includes(jogadorId);

  useEffect(() => {
    const timers = [
      setTimeout(() => setEtapa(ETAPA.LEGENDA_MR_WHITE), TEMPOS.LEGENDA_MR_WHITE),
      setTimeout(() => setEtapa(ETAPA.NOME_MR_WHITE), TEMPOS.NOME_MR_WHITE),
      setTimeout(() => {
        setEtapa(ETAPA.BANNER);
        void Haptics.notificationAsync(
          venci
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning,
        );
        void tocar(venci ? 'vitoria' : 'derrota');
      }, TEMPOS.BANNER),
      setTimeout(() => setEtapa(ETAPA.CONTEUDO), TEMPOS.CONTEUDO),
    ];
    return () => timers.forEach(clearTimeout);
  }, [venci]);

  const ehAnfitriao = sala?.anfitriaoId === jogadorId;
  const jogadores = sala?.jogadores ?? {};
  const nomeDe = (id: PlayerId): string => jogadores[id]?.nome ?? '...';

  const venc = estado.estadoPublico.vencedor;
  const ehVitoriaMrWhite = venc === 'mrwhite';
  const mrWhiteIds = estado.estadoPublico.mrWhiteIdsRevelados;
  const nomesMrWhites = mrWhiteIds.map(nomeDe).join(' e ');

  const dicasMaisVotadas = useMemo(() => {
    const votos = estado.estadoPublico.votos;
    const contagem = new Map<PlayerId, number>();
    for (const alvo of Object.values(votos)) {
      contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
    }
    const pistas = estado.estadoPublico.pistas;
    return [...pistas]
      .sort(
        (a, b) =>
          (contagem.get(b.jogadorId) ?? 0) - (contagem.get(a.jogadorId) ?? 0),
      )
      .slice(0, 5);
  }, [estado.estadoPublico.pistas, estado.estadoPublico.votos]);

  async function aoJogarDeNovo() {
    if (acaoEmCurso) return;
    setAcaoEmCurso(true);
    try {
      await resetarJogo(roomCode, jogadorId);
      navigation.replace('ConfiguracaoJogo', { roomCode, jogoId, jogadorId });
    } catch {
      setAcaoEmCurso(false);
      Alert.alert('Não rolou reiniciar a partida, tenta de novo.');
    }
  }

  async function aoEncerrar() {
    if (acaoEmCurso) return;
    setAcaoEmCurso(true);
    try {
      await sairDaSala(roomCode, jogadorId);
      await limparPartida();
      navigation.popToTop();
    } catch {
      setAcaoEmCurso(false);
    }
  }

  async function aoCompartilhar() {
    const mensagem = mensagemCompartilhar({
      nomesMrWhites,
      palavra: estado.estadoPublico.palavraRevelada,
      ehVitoriaMrWhite,
      palpiteFinal: estado.estadoPublico.palpiteFinal,
      palpiteCorreto: estado.estadoPublico.palpiteCorreto,
    });
    try {
      await Share.share({ message: mensagem });
    } catch {
      // usuário cancelou ou compartilhamento indisponível
    }
  }

  if (etapa < ETAPA.LEGENDA_MR_WHITE) {
    return <FaseRevelando />;
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <BlocoLegendaMrWhite
          quantidade={mrWhiteIds.length}
          visivel={etapa >= ETAPA.LEGENDA_MR_WHITE}
        />
        <NomeMrWhite
          nomes={nomesMrWhites || '...'}
          visivel={etapa >= ETAPA.NOME_MR_WHITE}
        />
        {etapa >= ETAPA.BANNER && (
          <BannerVitoria ehVitoriaMrWhite={ehVitoriaMrWhite} />
        )}

        {etapa >= ETAPA.CONTEUDO && (
          <View style={estilos.blocoResumo}>
            <BlocoStagger indice={0}>
              <View style={estilos.cardResumo}>
                <Text style={estilos.rotulo}>A PALAVRA ERA</Text>
                <Text style={estilos.palavraDestaque}>
                  {estado.estadoPublico.palavraRevelada}
                </Text>
              </View>
            </BlocoStagger>

            {estado.estadoPublico.palpiteFinal && (
              <BlocoStagger indice={1}>
                <View style={estilos.cardResumo}>
                  <Text style={estilos.rotulo}>PALPITE DO MR WHITE</Text>
                  <Text style={estilos.palpiteTexto}>
                    “{estado.estadoPublico.palpiteFinal}”
                  </Text>
                  <View
                    style={[
                      estilos.tagPalpite,
                      estado.estadoPublico.palpiteCorreto
                        ? estilos.tagCorreto
                        : estilos.tagErrado,
                    ]}
                  >
                    <Text style={estilos.tagPalpiteTexto}>
                      {estado.estadoPublico.palpiteCorreto
                        ? 'ACERTOU ✓'
                        : 'ERROU ✗'}
                    </Text>
                  </View>
                </View>
              </BlocoStagger>
            )}

            {dicasMaisVotadas.length > 0 && (
              <BlocoStagger indice={2}>
                <View style={estilos.cardResumo}>
                  <Text style={estilos.rotulo}>DICAS MAIS VOTADAS</Text>
                  {dicasMaisVotadas.map((p, i) => (
                    <View key={`${p.jogadorId}-${i}`} style={estilos.linhaDica}>
                      <Text style={estilos.dicaAutor}>
                        {nomeDe(p.jogadorId)}
                      </Text>
                      <Text style={estilos.dicaTexto}>“{p.texto}”</Text>
                    </View>
                  ))}
                </View>
              </BlocoStagger>
            )}
          </View>
        )}
      </ScrollView>

      {etapa >= ETAPA.CONTEUDO && (
        <View style={estilos.rodape}>
          {ehAnfitriao ? (
            <BotaoPrimario
              titulo="jogar de novo"
              carregando={acaoEmCurso}
              onPress={aoJogarDeNovo}
            />
          ) : (
            <EsperandoAnfitriao
              mostrarBotaoSair={mostrarBotaoSair}
              ativar={etapa >= ETAPA.CONTEUDO}
              onTimeout={() => setMostrarBotaoSair(true)}
              onSair={aoEncerrar}
              acaoEmCurso={acaoEmCurso}
            />
          )}
          <Pressable onPress={aoCompartilhar} style={estilos.botaoCompartilhar}>
            <Text style={estilos.botaoCompartilharTexto}>
              compartilhar resultado
            </Text>
          </Pressable>
          <BotaoSecundario titulo="encerrar partida" onPress={aoEncerrar} />
        </View>
      )}
    </SafeAreaView>
  );
}

function EsperandoAnfitriao({
  mostrarBotaoSair,
  ativar,
  onTimeout,
  onSair,
  acaoEmCurso,
}: {
  mostrarBotaoSair: boolean;
  ativar: boolean;
  onTimeout: () => void;
  onSair: () => void;
  acaoEmCurso: boolean;
}) {
  const pulso = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!ativar) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ativar, pulso]);

  useEffect(() => {
    if (!ativar || mostrarBotaoSair) return;
    const id = setTimeout(onTimeout, 30000);
    return () => clearTimeout(id);
  }, [ativar, mostrarBotaoSair, onTimeout]);

  return (
    <View style={estilos.esperandoBloco}>
      <Animated.Text style={[estilos.aguardandoHost, { opacity: pulso }]}>
        esperando o anfitrião escolher a próxima...
      </Animated.Text>
      {mostrarBotaoSair && (
        <BotaoSecundario
          titulo="sair da partida"
          onPress={onSair}
          disabled={acaoEmCurso}
        />
      )}
    </View>
  );
}

function FaseRevelando() {
  const pulso = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  return (
    <View style={[estilos.tela, estilos.revelandoCentralizado]}>
      <Animated.Text style={[estilos.revelandoTexto, { opacity: pulso }]}>
        revelando...
      </Animated.Text>
    </View>
  );
}

function BlocoLegendaMrWhite({
  quantidade,
  visivel,
}: {
  quantidade: number;
  visivel: boolean;
}) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, {
      toValue: visivel ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [op, visivel]);

  return (
    <Animated.Text style={[estilos.legendaMrWhite, { opacity: op }]}>
      {quantidade > 1 ? 'OS MR WHITES ERAM...' : 'O MR WHITE ERA...'}
    </Animated.Text>
  );
}

function NomeMrWhite({ nomes, visivel }: { nomes: string; visivel: boolean }) {
  const escala = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visivel) return;
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.2,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(escala, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 6,
        }),
      ]),
    ]).start();
  }, [escala, op, visivel]);

  return (
    <Animated.Text
      style={[
        estilos.nomeMrWhite,
        { opacity: op, transform: [{ scale: escala }] },
      ]}
    >
      {nomes}
    </Animated.Text>
  );
}

function BannerVitoria({ ehVitoriaMrWhite }: { ehVitoriaMrWhite: boolean }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(ty, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, [op, ty]);

  return (
    <Animated.View
      style={[
        estilos.banner,
        ehVitoriaMrWhite ? estilos.bannerMrWhite : estilos.bannerCivis,
        { opacity: op, transform: [{ translateY: ty }] },
      ]}
    >
      <Particulas />
      <Text style={estilos.bannerEmoji}>
        {ehVitoriaMrWhite ? '👁' : '🎉'}
      </Text>
      <Text style={estilos.bannerTitulo}>
        {ehVitoriaMrWhite ? 'MR WHITE VENCEU' : 'CIVIS VENCERAM'}
      </Text>
    </Animated.View>
  );
}

const QTD_PARTICULAS = 12;

function Particulas() {
  const particulas = useMemo(
    () =>
      Array.from({ length: QTD_PARTICULAS }, (_, i) => {
        const angulo = (Math.PI * 2 * i) / QTD_PARTICULAS;
        const distancia = 90 + Math.random() * 40;
        return {
          dx: Math.cos(angulo) * distancia,
          dy: Math.sin(angulo) * distancia,
          anim: new Animated.Value(0),
        };
      }),
    [],
  );

  useEffect(() => {
    const animacoes = particulas.map((p) =>
      Animated.timing(p.anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );
    Animated.parallel(animacoes).start();
  }, [particulas]);

  return (
    <View style={estilos.particulas} pointerEvents="none">
      {particulas.map((p, i) => {
        const tx = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx],
        });
        const ty = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dy],
        });
        const op = p.anim.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={[
              estilos.particula,
              {
                opacity: op,
                transform: [{ translateX: tx }, { translateY: ty }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function BlocoStagger({
  indice,
  children,
}: {
  indice: number;
  children: React.ReactNode;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        delay: indice * 180,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        delay: indice * 180,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [indice, op, ty]);
  return (
    <Animated.View style={{ opacity: op, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

function mensagemCompartilhar({
  nomesMrWhites,
  palavra,
  ehVitoriaMrWhite,
  palpiteFinal,
  palpiteCorreto,
}: {
  nomesMrWhites: string;
  palavra: string | null;
  ehVitoriaMrWhite: boolean;
  palpiteFinal: string | null;
  palpiteCorreto: boolean | null;
}): string {
  const nome = nomesMrWhites || 'O impostor';
  const palavraFinal = palavra ?? '???';

  // 6 templates por desfecho — sorteia um aleatoriamente.
  const civisGanharam = [
    `${nome} tentou ser o impostor mas a galera pegou no flagra 😂`,
    `A palavra era "${palavraFinal}" e ${nome} não fazia ideia 🕵️`,
    `Acabou o reinado de ${nome} — civis 1, impostor 0 ✊`,
    `${nome} disfarçou mal e foi desmascarado na votação 😬`,
    `O esquema do ${nome} caiu por terra. A palavra era "${palavraFinal}" 🎯`,
    `Civis 1, ${nome} 0. Próxima rodada vai melhor, impostor 👀`,
  ];

  const mrWhiteGanhou = [
    `${nome} enganou todo mundo e ninguém viu vindo 👁`,
    `Sem palavra, sem culpa, sem vergonha — ${nome} venceu 🔥`,
    `${nome} blefou tão bem que saiu como Mr White impune 🎭`,
    `A galera fica devendo essa: ${nome} escapou ileso 🕵️`,
    `Mr White venceu. A palavra era "${palavraFinal}" e ${nome} adivinhou 🤯`,
    `${nome} fez bonito disfarçando. Impostor 1, civis 0 😈`,
  ];

  const palpiteAcerto = [
    `${nome} foi pego mas adivinhou "${palavraFinal}" e virou o jogo 🤯`,
    `Última chance, último chute — "${palavraFinal}". ${nome} acertou 🎯`,
    `${nome} estava encurralado, soltou "${palavraFinal}" e venceu 🔥`,
  ];

  const palpiteErro = [
    `${nome} chutou "${palpiteFinal}" mas era "${palavraFinal}". Civis levam 😂`,
    `Quase: ${nome} disse "${palpiteFinal}", mas a palavra era "${palavraFinal}" 😬`,
    `${nome} foi descoberto e errou o chute. Civis arrasaram 🎉`,
  ];

  let pool: string[];
  if (palpiteFinal !== null && palpiteCorreto !== null) {
    pool = palpiteCorreto ? palpiteAcerto : palpiteErro;
  } else if (ehVitoriaMrWhite) {
    pool = mrWhiteGanhou;
  } else {
    pool = civisGanharam;
  }

  const principal = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  return `${principal}\n\nJogamos no Entre Nós 🎲 baixa aí e chama a galera.`;
}

const estilos = StyleSheet.create({
  aguardandoHost: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  esperandoBloco: {
    gap: espacamento.md,
  },
  banner: {
    alignItems: 'center',
    borderRadius: raio.lg,
    marginTop: espacamento.lg,
    overflow: 'hidden',
    padding: espacamento.xl,
    position: 'relative',
  },
  bannerCivis: {
    backgroundColor: '#064E3B',
  },
  bannerEmoji: {
    fontSize: 56,
    marginBottom: espacamento.sm,
  },
  bannerMrWhite: {
    backgroundColor: '#3B0764',
  },
  bannerTitulo: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  blocoResumo: {
    gap: espacamento.md,
    marginTop: espacamento.lg,
  },
  botaoCompartilhar: {
    alignItems: 'center',
    paddingVertical: espacamento.sm,
  },
  botaoCompartilharTexto: {
    color: cores.acento,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  cardResumo: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    padding: espacamento.lg,
  },
  conteudo: {
    padding: espacamento.lg,
  },
  dicaAutor: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    minWidth: 80,
  },
  dicaTexto: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
  },
  legendaMrWhite: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  linhaDica: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.sm,
  },
  nomeMrWhite: {
    color: cores.acento,
    fontSize: 44,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  palavraDestaque: {
    color: cores.acentoQuente,
    fontSize: 32,
    fontWeight: tipografia.pesoExtraBold,
    marginTop: espacamento.sm,
  },
  palpiteTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontStyle: 'italic',
    marginTop: espacamento.sm,
  },
  particula: {
    backgroundColor: cores.texto,
    borderRadius: 4,
    height: 8,
    left: '50%',
    marginLeft: -4,
    marginTop: -4,
    position: 'absolute',
    top: '50%',
    width: 8,
  },
  particulas: {
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  revelandoCentralizado: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  revelandoTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  rotulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  tagCorreto: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: cores.sucesso,
  },
  tagErrado: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: cores.erro,
  },
  tagPalpite: {
    alignSelf: 'flex-start',
    borderRadius: raio.sm,
    borderWidth: 1,
    marginTop: espacamento.sm,
    paddingHorizontal: espacamento.md - 4,
    paddingVertical: 4,
  },
  tagPalpiteTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.5,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
