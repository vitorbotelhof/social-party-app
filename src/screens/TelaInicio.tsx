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
import { HeroJogo } from '@/components/HeroJogo';
import {
  CATEGORIAS_EMOCIONAIS,
  JOGOS,
  jogosPorCategoria,
  type CategoriaMeta,
  type DefinicaoJogo,
} from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { obterOuCriarJogador, salvarNome } from '@/services/jogadorLocal';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

const MIN_TAMANHO_NOME = 2;
const ALTURA_CARD = 216;
const LARGURA_CARD_HORIZONTAL = 152;
const STAGGER_SECAO_MS = 70;

// Compact card gradient — fade starts at 50% since text footprint is small
const GRADIENTE_CARD: [string, string, string, string] = [
  'rgba(14,11,8,0)',
  'rgba(14,11,8,0)',
  'rgba(14,11,8,0.68)',
  'rgba(14,11,8,0.97)',
];

// Computed once — static catalog data grouped by primary category
const catalogoPorCategoria = jogosPorCategoria();
const categoriasComJogos = CATEGORIAS_EMOCIONAIS.filter(
  (cat) => catalogoPorCategoria[cat.id].length > 0,
);


export function TelaInicio({ navigation }: Props) {
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(10)).current;
  const taglineOp = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(10)).current;
  const heroOp = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(20)).current;
  const secoesAnim = useMemo(
    () => categoriasComJogos.map(() => ({ op: new Animated.Value(0), y: new Animated.Value(20) })),
    [],
  );

  const jogoDeDestaque = JOGOS.find((j) => j.destaque) ?? JOGOS[0]!;

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

    // Hero: entra logo após o header, com pacing cinematográfico
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(heroOp, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(heroY, { toValue: 0, duration: 520, useNativeDriver: true }),
      ]),
    ]).start();

    // Seções: entram em cascata após o hero se estabelecer
    Animated.sequence([
      Animated.delay(260),
      Animated.stagger(
        STAGGER_SECAO_MS,
        secoesAnim.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.op, { toValue: 1, duration: 420, useNativeDriver: true }),
            Animated.timing(anim.y, { toValue: 0, duration: 420, useNativeDriver: true }),
          ]),
        ),
      ),
    ]).start();
  }, [headerOp, headerY, heroOp, heroY, secoesAnim, taglineOp, taglineY]);

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
          style={{ opacity: heroOp, transform: [{ translateY: heroY }] }}
        >
          <HeroJogo
            jogo={jogoDeDestaque}
            onPress={() => aoEscolherJogo(jogoDeDestaque)}
          />
        </Animated.View>

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

        {categoriasComJogos.map((cat, i) => (
          <SecaoCategoria
            key={cat.id}
            meta={cat}
            jogos={catalogoPorCategoria[cat.id]}
            anim={secoesAnim[i]!}
            onEscolher={aoEscolherJogo}
          />
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

// ─── SecaoCategoria ──────────────────────────────────────────────────────────

interface SecaoCategoriaProps {
  meta: CategoriaMeta;
  jogos: DefinicaoJogo[];
  anim: { op: Animated.Value; y: Animated.Value };
  onEscolher: (jogo: DefinicaoJogo) => void;
}

function SecaoCategoria({ meta, jogos, anim, onEscolher }: SecaoCategoriaProps) {
  return (
    <Animated.View
      style={[estilos.secao, { opacity: anim.op, transform: [{ translateY: anim.y }] }]}
    >
      <View style={estilos.secaoCabecalho}>
        <Text style={estilos.secaoLabel}>{meta.label}</Text>
        <Text style={estilos.secaoSublabel}>{meta.sublabel}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.listaHorizontal}
        contentContainerStyle={estilos.listaHorizontalConteudo}
      >
        {jogos.map((jogo) => (
          <View key={jogo.id} style={estilos.cardHorizontalWrapper}>
            <CardJogo jogo={jogo} onPress={() => onEscolher(jogo)} />
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─── CardJogo ────────────────────────────────────────────────────────────────

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
            locations={[0, 0.5, 0.72, 1]}
            style={estilos.gradiente}
          />

          <View style={estilos.blocoBottom}>
            <Text style={estilos.cardNome} numberOfLines={2}>{jogo.nome}</Text>
            <Text style={estilos.cardSlogan} numberOfLines={1}>
              {jogo.slogan}
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
    gap: 3,
    paddingBottom: espacamento.md - 2,
    paddingHorizontal: 10,
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
    borderColor: 'rgba(160, 82, 45, 0.45)',
    borderWidth: 1,
  },
  cardImagem: {
    height: ALTURA_CARD,
    justifyContent: 'flex-end',
  },
  cardImagemRaio: {
    borderRadius: raio.lg,
  },
  cardNome: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: 15,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  cardPressavel: {
    borderRadius: raio.lg,
    overflow: 'hidden',
  },
  cardSlogan: {
    color: 'rgba(245,238,228,0.60)',
    fontSize: 11,
    fontWeight: tipografia.pesoRegular,
    lineHeight: 15,
  },
  cardWrapper: {
    borderRadius: raio.lg,
    marginBottom: 0,
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

  // ─── Category sections ─────────────────────────────────────────────────────
  secao: {
    marginBottom: espacamento.xl,
  },
  secaoCabecalho: {
    gap: 3,
    marginBottom: espacamento.md,
  },
  secaoLabel: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.1,
  },
  secaoSublabel: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoRegular,
    letterSpacing: 0.2,
  },
  // Breaks out of the scrollConteudo horizontal padding to reach screen edges
  listaHorizontal: {
    marginHorizontal: -espacamento.lg,
  },
  listaHorizontalConteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: 4,
  },
  cardHorizontalWrapper: {
    width: LARGURA_CARD_HORIZONTAL,
  },
});
