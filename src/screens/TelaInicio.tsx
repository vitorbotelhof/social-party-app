import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoPrimario } from '@/components';
import { HeroJogo } from '@/components/HeroJogo';
import { Logo } from '@/components/Logo';
import {
  CATEGORIAS_EMOCIONAIS,
  JOGOS,
  jogosPorCategoria,
  type CategoriaEmocional,
  type CategoriaMeta,
  type DefinicaoJogo,
} from '@/games/gameRegistry';
import type { RootStackParamList } from '@/navigation/types';
import { obterOuCriarJogador, salvarNome } from '@/services/jogadorLocal';
import { tutorialFoiVisto } from '@/services/tutorial';
import { getSessaoAtual } from '@/session/sessionStore';
import type { TemperaturaEmocional } from '@/session/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

const MIN_TAMANHO_NOME = 2;
const LARGURA_CARD_BROWSE = 152;
const ALTURA_CARD_BROWSE = 216;

// Gradient para cards de browse horizontal (estado padrão)
const GRADIENTE_BROWSE: [string, string, string, string] = [
  'rgba(22,14,10,0)',
  'rgba(22,14,10,0)',
  'rgba(22,14,10,0.72)',
  'rgba(22,14,10,0.97)',
];

// Catálogo estático — calculado uma única vez
const catalogoPorCategoria = jogosPorCategoria();
const jogoDeDestaque = JOGOS.find((j) => j.destaque) ?? JOGOS[0]!;
const todosDisponiveis = JOGOS.filter((j) => j.disponivel);

// Quais vibes têm pelo menos 1 jogo disponível (para o indicador no chip)
const vibesComJogo = new Set(
  CATEGORIAS_EMOCIONAIS
    .filter((cat) => catalogoPorCategoria[cat.id].some((j) => j.disponivel))
    .map((cat) => cat.id),
);


// ─── Tela principal ───────────────────────────────────────────────────────────

export function TelaInicio({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // ── Animações de entrada
  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(10)).current;
  const chipsOp = useRef(new Animated.Value(0)).current;
  const conteudoOp = useRef(new Animated.Value(0)).current;

  // ── Estado do jogador e nome
  const [jogador, setJogador] = useState<{ id: string; nome: string | null } | null>(null);
  const [mostrarModalNome, setMostrarModalNome] = useState(false);
  const [nomeDigitado, setNomeDigitado] = useState('');
  const [salvando, setSalvando] = useState(false);

  // ── Vibe navigation — o coração da home
  const [vibeAtiva, setVibeAtiva] = useState<CategoriaEmocional | null>(null);

  // ── Temperatura da sessão — atualiza ao voltar para a home
  const [temperatura, setTemperatura] = useState<TemperaturaEmocional>('frio');
  useFocusEffect(
    useCallback(() => {
      setTemperatura(getSessaoAtual()?.temperatura ?? 'frio');
    }, []),
  );

  // ── Bottom sheet de seleção de modo
  const [jogoSelecionado, setJogoSelecionado] = useState<DefinicaoJogo | null>(null);
  const sheetY = useRef(new Animated.Value(500)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;

  // ── Carrega jogador ao montar
  useEffect(() => {
    obterOuCriarJogador().then((j) => {
      setJogador(j);
      if (!j.nome) setMostrarModalNome(true);
    });
  }, []);

  // ── Animação de entrada em cascata rápida
  useEffect(() => {
    // Header: âncora o espaço imediatamente
    Animated.parallel([
      Animated.timing(headerOp, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    // Chips: logo atrás do header — a pergunta "qual a vibe?" aparece cedo
    Animated.sequence([
      Animated.delay(80),
      Animated.timing(chipsOp, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    // Conteúdo principal: entra por último, completando o layout
    Animated.sequence([
      Animated.delay(160),
      Animated.timing(conteudoOp, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [headerOp, headerY, chipsOp, conteudoOp]);

  // ── Seleção de vibe — chips atualizam imediatamente, conteúdo faz crossfade
  function selecionarVibe(id: CategoriaEmocional) {
    const novaVibe = id === vibeAtiva ? null : id;
    setVibeAtiva(novaVibe);
    void Haptics.selectionAsync();

    // Fade out → fade in: 100ms saída, 220ms entrada
    Animated.sequence([
      Animated.timing(conteudoOp, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(conteudoOp, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }

  // ── Ações de navegação
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

  // ── Sheet: abrir / fechar / navegar ─────────────────────────────────────────

  function aoEscolherJogo(jogo: DefinicaoJogo) {
    if (!jogo.disponivel) return;
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJogoSelecionado(jogo);
    sheetY.setValue(500);
    overlayOp.setValue(0);
    Animated.parallel([
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 4,
      }),
      Animated.timing(overlayOp, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function fecharSheet() {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOp, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setJogoSelecionado(null));
  }

  async function aoEscolherModo(id: 'local' | 'realtime' | 'entrar') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const jogoId = jogoSelecionado?.id;
    // Fecha o sheet imediatamente — a transição de navegação cobre o dismiss
    setJogoSelecionado(null);

    if (id === 'local') {
      if (jogoId === 'most-likely-to') {
        navigation.navigate('ConfiguracaoLocalMostLikely');
      } else if (jogoId === 'na-ponta-da-lingua') {
        navigation.navigate('ConfiguracaoLocalNaPontaDaLingua');
      } else if (jogoId === 'inquisicao') {
        navigation.navigate('ConfiguracaoLocalInquisicao');
      } else {
        navigation.navigate('ConfiguracaoLocal');
      }
    } else if (id === 'realtime') {
      if (jogoId === 'mrwhite' && !(await tutorialFoiVisto('mrwhite'))) {
        navigation.navigate('Tutorial', { jogoId });
        return;
      }
      if (jogoId) navigation.navigate('CriarSala', { jogoId });
    } else {
      navigation.navigate('EntrarSala');
    }
  }

  function aoVerDetalhesDoJogo() {
    if (!jogoSelecionado) return;
    const { id } = jogoSelecionado;
    setJogoSelecionado(null);
    navigation.navigate('DetalhesJogo', { jogoId: id });
  }

  function aoEntrarPartida() {
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    navigation.navigate('EntrarSala');
  }

  // ── Dados para o bloco de vibe ativa
  const metaVibeAtiva = vibeAtiva
    ? CATEGORIAS_EMOCIONAIS.find((c) => c.id === vibeAtiva) ?? null
    : null;
  const jogosParaVibe = vibeAtiva ? catalogoPorCategoria[vibeAtiva] : [];

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <Animated.View
        style={[
          estilos.header,
          { opacity: headerOp, transform: [{ translateY: headerY }] },
        ]}
      >
        <View style={estilos.headerLinha}>
          <View style={estilos.marcaContainer}>
            <Logo tamanho={28} />
            <Text style={estilos.marca}>entre nós</Text>
            {temperatura !== 'frio' && (
              <IndicadorTemperatura temperatura={temperatura} />
            )}
          </View>
          <Pressable
            onPress={aoEntrarPartida}
            style={({ pressed }) => [
              estilos.botaoEntrar,
              pressed && estilos.botaoEntrarPressionado,
            ]}
            accessibilityLabel="Entrar com código de sala"
            accessibilityRole="button"
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
        {/* ── Vibe Chips — navegação primária ── */}
        <Animated.View style={{ opacity: chipsOp }}>
          <VibeChips
            vibes={CATEGORIAS_EMOCIONAIS}
            ativa={vibeAtiva}
            onSelect={selecionarVibe}
          />
        </Animated.View>

        {/* ── Conteúdo principal — muda com a vibe selecionada ── */}
        <Animated.View style={{ opacity: conteudoOp }}>
          {vibeAtiva && metaVibeAtiva ? (
            <BlocoVibeAtiva
              meta={metaVibeAtiva}
              jogos={jogosParaVibe}
              onEscolher={aoEscolherJogo}
            />
          ) : (
            <BlocoDefault onEscolherJogo={aoEscolherJogo} />
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Sheet de seleção de modo ── */}
      <Modal
        visible={!!jogoSelecionado}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={fecharSheet}
      >
        <View style={estilos.sheetContainer}>
          {/* Overlay — toque para fechar */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={fecharSheet}>
            <Animated.View
              style={[StyleSheet.absoluteFillObject, estilos.sheetOverlay, { opacity: overlayOp }]}
            />
          </Pressable>

          {/* Sheet em si */}
          <Animated.View
            style={[estilos.sheet, { transform: [{ translateY: sheetY }] }]}
          >
            {/* Handle */}
            <View style={estilos.sheetHandle} />

            {/* Nome do jogo */}
            <Text style={estilos.sheetNomeJogo}>{jogoSelecionado?.nome}</Text>

            {/* Opções */}
            <View style={estilos.sheetOpcoes}>
              {jogoSelecionado?.supportsLocal && (
                <SheetOpcao
                  titulo="passando de mão em mão"
                  descricao="um celular, o grupo todo. cada um pega na sua vez."
                  primaria
                  onPress={() => void aoEscolherModo('local')}
                />
              )}
              {jogoSelecionado?.supportsRealtime && (
                <SheetOpcao
                  titulo="cada um com o seu"
                  descricao="todo mundo com celular. papéis separados, segredos na tela."
                  primaria
                  onPress={() => void aoEscolherModo('realtime')}
                />
              )}
              <SheetOpcao
                titulo="entrar numa sala"
                descricao="alguém já começou. só entrar com o código."
                primaria={false}
                onPress={() => void aoEscolherModo('entrar')}
              />
            </View>

            {/* Link para detalhes */}
            <Pressable
              onPress={aoVerDetalhesDoJogo}
              style={({ pressed }) => [
                estilos.sheetLinkDetalhes,
                pressed && { opacity: 0.5 },
              ]}
            >
              <Text style={estilos.sheetLinkDetalhesTexto}>como funciona →</Text>
            </Pressable>

            {/* Safe area */}
            <View style={{ height: Math.max(insets.bottom, espacamento.md) }} />
          </Animated.View>
        </View>
      </Modal>

      {/* ── Modal de nome ── */}
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
            <Text style={estilos.modalSubtitulo}>é como os outros vão te ver</Text>
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
              accessibilityLabel="Campo de nome"
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


// ─── IndicadorTemperatura ─────────────────────────────────────────────────────

const TEMP_VISUAL: Record<Exclude<TemperaturaEmocional, 'frio'>, { cor: string; rotulo: string }> = {
  morno:   { cor: '#FFBE0B', rotulo: 'esquentando' },
  quente:  { cor: '#FF7A7F', rotulo: 'quente' },
  colapso: { cor: cores.primaria, rotulo: 'caos' },
};

function IndicadorTemperatura({ temperatura }: { temperatura: TemperaturaEmocional }) {
  if (temperatura === 'frio') return null;
  const { cor, rotulo } = TEMP_VISUAL[temperatura];
  return (
    <View style={estilos.tempIndicador}>
      <View style={[estilos.tempPonto, { backgroundColor: cor }]} />
      <Text style={[estilos.tempRotulo, { color: cor }]}>{rotulo}</Text>
    </View>
  );
}

// ─── SheetOpcao ───────────────────────────────────────────────────────────────
// Opção de modo dentro do bottom sheet.
// Primárias: borda sutil + ponto colorido. Secundária: mais discreta.

interface SheetOpcaoProps {
  titulo: string;
  descricao: string;
  primaria: boolean;
  onPress: () => void;
}

function SheetOpcao({ titulo, descricao, primaria, onPress }: SheetOpcaoProps) {
  const escala = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(escala, {
            toValue: 0.97,
            useNativeDriver: true,
            speed: 40,
            bounciness: 0,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(escala, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 6,
          }).start()
        }
        style={[estilos.sheetOpcao, primaria && estilos.sheetOpcaoPrimaria]}
        accessibilityRole="button"
        accessibilityLabel={titulo}
      >
        {primaria && <View style={estilos.sheetPonto} />}
        <View style={estilos.sheetOpcaoTextos}>
          <Text
            style={[
              estilos.sheetOpcaoTitulo,
              !primaria && estilos.sheetOpcaoTituloSec,
            ]}
          >
            {titulo}
          </Text>
          <Text style={estilos.sheetOpcaoDesc}>{descricao}</Text>
        </View>
        <Text
          style={[estilos.sheetSeta, !primaria && estilos.sheetSetaSec]}
        >
          →
        </Text>
      </Pressable>
    </Animated.View>
  );
}


// ─── VibeChips ────────────────────────────────────────────────────────────────
// Navegação primária da home — "qual a vibe?" como pergunta real, não rótulo.
// Chips com indicador para vibes que têm jogos disponíveis agora.

interface VibeChipsProps {
  vibes: ReadonlyArray<CategoriaMeta>;
  ativa: CategoriaEmocional | null;
  onSelect: (id: CategoriaEmocional) => void;
}

function VibeChips({ vibes, ativa, onSelect }: VibeChipsProps) {
  return (
    <View style={estilos.vibeContainer}>
      <Text style={estilos.vibePergunta}>qual a vibe?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.vibeScroll}
        contentContainerStyle={estilos.vibeScrollConteudo}
      >
        {vibes.map((v) => {
          const selecionada = ativa === v.id;
          const temJogo = vibesComJogo.has(v.id);
          return (
            <Pressable
              key={v.id}
              onPress={() => onSelect(v.id)}
              style={({ pressed }) => [
                estilos.vibeChip,
                selecionada && estilos.vibeChipAtiva,
                pressed && !selecionada && estilos.vibeChipPressionada,
              ]}
              accessibilityLabel={v.label}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionada }}
            >
              <Text
                style={[
                  estilos.vibeChipTexto,
                  selecionada && estilos.vibeChipTextoAtivo,
                ]}
              >
                {v.labelCurto}
              </Text>
              {/* Ponto verde sutil — indica que há jogos disponíveis */}
              {temJogo && !selecionada && (
                <View style={estilos.vibeChipPonto} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}


// ─── BlocoDefault ─────────────────────────────────────────────────────────────
// Estado padrão (sem vibe selecionada): jogo em destaque + browse dos outros.
// Ação principal clara: "jogar agora" no HeroJogo.

interface BlocoDefaultProps {
  onEscolherJogo: (jogo: DefinicaoJogo) => void;
}

function BlocoDefault({ onEscolherJogo }: BlocoDefaultProps) {
  const outrosDisponiveis = todosDisponiveis.filter((j) => j.id !== jogoDeDestaque.id);

  return (
    <>
      {/* Jogo em destaque — CTA imediato */}
      <HeroJogo
        jogo={jogoDeDestaque}
        onPress={() => onEscolherJogo(jogoDeDestaque)}
      />

      {/* Browse horizontal dos outros jogos disponíveis */}
      {outrosDisponiveis.length > 0 && (
        <View style={estilos.browseSec}>
          <Text style={estilos.browseSecTitulo}>outros jogos</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={estilos.browseScroll}
            contentContainerStyle={estilos.browseScrollConteudo}
          >
            {outrosDisponiveis.map((jogo) => (
              <View key={jogo.id} style={{ width: LARGURA_CARD_BROWSE }}>
                <CardJogoBrowse jogo={jogo} onPress={() => onEscolherJogo(jogo)} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
}


// ─── BlocoVibeAtiva ───────────────────────────────────────────────────────────
// Estado de vibe selecionada: statement emocional + jogos filtrados.
// Fluxo: chip → statement → jogo → "jogar agora" sem nova decisão.

interface BlocoVibeAtivaProps {
  meta: CategoriaMeta;
  jogos: DefinicaoJogo[];
  onEscolher: (jogo: DefinicaoJogo) => void;
}

function BlocoVibeAtiva({ meta, jogos, onEscolher }: BlocoVibeAtivaProps) {
  const disponiveis = jogos.filter((j) => j.disponivel);

  return (
    <View style={estilos.blocoVibe}>
      {/* Statement da vibe — contexto emocional antes dos jogos */}
      <View style={estilos.vibeStatement}>
        <Text style={estilos.vibeStatementLabel}>{meta.label}</Text>
        <Text style={estilos.vibeStatementSub}>{meta.sublabel}</Text>
      </View>

      {disponiveis.length === 0 ? (
        // Nenhum jogo disponível para esta vibe
        <BlocoEmBreve />
      ) : (
        <>
          {/* Primeiro jogo como hero — ação principal */}
          <HeroJogo
            jogo={disponiveis[0]!}
            onPress={() => onEscolher(disponiveis[0]!)}
          />

          {/* Jogos adicionais como linhas compactas */}
          {disponiveis.slice(1).map((jogo) => (
            <CardJogoLinha
              key={jogo.id}
              jogo={jogo}
              onPress={() => onEscolher(jogo)}
            />
          ))}
        </>
      )}
    </View>
  );
}


// ─── BlocoEmBreve ─────────────────────────────────────────────────────────────
// Placeholder honesto quando a vibe não tem jogos disponíveis ainda.

function BlocoEmBreve() {
  return (
    <View style={estilos.emBreveBloco}>
      <View style={estilos.emBreveSelo}>
        <Text style={estilos.emBreveSeloTexto}>em breve</Text>
      </View>
      <Text style={estilos.emBreveTexto}>
        jogos chegando para essa vibe
      </Text>
    </View>
  );
}


// ─── CardJogoBrowse ───────────────────────────────────────────────────────────
// Card vertical para browse horizontal — imagem + nome + slogan.
// Usado na seção "outros jogos" do estado padrão.

interface CardJogoProps {
  jogo: DefinicaoJogo;
  onPress: () => void;
}

function CardJogoBrowse({ jogo, onPress }: CardJogoProps) {
  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    Animated.spring(escala, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function aoSoltar() {
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
        estilos.browseCard,
        jogo.disponivel && estilos.browseCardAtivo,
        { transform: [{ scale: escala }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        disabled={!jogo.disponivel}
        style={estilos.browseCardPressavel}
        accessibilityLabel={`Jogar ${jogo.nome}`}
        accessibilityRole="button"
      >
        <ImageBackground
          source={jogo.cover}
          style={estilos.browseCardImagem}
          imageStyle={estilos.browseCardImagemRaio}
        >
          <LinearGradient
            colors={GRADIENTE_BROWSE}
            locations={[0, 0.5, 0.72, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={estilos.browseCardInfo}>
            <Text style={estilos.browseCardNome} numberOfLines={2}>
              {jogo.nome}
            </Text>
            <Text style={estilos.browseCardSlogan} numberOfLines={1}>
              {jogo.slogan}
            </Text>
          </View>

          {!jogo.disponivel && (
            <View style={estilos.overlayEmBreve}>
              <View style={estilos.seloEmBreve}>
                <Text style={estilos.seloEmBreveTexto}>EM BREVE</Text>
              </View>
            </View>
          )}
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}


// ─── CardJogoLinha ────────────────────────────────────────────────────────────
// Card horizontal compacto — thumb + info + seta de ação.
// Usado quando vibe tem múltiplos jogos disponíveis.

interface CardJogoLinhaProps {
  jogo: DefinicaoJogo;
  onPress: () => void;
}

function CardJogoLinha({ jogo, onPress }: CardJogoLinhaProps) {
  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    Animated.spring(escala, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  }
  function aoSoltar() {
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 4 }).start();
  }

  return (
    <Animated.View style={[estilos.linhaCard, { transform: [{ scale: escala }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        style={estilos.linhaPressavel}
        accessibilityLabel={`Jogar ${jogo.nome}`}
        accessibilityRole="button"
      >
        {/* Thumbnail */}
        <ImageBackground
          source={jogo.cover}
          style={estilos.linhaThumb}
          imageStyle={estilos.linhaThumbImg}
        >
          <LinearGradient
            colors={['rgba(22,14,10,0)', 'rgba(22,14,10,0.40)']}
            style={StyleSheet.absoluteFillObject}
          />
        </ImageBackground>

        {/* Info */}
        <View style={estilos.linhaInfo}>
          <Text style={estilos.linhaNome} numberOfLines={1}>{jogo.nome}</Text>
          <Text style={estilos.linhaSlogan} numberOfLines={1}>{jogo.slogan}</Text>
          <Text style={estilos.linhaMeta}>
            {jogo.minJogadores}–{jogo.maxJogadores} jogadores · {jogo.tempoMedio}
          </Text>
        </View>

        {/* Seta */}
        <View style={estilos.linhaSeta}>
          <Text style={estilos.linhaSetaTexto}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}


// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },

  // ── Header ──
  header: {
    paddingBottom: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  headerLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marcaContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  marca: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  // Indicador de temperatura — ponto + palavra, invisível quando frio
  tempIndicador: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginLeft: 2,
  },
  tempPonto: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  tempRotulo: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
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
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
  },

  // ── ScrollView ──
  scroll: {
    flex: 1,
  },
  scrollConteudo: {
    paddingBottom: espacamento.xxl + espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xs,
  },

  // ── Vibe chips ──
  // "qual a vibe?" como pergunta, chips como resposta.
  vibeContainer: {
    marginBottom: espacamento.lg,
  },
  vibePergunta: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
    marginBottom: espacamento.sm,
    textTransform: 'lowercase',
  },
  vibeScroll: {
    marginHorizontal: -espacamento.lg,
  },
  vibeScrollConteudo: {
    gap: espacamento.sm - 2,
    paddingHorizontal: espacamento.lg,
    paddingVertical: 2,
  },
  vibeChip: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: espacamento.md,
    paddingVertical: 8,
  },
  vibeChipAtiva: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  vibeChipPressionada: {
    opacity: 0.7,
  },
  vibeChipTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
  },
  vibeChipTextoAtivo: {
    color: '#FFFFFF',
    fontWeight: tipografia.pesoBold,
  },
  // Ponto indicador — vibe tem jogos disponíveis
  vibeChipPonto: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    height: 6,
    width: 6,
  },

  // ── BlocoVibeAtiva: statement + jogos filtrados ──
  blocoVibe: {
    gap: 0,
  },
  vibeStatement: {
    gap: espacamento.xs,
    marginBottom: espacamento.lg,
    paddingBottom: espacamento.md,
    borderBottomColor: cores.borda,
    borderBottomWidth: 1,
  },
  vibeStatementLabel: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  vibeStatementSub: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.2,
    lineHeight: 18,
  },

  // ── BlocoEmBreve ──
  emBreveBloco: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.md,
    marginTop: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.xxl,
  },
  emBreveSelo: {
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.md,
    paddingVertical: 6,
  },
  emBreveSeloTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emBreveTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // ── BlocoDefault: browse horizontal ──
  browseSec: {
    marginTop: espacamento.xs,
  },
  browseSecTitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
    marginBottom: espacamento.sm,
    textTransform: 'lowercase',
  },
  browseScroll: {
    marginHorizontal: -espacamento.lg,
  },
  browseScrollConteudo: {
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: 4,
  },
  browseCard: {
    borderRadius: raio.lg,
  },
  browseCardAtivo: {
    borderColor: 'rgba(255, 90, 95, 0.40)',
    borderWidth: 1,
  },
  browseCardImagem: {
    height: ALTURA_CARD_BROWSE,
    justifyContent: 'flex-end',
  },
  browseCardImagemRaio: {
    borderRadius: raio.lg,
  },
  browseCardPressavel: {
    borderRadius: raio.lg,
    overflow: 'hidden',
  },
  browseCardInfo: {
    gap: 3,
    paddingBottom: espacamento.md - 2,
    paddingHorizontal: 10,
  },
  browseCardNome: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 15,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  browseCardSlogan: {
    color: 'rgba(245,238,228,0.60)',
    fontFamily: familias.sans,
    fontSize: 11,
    fontWeight: tipografia.pesoRegular,
    lineHeight: 15,
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
  seloEmBreve: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm - 2,
  },
  seloEmBreveTexto: {
    color: '#FFFFFF',
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingLabel,
  },

  // ── CardJogoLinha — compacto horizontal ──
  linhaCard: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    marginBottom: espacamento.sm,
    overflow: 'hidden',
  },
  linhaPressavel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
    padding: espacamento.md,
  },
  linhaThumb: {
    borderRadius: raio.md,
    height: 64,
    overflow: 'hidden',
    width: 64,
  },
  linhaThumbImg: {
    borderRadius: raio.md,
  },
  linhaInfo: {
    flex: 1,
    gap: 3,
  },
  linhaNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '700' as const,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: 0,
    lineHeight: 22,
  },
  linhaSlogan: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    fontWeight: tipografia.pesoRegular,
    lineHeight: 17,
  },
  linhaMeta: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 11,
    fontWeight: tipografia.pesoRegular,
    letterSpacing: 0.1,
    lineHeight: 16,
    marginTop: 1,
  },
  linhaSeta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: espacamento.sm,
  },
  linhaSetaTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 18,
    fontWeight: tipografia.pesoRegular,
  },

  // ── Modal de nome ──
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  modalToque: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCard: {
    backgroundColor: cores.superficie,
    borderRadius: raio.xl,
    gap: espacamento.md,
    padding: espacamento.lg + 4,
    width: '100%',
  },
  modalTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 24,
    fontWeight: tipografia.pesoBold,
  },
  modalSubtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.sm,
  },
  modalInput: {
    backgroundColor: cores.superficieElevada,
    borderRadius: raio.md,
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 18,
    fontWeight: tipografia.pesoMedio,
    padding: espacamento.md,
  },

  // ── Bottom sheet de seleção de modo ──
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: raio.xl,
    borderTopRightRadius: raio.xl,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: cores.borda,
    borderRadius: 2,
    height: 4,
    marginBottom: espacamento.lg,
    width: 36,
  },
  sheetNomeJogo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
    marginBottom: espacamento.md,
  },
  sheetOpcoes: {
    gap: espacamento.sm,
  },
  sheetOpcao: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  sheetOpcaoPrimaria: {
    borderColor: 'rgba(255, 90, 95, 0.28)',
  },
  sheetPonto: {
    backgroundColor: cores.primaria,
    borderRadius: 4,
    height: 8,
    opacity: 0.75,
    width: 8,
  },
  sheetOpcaoTextos: {
    flex: 1,
    gap: 2,
  },
  sheetOpcaoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    letterSpacing: -0.1,
  },
  sheetOpcaoTituloSec: {
    color: cores.textoSecundario,
    fontWeight: tipografia.pesoSemibold,
  },
  sheetOpcaoDesc: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    lineHeight: 17,
  },
  sheetSeta: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: 18,
    fontWeight: tipografia.pesoBold,
  },
  sheetSetaSec: {
    color: cores.textoMudo,
    fontWeight: tipografia.pesoRegular,
  },
  sheetLinkDetalhes: {
    alignItems: 'center',
    marginTop: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  sheetLinkDetalhesTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.2,
  },
});
