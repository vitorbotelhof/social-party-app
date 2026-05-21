/**
 * TelaConfiguracaoLocalInquisicao — Setup para o modo 1 celular.
 *
 * Fluxo:
 *   1. Adicionar nomes dos jogadores (mínimo 4, máximo 10)
 *   2. Escolher intensidade (leve / padrão / paranoia)
 *   3. "começar" → navega para JogoLocalInquisicao
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
import { criarConfiguracaoLocal } from '@/games/inquisicao/local/types';
import type { ModoLocal } from '@/games/inquisicao/local/types';
import type { RootStackParamList } from '@/navigation/types';
import {
  carregarGrupoRecente,
  salvarGrupoRecente,
} from '@/services/grupoRecente';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocalInquisicao'>;

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 10;
const MIN_NOME = 2;

const MODOS: { valor: ModoLocal; rotulo: string; descricao: string }[] = [
  {
    valor: 'leve',
    rotulo: 'leve',
    descricao: 'sem guardião. perfeito para começar.',
  },
  {
    valor: 'padrao',
    rotulo: 'padrão',
    descricao: 'com guardião. tensão equilibrada.',
  },
  {
    valor: 'paranoia',
    rotulo: 'paranoia',
    descricao: 'com guardião. ninguém confia em ninguém.',
  },
];

export function TelaConfiguracaoLocalInquisicao({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [nomes, setNomes] = useState<string[]>([]);
  const [inputAtual, setInputAtual] = useState('');
  const [modo, setModo] = useState<ModoLocal>('padrao');
  const inputRef = useRef<TextInput>(null);

  // Carrega grupo recente ao montar
  useEffect(() => {
    carregarGrupoRecente().then((grupo) => {
      if (grupo && grupo.length >= MIN_JOGADORES) setNomes(grupo);
    });
  }, []);

  const podeAdicionar =
    inputAtual.trim().length >= MIN_NOME && nomes.length < MAX_JOGADORES;

  const podeIniciar = nomes.length >= MIN_JOGADORES;

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

  function iniciar() {
    if (!podeIniciar) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const jogadores = nomes.map((nome, i) => ({ id: `j${i}`, nome }));
    const config = criarConfiguracaoLocal(modo, jogadores.length);

    void salvarGrupoRecente(nomes);

    navigation.replace('JogoLocalInquisicao', { jogadores, config });
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
          <Text style={estilos.titulo}>inquisição</Text>
          <Text style={estilos.subtitulo}>quem não é o que parece?</Text>
        </View>

        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Input de nome */}
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
                style={[estilos.botaoAdd, !podeAdicionar && estilos.botaoAddDesabilitado]}
                onPress={adicionarJogador}
                activeOpacity={0.7}
                disabled={!podeAdicionar}
              >
                <Text style={estilos.textoBotaoAdd}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de jogadores adicionados */}
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

          {/* Seleção de modo */}
          <View style={estilos.secao}>
            <Text style={estilos.labelSecao}>intensidade</Text>

            {MODOS.map((m) => (
              <Pressable
                key={m.valor}
                style={[
                  estilos.cardModo,
                  modo === m.valor && estilos.cardModoAtivo,
                ]}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setModo(m.valor);
                }}
              >
                <View style={estilos.cardModoTexto}>
                  <Text
                    style={[
                      estilos.nomeModo,
                      modo === m.valor && estilos.nomeModoAtivo,
                    ]}
                  >
                    {m.rotulo}
                  </Text>
                  <Text style={estilos.descricaoModo}>{m.descricao}</Text>
                </View>
                {modo === m.valor && <View style={estilos.indicadorModo} />}
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
            style={[estilos.botaoIniciar, !podeIniciar && estilos.botaoIniciarDesabilitado]}
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
  // Input row
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
  // Cards de modo
  cardModo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espacamento.md,
    paddingHorizontal: espacamento.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    gap: espacamento.sm,
  },
  cardModoAtivo: {
    borderColor: cores.texto,
    backgroundColor: `${cores.texto}08`,
  },
  cardModoTexto: {
    flex: 1,
    gap: 2,
  },
  nomeModo: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.textoMudo,
  },
  nomeModoAtivo: {
    color: cores.texto,
    fontWeight: tipografia.pesoBold,
  },
  descricaoModo: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  indicadorModo: {
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
