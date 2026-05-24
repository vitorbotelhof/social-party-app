/**
 * TelaConfiguracaoLocalAlianca — setup do modo 1 celular.
 *
 * Sprint 2: jogadores + resumo das regras calibradas.
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { CadastroJogadores, SecaoConfig, TelaConfigLocal } from '@/components';
import { criarConfiguracaoAlianca } from '@/games/alianca';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalAlianca'
>;

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 10;

export function TelaConfiguracaoLocalAlianca({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const config = useMemo(
    () => criarConfiguracaoAlianca(Math.max(nomes.length, MIN_JOGADORES)),
    [nomes.length],
  );
  const podeIniciar = nomes.length >= MIN_JOGADORES;
  const avisoRodape = !podeIniciar
    ? `mínimo ${MIN_JOGADORES} jogadores`
    : undefined;

  function iniciar() {
    if (!podeIniciar) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const jogadores = nomes.map((nome, i) => ({ id: `alianca-${i}`, nome }));
    const configFinal = criarConfiguracaoAlianca(jogadores.length);
    void salvarGrupoRecente(nomes);
    assegurarSessaoIniciada(jogadores, 'alianca');
    navigation.replace('JogoLocalAlianca', { jogadores, config: configFinal });
  }

  return (
    <TelaConfigLocal
      titulo="aliança"
      subtitulo="confie em alguém. talvez seja isso que querem."
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: iniciar,
      }}
    >
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

      <SecaoConfig titulo="como essa mesa fica?">
        <View style={estilos.resumoGrid}>
          <CardResumo valor={config.numeroTraidores} label="traidores" />
          <CardResumo valor={config.totalMissoesParaVencer} label="vitórias" />
          <CardResumo valor={config.maxRejeicoesSeguidas} label="rejeições" />
        </View>
        <Text style={estilos.ajuda}>
          líder propõe equipe, grupo aprova em segredo, missão acontece sem
          revelar quem sabotou.
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="tamanho das missões?">
        <View style={estilos.missoes}>
          {config.tamanhosMissoes.map((tamanho, indice) => (
            <View key={`${indice}-${tamanho}`} style={estilos.missaoItem}>
              <Text style={estilos.missaoRodada}>{indice + 1}</Text>
              <Text style={estilos.missaoTamanho}>{tamanho}</Text>
            </View>
          ))}
        </View>
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

function CardResumo({ valor, label }: { valor: number; label: string }) {
  return (
    <View style={estilos.cardResumo}>
      <Text style={estilos.cardValor}>{valor}</Text>
      <Text style={estilos.cardLabel}>{label}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 20,
    marginTop: espacamento.md,
  },
  cardLabel: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 11,
    marginTop: 2,
  },
  cardResumo: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    padding: espacamento.md,
  },
  cardValor: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTitulo,
  },
  missaoItem: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  missaoRodada: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 11,
  },
  missaoTamanho: {
    color: cores.texto,
    fontFamily: familias.serifDisplay,
    fontSize: tipografia.tamanhoTitulo,
    marginTop: 2,
  },
  missoes: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  resumoGrid: {
    flexDirection: 'row',
    gap: espacamento.sm,
  },
});
