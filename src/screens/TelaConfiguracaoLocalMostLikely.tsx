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
          <View style={estilos.cabecalho}>
            <Text style={estilos.legenda}>📱 UM CELULAR</Text>
            <Text style={estilos.tituloPagina}>most likely to</Text>
            <Text style={estilos.subtitulo}>todos apontam juntos. sem filtro.</Text>
          </View>

          {/* ─── Modo ─── */}
          <Section titulo="Modo">
            <View style={estilos.linhaSegmentos}>
              <Pressable
                onPress={() => setModo('classico')}
                style={[estilos.segmento, modo === 'classico' && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, modo === 'classico' && estilos.segmentoTextoAtivo]}>
                  Clássico
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setModo('sincero')}
                style={[estilos.segmento, modo === 'sincero' && estilos.segmentoAtivo]}
              >
                <Text style={[estilos.segmentoTexto, modo === 'sincero' && estilos.segmentoTextoAtivo]}>
                  Sincero
                </Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              {modo === 'sincero'
                ? 'perguntas mais intensas a partir da 4ª rodada.'
                : 'perguntas divertidas e sem risco até o fim.'}
            </Text>
          </Section>

          {/* ─── Rodadas ─── */}
          <Section titulo="Rodadas">
            <View style={estilos.controleNumero}>
              <Pressable
                onPress={() => { setTotalRodadas((n) => Math.max(MIN_RODADAS, n - 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={totalRodadas <= MIN_RODADAS}
                style={[estilos.botaoNumero, totalRodadas <= MIN_RODADAS && estilos.botaoNumeroDesabilitado]}
              >
                <Text style={estilos.botaoNumeroTexto}>−</Text>
              </Pressable>
              <Text style={estilos.valorNumero}>{totalRodadas}</Text>
              <Pressable
                onPress={() => { setTotalRodadas((n) => Math.min(MAX_RODADAS, n + 1)); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                disabled={totalRodadas >= MAX_RODADAS}
                style={[estilos.botaoNumero, totalRodadas >= MAX_RODADAS && estilos.botaoNumeroDesabilitado]}
              >
                <Text style={estilos.botaoNumeroTexto}>+</Text>
              </Pressable>
            </View>
            <Text style={estilos.ajuda}>
              {totalRodadas <= 5 ? 'rápido e direto.' : totalRodadas <= 10 ? 'ritmo ideal.' : 'noite longa.'}
            </Text>
          </Section>

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
                      style={({ pressed }) => [estilos.itemRemover, pressed && estilos.itemRemoverPressionado]}
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

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={estilos.section}>
      <Text style={estilos.sectionTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontSize: 13,
    marginTop: espacamento.sm,
    textAlign: 'center',
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
    fontSize: 26,
    fontWeight: '700',
  },
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
  cabecalho: {
    marginBottom: espacamento.lg,
    marginTop: espacamento.xl,
  },
  controleNumero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  entradaBloco: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  faltam: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  flex: { flex: 1 },
  input: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    flex: 1,
    fontSize: 17,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
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
  itemNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
  },
  itemNumero: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
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
  legenda: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  linhaSegmentos: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  lista: { marginTop: espacamento.md },
  rodape: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    padding: espacamento.lg,
    paddingTop: espacamento.md,
  },
  scroll: { flex: 1 },
  scrollConteudo: { padding: espacamento.lg },
  section: { marginBottom: espacamento.xl },
  sectionTitulo: {
    color: cores.textoSecundario,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: espacamento.md,
    textTransform: 'uppercase',
  },
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
    fontSize: 15,
    fontWeight: '600',
  },
  segmentoTextoAtivo: { color: cores.textoSobrePrimaria },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloPagina: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: 32,
    marginTop: espacamento.sm,
  },
  valorNumero: {
    color: cores.primaria,
    fontFamily: familias.serifDisplay,
    fontSize: 44,
    minWidth: 56,
    textAlign: 'center',
  },
  vazio: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    marginTop: espacamento.md,
    paddingVertical: espacamento.sm,
    textAlign: 'center',
  },
});
