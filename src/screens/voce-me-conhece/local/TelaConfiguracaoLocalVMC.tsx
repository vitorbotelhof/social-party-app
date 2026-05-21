/**
 * TelaConfiguracaoLocalVMC — Setup do modo 1 celular.
 *
 * 1. Adicionar nomes (mínimo 3, máximo 10)
 * 2. Escolher categorias (ao menos 1)
 * 3. Escolher ritmo (1× rápido / 2× completo / 3× longo)
 * 4. "começar" → navega para JogoLocalVMC
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeUmCelular } from '@/components';
import { CATEGORIAS_VMC } from '@/games/voce-me-conhece/local/cards';
import { criarConfiguracaoVMC } from '@/games/voce-me-conhece/local/types';
import type { CategoriaVMCId } from '@/games/voce-me-conhece/local/types';
import type { RootStackParamList } from '@/navigation/types';
import {
  carregarGrupoRecente,
  salvarGrupoRecente,
} from '@/services/grupoRecente';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocalVMC'>;

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 10;
const MIN_NOME = 2;

const OPCOES_RITMO: { valor: 1 | 2 | 3; rotulo: string; descricao: string }[] = [
  { valor: 1, rotulo: '1× por pessoa', descricao: 'rápido — 15–20 min.' },
  { valor: 2, rotulo: '2× por pessoa', descricao: 'completo — 25–35 min.' },
  { valor: 3, rotulo: '3× por pessoa', descricao: 'longo — 40–55 min.' },
];

const COR_TEMPERATURA: Record<string, string> = {
  leve: '#4D7CFE',
  social: '#F59E0B',
  pessoal: '#F97316',
  intenso: '#EF4444',
};

export function TelaConfiguracaoLocalVMC({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [nomes, setNomes] = useState<string[]>([]);
  const [inputAtual, setInputAtual] = useState('');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<CategoriaVMCId[]>(['vibes', 'prioridades']);
  const [ritmo, setRitmo] = useState<1 | 2 | 3>(2);

  useEffect(() => {
    carregarGrupoRecente().then((grupo) => {
      if (grupo && grupo.length >= MIN_JOGADORES) setNomes(grupo);
    });
  }, []);

  const podeAdicionar =
    inputAtual.trim().length >= MIN_NOME && nomes.length < MAX_JOGADORES;

  const podeIniciar =
    nomes.length >= MIN_JOGADORES && categoriasSelecionadas.length > 0;

  function adicionarJogador() {
    const nome = inputAtual.trim();
    if (nome.length < MIN_NOME || nomes.length >= MAX_JOGADORES) return;
    void Haptics.selectionAsync();
    setNomes((prev) => [...prev, nome]);
    setInputAtual('');
    inputRef.current?.focus();
  }

  function removerJogador(index: number) {
    void Haptics.selectionAsync();
    setNomes((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleCategoria(id: CategoriaVMCId) {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas((prev) => {
      if (prev.includes(id)) {
        // Nunca desmarcar a última
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== id);
      }
      return [...prev, id];
    });
  }

  function iniciar() {
    if (!podeIniciar) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const jogadores = nomes.map((nome, i) => ({ id: `j${i}`, nome }));
    const config = criarConfiguracaoVMC(categoriasSelecionadas, ritmo);

    void salvarGrupoRecente(nomes);

    navigation.replace('JogoLocalVMC', { jogadores, config });
  }

  return (
    <KeyboardAvoidingView
      style={estilos.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={estilos.container} edges={['top']}>

        {/* Header */}
        <View style={estilos.cabecalho}>
          <BadgeUmCelular />
          <Text style={estilos.titulo}>você me conhece?</Text>
          <Text style={estilos.subtitulo}>prioridades revelam identidade.</Text>
        </View>

        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Jogadores ── */}
          <View style={estilos.secao}>
            <Text style={estilos.labelSecao}>jogadores</Text>

            <View style={estilos.inputRow}>
              <TextInput
                ref={inputRef}
                style={estilos.input}
                value={inputAtual}
                onChangeText={setInputAtual}
                placeholder={
                  nomes.length === 0
                    ? 'nome do primeiro jogador'
                    : nomes.length < MIN_JOGADORES
                      ? `mais ${MIN_JOGADORES - nomes.length} para começar`
                      : 'adicionar mais um'
                }
                placeholderTextColor={cores.textoMudo}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={adicionarJogador}
                maxLength={24}
              />
              <TouchableOpacity
                style={[
                  estilos.botaoAdd,
                  !podeAdicionar && estilos.botaoAddDesabilitado,
                ]}
                onPress={adicionarJogador}
                activeOpacity={0.7}
                disabled={!podeAdicionar}
              >
                <Text style={estilos.textoBotaoAdd}>+</Text>
              </TouchableOpacity>
            </View>

            {nomes.map((nome, index) => (
              <View key={`${nome}-${index}`} style={estilos.linhaJogador}>
                <Text style={estilos.nomeJogador}>{nome}</Text>
                <Pressable
                  style={estilos.botaoRemover}
                  onPress={() => removerJogador(index)}
                  hitSlop={12}
                >
                  <Text style={estilos.textoBotaoRemover}>×</Text>
                </Pressable>
              </View>
            ))}

            {nomes.length > 0 && (
              <Text style={estilos.contadorJogadores}>
                {nomes.length} de {MAX_JOGADORES}
              </Text>
            )}
          </View>

          {/* ── Categorias ── */}
          <View style={estilos.secao}>
            <Text style={estilos.labelSecao}>categorias</Text>

            {CATEGORIAS_VMC.map((cat) => {
              const ativo = categoriasSelecionadas.includes(cat.id);
              const cor = COR_TEMPERATURA[cat.temperatura] ?? cores.textoMudo;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    estilos.cardCategoria,
                    ativo && { borderColor: cor, backgroundColor: `${cor}0C` },
                  ]}
                  onPress={() => toggleCategoria(cat.id)}
                >
                  <View style={estilos.cardCategoriaEsquerda}>
                    <View style={[estilos.dotTemperatura, { backgroundColor: cor }]} />
                    <View style={estilos.cardCategoriaTexto}>
                      <Text
                        style={[
                          estilos.nomeCategoriaCard,
                          ativo && { color: cores.texto, fontWeight: tipografia.pesoBold },
                        ]}
                      >
                        {cat.nome}
                      </Text>
                      <Text style={estilos.descricaoCategoriaCard}>{cat.descricao}</Text>
                    </View>
                  </View>
                  {ativo && <View style={[estilos.indicadorCategoria, { backgroundColor: cor }]} />}
                </Pressable>
              );
            })}
          </View>

          {/* ── Ritmo ── */}
          <View style={estilos.secao}>
            <Text style={estilos.labelSecao}>ritmo</Text>

            {OPCOES_RITMO.map((op) => (
              <Pressable
                key={op.valor}
                style={[
                  estilos.cardRitmo,
                  ritmo === op.valor && estilos.cardRitmoAtivo,
                ]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setRitmo(op.valor);
                }}
              >
                <View style={estilos.cardRitmoTexto}>
                  <Text
                    style={[
                      estilos.nomeRitmo,
                      ritmo === op.valor && estilos.nomeRitmoAtivo,
                    ]}
                  >
                    {op.rotulo}
                  </Text>
                  <Text style={estilos.descricaoRitmo}>{op.descricao}</Text>
                </View>
                {ritmo === op.valor && <View style={estilos.indicadorRitmo} />}
              </Pressable>
            ))}
          </View>

        </ScrollView>

        {/* Rodapé */}
        <View style={[estilos.rodape, { paddingBottom: insets.bottom + espacamento.md }]}>
          {!podeIniciar && nomes.length < MIN_JOGADORES && (
            <Text style={estilos.avisoMinimo}>
              mínimo {MIN_JOGADORES} jogadores
            </Text>
          )}
          <TouchableOpacity
            style={[
              estilos.botaoIniciar,
              !podeIniciar && estilos.botaoIniciarDesabilitado,
            ]}
            onPress={iniciar}
            activeOpacity={0.8}
            disabled={!podeIniciar}
          >
            <Text style={estilos.textoBotaoIniciar}>começar</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  flex1: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    paddingBottom: espacamento.md,
    gap: espacamento.xs,
  },
  titulo: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    letterSpacing: tipografia.spacingHero,
  },
  subtitulo: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  scroll: { flex: 1 },
  scrollConteudo: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    gap: espacamento.xl,
  },
  secao: {
    gap: espacamento.sm,
  },
  labelSecao: {
    fontSize: 11,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: espacamento.xs,
  },
  // Input
  inputRow: {
    flexDirection: 'row',
    gap: espacamento.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espacamento.md,
    fontSize: tipografia.tamanhoCorpo,
    fontFamily: familias.sans,
    color: cores.texto,
    backgroundColor: cores.fundo,
  },
  botaoAdd: {
    width: 52,
    height: 52,
    borderRadius: raio.md,
    backgroundColor: cores.texto,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoAddDesabilitado: {
    backgroundColor: cores.borda,
  },
  textoBotaoAdd: {
    fontSize: 24,
    color: cores.fundo,
    fontFamily: familias.sans,
    lineHeight: 28,
  },
  // Lista de jogadores
  linhaJogador: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  nomeJogador: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.texto,
  },
  botaoRemover: {
    padding: espacamento.xs,
  },
  textoBotaoRemover: {
    fontSize: 20,
    color: cores.textoMudo,
    fontFamily: familias.sans,
    lineHeight: 24,
  },
  contadorJogadores: {
    fontSize: 12,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'right',
    marginTop: 2,
  },
  // Cards de categoria
  cardCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: espacamento.md,
    paddingHorizontal: espacamento.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  cardCategoriaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
    flex: 1,
  },
  cardCategoriaTexto: {
    gap: 2,
    flex: 1,
  },
  dotTemperatura: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 2,
  },
  nomeCategoriaCard: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.textoMudo,
  },
  descricaoCategoriaCard: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    opacity: 0.7,
  },
  indicadorCategoria: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Ritmo
  cardRitmo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espacamento.md,
    paddingHorizontal: espacamento.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  cardRitmoAtivo: {
    borderColor: cores.texto,
    backgroundColor: `${cores.texto}08`,
  },
  cardRitmoTexto: {
    flex: 1,
    gap: 2,
  },
  nomeRitmo: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.textoMudo,
  },
  nomeRitmoAtivo: {
    color: cores.texto,
    fontWeight: tipografia.pesoBold,
  },
  descricaoRitmo: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  indicadorRitmo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cores.texto,
  },
  // Rodapé
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    gap: espacamento.xs,
  },
  avisoMinimo: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
  },
  botaoIniciar: {
    backgroundColor: cores.texto,
    borderRadius: raio.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoIniciarDesabilitado: {
    opacity: 0.35,
  },
  textoBotaoIniciar: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.fundo,
  },
});
