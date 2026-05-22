/**
 * CadastroJogadores — Campo de entrada + lista de jogadores cadastrados.
 *
 * Encapsula:
 *   - Input de nome + botão adicionar
 *   - Banner "vocês de novo?" com carregamento automático do grupo recente
 *   - Lista de jogadores com posição numerada e remoção individual
 *   - Estado vazio com instrução
 *
 * Completamente controlado: `nomes` e `onNomesChange` vivem no pai,
 * que mantém visibilidade do array para calcular `podeIniciar`.
 *
 * Uso:
 *   <CadastroJogadores
 *     nomes={nomes}
 *     onNomesChange={setNomes}
 *     minJogadores={3}
 *     maxJogadores={12}
 *   />
 */

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { carregarGrupoRecente } from '@/services/grupoRecente';
import {
  cores,
  espacamento,
  familias,
  raio,
  tamanhos,
  tipografia,
} from '@/theme/colors';

interface Props {
  nomes: string[];
  onNomesChange: (nomes: string[]) => void;
  /** Mínimo de jogadores exigido — usado no placeholder dinâmico. */
  minJogadores?: number;
  maxJogadores?: number;
  /** Comprimento mínimo do nome para habilitar o botão adicionar. */
  minNome?: number;
  /** Carregar grupo recente automaticamente ao montar. Default: true. */
  carregarRecente?: boolean;
}

export function CadastroJogadores({
  nomes,
  onNomesChange,
  minJogadores = 3,
  maxJogadores = 12,
  minNome = 2,
  carregarRecente = true,
}: Props) {
  const [novoNome, setNovoNome] = useState('');
  const [grupoEraRecente, setGrupoEraRecente] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!carregarRecente) return;
    void carregarGrupoRecente().then((salvos) => {
      if (salvos && salvos.length >= minJogadores) {
        onNomesChange(salvos);
        setGrupoEraRecente(true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nomeLimpo = novoNome.trim();
  const podeAdicionar =
    nomeLimpo.length >= minNome &&
    nomes.length < maxJogadores &&
    !nomes.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());

  function aoAdicionar() {
    if (!podeAdicionar) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNomesChange([...nomes, nomeLimpo]);
    setNovoNome('');
    inputRef.current?.focus();
  }

  function aoRemover(index: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNomesChange(nomes.filter((_, i) => i !== index));
  }

  function aoLimparGrupo() {
    onNomesChange([]);
    setGrupoEraRecente(false);
  }

  // Placeholder dinâmico: guia o anfitrião pelo fluxo
  const placeholder =
    nomes.length === 0
      ? 'nome do primeiro jogador...'
      : nomes.length < minJogadores
        ? `mais ${minJogadores - nomes.length} para começar`
        : nomes.length < maxJogadores
          ? 'adicionar mais um'
          : `máximo de ${maxJogadores} jogadores`;

  return (
    <View style={estilos.raiz}>
      {/* Input + botão adicionar */}
      <View style={estilos.entradaBloco}>
        <TextInput
          ref={inputRef}
          value={novoNome}
          onChangeText={setNovoNome}
          placeholder={placeholder}
          placeholderTextColor={cores.textoMudo}
          maxLength={24}
          returnKeyType="done"
          autoCapitalize="words"
          autoCorrect={false}
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

      {/* Banner de grupo recente */}
      {grupoEraRecente && nomes.length > 0 && (
        <View style={estilos.grupoRecente}>
          <Text style={estilos.grupoRecenteTexto}>vocês de novo?</Text>
          <Pressable
            onPress={aoLimparGrupo}
            hitSlop={12}
            accessibilityLabel="Limpar grupo"
          >
            <Text style={estilos.grupoRecenteLimpar}>trocar grupo</Text>
          </Pressable>
        </View>
      )}

      {/* Lista vazia */}
      {nomes.length === 0 && (
        <Text style={estilos.vazio}>
          comece pelo seu nome. os outros entram depois.
        </Text>
      )}

      {/* Lista de jogadores */}
      {nomes.length > 0 && (
        <View style={estilos.lista}>
          {nomes.map((nome, i) => (
            <View key={`${nome}-${i}`} style={estilos.item}>
              <View style={estilos.itemBolinha}>
                <Text style={estilos.itemNumero}>{i + 1}</Text>
              </View>
              <Text style={estilos.itemNome} numberOfLines={1}>
                {nome}
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
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { gap: 0 },

  // ── Input ──────────────────────────────────────────────────────────────────
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
    fontSize: tipografia.tamanhoCorpoMaior,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  botaoAdicionar: {
    alignItems: 'center',
    backgroundColor: cores.texto,
    borderRadius: raio.md,
    height: tamanhos.botaoAcao,
    justifyContent: 'center',
    width: tamanhos.botaoAcao,
  },
  botaoAdicionarDesabilitado: {
    backgroundColor: cores.borda,
  },
  botaoAdicionarPressionado: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  botaoAdicionarTexto: {
    color: cores.fundo,
    fontSize: 26,
    fontWeight: tipografia.pesoBold,
    lineHeight: 30,
  },

  // ── Grupo recente ──────────────────────────────────────────────────────────
  grupoRecente: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espacamento.sm,
    paddingHorizontal: 2,
  },
  grupoRecenteTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
  },
  grupoRecenteLimpar: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    textDecorationLine: 'underline',
  },

  // ── Estado vazio ───────────────────────────────────────────────────────────
  vazio: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.md,
    paddingVertical: espacamento.sm,
    textAlign: 'center',
  },

  // ── Lista de jogadores ─────────────────────────────────────────────────────
  lista: {
    marginTop: espacamento.md,
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
    borderRadius: raio.lg,
    height: tamanhos.avatarNumero,
    justifyContent: 'center',
    width: tamanhos.avatarNumero,
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
    fontFamily: familias.sans,
    fontSize: 24,
    fontWeight: tipografia.pesoBold,
    lineHeight: 26,
  },
});
