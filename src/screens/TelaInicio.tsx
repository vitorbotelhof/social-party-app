import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  BannerJogoDestaque,
  BotaoPrimario,
  CardJogoCatalogo,
  Logo,
  SecaoJogosHorizontal,
  type JogoCatalogoItem,
  type SecaoJogosItem,
} from '@/components';
import { buscarJogosCatalogo } from '@/games/buscaCatalogo';
import {
  getSecaoCategoriaPrincipalCatalogo,
  getSecaoContextoCatalogo,
  getSecaoTagCatalogo,
  getSecaoTodosOsJogos,
  getJogoDestaqueDoDia,
  getJogoPorId,
  getJogosPorCategoriaPrincipal,
  getSecoesHomeCatalogo,
  type SecaoCatalogo,
} from '@/games/catalogo';
import { type DefinicaoJogo } from '@/games/gameRegistry';
import {
  CATEGORIAS_PRINCIPAIS,
  type CategoriaPrincipalId,
  type CategoriaPrincipalMeta,
  type ContextoSocialId,
  type TagSocialId,
} from '@/games/taxonomia';
import type { RootStackParamList } from '@/navigation/types';
import { obterOuCriarJogador, salvarNome } from '@/services/jogadorLocal';
import { tutorialFoiVisto } from '@/services/tutorial';
import { getSessaoAtual } from '@/session/sessionStore';
import type { TemperaturaEmocional } from '@/session/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

const MIN_TAMANHO_NOME = 2;
const MARGEM_TELA = espacamento.lg;
const COR_MODAL_OVERLAY = 'rgba(0,0,0,0.75)';
const COR_SHEET_OVERLAY = 'rgba(0, 0, 0, 0.55)';
const COR_SHEET_PRIMARIA_BORDA = 'rgba(255, 90, 95, 0.28)';
const GRADIENTE_SHEET_BANNER: [string, string, string] = [
  'rgba(0,0,0,0)',
  'rgba(0,0,0,0.36)',
  'rgba(0,0,0,0.78)',
];

const destaqueDoDia = getJogoDestaqueDoDia();
const categoriasComJogos = CATEGORIAS_PRINCIPAIS.filter(
  (categoria) => getJogosPorCategoriaPrincipal(categoria.id).length > 0,
);

function adaptarJogoCatalogo(jogo: DefinicaoJogo): JogoCatalogoItem {
  return {
    ...jogo,
    meta: `${jogo.minJogadores}–${jogo.maxJogadores} jogadores · ${jogo.tempoMedio}`,
  };
}

function adaptarSecaoCatalogo(secao: SecaoCatalogo): SecaoJogosItem {
  return {
    ...secao,
    jogos: secao.jogos.map(adaptarJogoCatalogo),
  };
}

function buscarJogoCatalogo(item: JogoCatalogoItem): DefinicaoJogo | null {
  return getJogoPorId(item.id);
}

function montarSecaoFiltrada(secao: SecaoJogosItem): SecaoCatalogo | null {
  if (secao.categoriaPrincipalId) {
    return getSecaoCategoriaPrincipalCatalogo(
      secao.categoriaPrincipalId as CategoriaPrincipalId,
    );
  }
  if (secao.contextoId) {
    return getSecaoContextoCatalogo(secao.contextoId as ContextoSocialId);
  }
  if (secao.tagId) {
    return getSecaoTagCatalogo(secao.tagId as TagSocialId);
  }
  return null;
}

export function TelaInicio({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const headerOp = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(10)).current;
  const conteudoOp = useRef(new Animated.Value(0)).current;

  const [jogador, setJogador] = useState<{
    id: string;
    nome: string | null;
  } | null>(null);
  const [mostrarModalNome, setMostrarModalNome] = useState(false);
  const [nomeDigitado, setNomeDigitado] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [consultaBusca, setConsultaBusca] = useState('');
  const [buscaEmFoco, setBuscaEmFoco] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoCatalogo | null>(null);
  const [temperatura, setTemperatura] = useState<TemperaturaEmocional>('frio');
  const [jogoSelecionado, setJogoSelecionado] = useState<DefinicaoJogo | null>(
    null,
  );
  const [etapaSheet, setEtapaSheet] = useState<'descricao' | 'modo'>(
    'descricao',
  );

  const sheetY = useRef(new Animated.Value(500)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setTemperatura(getSessaoAtual()?.temperatura ?? 'frio');
    }, []),
  );

  useEffect(() => {
    obterOuCriarJogador().then((j) => {
      setJogador(j);
      if (!j.nome) setMostrarModalNome(true);
    });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOp, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(conteudoOp, {
        toValue: 1,
        delay: 90,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [conteudoOp, headerOp, headerY]);

  // Seções da home — aleatoriza a cada montagem do componente (nova entrada na tela).
  // useMemo com deps vazias: calcula uma vez por mount, não por render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const secoesHome = useMemo(() => getSecoesHomeCatalogo(undefined, true), []);

  const nomeValido = nomeDigitado.trim().length >= MIN_TAMANHO_NOME;
  const termoBusca = consultaBusca.trim();
  const buscaAtiva = termoBusca.length > 0;
  const resultadosBusca = useMemo(
    () => buscarJogosCatalogo(termoBusca),
    [termoBusca],
  );
  const secaoFiltrada = secaoAtiva;
  const larguraCardFiltro = Math.floor(
    (width - MARGEM_TELA * 2 - espacamento.md) / 2,
  );

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

  function abrirJogo(jogo: DefinicaoJogo) {
    if (!jogo.disponivel) return;
    if (!jogador?.nome) {
      setMostrarModalNome(true);
      return;
    }
    Keyboard.dismiss();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJogoSelecionado(jogo);
    setEtapaSheet('descricao');
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

  function aoEscolherItemCatalogo(item: JogoCatalogoItem) {
    const jogo = buscarJogoCatalogo(item);
    if (jogo) abrirJogo(jogo);
  }

  function aoVerMais(secao: SecaoJogosItem) {
    const filtro = montarSecaoFiltrada(secao);
    if (!filtro) return;
    setSecaoAtiva(filtro);
    void Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(conteudoOp, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(conteudoOp, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function limparFiltro() {
    setSecaoAtiva(null);
    void Haptics.selectionAsync();
  }

  function atualizarBusca(texto: string) {
    setConsultaBusca(texto);
    if (texto.trim().length > 0) setSecaoAtiva(null);
  }

  function limparBusca() {
    setConsultaBusca('');
    Keyboard.dismiss();
    void Haptics.selectionAsync();
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
    ]).start(() => {
      setJogoSelecionado(null);
      setEtapaSheet('descricao');
    });
  }

  async function aoEscolherModo(id: 'local' | 'realtime' | 'entrar') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const jogoId = jogoSelecionado?.id;
    setJogoSelecionado(null);

    if (id === 'local') {
      if (jogoId === 'most-likely-to') {
        navigation.navigate('ConfiguracaoLocalMostLikely');
      } else if (jogoId === 'na-ponta-da-lingua') {
        navigation.navigate('ConfiguracaoLocalNaPontaDaLingua');
      } else if (jogoId === 'inquisicao') {
        navigation.navigate('ConfiguracaoLocalInquisicao');
      } else if (jogoId === 'voce-me-conhece') {
        navigation.navigate('ConfiguracaoLocalVMC');
      } else if (jogoId === 'faz-ai') {
        navigation.navigate('ConfiguracaoLocalFazAi');
      } else if (jogoId === 'alianca') {
        navigation.navigate('ConfiguracaoLocalAlianca');
      } else if (jogoId === 'duvido') {
        navigation.navigate('ConfiguracaoLocalDuvido');
      } else if (jogoId === 'eu-nunca') {
        navigation.navigate('ConfiguracaoLocalEuNunca');
      } else if (jogoId === 'verdade-desafio') {
        navigation.navigate('ConfiguracaoLocalVerdadeDesafio');
      } else if (jogoId === 'de-0-a-10') {
        navigation.navigate('ConfiguracaoLocalDe0a10');
      } else if (jogoId === 'quem-na-sala') {
        navigation.navigate('ConfiguracaoLocalQuemNaSala');
      } else if (jogoId === 'entrelinhas') {
        navigation.navigate('ListaEntrelinhas');
      } else if (jogoId === 'sincronia') {
        navigation.navigate('ConfiguracaoLocalSincronia');
      } else if (jogoId === 'na-mesma-pagina') {
        navigation.navigate('ConfiguracaoLocalNaMesmaPagina');
      } else if (jogoId === 'operacao-resgate') {
        navigation.navigate('ConfiguracaoLocalOperacaoResgate');
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

  function mostrarEscolhaDeModo() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEtapaSheet('modo');
  }

  function voltarParaDescricao() {
    void Haptics.selectionAsync();
    setEtapaSheet('descricao');
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

        <View
          style={[
            estilos.busca,
            (buscaEmFoco || buscaAtiva) && estilos.buscaAtiva,
          ]}
        >
          <Text style={estilos.buscaIcone} accessibilityElementsHidden>
            ⌕
          </Text>
          <TextInput
            value={consultaBusca}
            onChangeText={atualizarBusca}
            onFocus={() => setBuscaEmFoco(true)}
            onBlur={() => setBuscaEmFoco(false)}
            onSubmitEditing={() => Keyboard.dismiss()}
            placeholder="buscar jogo, clima ou dinâmica"
            placeholderTextColor={cores.textoMudo}
            returnKeyType="search"
            autoCapitalize="none"
            style={estilos.buscaInput}
            accessibilityLabel="Buscar jogos"
          />
          {buscaAtiva ? (
            <Pressable
              onPress={limparBusca}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
              style={({ pressed }) => [
                estilos.buscaLimpar,
                pressed && estilos.buscaLimparPressionado,
              ]}
            >
              <Text style={estilos.buscaLimparTexto}>×</Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: conteudoOp }}>
          {buscaAtiva ? (
            <ResultadosBusca
              termo={termoBusca}
              resultados={resultadosBusca.map((resultado) =>
                adaptarJogoCatalogo(resultado.jogo),
              )}
              larguraCard={larguraCardFiltro}
              onLimpar={limparBusca}
              onEscolherJogo={aoEscolherItemCatalogo}
            />
          ) : secaoFiltrada ? (
            <CatalogoFiltrado
              secao={secaoFiltrada}
              larguraCard={larguraCardFiltro}
              onLimpar={limparFiltro}
              onEscolherJogo={aoEscolherItemCatalogo}
            />
          ) : (
            <>
              <CategoriaChipsCatalogo
                categorias={categoriasComJogos}
                onSelect={(categoriaId) => {
                  const filtro =
                    getSecaoCategoriaPrincipalCatalogo(categoriaId);
                  if (filtro) setSecaoAtiva(filtro);
                  void Haptics.selectionAsync();
                }}
                onTodos={() => {
                  setSecaoAtiva(getSecaoTodosOsJogos());
                  void Haptics.selectionAsync();
                }}
              />

              <View style={estilos.destaqueWrap}>
                <BannerJogoDestaque
                  destaque={destaqueDoDia}
                  onPress={(jogo) => {
                    const completo = getJogoPorId(jogo.id);
                    if (completo) abrirJogo(completo);
                  }}
                />
              </View>

              {secoesHome.map((secao) => (
                <SecaoJogosHorizontal
                  key={secao.id}
                  secao={adaptarSecaoCatalogo(secao)}
                  compacto={secao.tipo === 'recentes'}
                  onEscolherJogo={aoEscolherItemCatalogo}
                  onVerMais={aoVerMais}
                />
              ))}
            </>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={!!jogoSelecionado}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={fecharSheet}
      >
        <View style={estilos.sheetContainer}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={fecharSheet}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                estilos.sheetOverlay,
                { opacity: overlayOp },
              ]}
            />
          </Pressable>

          <Animated.View
            style={[estilos.sheet, { transform: [{ translateY: sheetY }] }]}
          >
            <View style={estilos.sheetHandle} />
            {jogoSelecionado &&
              (etapaSheet === 'descricao' ? (
                <SheetDescricaoJogo
                  jogo={jogoSelecionado}
                  onJogar={mostrarEscolhaDeModo}
                  onDetalhes={aoVerDetalhesDoJogo}
                />
              ) : (
                <SheetEscolhaModo
                  jogo={jogoSelecionado}
                  onVoltar={voltarParaDescricao}
                  onEscolherModo={(modo) => void aoEscolherModo(modo)}
                />
              ))}

            <View style={{ height: Math.max(insets.bottom, espacamento.md) }} />
          </Animated.View>
        </View>
      </Modal>

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

const TEMP_VISUAL: Record<
  Exclude<TemperaturaEmocional, 'frio'>,
  { cor: string; rotulo: string }
> = {
  morno: { cor: cores.alerta, rotulo: 'esquentando' },
  quente: { cor: cores.acentoQuente, rotulo: 'quente' },
  colapso: { cor: cores.primaria, rotulo: 'caos' },
};

function IndicadorTemperatura({
  temperatura,
}: {
  temperatura: TemperaturaEmocional;
}) {
  if (temperatura === 'frio') return null;
  const { cor, rotulo } = TEMP_VISUAL[temperatura];
  return (
    <View style={estilos.tempIndicador}>
      <View style={[estilos.tempPonto, { backgroundColor: cor }]} />
      <Text style={[estilos.tempRotulo, { color: cor }]}>{rotulo}</Text>
    </View>
  );
}

interface CatalogoFiltradoProps {
  secao: SecaoCatalogo;
  larguraCard: number;
  onLimpar: () => void;
  onEscolherJogo: (jogo: JogoCatalogoItem) => void;
}

function CatalogoFiltrado({
  secao,
  larguraCard,
  onLimpar,
  onEscolherJogo,
}: CatalogoFiltradoProps) {
  const eyebrow =
    secao.tipo === 'todos'
      ? 'catálogo'
      : secao.tipo === 'contexto'
        ? 'curadoria'
        : secao.tipo === 'tag'
          ? 'tag'
          : 'categoria';

  return (
    <View style={estilos.filtroContainer}>
      <View style={estilos.filtroCabecalho}>
        <View style={estilos.filtroTextos}>
          <Text style={estilos.filtroEyebrow}>{eyebrow}</Text>
          <Text style={estilos.filtroTitulo}>{secao.titulo}</Text>
          {secao.subtitulo ? (
            <Text style={estilos.filtroSubtitulo}>{secao.subtitulo}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={onLimpar}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Limpar filtro"
          style={({ pressed }) => [
            estilos.filtroFechar,
            pressed && estilos.filtroFecharPressionado,
          ]}
        >
          <Text style={estilos.filtroFecharTexto}>×</Text>
        </Pressable>
      </View>

      <View style={estilos.gradeJogos}>
        {secao.jogos.map((jogo) => (
          <View key={jogo.id} style={{ width: larguraCard }}>
            <CardJogoCatalogo
              jogo={adaptarJogoCatalogo(jogo)}
              largura={larguraCard}
              alturaImagem={larguraCard}
              onPress={onEscolherJogo}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

interface CategoriaChipsCatalogoProps {
  categorias: ReadonlyArray<CategoriaPrincipalMeta>;
  onSelect: (categoriaId: CategoriaPrincipalId) => void;
  onTodos: () => void;
}

function CategoriaChipsCatalogo({
  categorias,
  onSelect,
  onTodos,
}: CategoriaChipsCatalogoProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.chipsScroll}
      contentContainerStyle={estilos.chipsConteudo}
    >
      <Pressable
        onPress={onTodos}
        accessibilityRole="button"
        accessibilityLabel="Ver todos os jogos"
        style={({ pressed }) => [
          estilos.chipCategoria,
          estilos.chipTodos,
          pressed && estilos.chipCategoriaPressionado,
        ]}
      >
        <Text style={[estilos.chipCategoriaTexto, estilos.chipTodosTexto]}>
          todos os jogos
        </Text>
      </Pressable>

      {categorias.map((categoria) => (
        <Pressable
          key={categoria.id}
          onPress={() => onSelect(categoria.id)}
          accessibilityRole="button"
          accessibilityLabel={`Ver jogos de ${categoria.nome}`}
          style={({ pressed }) => [
            estilos.chipCategoria,
            pressed && estilos.chipCategoriaPressionado,
          ]}
        >
          <Text style={estilos.chipCategoriaTexto}>{categoria.nome}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

interface ResultadosBuscaProps {
  termo: string;
  resultados: JogoCatalogoItem[];
  larguraCard: number;
  onLimpar: () => void;
  onEscolherJogo: (jogo: JogoCatalogoItem) => void;
}

function ResultadosBusca({
  termo,
  resultados,
  larguraCard,
  onLimpar,
  onEscolherJogo,
}: ResultadosBuscaProps) {
  const aguardandoMaisTexto = termo.length < 2;
  const quantidade =
    resultados.length === 1
      ? '1 jogo encontrado'
      : `${resultados.length} jogos encontrados`;

  return (
    <View style={estilos.filtroContainer}>
      <View style={estilos.filtroCabecalho}>
        <View style={estilos.filtroTextos}>
          <Text style={estilos.filtroEyebrow}>busca</Text>
          <Text style={estilos.filtroTitulo}>jogos</Text>
          {!aguardandoMaisTexto ? (
            <Text style={estilos.filtroSubtitulo}>{quantidade}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={onLimpar}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          style={({ pressed }) => [
            estilos.filtroFechar,
            pressed && estilos.filtroFecharPressionado,
          ]}
        >
          <Text style={estilos.filtroFecharTexto}>×</Text>
        </Pressable>
      </View>

      {resultados.length > 0 ? (
        <View style={estilos.gradeJogos}>
          {resultados.map((jogo) => (
            <View key={jogo.id} style={{ width: larguraCard }}>
              <CardJogoCatalogo
                jogo={jogo}
                largura={larguraCard}
                alturaImagem={larguraCard}
                onPress={onEscolherJogo}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={estilos.buscaVazia}>
          <Text style={estilos.buscaVaziaTitulo}>
            {aguardandoMaisTexto
              ? 'continue digitando'
              : 'nenhum jogo encontrado'}
          </Text>
          {!aguardandoMaisTexto ? (
            <Text style={estilos.buscaVaziaTexto}>
              tente outro nome, clima ou tipo de jogo.
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

interface SheetOpcaoProps {
  titulo: string;
  descricao: string;
  primaria: boolean;
  onPress: () => void;
}

interface SheetDescricaoJogoProps {
  jogo: DefinicaoJogo;
  onJogar: () => void;
  onDetalhes: () => void;
}

function SheetDescricaoJogo({
  jogo,
  onJogar,
  onDetalhes,
}: SheetDescricaoJogoProps) {
  return (
    <View style={estilos.sheetDescricao}>
      <ImageBackground
        source={jogo.banner ?? jogo.cover}
        style={estilos.sheetBanner}
        imageStyle={estilos.sheetBannerImagem}
        resizeMode="cover"
      >
        <LinearGradient
          colors={GRADIENTE_SHEET_BANNER}
          locations={[0, 0.56, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={estilos.sheetBannerConteudo}>
          <Text style={estilos.sheetMeta}>
            {jogo.minJogadores}–{jogo.maxJogadores} jogadores ·{' '}
            {jogo.tempoMedio}
          </Text>
          <Text style={estilos.sheetTituloJogo}>{jogo.nome}</Text>
        </View>
      </ImageBackground>

      <View style={estilos.sheetDescricaoTextos}>
        <Text style={estilos.sheetSlogan}>{jogo.slogan}</Text>
        <Text style={estilos.sheetResumo}>{jogo.descricao}</Text>
      </View>

      <Pressable
        onPress={onJogar}
        accessibilityRole="button"
        accessibilityLabel={`Jogar ${jogo.nome}`}
        style={({ pressed }) => [
          estilos.sheetBotaoJogar,
          pressed && estilos.sheetBotaoPressionado,
        ]}
      >
        <Text style={estilos.sheetBotaoJogarTexto}>jogar</Text>
      </Pressable>

      <Pressable
        onPress={onDetalhes}
        style={({ pressed }) => [
          estilos.sheetLinkDetalhes,
          pressed && { opacity: 0.5 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Ver regras de ${jogo.nome}`}
      >
        <Text style={estilos.sheetLinkDetalhesTexto}>ver regras completas</Text>
      </Pressable>
    </View>
  );
}

interface SheetEscolhaModoProps {
  jogo: DefinicaoJogo;
  onVoltar: () => void;
  onEscolherModo: (modo: 'local' | 'realtime' | 'entrar') => void;
}

function SheetEscolhaModo({
  jogo,
  onVoltar,
  onEscolherModo,
}: SheetEscolhaModoProps) {
  return (
    <View>
      <Pressable
        onPress={onVoltar}
        hitSlop={10}
        style={({ pressed }) => [
          estilos.sheetVoltar,
          pressed && estilos.sheetVoltarPressionado,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Voltar para descrição do jogo"
      >
        <Text style={estilos.sheetVoltarTexto}>←</Text>
        <Text style={estilos.sheetVoltarLabel}>{jogo.nome}</Text>
      </Pressable>

      <Text style={estilos.sheetModoTitulo}>como vocês vão jogar?</Text>

      <View style={estilos.sheetOpcoes}>
        {jogo.supportsLocal && (
          <SheetOpcao
            titulo="passando de mão em mão"
            descricao="um celular, o grupo todo. cada um pega na sua vez."
            primaria
            onPress={() => onEscolherModo('local')}
          />
        )}
        {jogo.supportsRealtime && (
          <SheetOpcao
            titulo="cada um com o seu"
            descricao="todo mundo com celular. papéis separados, segredos na tela."
            primaria
            onPress={() => onEscolherModo('realtime')}
          />
        )}
        <SheetOpcao
          titulo="entrar numa sala"
          descricao="alguém já começou. só entrar com o código."
          primaria={false}
          onPress={() => onEscolherModo('entrar')}
        />
      </View>
    </View>
  );
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
        <Text style={[estilos.sheetSeta, !primaria && estilos.sheetSetaSec]}>
          →
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
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
  busca: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
    marginTop: espacamento.md,
    minHeight: 48,
    paddingHorizontal: espacamento.md,
  },
  buscaAtiva: {
    borderColor: cores.bordaForte,
  },
  buscaIcone: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconePequeno,
    lineHeight: 20,
  },
  buscaInput: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoRegular,
    letterSpacing: 0,
    paddingVertical: espacamento.sm,
  },
  buscaLimpar: {
    alignItems: 'center',
    borderRadius: raio.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  buscaLimparPressionado: {
    backgroundColor: cores.superficieElevada,
  },
  buscaLimparTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconePequeno,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  buscaVazia: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.xs,
    justifyContent: 'center',
    minHeight: 156,
    paddingHorizontal: espacamento.lg,
  },
  buscaVaziaTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    textAlign: 'center',
  },
  buscaVaziaTitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0,
  },
  chipCategoria: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  chipCategoriaPressionado: {
    opacity: 0.65,
    transform: [{ scale: 0.98 }],
  },
  chipCategoriaTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSegmento,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0,
  },
  chipTodos: {
    backgroundColor: cores.texto,
    borderColor: cores.texto,
  },
  chipTodosTexto: {
    color: cores.fundo,
  },
  chipsConteudo: {
    gap: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  chipsScroll: {
    marginBottom: espacamento.md,
  },
  destaqueWrap: {
    paddingHorizontal: MARGEM_TELA,
  },
  filtroCabecalho: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.md,
    justifyContent: 'space-between',
    marginBottom: espacamento.xl,
  },
  filtroContainer: {
    paddingBottom: espacamento.xl,
    paddingHorizontal: MARGEM_TELA,
  },
  filtroEyebrow: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
    textTransform: 'lowercase',
  },
  filtroFechar: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  filtroFecharPressionado: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  filtroFecharTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconeMedio,
    fontWeight: tipografia.pesoBold,
    lineHeight: 26,
  },
  filtroSubtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    marginTop: espacamento.xs,
  },
  filtroTextos: {
    flex: 1,
  },
  filtroTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 36,
  },
  gradeJogos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.md,
    rowGap: espacamento.xl,
  },
  header: {
    paddingBottom: espacamento.md,
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
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0,
  },
  marcaContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
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
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconePequeno,
    fontWeight: tipografia.pesoMedio,
    padding: espacamento.md,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: COR_MODAL_OVERLAY,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  modalSubtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginBottom: espacamento.sm,
  },
  modalTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconeMedio,
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
    paddingTop: 0,
  },
  sheet: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: raio.xl,
    borderTopRightRadius: raio.xl,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: cores.borda,
    borderRadius: 2,
    height: 4,
    marginBottom: espacamento.lg,
    width: 36,
  },
  sheetBanner: {
    aspectRatio: 16 / 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  sheetBannerConteudo: {
    gap: espacamento.xs,
    padding: espacamento.md,
  },
  sheetBannerImagem: {
    borderRadius: raio.lg,
  },
  sheetBotaoJogar: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: espacamento.lg,
  },
  sheetBotaoJogarTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
  },
  sheetBotaoPressionado: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  sheetDescricao: {
    gap: espacamento.lg,
  },
  sheetDescricaoTextos: {
    gap: espacamento.sm,
  },
  sheetLinkDetalhes: {
    alignItems: 'center',
    paddingVertical: espacamento.sm,
  },
  sheetLinkDetalhesTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0,
  },
  sheetMeta: {
    color: cores.textoSobreEscuro,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0,
    opacity: 0.9,
  },
  sheetModoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconePequeno,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 26,
    marginBottom: espacamento.md,
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
  sheetOpcaoDesc: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    lineHeight: 17,
  },
  sheetOpcaoPrimaria: {
    borderColor: COR_SHEET_PRIMARIA_BORDA,
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
    letterSpacing: 0,
  },
  sheetOpcaoTituloSec: {
    color: cores.textoSecundario,
    fontWeight: tipografia.pesoSemibold,
  },
  sheetOpcoes: {
    gap: espacamento.sm,
  },
  sheetOverlay: {
    backgroundColor: COR_SHEET_OVERLAY,
  },
  sheetPonto: {
    backgroundColor: cores.primaria,
    borderRadius: 4,
    height: 8,
    opacity: 0.75,
    width: 8,
  },
  sheetSeta: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconePequeno,
    fontWeight: tipografia.pesoBold,
  },
  sheetSetaSec: {
    color: cores.textoMudo,
    fontWeight: tipografia.pesoRegular,
  },
  sheetSlogan: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0,
    lineHeight: 21,
  },
  sheetResumo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
  },
  sheetTituloJogo: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: 0,
    lineHeight: 31,
  },
  sheetVoltar: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: espacamento.xs,
    marginBottom: espacamento.sm,
    paddingVertical: espacamento.xs,
  },
  sheetVoltarLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0,
  },
  sheetVoltarPressionado: {
    opacity: 0.55,
  },
  sheetVoltarTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoIconePequeno,
    fontWeight: tipografia.pesoBold,
    lineHeight: 22,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
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
    letterSpacing: 0,
  },
});
