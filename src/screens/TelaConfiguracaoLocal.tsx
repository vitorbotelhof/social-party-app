import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeUmCelular, BotaoPrimario } from '@/components';
import type { Player } from '@/engine/types';
import { LISTA_CATEGORIAS } from '@/games/mr-white/categorias';
import type {
  CategoriaId,
  Dificuldade,
  DificuldadeParPalavras,
  OpcoesMrWhite,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { carregarNome } from '@/services/jogadorLocal';
import {
  getJogadoresLocais,
  inicializarJogoLocal,
} from '@/services/jogoLocal';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocal'>;

const ROTULOS_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'fácil',
  medio: 'médio',
  dificil: 'difícil',
};

const PROXIMIDADE: { valor: DificuldadeParPalavras; rotulo: string }[] = [
  { valor: 'leve', rotulo: 'leve' },
  { valor: 'media', rotulo: 'médio' },
  { valor: 'hard', rotulo: 'difícil' },
  { valor: 'insana', rotulo: 'insano' },
];

const MIN_MR_WHITES = 1;
const MAX_MR_WHITES = 3;
const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;
const MIN_TAMANHO_NOME = 2;

function emPares<T>(arr: T[]): [T, T | null][] {
  const resultado: [T, T | null][] = [];
  for (let i = 0; i < arr.length; i += 2) {
    resultado.push([arr[i]!, arr[i + 1] ?? null]);
  }
  return resultado;
}

export function TelaConfiguracaoLocal({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [categoriaId, setCategoriaId] = useState<CategoriaId>('comidas');
  const [dificuldade, setDificuldade] = useState<Dificuldade>('medio');
  const [modoDualWord, setModoDualWord] = useState(false);
  const [dificuldadePar, setDificuldadePar] = useState<DificuldadeParPalavras>('media');
  const [numMrWhites, setNumMrWhites] = useState(1);
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    const anteriores = getJogadoresLocais();
    if (anteriores.length > 0) {
      setNomes(anteriores.map((j) => j.nome));
      return;
    }
    void carregarNome().then((nome) => {
      if (nome) setNomes((atual) => (atual.length === 0 ? [nome] : atual));
    });
  }, []);

  const nomeLimpo = novoNome.trim();
  const podeAdicionar =
    nomeLimpo.length >= MIN_TAMANHO_NOME &&
    nomes.length < MAX_JOGADORES &&
    !nomes.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());
  const podeIniciar = nomes.length >= MIN_JOGADORES && !iniciando;

  function sortearCategoria() {
    const disponiveis = LISTA_CATEGORIAS.filter((c) => c.id !== categoriaId);
    const sorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    if (sorteada) {
      setCategoriaId(sorteada.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function aoAdicionar() {
    if (!podeAdicionar) return;
    setNomes((atual) => [...atual, nomeLimpo]);
    setNovoNome('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function aoRemover(indice: number) {
    setNomes((atual) => atual.filter((_, i) => i !== indice));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function aoComecar() {
    if (!podeIniciar) return;
    setIniciando(true);
    const agora = Date.now();
    const jogadores: Player[] = nomes.map((nome, i) => ({
      id: `local-${i}`,
      nome,
      papelSecreto: null,
      ehAnfitriao: i === 0,
      estaConectado: true,
      entrouEm: agora + i,
    }));
    const opcoes: OpcoesMrWhite = {
      categoriaId,
      dificuldade,
      numeroMrWhites: numMrWhites,
      duracaoTurnoSegundos: 60,
      modoDualWord,
      dificuldadePar,
    };
    inicializarJogoLocal('mrwhite', jogadores, opcoes);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.replace('JogoLocal');
  }

  const categoriaAtiva = LISTA_CATEGORIAS.find((c) => c.id === categoriaId);

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [
          estilos.botaoVoltar,
          { top: insets.top + 8 },
          pressed && estilos.botaoVoltarPressionado,
        ]}
        hitSlop={12}
      >
        <Text style={estilos.botaoVoltarIcone}>←</Text>
      </Pressable>

      <BadgeUmCelular />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Cabeçalho — sem burocracia ─── */}
          <View style={estilos.cabecalho}>
            <Text style={estilos.tituloPagina}>mr white</Text>
            <Text style={estilos.subtitulo}>montem o grupo, escolham o tema.</Text>
          </View>

          {/* ─── 1. Quem tá jogando? — PRIMEIRO ─── */}
          {/* A sessão começa aqui. Antes de qualquer configuração. */}
          <Section titulo="quem tá jogando?" subtitulo={`${nomes.length} de ${MAX_JOGADORES}`}>
            <View style={estilos.entradaBloco}>
              <TextInput
                value={novoNome}
                onChangeText={setNovoNome}
                placeholder="nome do jogador..."
                placeholderTextColor={cores.textoMudo}
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={aoAdicionar}
                style={estilos.input}
                accessibilityLabel="Nome do jogador"
              />
              <Pressable
                onPress={aoAdicionar}
                disabled={!podeAdicionar}
                style={({ pressed }) => [
                  estilos.botaoAdicionar,
                  !podeAdicionar && estilos.botaoAdicionarDesabilitado,
                  pressed && podeAdicionar && estilos.botaoAdicionarPressionado,
                ]}
                accessibilityLabel="Adicionar jogador"
              >
                <Text style={estilos.botaoAdicionarTexto}>+</Text>
              </Pressable>
            </View>

            {nomes.length === 0 ? (
              <Text style={estilos.vazio}>
                comece pelo seu nome. os outros entram depois.
              </Text>
            ) : (
              <View style={estilos.lista}>
                {nomes.map((nome, i) => (
                  <View key={`${nome}-${i}`} style={estilos.item}>
                    <View style={estilos.itemBolinha}>
                      <Text style={estilos.itemNumero}>{i + 1}</Text>
                    </View>
                    <Text style={estilos.itemNome} numberOfLines={1}>
                      {nome}
                      {i === 0 ? ' (você)' : ''}
                    </Text>
                    <Pressable
                      onPress={() => aoRemover(i)}
                      hitSlop={12}
                      style={({ pressed }) => [
                        estilos.itemRemover,
                        pressed && estilos.itemRemoverPressionado,
                      ]}
                      accessibilityLabel={`Remover ${nome}`}
                    >
                      <Text style={estilos.itemRemoverTexto}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Section>

          {/* ─── 2. Sobre o quê? — Categoria ─── */}
          <Section titulo="sobre o quê?">
            {categoriaAtiva && (
              <View style={estilos.categoriaAtivaBadge}>
                <Text style={estilos.categoriaAtivaEmoji}>{categoriaAtiva.emoji}</Text>
                <Text style={estilos.categoriaAtivaTexto}>{categoriaAtiva.nome}</Text>
              </View>
            )}

            <View style={estilos.categoriaGrid}>
              {emPares(LISTA_CATEGORIAS).map(([a, b], i) => (
                <View key={i} style={estilos.categoriaLinha}>
                  <CategoriaCard
                    categoria={a}
                    ativo={a.id === categoriaId}
                    onPress={() => setCategoriaId(a.id)}
                  />
                  {b ? (
                    <CategoriaCard
                      categoria={b}
                      ativo={b.id === categoriaId}
                      onPress={() => setCategoriaId(b.id)}
                    />
                  ) : (
                    <View style={estilos.categoriaCardVazio} />
                  )}
                </View>
              ))}
            </View>

            <Pressable
              onPress={sortearCategoria}
              style={({ pressed }) => [
                estilos.botaoSortear,
                pressed && estilos.botaoSortearPressionado,
              ]}
            >
              <Text style={estilos.botaoSortearTexto}>sortear categoria</Text>
            </Pressable>
          </Section>

          {/* ─── 3. Como funciona? — Modo ─── */}
          <Section titulo="como funciona?">
            <View style={estilos.linhaSegmentos}>
              <Pressable
                onPress={() => setModoDualWord(false)}
                style={[estilos.segmento, !modoDualWord && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, !modoDualWord && estilos.segmentoTextoAtivo]}>
                  clássico
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setModoDualWord(true)}
                style={[estilos.segmento, modoDualWord && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, modoDualWord && estilos.segmentoTextoAtivo]}>
                  dual word
                </Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              {modoDualWord
                ? 'mr white recebe palavra parecida — mais difícil de desmascarar.'
                : 'mr white não recebe palavra — deve blefar do zero.'}
            </Text>
          </Section>

          {/* ─── 4. Quão parecidas? (só Dual Word) ─── */}
          {modoDualWord && (
            <Section titulo="quão parecidas as palavras?">
              <View style={estilos.linhaSegmentos}>
                {PROXIMIDADE.map(({ valor, rotulo }) => {
                  const ativo = valor === dificuldadePar;
                  return (
                    <Pressable
                      key={valor}
                      onPress={() => setDificuldadePar(valor)}
                      style={[estilos.segmento, ativo && estilos.segmentoAtivo]}
                    >
                      <Text style={[estilos.segmentoTexto, ativo && estilos.segmentoTextoAtivo]}>
                        {rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={estilos.ajuda}>
                {dificuldadePar === 'leve' && 'palavras bem diferentes — fácil de perceber'}
                {dificuldadePar === 'media' && 'alguma semelhança — ambiguidade moderada'}
                {dificuldadePar === 'hard' && 'muito próximas — leitura social necessária'}
                {dificuldadePar === 'insana' && 'quase a mesma coisa — paranoia total'}
              </Text>
            </Section>
          )}

          {/* ─── 5. Que nível? (só Clássico) ─── */}
          {!modoDualWord && (
            <Section titulo="que nível?">
              <View style={estilos.linhaSegmentos}>
                {(Object.keys(ROTULOS_DIFICULDADE) as Dificuldade[]).map((d) => {
                  const ativo = d === dificuldade;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDificuldade(d)}
                      style={[estilos.segmento, ativo && estilos.segmentoAtivo]}
                    >
                      <Text style={[estilos.segmentoTexto, ativo && estilos.segmentoTextoAtivo]}>
                        {ROTULOS_DIFICULDADE[d]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={estilos.ajuda}>quão parecidas são as pistas do impostor com as dos civis.</Text>
            </Section>
          )}

          {/* ─── 6. Quantos impostores? ─── */}
          <Section titulo="quantos impostores?">
            <View style={estilos.controleNumero}>
              <Pressable
                onPress={() => setNumMrWhites((n) => Math.max(MIN_MR_WHITES, n - 1))}
                style={[estilos.botaoNumero, numMrWhites <= MIN_MR_WHITES && estilos.botaoNumeroDesabilitado]}
                disabled={numMrWhites <= MIN_MR_WHITES}
                accessibilityLabel="Diminuir impostores"
              >
                <Text style={[estilos.botaoNumeroTexto, numMrWhites <= MIN_MR_WHITES && estilos.botaoNumeroTextoDesabilitado]}>−</Text>
              </Pressable>
              <Text style={estilos.valorNumero}>{numMrWhites}</Text>
              <Pressable
                onPress={() => setNumMrWhites((n) => Math.min(MAX_MR_WHITES, n + 1))}
                style={[estilos.botaoNumero, numMrWhites >= MAX_MR_WHITES && estilos.botaoNumeroDesabilitado]}
                disabled={numMrWhites >= MAX_MR_WHITES}
                accessibilityLabel="Aumentar impostores"
              >
                <Text style={[estilos.botaoNumeroTexto, numMrWhites >= MAX_MR_WHITES && estilos.botaoNumeroTextoDesabilitado]}>+</Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              quanto mais impostores, mais difícil para os civis.
            </Text>
          </Section>
        </ScrollView>

        {/* ─── Rodapé fixo: ação principal ─── */}
        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="começa aí"
            disabled={!podeIniciar}
            carregando={iniciando}
            onPress={aoComecar}
          />
          {nomes.length < MIN_JOGADORES && (
            <Text style={estilos.faltam}>
              faltam {MIN_JOGADORES - nomes.length} jogador
              {MIN_JOGADORES - nomes.length === 1 ? '' : 'es'}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

interface CategoriaCardProps {
  categoria: { id: CategoriaId; emoji: string; nome: string };
  ativo: boolean;
  onPress: () => void;
}

function CategoriaCard({ categoria, ativo, onPress }: CategoriaCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        estilos.categoriaCard,
        ativo && estilos.categoriaCardAtivo,
        pressed && !ativo && estilos.categoriaCardPressionado,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
    >
      <Text style={estilos.categoriaCardEmoji}>{categoria.emoji}</Text>
      <Text
        style={[estilos.categoriaCardNome, ativo && estilos.categoriaCardNomeAtivo]}
        numberOfLines={1}
      >
        {categoria.nome}
      </Text>
    </Pressable>
  );
}

// Section: labels conversacionais — não rótulos de formulário
function Section({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={estilos.section}>
      <View style={estilos.sectionHeader}>
        <Text style={estilos.sectionTitulo}>{titulo}</Text>
        {subtitulo && <Text style={estilos.sectionSubtitulo}>{subtitulo}</Text>}
      </View>
      {children}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  flex: { flex: 1 },

  // ── Voltar ──
  botaoVoltar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    width: 36,
    zIndex: 100,
  },
  botaoVoltarIcone: {
    color: cores.texto,
    fontSize: 18,
    fontWeight: tipografia.pesoBold,
    lineHeight: 20,
  },
  botaoVoltarPressionado: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ scale: 0.94 }],
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollConteudo: { padding: espacamento.lg },

  // ── Cabeçalho: contexto do jogo, não título de formulário ──
  cabecalho: {
    marginBottom: espacamento.lg,
    marginTop: espacamento.xl,
  },
  tituloPagina: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 28,
    letterSpacing: -0.2,
    marginTop: espacamento.sm,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
  },

  // ── Section: conversacional, não burocrática ──
  section: { marginBottom: espacamento.xl },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.md,
  },
  // Lowercase, sem uppercase transform — linguagem humana
  sectionTitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
  },
  sectionSubtitulo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // ── Jogadores: primeiro e em destaque ──
  entradaBloco: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  input: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: 17,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  botaoAdicionar: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  botaoAdicionarDesabilitado: { backgroundColor: cores.borda },
  botaoAdicionarPressionado: {
    backgroundColor: cores.primariaPressionada,
    transform: [{ scale: 0.95 }],
  },
  botaoAdicionarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 28,
    fontWeight: tipografia.pesoBold,
    lineHeight: 30,
  },
  vazio: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.md,
    paddingVertical: espacamento.sm,
    textAlign: 'center',
  },
  lista: { marginTop: espacamento.md },
  item: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    marginBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  itemBolinha: {
    alignItems: 'center',
    backgroundColor: cores.fundoSecundario,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  itemNumero: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
  },
  itemNome: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
  },
  itemRemover: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  itemRemoverPressionado: { opacity: 0.5 },
  itemRemoverTexto: {
    color: cores.textoSecundario,
    fontSize: 24,
    fontWeight: tipografia.pesoBold,
    lineHeight: 26,
  },

  // ── Categoria ──
  categoriaAtivaBadge: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.acento,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm + 2,
  },
  categoriaAtivaEmoji: { fontSize: 22 },
  categoriaAtivaTexto: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoSubtitulo,
  },
  categoriaGrid: { gap: espacamento.sm },
  categoriaLinha: { flexDirection: 'row', gap: espacamento.sm },
  categoriaCard: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    gap: espacamento.xs,
    paddingHorizontal: espacamento.sm,
    paddingVertical: espacamento.md,
  },
  categoriaCardAtivo: {
    backgroundColor: 'rgba(201, 137, 58, 0.10)',
    borderColor: cores.acento,
  },
  categoriaCardEmoji: { fontSize: 24 },
  categoriaCardNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 12,
    fontWeight: tipografia.pesoSemibold,
    textAlign: 'center',
  },
  categoriaCardNomeAtivo: { color: cores.acento },
  categoriaCardPressionado: { opacity: 0.7 },
  categoriaCardVazio: { flex: 1 },
  botaoSortear: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: cores.acento,
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm + 2,
  },
  botaoSortearPressionado: {
    backgroundColor: 'rgba(201, 137, 58, 0.12)',
    transform: [{ scale: 0.97 }],
  },
  botaoSortearTexto: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontSize: 14,
    fontWeight: tipografia.pesoSemibold,
    letterSpacing: 0.3,
  },

  // ── Segmentos de modo/nível ──
  linhaSegmentos: { flexDirection: 'row', gap: espacamento.sm },
  segmento: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  segmentoAtivo: {
    backgroundColor: cores.acento,
    borderColor: cores.acento,
  },
  segmentoTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 15,
    fontWeight: tipografia.pesoSemibold,
  },
  segmentoTextoAtivo: {
    color: cores.textoSobrePrimaria,
    fontWeight: tipografia.pesoBold,
  },
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 13,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },

  // ── Stepper de impostores ──
  controleNumero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  botaoNumero: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 60,
  },
  botaoNumeroDesabilitado: { opacity: 0.35 },
  botaoNumeroTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: 26,
    fontWeight: '700',
  },
  botaoNumeroTextoDesabilitado: { color: cores.textoMudo },
  valorNumero: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 44,
    minWidth: 56,
    textAlign: 'center',
  },

  // ── Rodapé fixo ──
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    padding: espacamento.lg,
    paddingTop: espacamento.md,
  },
  faltam: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
});
