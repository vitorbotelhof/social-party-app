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

const DIFICULDADES: { valor: 'facil' | 'medio' | 'dificil' | 'todas'; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'facil', rotulo: 'Fácil' },
  { valor: 'medio', rotulo: 'Médio' },
  { valor: 'dificil', rotulo: 'Difícil' },
];

const MODOS: { valor: 'todos_juntos' | 'individual' | 'time_vs_time'; rotulo: string; descricao: string }[] = [
  { valor: 'todos_juntos', rotulo: 'Todos juntos', descricao: 'grupo todo responde. máximo de caos.' },
  { valor: 'time_vs_time', rotulo: 'Time vs Time', descricao: 'dois times. roubo. gritaria.' },
  { valor: 'individual', rotulo: 'Solo', descricao: '1 explica, 1 responde. mais focado.' },
];

export function TelaConfiguracaoLocalNaPontaDaLingua({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [duracao, setDuracao] = useState<45 | 60 | 90>(60);
  const [rodadasPorJogador, setRodadasPorJogador] = useState(3);
  const [dificuldade, setDificuldade] = useState<'facil' | 'medio' | 'dificil' | 'todas'>('todas');
  const [modoJogo, setModoJogo] = useState<'todos_juntos' | 'individual' | 'time_vs_time'>('todos_juntos');
  const [timesA, setTimesA] = useState<number[]>([]);
  const [timesB, setTimesB] = useState<number[]>([]);

  const nomeLimpo = novoNome.trim();
  const podeAdicionar =
    nomeLimpo.length >= MIN_NOME &&
    nomes.length < MAX_JOGADORES &&
    !nomes.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());

  const podeIniciarTvT = modoJogo === 'time_vs_time'
    ? timesA.length >= 2 && timesB.length >= 2
    : true;
  const podeIniciar = nomes.length >= MIN_JOGADORES && podeIniciarTvT;

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
      modoJogo,
      times,
    });
  }

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
          <View style={estilos.cabecalho}>
            <Text style={estilos.legenda}>📱 UM CELULAR</Text>
            <Text style={estilos.tituloPagina}>na ponta{'\n'}da língua</Text>
            <Text style={estilos.subtitulo}>improvise. as proibidas não perdoam.</Text>
          </View>

          {/* ─── Duração ─── */}
          <Section titulo="Tempo por rodada">
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

          {/* ─── Rodadas ─── */}
          <Section titulo="Rodadas por jogador">
            <View style={estilos.controleNumero}>
              <Pressable
                onPress={() => { setRodadasPorJogador((n) => Math.max(MIN_RODADAS, n - 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={rodadasPorJogador <= MIN_RODADAS}
                style={[estilos.botaoNumero, rodadasPorJogador <= MIN_RODADAS && estilos.botaoNumeroDesabilitado]}
              >
                <Text style={estilos.botaoNumeroTexto}>−</Text>
              </Pressable>
              <Text style={estilos.valorNumero}>{rodadasPorJogador}</Text>
              <Pressable
                onPress={() => { setRodadasPorJogador((n) => Math.min(MAX_RODADAS, n + 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={rodadasPorJogador >= MAX_RODADAS}
                style={[estilos.botaoNumero, rodadasPorJogador >= MAX_RODADAS && estilos.botaoNumeroDesabilitado]}
              >
                <Text style={estilos.botaoNumeroTexto}>+</Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              {nomes.length > 0
                ? `${nomes.length * rodadasPorJogador} turnos no total.`
                : 'cada jogador joga esse número de vezes.'}
            </Text>
          </Section>

          {/* ─── Dificuldade ─── */}
          <Section titulo="Dificuldade">
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
               'mistura de tudo. o app decide.'}
            </Text>
          </Section>

          {/* ─── Modo de jogo ─── */}
          <Section titulo="Modo de jogo" subtitulo={modoJogo === 'time_vs_time' ? 'rivalidade máxima' : undefined}>
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

          {/* ─── Divisão dos times (TvT) ─── */}
          {modoJogo === 'time_vs_time' && nomes.length >= 2 && (
            <Section titulo="Divisão dos times">
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

          {/* ─── Jogadores ─── */}
          <Section titulo={`Jogadores (${nomes.length}/${MAX_JOGADORES})`}>
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
              />
              <Pressable
                onPress={aoAdicionar}
                disabled={!podeAdicionar}
                style={({ pressed }) => [
                  estilos.botaoAdicionar,
                  !podeAdicionar && estilos.botaoAdicionarDesabilitado,
                  pressed && podeAdicionar && estilos.botaoAdicionarPressionado,
                ]}
              >
                <Text style={estilos.botaoAdicionarTexto}>+</Text>
              </Pressable>
            </View>

            {nomes.length === 0 ? (
              <Text style={estilos.vazio}>nenhum jogador ainda.</Text>
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
                    >
                      <Text style={estilos.itemRemoverTexto}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Section>
        </ScrollView>

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
  ajuda: { color: cores.textoMudo, fontSize: 13, marginTop: espacamento.sm, textAlign: 'center' },
  botaoAdicionar: { alignItems: 'center', backgroundColor: cores.primaria, borderRadius: raio.md, height: 52, justifyContent: 'center', width: 52 },
  botaoAdicionarDesabilitado: { backgroundColor: cores.borda },
  botaoAdicionarPressionado: { backgroundColor: cores.primariaPressionada, transform: [{ scale: 0.95 }] },
  botaoAdicionarTexto: { color: cores.textoSobrePrimaria, fontSize: 28, fontWeight: tipografia.pesoBold, lineHeight: 30 },
  botaoNumero: { alignItems: 'center', backgroundColor: cores.superficieElevada, borderColor: cores.borda, borderRadius: raio.md, borderWidth: 1, height: 52, justifyContent: 'center', width: 60 },
  botaoNumeroDesabilitado: { opacity: 0.35 },
  botaoNumeroTexto: { color: cores.texto, fontSize: 26, fontWeight: '700' },
  botaoVoltar: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.18)', borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', left: 16, position: 'absolute', width: 36, zIndex: 100 },
  botaoVoltarIcone: { color: cores.texto, fontSize: 18, fontWeight: tipografia.pesoBold, lineHeight: 20 },
  botaoVoltarPressionado: { backgroundColor: 'rgba(255,255,255,0.14)', transform: [{ scale: 0.94 }] },
  cabecalho: { marginBottom: espacamento.lg, marginTop: espacamento.xl },
  controleNumero: { alignItems: 'center', flexDirection: 'row', gap: espacamento.lg, justifyContent: 'center' },
  entradaBloco: { flexDirection: 'row', gap: espacamento.sm },
  faltam: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, marginTop: espacamento.sm, textAlign: 'center' },
  flex: { flex: 1 },
  input: { backgroundColor: cores.superficie, borderColor: cores.borda, borderRadius: raio.md, borderWidth: 1, color: cores.texto, flex: 1, fontSize: 17, paddingHorizontal: espacamento.md, paddingVertical: espacamento.md },
  item: { alignItems: 'center', backgroundColor: cores.superficie, borderColor: cores.borda, borderRadius: raio.md, borderWidth: 1, flexDirection: 'row', gap: espacamento.md, marginBottom: espacamento.sm, paddingHorizontal: espacamento.md, paddingVertical: espacamento.md },
  itemBolinha: { alignItems: 'center', backgroundColor: cores.fundoSecundario, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  itemNome: { color: cores.texto, flex: 1, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoSemibold },
  itemNumero: { color: cores.textoSecundario, fontSize: tipografia.tamanhoLegenda, fontWeight: tipografia.pesoExtraBold },
  itemRemover: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  itemRemoverTexto: { color: cores.textoSecundario, fontSize: 24, fontWeight: tipografia.pesoBold, lineHeight: 26 },
  legenda: { color: cores.primaria, fontSize: tipografia.tamanhoMicro, fontWeight: tipografia.pesoExtraBold, letterSpacing: tipografia.letraSpacingLegenda },
  linhaSegmentos: { flexDirection: 'row', gap: espacamento.sm },
  lista: { marginTop: espacamento.md },
  rodape: { borderTopColor: cores.borda, borderTopWidth: 1, padding: espacamento.lg, paddingTop: espacamento.md },
  scroll: { flex: 1 },
  scrollConteudo: { padding: espacamento.lg },
  section: { marginBottom: espacamento.xl },
  sectionHeader: { alignItems: 'baseline', flexDirection: 'row', gap: espacamento.sm, marginBottom: espacamento.md },
  sectionTitulo: { color: cores.textoSecundario, fontSize: 12, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  sectionSubtitulo: { color: cores.acento, fontSize: 11, fontStyle: 'italic', letterSpacing: 0.3 },
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
  segmento: { alignItems: 'center', backgroundColor: cores.superficie, borderColor: cores.borda, borderRadius: raio.md, borderWidth: 1, flex: 1, paddingVertical: espacamento.md },
  segmentoAtivo: { backgroundColor: cores.acento, borderColor: cores.acento },
  segmentoTexto: { color: cores.textoSecundario, fontSize: 15, fontWeight: '600' },
  segmentoTextoAtivo: { color: cores.textoSobrePrimaria },
  subtitulo: { color: cores.textoSecundario, fontSize: tipografia.tamanhoCorpoMenor, marginTop: espacamento.xs },
  tela: { backgroundColor: cores.fundo, flex: 1 },
  tituloPagina: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 32, marginTop: espacamento.sm, lineHeight: 40 },
  valorNumero: { color: cores.primaria, fontFamily: familias.serifDisplay, fontSize: 44, minWidth: 56, textAlign: 'center' },
  vazio: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, fontStyle: 'italic', marginTop: espacamento.md, paddingVertical: espacamento.sm, textAlign: 'center' },
});
