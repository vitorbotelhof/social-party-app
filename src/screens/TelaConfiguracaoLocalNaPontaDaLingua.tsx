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
import type { CategoriaIdNPL } from '@/games/na-ponta-da-lingua/types';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocalNaPontaDaLingua'>;

const MIN_JOGADORES = 2;
const MAX_JOGADORES = 10;
const MIN_RODADAS = 1;
const MAX_RODADAS = 8;
const MIN_NOME = 2;

const DURACOES: { valor: 45 | 60 | 90; rotulo: string; descricao: string }[] = [
  { valor: 45, rotulo: '45s', descricao: 'rápido e cruel.' },
  { valor: 60, rotulo: '60s', descricao: 'ritmo ideal.' },
  { valor: 90, rotulo: '90s', descricao: 'mais fôlego.' },
];

const DIFICULDADES: { valor: 'facil' | 'medio' | 'dificil' | 'colapso' | 'todas'; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'todas' },
  { valor: 'facil', rotulo: 'fácil' },
  { valor: 'medio', rotulo: 'médio' },
  { valor: 'dificil', rotulo: 'difícil' },
  { valor: 'colapso', rotulo: 'colapso' },
];

const CATEGORIAS: { valor: CategoriaIdNPL; rotulo: string }[] = [
  { valor: 'internet_br', rotulo: 'Internet BR' },
  { valor: 'cotidiano', rotulo: 'Cotidiano' },
  { valor: 'comida', rotulo: 'Comida' },
  { valor: 'cultura_pop', rotulo: 'Cultura Pop' },
  { valor: 'objetos', rotulo: 'Objetos' },
  { valor: 'profissoes', rotulo: 'Profissões' },
  { valor: 'festas', rotulo: 'Festas' },
  { valor: 'relacionamentos', rotulo: 'Relacionamentos' },
  { valor: 'lugares', rotulo: 'Lugares' },
  { valor: 'brasil', rotulo: 'Brasil' },
  { valor: 'traumas_millennials', rotulo: 'Traumas Millennials' },
  { valor: 'memes_br', rotulo: 'Memes BR' },
  { valor: 'vida_adulta', rotulo: 'Vida Adulta' },
  { valor: 'date_ruim', rotulo: 'Date Ruim' },
  { valor: 'escritorio', rotulo: 'Escritório' },
  { valor: 'universidade', rotulo: 'Universidade' },
  { valor: 'carnaval', rotulo: 'Carnaval' },
  { valor: 'reality_shows', rotulo: 'Reality Shows' },
  { valor: 'celebridades_br', rotulo: 'Celebridades BR' },
  { valor: 'colapso_br', rotulo: 'Colapso BR' },
  { valor: 'vergonha_social', rotulo: 'Vergonha Social' },
];

const MODOS: { valor: 'todos_juntos' | 'individual' | 'time_vs_time'; rotulo: string; descricao: string }[] = [
  { valor: 'todos_juntos', rotulo: 'todos juntos', descricao: 'grupo todo adivinha. máximo de caos.' },
  { valor: 'time_vs_time', rotulo: 'time vs time', descricao: 'dois times. roubo. gritaria.' },
  { valor: 'individual', rotulo: 'solo', descricao: '1 explica, 1 responde. mais focado.' },
];

export function TelaConfiguracaoLocalNaPontaDaLingua({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [duracao, setDuracao] = useState<45 | 60 | 90>(60);
  const [rodadasPorJogador, setRodadasPorJogador] = useState(3);
  const [dificuldade, setDificuldade] = useState<'facil' | 'medio' | 'dificil' | 'colapso' | 'todas'>('todas');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<CategoriaIdNPL[] | 'todas'>('todas');
  const [modoJogo, setModoJogo] = useState<'todos_juntos' | 'individual' | 'time_vs_time'>('todos_juntos');
  const [timesA, setTimesA] = useState<number[]>([]);
  const [timesB, setTimesB] = useState<number[]>([]);
  // Categorias colapsadas por padrão — onboarding invisível
  const [expandirCategorias, setExpandirCategorias] = useState(false);

  const nomeLimpo = novoNome.trim();
  const podeAdicionar =
    nomeLimpo.length >= MIN_NOME &&
    nomes.length < MAX_JOGADORES &&
    !nomes.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());

  const podeIniciarTvT = modoJogo === 'time_vs_time'
    ? timesA.length >= 2 && timesB.length >= 2
    : true;
  const categoriaValida = categoriasSelecionadas === 'todas' || categoriasSelecionadas.length >= 3;
  const podeIniciar = nomes.length >= MIN_JOGADORES && podeIniciarTvT && categoriaValida;

  useEffect(() => {
    if (modoJogo !== 'time_vs_time') return;
    const a: number[] = [];
    const b: number[] = [];
    nomes.forEach((_, i) => { if (i % 2 === 0) a.push(i); else b.push(i); });
    setTimesA(a);
    setTimesB(b);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomes.length, modoJogo]);

  function moverJogador(idx: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (timesA.includes(idx)) {
      setTimesA((a) => a.filter((i) => i !== idx));
      setTimesB((b) => [...b, idx].sort((x, y) => x - y));
    } else {
      setTimesB((b) => b.filter((i) => i !== idx));
      setTimesA((a) => [...a, idx].sort((x, y) => x - y));
    }
  }

  function aoAdicionar() {
    if (!podeAdicionar) return;
    setNomes((a) => [...a, nomeLimpo]);
    setNovoNome('');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function aoRemover(i: number) {
    setNomes((a) => a.filter((_, idx) => idx !== i));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    const times = modoJogo === 'time_vs_time' ? {
      nomeA: 'Time A',
      idsA: timesA.map((i) => `local-${i}`),
      nomeB: 'Time B',
      idsB: timesB.map((i) => `local-${i}`),
    } : undefined;
    navigation.replace('JogoLocalNaPontaDaLingua', {
      jogadores,
      duracaoSegundos: duracao,
      rodadasPorJogador,
      dificuldade,
      categorias: categoriasSelecionadas,
      modoJogo,
      times,
    });
  }

  // Rótulo do estado das categorias — mostra o que está ativo sem expor o grid
  const labelCategorias = categoriasSelecionadas === 'todas'
    ? 'todas as categorias'
    : `${categoriasSelecionadas.length} categoria${categoriasSelecionadas.length === 1 ? '' : 's'}`;

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
          {/* ─── Cabeçalho ─── */}
          <View style={estilos.cabecalho}>
            <Text style={estilos.tituloPagina}>na ponta{'\n'}da língua</Text>
            <Text style={estilos.subtitulo}>improvise. as proibidas não perdoam.</Text>
          </View>

          {/* ─── 1. Quem tá jogando? — PRIMEIRO ─── */}
          {/* Ato social primeiro. Configuração técnica depois. */}
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
              <Text style={estilos.vazio}>comece pelo seu nome. os outros entram depois.</Text>
            ) : (
              <View style={estilos.lista}>
                {nomes.map((nome, i) => (
                  <View key={`${nome}-${i}`} style={estilos.item}>
                    <View style={estilos.itemBolinha}>
                      <Text style={estilos.itemNumero}>{i + 1}</Text>
                    </View>
                    <Text style={estilos.itemNome} numberOfLines={1}>{nome}</Text>
                    <Pressable
                      onPress={() => aoRemover(i)}
                      hitSlop={12}
                      style={({ pressed }) => [estilos.itemRemover, pressed && { opacity: 0.5 }]}
                      accessibilityLabel={`Remover ${nome}`}
                    >
                      <Text style={estilos.itemRemoverTexto}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Section>

          {/* ─── 2. Quanto tempo por rodada? ─── */}
          <Section titulo="quanto tempo por rodada?">
            <View style={estilos.linhaSegmentos}>
              {DURACOES.map(({ valor, rotulo }) => (
                <Pressable
                  key={valor}
                  onPress={() => { setDuracao(valor); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[estilos.segmento, duracao === valor && estilos.segmentoAtivo]}
                >
                  <Text style={[estilos.segmentoTexto, duracao === valor && estilos.segmentoTextoAtivo]}>
                    {rotulo}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={estilos.ajuda}>{DURACOES.find((d) => d.valor === duracao)?.descricao}</Text>
          </Section>

          {/* ─── 3. Rodadas por jogador ─── */}
          <Section titulo="quantas vezes cada um joga?">
            <View style={estilos.controleNumero}>
              <Pressable
                onPress={() => { setRodadasPorJogador((n) => Math.max(MIN_RODADAS, n - 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={rodadasPorJogador <= MIN_RODADAS}
                style={[estilos.botaoNumero, rodadasPorJogador <= MIN_RODADAS && estilos.botaoNumeroDesabilitado]}
                accessibilityLabel="Diminuir rodadas"
              >
                <Text style={estilos.botaoNumeroTexto}>−</Text>
              </Pressable>
              <View style={estilos.valorBloco}>
                <Text style={estilos.valorNumero}>{rodadasPorJogador}</Text>
                <Text style={estilos.valorUnidade}>
                  {nomes.length > 0 ? `× ${nomes.length} = ${nomes.length * rodadasPorJogador} turnos` : 'vezes cada'}
                </Text>
              </View>
              <Pressable
                onPress={() => { setRodadasPorJogador((n) => Math.min(MAX_RODADAS, n + 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={rodadasPorJogador >= MAX_RODADAS}
                style={[estilos.botaoNumero, rodadasPorJogador >= MAX_RODADAS && estilos.botaoNumeroDesabilitado]}
                accessibilityLabel="Aumentar rodadas"
              >
                <Text style={estilos.botaoNumeroTexto}>+</Text>
              </Pressable>
            </View>
          </Section>

          {/* ─── 4. Dificuldade ─── */}
          <Section titulo="que intensidade?">
            <View style={estilos.linhaSegmentos}>
              {DIFICULDADES.map(({ valor, rotulo }) => (
                <Pressable
                  key={valor}
                  onPress={() => setDificuldade(valor)}
                  style={[estilos.segmento, dificuldade === valor && estilos.segmentoAtivo]}
                >
                  <Text style={[estilos.segmentoTexto, dificuldade === valor && estilos.segmentoTextoAtivo]}>
                    {rotulo}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={estilos.ajuda}>
              {dificuldade === 'dificil' ? 'palavras que exigem muita criatividade.' :
               dificuldade === 'facil' ? 'para esquentar o grupo.' :
               dificuldade === 'medio' ? 'desconfortável de um jeito bom.' :
               dificuldade === 'colapso' ? 'o cérebro para de funcionar.' :
               'mistura de tudo. o app decide.'}
            </Text>
          </Section>

          {/* ─── 5. Modo de jogo ─── */}
          <Section titulo="como o grupo joga?">
            <View style={estilos.linhaSegmentos}>
              {MODOS.map(({ valor, rotulo }) => (
                <Pressable
                  key={valor}
                  onPress={() => { setModoJogo(valor); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[estilos.segmento, modoJogo === valor && estilos.segmentoAtivo]}
                >
                  <Text style={[estilos.segmentoTexto, modoJogo === valor && estilos.segmentoTextoAtivo]}>
                    {rotulo}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={estilos.ajuda}>{MODOS.find((m) => m.valor === modoJogo)?.descricao}</Text>
          </Section>

          {/* ─── 6. Divisão dos times (TvT) ─── */}
          {modoJogo === 'time_vs_time' && nomes.length >= 2 && (
            <Section titulo="quem vai em cada time?">
              <View style={estilos.timesGrid}>
                <View style={estilos.timeColunaContainer}>
                  <Text style={estilos.timeLabel}>Time A</Text>
                  {timesA.length === 0
                    ? <Text style={estilos.timeVazio}>vazio</Text>
                    : timesA.map((i) => (
                      <Pressable
                        key={i}
                        onPress={() => moverJogador(i)}
                        style={({ pressed }) => [estilos.timeJogadorItem, estilos.timeJogadorA, pressed && { opacity: 0.6 }]}
                      >
                        <Text style={estilos.timeJogadorNome} numberOfLines={1}>{nomes[i]}</Text>
                        <Text style={estilos.timeMoverTexto}>→ B</Text>
                      </Pressable>
                    ))
                  }
                </View>
                <View style={estilos.timeDivisorVertical} />
                <View style={estilos.timeColunaContainer}>
                  <Text style={estilos.timeLabel}>Time B</Text>
                  {timesB.length === 0
                    ? <Text style={estilos.timeVazio}>vazio</Text>
                    : timesB.map((i) => (
                      <Pressable
                        key={i}
                        onPress={() => moverJogador(i)}
                        style={({ pressed }) => [estilos.timeJogadorItem, estilos.timeJogadorB, pressed && { opacity: 0.6 }]}
                      >
                        <Text style={estilos.timeMoverTexto}>A ←</Text>
                        <Text style={estilos.timeJogadorNome} numberOfLines={1}>{nomes[i]}</Text>
                      </Pressable>
                    ))
                  }
                </View>
              </View>
              <Text style={estilos.ajuda}>toque num jogador para trocar de time.</Text>
              {(timesA.length < 2 || timesB.length < 2) && (
                <Text style={[estilos.ajuda, { color: 'rgba(232,106,90,0.8)', marginTop: 4 }]}>
                  mínimo 2 por time.
                </Text>
              )}
            </Section>
          )}

          {/* ─── 7. Categorias — colapsadas por padrão ─── */}
          {/* Setup invisível: padrão funciona para todos. Quem quer personalizar, expande. */}
          <Section titulo="categorias de palavras" subtitulo={labelCategorias}>
            <Pressable
              onPress={() => {
                setExpandirCategorias((v) => !v);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [estilos.expandirBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={estilos.expandirTexto}>
                {expandirCategorias ? 'ocultar categorias ↑' : 'personalizar categorias ↓'}
              </Text>
            </Pressable>

            {expandirCategorias && (
              <>
                <View style={[estilos.categoriasGrid, { marginTop: espacamento.md }]}>
                  {CATEGORIAS.map(({ valor, rotulo }) => {
                    const ativa = categoriasSelecionadas === 'todas' || categoriasSelecionadas.includes(valor);
                    return (
                      <Pressable
                        key={valor}
                        onPress={() => {
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          if (categoriasSelecionadas === 'todas') {
                            setCategoriasSelecionadas(CATEGORIAS.map((c) => c.valor).filter((v) => v !== valor));
                          } else {
                            const nova = ativa
                              ? categoriasSelecionadas.filter((v) => v !== valor)
                              : [...categoriasSelecionadas, valor];
                            setCategoriasSelecionadas(
                              nova.length === CATEGORIAS.length ? 'todas' : nova.length === 0 ? 'todas' : nova,
                            );
                          }
                        }}
                        style={[estilos.categoriaChip, ativa && estilos.categoriaChipAtivo]}
                      >
                        <Text style={[estilos.categoriaChipTexto, ativa && estilos.categoriaChipTextoAtivo]}>
                          {rotulo}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {categoriasSelecionadas !== 'todas' && categoriasSelecionadas.length < 3 && (
                  <Text style={[estilos.ajuda, { color: 'rgba(232,106,90,0.8)', marginTop: 8 }]}>
                    selecione pelo menos 3 categorias.
                  </Text>
                )}
                {categoriasSelecionadas !== 'todas' && (
                  <Pressable
                    onPress={() => { setCategoriasSelecionadas('todas'); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    hitSlop={8}
                    style={{ alignSelf: 'center', marginTop: espacamento.sm }}
                  >
                    <Text style={estilos.ajuda}>usar todas as categorias</Text>
                  </Pressable>
                )}
              </>
            )}
          </Section>
        </ScrollView>

        {/* ─── Rodapé fixo: ação principal ─── */}
        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="começa aí"
            disabled={!podeIniciar}
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

function Section({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
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

const estilos = StyleSheet.create({
  tela: { backgroundColor: cores.fundo, flex: 1 },
  flex: { flex: 1 },

  botaoVoltar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    width: 36,
    zIndex: 100,
  },
  botaoVoltarIcone: { color: cores.texto, fontSize: 18, fontWeight: tipografia.pesoBold, lineHeight: 20 },
  botaoVoltarPressionado: { backgroundColor: 'rgba(255,255,255,0.14)', transform: [{ scale: 0.94 }] },

  scroll: { flex: 1 },
  scrollConteudo: { padding: espacamento.lg },

  // Cabeçalho: game title + contexto, não título de formulário
  cabecalho: { marginBottom: espacamento.lg, marginTop: espacamento.xl },
  tituloPagina: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 32,
    letterSpacing: -0.2,
    lineHeight: 40,
    marginTop: espacamento.sm,
  },
  subtitulo: { color: cores.textoSecundario, fontFamily: familias.sans, fontSize: tipografia.tamanhoCorpoMenor, marginTop: espacamento.xs },

  // Section: conversacional
  section: { marginBottom: espacamento.xl },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', gap: espacamento.sm, marginBottom: espacamento.md },
  sectionTitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
  },
  sectionSubtitulo: { color: cores.textoMudo, fontFamily: familias.sans, fontSize: 11, letterSpacing: 0.3 },

  // Jogadores
  entradaBloco: { flexDirection: 'row', gap: espacamento.sm },
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
  botaoAdicionar: { alignItems: 'center', backgroundColor: cores.primaria, borderRadius: raio.md, height: 52, justifyContent: 'center', width: 52 },
  botaoAdicionarDesabilitado: { backgroundColor: cores.borda },
  botaoAdicionarPressionado: { backgroundColor: cores.primariaPressionada, transform: [{ scale: 0.95 }] },
  botaoAdicionarTexto: { color: cores.textoSobrePrimaria, fontSize: 28, fontWeight: tipografia.pesoBold, lineHeight: 30 },
  vazio: { color: cores.textoMudo, fontFamily: familias.sans, fontSize: tipografia.tamanhoLegenda, marginTop: espacamento.md, paddingVertical: espacamento.sm, textAlign: 'center' },
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
  itemBolinha: { alignItems: 'center', backgroundColor: cores.fundoSecundario, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  itemNumero: { color: cores.textoSecundario, fontFamily: familias.sans, fontSize: tipografia.tamanhoLegenda, fontWeight: tipografia.pesoExtraBold },
  itemNome: { color: cores.texto, flex: 1, fontFamily: familias.sans, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoSemibold },
  itemRemover: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  itemRemoverTexto: { color: cores.textoSecundario, fontSize: 24, fontWeight: tipografia.pesoBold, lineHeight: 26 },

  // Segmentos
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
  segmentoAtivo: { backgroundColor: cores.acento, borderColor: cores.acento },
  segmentoTexto: { color: cores.textoSecundario, fontFamily: familias.sans, fontSize: 15, fontWeight: tipografia.pesoSemibold },
  segmentoTextoAtivo: { color: cores.textoSobrePrimaria, fontWeight: tipografia.pesoBold },
  ajuda: { color: cores.textoMudo, fontFamily: familias.sans, fontSize: 13, marginTop: espacamento.sm, textAlign: 'center' },

  // Stepper de rodadas
  controleNumero: { alignItems: 'center', flexDirection: 'row', gap: espacamento.lg, justifyContent: 'center' },
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
  botaoNumeroTexto: { color: cores.texto, fontFamily: familias.sans, fontSize: 26, fontWeight: '700' },
  valorBloco: { alignItems: 'center', minWidth: 80 },
  valorNumero: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 44,
    lineHeight: 50,
    textAlign: 'center',
  },
  valorUnidade: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.1,
    textAlign: 'center',
  },

  // Times
  timesGrid: { flexDirection: 'row', gap: 0 },
  timeColunaContainer: { flex: 1, gap: espacamento.sm },
  timeLabel: { color: cores.textoMudo, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', marginBottom: 2 },
  timeDivisorVertical: { backgroundColor: cores.borda, marginHorizontal: espacamento.sm, width: 1 },
  timeJogadorItem: { alignItems: 'center', borderRadius: raio.sm, borderWidth: 1, flexDirection: 'row', gap: espacamento.xs, paddingHorizontal: espacamento.sm, paddingVertical: espacamento.sm },
  timeJogadorA: { backgroundColor: 'rgba(201,137,58,0.08)', borderColor: 'rgba(201,137,58,0.3)' },
  timeJogadorB: { backgroundColor: 'rgba(160,82,45,0.08)', borderColor: 'rgba(160,82,45,0.3)' },
  timeJogadorNome: { color: cores.texto, flex: 1, fontSize: 13, fontWeight: '600' },
  timeMoverTexto: { color: cores.textoMudo, fontSize: 11 },
  timeVazio: { color: cores.textoMudo, fontSize: 12, fontStyle: 'italic', textAlign: 'center', paddingVertical: espacamento.sm },

  // Categorias — colapsadas por padrão
  expandirBtn: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  expandirTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.2,
  },
  categoriasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: espacamento.sm },
  categoriaChip: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.xl,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: 7,
  },
  categoriaChipAtivo: { backgroundColor: cores.acento, borderColor: cores.acento },
  categoriaChipTexto: { color: cores.textoSecundario, fontFamily: familias.sans, fontSize: 13, fontWeight: tipografia.pesoSemibold },
  categoriaChipTextoAtivo: { color: cores.textoSobrePrimaria },

  // Rodapé
  rodape: { borderTopColor: cores.borda, borderTopWidth: 1, padding: espacamento.lg, paddingTop: espacamento.md },
  faltam: { color: cores.textoMudo, fontFamily: familias.sans, fontSize: tipografia.tamanhoLegenda, marginTop: espacamento.sm, textAlign: 'center' },
});
