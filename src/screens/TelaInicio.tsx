import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components';
import { JOGOS, type DefinicaoJogo } from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { obterOuCriarJogador, salvarNome } from '@/services/jogadorLocal';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

const MIN_TAMANHO_NOME = 2;
const ALTURA_CARD = 272;
const STAGGER_MS = 85;
// Noir warm: topo claro, base carvão quente (não preto puro)
const GRADIENTE_CARD: [string, string, string, string] = [
  'rgba(0,0,0,0)',
  'rgba(0,0,0,0)',
  'rgba(10,6,2,0.64)',
  'rgba(10,6,2,0.97)',
];


export function TelaInicio({ navigation }: Props) {
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(10)).current;
  const taglineOp = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(10)).current;
  const cardsAnim = useMemo(
    () => JOGOS.map(() => ({ op: new Animated.Value(0), y: new Animated.Value(24) })),
    [],
  );

  const [jogador, setJogador] = useState<{ id: string; nome: string | null } | null>(null);
  const [mostrarModalNome, setMostrarModalNome] = useState(false);
  const [nomeDigitado, setNomeDigitado] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obterOuCriarJogador().then((j) => {
      setJogador(j);
      if (!j.nome) setMostrarModalNome(true);
    });
  }, []);

  useEffect(() => {
    // Header: entrada rápida para estabelecer o espaço
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Tagline: 160ms de delay — o palco se abre antes das estrelas entrarem
    Animated.sequence([
      Animated.delay(160),
      Animated.parallel([
        Animated.timing(taglineOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Cards: entram deliberadamente após a atmosfera se estabelecer
    Animated.stagger(
      STAGGER_MS,
      cardsAnim.map((anim) =>
        Animated.parallel([
          Animated.timing(anim.op, { toValue: 1, duration: 440, useNativeDriver: true }),
          Animated.timing(anim.y, { toValue: 0, duration: 440, useNativeDriver: true }),
        ]),
      ),
    ).start();
  }, [cardsAnim, headerOp, headerY, taglineOp, taglineY]);

  const nomeValido = nomeDigitado.trim().length >= MIN_TAMANHO_NOME;

  async function confirmarNome() {
    if (!nomeValido || salvando) return;
    setSalvando(true);
    const nomeLimpo = nomeDigitado.trim();
    try {
      await salvarNome(nomeLimpo);
      setJogador((j) => (j ? { ...j, nome: nomeLimpo } : j));
      setMostrarModalNome(false);
      setNomeDigitado('');
    } finally {
      setSalvando(false);
    }
  }

  function aoEscolherJogo(jogo: DefinicaoJogo) {
    if (!jogo.disponivel) return;
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('SelecaoDinamica', { jogoId: jogo.id });
  }

  function aoEntrarPartida() {
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    navigation.navigate('EntrarSala');
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          estilos.header,
          { opacity: headerOp, transform: [{ translateY: headerY }] },
        ]}
      >
        <View style={estilos.headerLinha}>
          <Text style={estilos.marca}>entre nós</Text>
          <Pressable
            onPress={aoEntrarPartida}
            style={({ pressed }) => [
              estilos.botaoEntrar,
              pressed && estilos.botaoEntrarPressionado,
            ]}
          >
            <Text style={estilos.botaoEntrarTexto}>tenho código</Text>
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            estilos.blocoTagline,
            { opacity: taglineOp, transform: [{ translateY: taglineY }] },
          ]}
        >
          <Text style={estilos.tagline}>
            cuidado com o que você começa.
          </Text>
        </Animated.View>

        {JOGOS.map((jogo, i) => (
          <Animated.View
            key={jogo.id}
            style={{
              opacity: cardsAnim[i]!.op,
              transform: [{ translateY: cardsAnim[i]!.y }],
            }}
          >
            <CardJogo
              jogo={jogo}
              onPress={() => aoEscolherJogo(jogo)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <Modal
        visible={mostrarModalNome}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (jogador?.nome) setMostrarModalNome(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={estilos.modalOverlay}
        >
          <Pressable
            style={estilos.modalToque}
            onPress={() => {
              if (jogador?.nome) setMostrarModalNome(false);
            }}
          />
          <View style={estilos.modalCard}>
            <Text style={estilos.modalTitulo}>como te chamam?</Text>
            <Text style={estilos.modalSubtitulo}>
              é como os outros vão te ver
            </Text>
            <TextInput
              value={nomeDigitado}
              onChangeText={setNomeDigitado}
              placeholder="seu nome..."
              placeholderTextColor={cores.textoMudo}
              maxLength={20}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmarNome}
              style={estilos.modalInput}
            />
            <BotaoPrimario
              titulo="entrar"
              carregando={salvando}
              disabled={!nomeValido}
              onPress={confirmarNome}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

interface CardJogoProps {
  jogo: DefinicaoJogo;
  onPress: () => void;
}

function CardJogo({ jogo, onPress }: CardJogoProps) {
  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    if (!jogo.disponivel) return;
    Animated.spring(escala, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function aoSoltar() {
    if (!jogo.disponivel) return;
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  }

  return (
    <Animated.View
      style={[
        estilos.cardWrapper,
        jogo.disponivel && estilos.cardAtivo,
        { transform: [{ scale: escala }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        disabled={!jogo.disponivel}
        style={estilos.cardPressavel}
      >
        <ImageBackground
          source={jogo.cover}
          style={estilos.cardImagem}
          imageStyle={estilos.cardImagemRaio}
        >
          <LinearGradient
            colors={GRADIENTE_CARD}
            locations={[0, 0.3, 0.62, 1]}
            style={estilos.gradiente}
          />

          <View style={estilos.blocoBottom}>
            <Text style={estilos.cardNome}>{jogo.nome}</Text>
            <Text style={estilos.cardSlogan} numberOfLines={2}>
              {jogo.slogan}
            </Text>
            {jogo.socialTags.length > 0 && (
              <View style={estilos.chips}>
                {jogo.socialTags.map((cat) => (
                  <View key={cat} style={estilos.chip}>
                    <Text style={estilos.chipTexto}>{cat}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={estilos.metadados}>
              {jogo.minJogadores}–{jogo.maxJogadores} jogadores · {jogo.tempoMedio}
            </Text>
          </View>

          {!jogo.disponivel && (
            <View style={estilos.overlayEmBreve}>
              <View style={estilos.seloEmBreve}>
                <Text style={estilos.seloTexto}>EM BREVE</Text>
              </View>
            </View>
          )}
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  blocoBottom: {
    gap: 6,
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.md + 4,
    paddingTop: 0,
  },
  botaoEntrar: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  botaoEntrarPressionado: {
    opacity: 0.7,
  },
  botaoEntrarTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
  },
  cardAtivo: {
    borderColor: 'rgba(160, 82, 45, 0.5)',
    borderWidth: 1,
  },
  cardImagem: {
    height: ALTURA_CARD,
    justifyContent: 'flex-end',
  },
  cardImagemRaio: {
    borderRadius: raio.xl,
  },
  cardNome: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: 26,
    letterSpacing: 0.2,
    lineHeight: 32,
  },
  cardPressavel: {
    borderRadius: raio.xl,
    overflow: 'hidden',
  },
  cardSlogan: {
    color: 'rgba(245,238,228,0.80)',
    fontSize: 14,
    fontWeight: tipografia.pesoMedio,
    lineHeight: 20,
  },
  cardWrapper: {
    borderRadius: raio.xl,
    marginBottom: 28,
  },
  chip: {
    borderColor: 'rgba(245,230,210,0.22)',
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm + 2,
    paddingVertical: 3,
  },
  chipTexto: {
    color: 'rgba(245,230,210,0.55)',
    fontSize: 11,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.xs,
    marginTop: 2,
  },
  metadados: {
    color: 'rgba(245,230,210,0.35)',
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 6,
  },
  gradiente: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blocoTagline: {
    paddingBottom: espacamento.xxl,
    paddingTop: espacamento.sm,
  },
  header: {
    paddingBottom: espacamento.xl,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  headerLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marca: {
    color: cores.texto,
    fontFamily: familias.serifItalico,
    fontSize: 22,
    letterSpacing: 0.3,
  },
  modalCard: {
    backgroundColor: cores.superficie,
    borderRadius: raio.xl,
    gap: espacamento.md,
    padding: espacamento.lg + 4,
    width: '100%',
  },
  modalInput: {
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.md,
    color: cores.texto,
    fontSize: 18,
    fontWeight: tipografia.pesoMedio,
    padding: espacamento.md,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  modalSubtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.sm,
  },
  modalTitulo: {
    color: cores.texto,
    fontSize: 24,
    fontWeight: tipografia.pesoBold,
  },
  modalToque: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    paddingBottom: espacamento.xxl + espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  seloEmBreve: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm - 2,
  },
  seloTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingLabel,
  },
  tagline: {
    color: cores.textoSecundario,
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.15,
    lineHeight: 28,
    opacity: 0.85,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  overlayEmBreve: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
