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
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CadastroJogadores, SecaoConfig, TelaConfigLocal } from '@/components';
import { CATEGORIAS_VMC } from '@/games/voce-me-conhece/local/cards';
import { criarConfiguracaoVMC } from '@/games/voce-me-conhece/local/types';
import type { CategoriaVMCId } from '@/games/voce-me-conhece/local/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoLocalVMC'>;

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 10;

const OPCOES_RITMO: { valor: 1 | 2 | 3; rotulo: string; descricao: string }[] =
  [
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
  const [nomes, setNomes] = useState<string[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    CategoriaVMCId[]
  >(['vibes', 'prioridades']);
  const [ritmo, setRitmo] = useState<1 | 2 | 3>(2);

  const podeIniciar =
    nomes.length >= MIN_JOGADORES && categoriasSelecionadas.length > 0;
  const avisoRodape =
    !podeIniciar && nomes.length < MIN_JOGADORES
      ? `mínimo ${MIN_JOGADORES} jogadores`
      : undefined;

  function toggleCategoria(id: CategoriaVMCId) {
    void Haptics.selectionAsync();
    setCategoriasSelecionadas((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Nunca desmarcar a última
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
    <TelaConfigLocal
      titulo="você me conhece?"
      subtitulo="prioridades revelam identidade."
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: iniciar,
      }}
    >
      {/* ── Jogadores ── */}
      <SecaoConfig
        titulo="quem tá jogando?"
        subtitulo={`${nomes.length} de ${MAX_JOGADORES}`}
      >
        <CadastroJogadores
          nomes={nomes}
          onNomesChange={setNomes}
          minJogadores={MIN_JOGADORES}
          maxJogadores={MAX_JOGADORES}
        />
      </SecaoConfig>

      {/* ── Categorias ── */}
      <SecaoConfig titulo="que assunto?">
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
                <View
                  style={[estilos.dotTemperatura, { backgroundColor: cor }]}
                />
                <View style={estilos.cardCategoriaTexto}>
                  <Text
                    style={[
                      estilos.nomeCategoriaCard,
                      ativo && {
                        color: cores.texto,
                        fontWeight: tipografia.pesoBold,
                      },
                    ]}
                  >
                    {cat.nome}
                  </Text>
                  <Text style={estilos.descricaoCategoriaCard}>
                    {cat.descricao}
                  </Text>
                </View>
              </View>
              {ativo && (
                <View
                  style={[estilos.indicadorCategoria, { backgroundColor: cor }]}
                />
              )}
            </Pressable>
          );
        })}
      </SecaoConfig>

      {/* ── Ritmo ── */}
      <SecaoConfig titulo="quanto tempo?">
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
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

const estilos = StyleSheet.create({
  // ── Cards de categoria ──
  cardCategoria: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  cardCategoriaEsquerda: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  cardCategoriaTexto: {
    flex: 1,
    gap: 2,
  },
  dotTemperatura: {
    borderRadius: 4,
    height: 8,
    marginTop: 2,
    width: 8,
  },
  nomeCategoriaCard: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: '500',
  },
  descricaoCategoriaCard: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 13,
    opacity: 0.7,
  },
  indicadorCategoria: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },

  // ── Ritmo ──
  cardRitmo: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  cardRitmoAtivo: {
    backgroundColor: `${cores.texto}08`,
    borderColor: cores.texto,
  },
  cardRitmoTexto: {
    flex: 1,
    gap: 2,
  },
  nomeRitmo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: '500',
  },
  nomeRitmoAtivo: {
    color: cores.texto,
    fontWeight: tipografia.pesoBold,
  },
  descricaoRitmo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 13,
  },
  indicadorRitmo: {
    backgroundColor: cores.texto,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
