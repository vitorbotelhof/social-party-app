import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocalMostLikely'>;

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;
const MIN_RODADAS = 3;
const MAX_RODADAS = 20;
const MIN_TAMANHO_NOME = 2;

export function TelaConfiguracaoLocalMostLikely({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [nomes, setNomes] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState('');
  const [totalRodadas, setTotalRodadas] = useState(8);
  const [modo, setModo] = useState<'classico' | 'sincero'>('classico');

  const nomeLimpo = novoNome.trim();
  const podeAdicionar =
    nomeLimpo.length >= MIN_TAMANHO_NOME &&
    nomes.length < MAX_JOGADORES &&
    !nomes.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());
  const podeIniciar = nomes.length >= MIN_JOGADORES;

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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    navigation.replace('JogoLocalMostLikely', { jogadores, totalRodadas, modo });
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
          {/* ─── Cabeçalho ─── */}
          <View style={estilos.cabecalho}>
            <Text style={estilos.tituloPagina}>most likely to</Text>
            <Text style={estilos.subtitulo}>todos apontam juntos. sem filtro.</Text>
          </View>

          {/* ─── 1. Quem tá jogando? — PRIMEIRO ─── */}
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

          {/* ─── 2. Que tipo de pergunta? — Modo ─── */}
          <Section titulo="que tipo de pergunta?">
            <View style={estilos.linhaSegmentos}>
              <Pressable
                onPress={() => setModo('classico')}
                style={[estilos.segmento, modo === 'classico' && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, modo === 'classico' && estilos.segmentoTextoAtivo]}>
                  clássico
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setModo('sincero')}
                style={[estilos.segmento, modo === 'sincero' && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, modo === 'sincero' && estilos.segmentoTextoAtivo]}>
                  sincero
                </Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              {modo === 'sincero'
                ? 'perguntas mais intensas a partir da 4ª rodada.'
                : 'perguntas divertidas e sem risco até o fim.'}
            </Text>
          </Section>

          {/* ─── 3. Quanto tempo? — Rodadas ─── */}
          <Section titulo="quanto tempo?">
            <View style={estilos.controleNumero}>
              <Pressable
                onPress={() => { setTotalRodadas((n) => Math.max(MIN_RODADAS, n - 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={totalRodadas <= MIN_RODADAS}
                style={[estilos.botaoNumero, totalRodadas <= MIN_RODADAS && estilos.botaoNumeroDesabilitado]}
                accessibilityLabel="Diminuir rodadas"
              >
                <Text style={estilos.botaoNumeroTexto}>−</Text>
              </Pressable>
              <View style={estilos.valorBloco}>
                <Text style={estilos.valorNumero}>{totalRodadas}</Text>
                <Text style={estilos.valorUnidade}>rodadas</Text>
              </View>
              <Pressable
                onPress={() => { setTotalRodadas((n) => Math.min(MAX_RODADAS, n + 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={totalRodadas >= MAX_RODADAS}
                style={[estilos.botaoNumero, totalRodadas >= MAX_RODADAS && estilos.botaoNumeroDesabilitado]}
                accessibilityLabel="Aumentar rodadas"
              >
                <Text style={estilos.botaoNumeroTexto}>+</Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              {totalRodadas <= 5 ? 'sessão rápida e direta.' : totalRodadas <= 10 ? 'ritmo ideal para a maioria.' : 'noite longa — muita revelação.'}
            </Text>
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
  botaoVoltarIcone: { color: cores.texto, fontSize: 18, fontWeight: tipografia.pesoBold, lineHeight: 20 },
  botaoVoltarPressionado: { backgroundColor: 'rgba(255,255,255,0.14)', transform: [{ scale: 0.94 }] },

  scroll: { flex: 1 },
  scrollConteudo: { padding: espacamento.lg },

  cabecalho: { marginBottom: espacamento.lg, marginTop: espacamento.xl },
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

  section: { marginBottom: espacamento.xl },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.md,
  },
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
  itemBolinha: { alignItems: 'center', backgroundColor: cores.fundoSecundario, borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  itemNumero: { color: cores.textoSecundario, fontFamily: familias.sans, fontSize: tipografia.tamanhoLegenda, fontWeight: tipografia.pesoExtraBold },
  itemNome: { color: cores.texto, flex: 1, fontFamily: familias.sans, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoSemibold },
  itemRemover: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  itemRemoverTexto: { color: cores.textoSecundario, fontSize: 24, fontWeight: tipografia.pesoBold, lineHeight: 26 },

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
  valorBloco: { alignItems: 'center', minWidth: 72 },
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
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  rodape: { borderTopColor: cores.borda, borderTopWidth: 1, padding: espacamento.lg, paddingTop: espacamento.md },
  faltam: { color: cores.textoMudo, fontFamily: familias.sans, fontSize: tipografia.tamanhoLegenda, marginTop: espacamento.sm, textAlign: 'center' },
});
