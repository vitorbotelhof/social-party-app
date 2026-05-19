import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraAcoesJogo, IndicadorConexao } from '@/components';
import type { GameId, GameState, Player, PlayerId, RoomCode } from '@/engine/types';
import type {
  MostLikelyPrivateState,
  MostLikelyPublicState,
} from '@/games/most-likely-to/types';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import {
  PALETA_AVATARES,
  cores,
  espacamento,
  familias,
  raio,
  tipografia,
} from '@/theme/colors';

type EstadoMLT = GameState<MostLikelyPublicState, MostLikelyPrivateState>;

interface Props {
  estado: EstadoMLT;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  jogadores: Player[];
}

// 3s pause — forces group to read the prompt together before voting opens
const DELAY_ABSORCAO_MS = 3000;

export function TelaPromptMostLikely({
  estado,
  roomCode,
  jogoId,
  jogadorId,
  jogadores,
}: Props) {
  const { estadoPublico } = estado;
  const [selecionado, setSelecionado] = useState<PlayerId | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [absorveu, setAbsorveu] = useState(false);
  const ultimoCliqueRef = useRef(0);

  const meuVoto = estadoPublico.votos[jogadorId] ?? null;
  const totalVotos = Object.keys(estadoPublico.votos).length;
  const total = estadoPublico.ordemJogadores.length;
  const todosVotaram = totalVotos >= total;

  useEffect(() => {
    const decorrido = Date.now() - estadoPublico.rodadaIniciadaEm;
    const restante = Math.max(0, DELAY_ABSORCAO_MS - decorrido);
    setAbsorveu(restante === 0);
    if (restante === 0) return;
    const id = setTimeout(() => setAbsorveu(true), restante);
    return () => clearTimeout(id);
  }, [estadoPublico.rodadaIniciadaEm]);

  const nomeDe = (id: PlayerId) =>
    jogadores.find((j) => j.id === id)?.nome ?? '...';

  async function aoSelecionar(id: PlayerId) {
    if (!absorveu || meuVoto || enviando || id === jogadorId) return;
    setSelecionado(id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function aoConfirmar() {
    if (!selecionado || meuVoto || enviando) return;
    const agora = Date.now();
    if (agora - ultimoCliqueRef.current < 1000) return;
    ultimoCliqueRef.current = agora;
    setEnviando(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await despacharAcao(
        roomCode,
        jogoId,
        criarAcao('votar', jogadorId, { alvoId: selecionado }),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />

      {/* Prompt — hero da tela. Sem título concorrente. */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.rodadaLegenda}>
          rodada {estado.rodada} de {estadoPublico.totalRodadas}
        </Text>
        <Text style={estilos.prompt}>{estadoPublico.promptAtual}</Text>
      </View>

      {/* Grade de jogadores — portrait cards, 2 colunas */}
      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        <View style={[estilos.grade, !absorveu && estilos.gradeNaoAbsorvida]}>
          {jogadores.map((j) => {
            const ehVoce = j.id === jogadorId;
            const ehSelecionado = selecionado === j.id;
            const ehMeuVoto = meuVoto === j.id;
            const destacado = ehMeuVoto || (ehSelecionado && !meuVoto);
            const opaco = ehVoce || (!!meuVoto && !ehMeuVoto);
            return (
              <CardVotoMLT
                key={j.id}
                jogador={j}
                ehVoce={ehVoce}
                destacado={destacado}
                opaco={opaco}
                desabilitado={ehVoce || !!meuVoto || enviando || !absorveu}
                onPress={() => aoSelecionar(j.id)}
              />
            );
          })}
        </View>
      </ScrollView>

      <RodapeVoto
        meuVoto={meuVoto}
        selecionado={selecionado}
        nomeSelecionado={selecionado ? nomeDe(selecionado) : null}
        absorveu={absorveu}
        totalVotos={totalVotos}
        total={total}
        todosVotaram={todosVotaram}
        enviando={enviando}
        onConfirmar={aoConfirmar}
      />
    </SafeAreaView>
  );
}

// ---------- Card de votação ----------

interface CardVotoMLTProps {
  jogador: Player;
  ehVoce: boolean;
  destacado: boolean;
  opaco: boolean;
  desabilitado: boolean;
  onPress: () => void;
}

function CardVotoMLT({
  jogador,
  ehVoce,
  destacado,
  opaco,
  desabilitado,
  onPress,
}: CardVotoMLTProps) {
  const escala = useRef(new Animated.Value(1)).current;
  const [corA, corB] = gradienteAvatarDe(jogador.id);
  const inicial = (jogador.nome.trim().charAt(0) || '?').toUpperCase();

  function aoPressIn() {
    if (desabilitado) return;
    Animated.spring(escala, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function aoPressOut() {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }

  return (
    <Animated.View
      style={[estilos.cardWrapper, { transform: [{ scale: escala }] }]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={aoPressIn}
        onPressOut={aoPressOut}
        disabled={desabilitado}
        style={[
          estilos.card,
          destacado && estilos.cardDestacado,
          opaco && estilos.cardOpaco,
          ehVoce && estilos.cardEhVoce,
        ]}
      >
        <LinearGradient
          colors={[corA, corB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={estilos.avatar}
        >
          <Text style={estilos.avatarTexto}>{inicial}</Text>
        </LinearGradient>

        <Text
          style={[estilos.cardNome, destacado && estilos.cardNomeDestacado]}
          numberOfLines={1}
        >
          {jogador.nome}
        </Text>

        {ehVoce && <Text style={estilos.cardVoceLegenda}>você</Text>}
      </Pressable>
    </Animated.View>
  );
}

// ---------- Rodapé condicional ----------

interface RodapeVotoProps {
  meuVoto: PlayerId | null;
  selecionado: PlayerId | null;
  nomeSelecionado: string | null;
  absorveu: boolean;
  totalVotos: number;
  total: number;
  todosVotaram: boolean;
  enviando: boolean;
  onConfirmar: () => void;
}

function RodapeVoto({
  meuVoto,
  selecionado,
  nomeSelecionado,
  absorveu,
  totalVotos,
  total,
  todosVotaram,
  enviando,
  onConfirmar,
}: RodapeVotoProps) {
  // Já votou → espera o grupo
  if (meuVoto) {
    return (
      <EsperaVotos
        totalVotos={totalVotos}
        total={total}
        todosVotaram={todosVotaram}
      />
    );
  }

  // Ainda absorvendo o prompt → rodapé vazio (mantém altura mínima)
  if (!absorveu) {
    return <View style={[estilos.rodape, estilos.rodapeVazio]} />;
  }

  // Absorveu mas não selecionou → dica sutil
  if (!selecionado) {
    return (
      <View style={estilos.rodape}>
        <Text style={estilos.dicaVoto}>quem mais representa essa situação?</Text>
      </View>
    );
  }

  // Selecionou → botão de confirmação
  return (
    <View style={estilos.rodape}>
      <Pressable
        onPress={onConfirmar}
        disabled={enviando}
        style={({ pressed }) => [
          estilos.botaoConfirmar,
          pressed && estilos.botaoConfirmarPressionado,
          enviando && estilos.botaoDesabilitado,
        ]}
      >
        <Text style={estilos.botaoConfirmarTexto}>
          {enviando ? 'votando...' : `${nomeSelecionado}, com certeza.`}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------- Waiting state — breath, não loading ----------

function EsperaVotos({
  totalVotos,
  total,
  todosVotaram,
}: {
  totalVotos: number;
  total: number;
  todosVotaram: boolean;
}) {
  const opacidade = useRef(new Animated.Value(todosVotaram ? 0 : 1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    animRef.current?.stop();
    if (todosVotaram) {
      opacidade.setValue(0);
      animRef.current = Animated.timing(opacidade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      });
      animRef.current.start();
      return;
    }
    opacidade.setValue(1);
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidade, {
          toValue: 0.4,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
      ]),
    );
    animRef.current.start();
    return () => {
      animRef.current?.stop();
    };
  }, [todosVotaram, opacidade]);

  return (
    <View style={estilos.rodape}>
      <View style={estilos.esperaBloco}>
        {todosVotaram ? (
          <Animated.Text
            style={[estilos.esperaDecidiu, { opacity: opacidade }]}
          >
            o grupo decidiu.
          </Animated.Text>
        ) : (
          <Animated.Text
            style={[estilos.esperaAguardando, { opacity: opacidade }]}
          >
            o grupo está decidindo.
          </Animated.Text>
        )}
        {!todosVotaram && (
          <Text style={estilos.esperaContador}>
            {totalVotos} de {total} votaram
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------- Helpers ----------

function gradienteAvatarDe(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETA_AVATARES.length;
  const idx2 =
    (idx + Math.floor(PALETA_AVATARES.length / 2)) % PALETA_AVATARES.length;
  return [PALETA_AVATARES[idx]!, PALETA_AVATARES[idx2]!];
}

// ---------- Estilos ----------

const TAMANHO_AVATAR = 72;

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },

  // Cabeçalho — prompt como herói
  cabecalho: {
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  rodadaLegenda: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLegenda,
    marginBottom: espacamento.sm,
    textTransform: 'uppercase',
  },
  // Prompt em serifItalico — editorial, não trivia
  prompt: {
    color: cores.texto,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoSubtituloGrande,
    lineHeight: 34,
  },

  // Grade
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollConteudo: {
    paddingBottom: espacamento.xl,
    paddingHorizontal: espacamento.lg,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.sm,
  },
  gradeNaoAbsorvida: {
    opacity: 0.52,
  },

  // Cards — portrait (avatar em cima, nome embaixo)
  cardWrapper: {
    width: '48.5%',
  },
  card: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1.5,
    gap: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.lg,
  },
  cardDestacado: {
    backgroundColor: cores.acentoEscuro,
    borderColor: cores.acento,
    borderWidth: 2,
  },
  cardOpaco: {
    opacity: 0.42,
  },
  cardEhVoce: {
    opacity: 0.3,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: TAMANHO_AVATAR / 2,
    height: TAMANHO_AVATAR,
    justifyContent: 'center',
    width: TAMANHO_AVATAR,
  },
  avatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 28,
    fontWeight: tipografia.pesoExtraBold,
  },
  cardNome: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
    textAlign: 'center',
  },
  // Nome destacado: serif + âmbar — identidade nomeada
  cardNomeDestacado: {
    color: cores.acento,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
  },
  cardVoceLegenda: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Rodapé
  rodape: {
    alignItems: 'stretch',
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  rodapeVazio: {
    minHeight: 80,
  },
  dicaVoto: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
  // Botão de confirmação — âmbar, não vinho (MLT é mais leve que Mr White)
  botaoConfirmar: {
    alignItems: 'center',
    backgroundColor: cores.acento,
    borderRadius: raio.pill,
    elevation: 6,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: espacamento.xl,
    shadowColor: cores.acento,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  botaoConfirmarPressionado: {
    backgroundColor: cores.acentoPressionado,
    transform: [{ scale: 0.98 }],
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoConfirmarTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoCorpo,
  },

  // Waiting state
  esperaBloco: {
    alignItems: 'center',
    paddingTop: espacamento.xs,
  },
  esperaAguardando: {
    color: cores.textoMudo,
    fontFamily: familias.serifItalico,
    fontSize: tipografia.tamanhoSubtitulo,
    textAlign: 'center',
  },
  esperaDecidiu: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoSubtitulo,
    letterSpacing: 0,
    textAlign: 'center',
  },
  esperaContador: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
});
