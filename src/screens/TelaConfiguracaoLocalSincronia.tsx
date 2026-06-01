import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  CadastroJogadores,
  SecaoConfig,
  SegmentControl,
  TelaConfigLocal,
} from '@/components';
import type { ConfiguracaoSincronia } from '@/games/sincronia/types';
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalSincronia'
>;

const COR_SINCRONIA = '#0EA5E9';

const MIN_JOGADORES = 4;
const MAX_JOGADORES = 12;

const DURACOES: { valor: 60 | 90 | 120; rotulo: string }[] = [
  { valor: 60, rotulo: '60s' },
  { valor: 90, rotulo: '90s' },
  { valor: 120, rotulo: '120s' },
];

const VOLTAS: { valor: 1 | 2 | 3; rotulo: string }[] = [
  { valor: 1, rotulo: '1 volta' },
  { valor: 2, rotulo: '2 voltas' },
  { valor: 3, rotulo: '3 voltas' },
];

const SKIPS: { valor: 3 | 5 | null; rotulo: string }[] = [
  { valor: 3, rotulo: '3 pulos' },
  { valor: 5, rotulo: '5 pulos' },
  { valor: null, rotulo: 'sem limite' },
];

export function TelaConfiguracaoLocalSincronia({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [duracao, setDuracao] = useState<60 | 90 | 120>(60);
  const [voltas, setVoltas] = useState<1 | 2 | 3>(2);
  const [skips, setSkips] = useState<3 | 5 | null>(3);
  const [incluirDificil, setIncluirDificil] = useState(false);

  const numJogadores = nomes.length;
  const parImpar = numJogadores % 2 === 0;
  const podeIniciar = numJogadores >= MIN_JOGADORES && parImpar;

  const avisoRodape =
    numJogadores < MIN_JOGADORES
      ? `mínimo ${MIN_JOGADORES} jogadores`
      : !parImpar
        ? 'precisa ser um número par de jogadores'
        : undefined;

  const numDuplas = Math.floor(numJogadores / 2);
  const descricaoDuplas =
    numJogadores >= 4 && parImpar
      ? `${numDuplas} dupla${numDuplas > 1 ? 's' : ''}`
      : '';

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void salvarGrupoRecente(nomes);
    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    assegurarSessaoIniciada(jogadores, 'sincronia');

    const config: ConfiguracaoSincronia = {
      jogadores,
      duracaoSegundos: duracao,
      voltasPorDupla: voltas,
      skipsPorRodada: skips,
      incluirDificil,
    };

    navigation.replace('JogoLocalSincronia', config);
  }

  return (
    <TelaConfigLocal
      titulo="sincronia"
      subtitulo="uma palavra. dois cérebros. um minuto."
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: aoComecar,
      }}
    >
      <SecaoConfig
        titulo="quem tá jogando?"
        subtitulo={
          descricaoDuplas ||
          `${numJogadores} de ${MAX_JOGADORES}`
        }
      >
        <CadastroJogadores
          nomes={nomes}
          onNomesChange={setNomes}
          minJogadores={MIN_JOGADORES}
          maxJogadores={MAX_JOGADORES}
        />
        {numJogadores >= 4 && !parImpar && (
          <Text style={estilos.avisoImpar}>
            adicione mais um para fechar as duplas.
          </Text>
        )}
        {numJogadores >= 4 && parImpar && (
          <View style={estilos.duplasContainer}>
            {Array.from({ length: numDuplas }, (_, i) => (
              <View key={i} style={estilos.duplaChip}>
                <Text style={estilos.duplaTexto}>
                  {nomes[i * 2]} + {nomes[i * 2 + 1]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </SecaoConfig>

      <SecaoConfig titulo="quanto tempo por rodada?">
        <SegmentControl
          opcoes={DURACOES}
          valor={duracao}
          onChange={setDuracao}
        />
        <Text style={estilos.ajuda}>
          {duracao === 60
            ? 'ritmo acelerado. pressão máxima.'
            : duracao === 90
              ? 'equilibrado. espaço pra comunicar.'
              : 'mais fôlego. ótimo pra palavras difíceis.'}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="quantas voltas por dupla?">
        <SegmentControl
          opcoes={VOLTAS}
          valor={voltas}
          onChange={setVoltas}
        />
        <Text style={estilos.ajuda}>
          {voltas === 1
            ? 'partida rápida. cada um joga uma vez.'
            : voltas === 2
              ? 'os papéis se invertem. todo mundo dá dica e adivinha.'
              : 'longa. cada dupla joga 3 rodadas completas.'}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="quantos pulos por rodada?">
        <SegmentControl
          opcoes={SKIPS}
          valor={skips}
          onChange={setSkips}
        />
        <Text style={estilos.ajuda}>
          {skips === null
            ? 'pule à vontade. sem custo, sem limite.'
            : `até ${skips} palavras podem ser puladas por rodada.`}
        </Text>
      </SecaoConfig>

      <SecaoConfig titulo="nível das palavras?">
        <View style={estilos.linhaSwitch}>
          <View style={estilos.switchTextos}>
            <Text style={estilos.switchLabel}>incluir difícil</Text>
            <Text style={estilos.switchDescricao}>
              palavras abstratas e conceitos.{'\n'}
              bom quando o grupo já se conhece bem.
            </Text>
          </View>
          <Switch
            value={incluirDificil}
            onValueChange={(valor) => {
              void Haptics.selectionAsync();
              setIncluirDificil(valor);
            }}
            trackColor={{
              false: cores.borda,
              true: COR_SINCRONIA,
            }}
            thumbColor={cores.fundoSecundario}
          />
        </View>
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.xs,
  },
  avisoImpar: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: espacamento.xs,
  },
  duplaChip: {
    backgroundColor: cores.borda,
    borderRadius: 20,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 5,
  },
  duplaTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: '600',
  },
  duplasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacamento.xs,
    marginTop: espacamento.sm,
  },
  linhaSwitch: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
    justifyContent: 'space-between',
  },
  switchDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    lineHeight: 18,
    marginTop: 2,
  },
  switchLabel: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: '600',
  },
  switchTextos: {
    flex: 1,
  },
});
