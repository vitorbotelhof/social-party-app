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
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CadastroJogadores, SecaoConfig, TelaConfigLocal } from '@/components';
import { criarConfiguracaoLocal } from '@/games/inquisicao/local/types';
import type { ModoLocal } from '@/games/inquisicao/local/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalInquisicao'
>;

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 10;

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
  const [nomes, setNomes] = useState<string[]>([]);
  const [modo, setModo] = useState<ModoLocal>('padrao');

  const podeIniciar = nomes.length >= MIN_JOGADORES;
  const avisoRodape = !podeIniciar
    ? `mínimo ${MIN_JOGADORES} jogadores`
    : undefined;

  function iniciar() {
    if (!podeIniciar) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const jogadores = nomes.map((nome, i) => ({ id: `j${i}`, nome }));
    const config = criarConfiguracaoLocal(modo, jogadores.length);
    void salvarGrupoRecente(nomes);
    navigation.replace('JogoLocalInquisicao', { jogadores, config });
  }

  return (
    <TelaConfigLocal
      titulo="inquisição"
      subtitulo="quem não é o que parece?"
      onVoltar={() => navigation.goBack()}
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

      {/* ── Intensidade ── */}
      <SecaoConfig titulo="que intensidade?">
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
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

const estilos = StyleSheet.create({
  // ── Cards de modo ──
  cardModo: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.sm,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
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
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: '500',
  },
  nomeModoAtivo: {
    color: cores.texto,
    fontWeight: tipografia.pesoBold,
  },
  descricaoModo: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 13,
  },
  indicadorModo: {
    backgroundColor: cores.texto,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
});
