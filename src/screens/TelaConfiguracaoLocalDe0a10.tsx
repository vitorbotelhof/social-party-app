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
import type { RootStackParamList } from '@/navigation/types';
import { salvarGrupoRecente } from '@/services/grupoRecente';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'ConfiguracaoLocalDe0a10'
>;

// ─── Identidade visual do jogo ────────────────────────────────────────────────
const COR_D010 = '#10B981';  // esmeralda — leitura, inteligência emocional

const MIN_JOGADORES = 2;
const MAX_JOGADORES = 12;

const VOLTAS_OPCOES: { valor: 1 | 2 | 3; rotulo: string }[] = [
  { valor: 1, rotulo: '1 volta' },
  { valor: 2, rotulo: '2 voltas' },
  { valor: 3, rotulo: '3 voltas' },
];

export function TelaConfiguracaoLocalDe0a10({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [voltas, setVoltas] = useState<1 | 2 | 3>(1);
  const [modoCompetitivo, setModoCompetitivo] = useState(false);
  const [incluirMais18, setIncluirMais18] = useState(false);

  const totalRodadas = nomes.length * voltas;

  const podeIniciar = nomes.length >= MIN_JOGADORES;

  const avisoRodape = !podeIniciar
    ? `mínimo ${MIN_JOGADORES} jogadores (faltam ${MIN_JOGADORES - nomes.length})`
    : undefined;

  async function iniciar() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const jogadores = nomes.map((nome, i) => ({ id: `j-${i}`, nome }));
    await salvarGrupoRecente(nomes);
    assegurarSessaoIniciada(jogadores, 'de-0-a-10');
    navigation.navigate('JogoLocalDe0a10', {
      jogadores,
      voltas,
      modoCompetitivo,
      incluirMais18,
    });
  }

  return (
    <TelaConfigLocal
      titulo="De 0 a 10"
      subtitulo="sua nota secreta, as respostas revelam tudo"
      onVoltar={() => navigation.goBack()}
      tituloMultilinha
      rodape={{
        titulo: 'começar',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: iniciar,
      }}
    >
      {/* Jogadores */}
      <SecaoConfig titulo="quem vai jogar?">
        <CadastroJogadores
          nomes={nomes}
          onNomesChange={setNomes}
          minJogadores={MIN_JOGADORES}
          maxJogadores={MAX_JOGADORES}
        />
      </SecaoConfig>

      {/* Voltas */}
      <SecaoConfig
        titulo="quantas voltas?"
        subtitulo={
          totalRodadas > 0
            ? `${totalRodadas} rodada${totalRodadas !== 1 ? 's' : ''} no total`
            : undefined
        }
      >
        <SegmentControl
          opcoes={VOLTAS_OPCOES}
          valor={voltas}
          onChange={setVoltas}
        />
        <Text style={estilos.ajuda}>
          {voltas === 1
            ? 'cada jogador responde uma vez. rápido e revelador.'
            : voltas === 2
              ? 'duas rodadas por pessoa. o grupo aprende a calibrar.'
              : 'três rodadas por pessoa. padrões ficam impossíveis de esconder.'}
        </Text>
      </SecaoConfig>

      {/* Modo competitivo */}
      <SecaoConfig titulo="modo">
        <View style={estilos.linhaSwitch}>
          <View style={estilos.switchTextos}>
            <Text style={estilos.switchLabel}>modo competitivo</Text>
            <Text style={estilos.switchDescricao}>
              cravar a nota vale 2; chegar a ±1 vale 1.{'\n'}
              respondente pontua por quem o leu de perto.
            </Text>
          </View>
          <Switch
            value={modoCompetitivo}
            onValueChange={(v) => {
              void Haptics.selectionAsync();
              setModoCompetitivo(v);
            }}
            trackColor={{ false: cores.borda, true: COR_D010 }}
            thumbColor={cores.superficie}
            accessibilityLabel="Ativar modo competitivo"
          />
        </View>
      </SecaoConfig>

      {/* +18 */}
      <SecaoConfig titulo="categorias">
        <View style={estilos.linhaSwitch}>
          <View style={estilos.switchTextos}>
            <Text style={estilos.switchLabel}>incluir categorias +18</Text>
            <Text style={estilos.switchDescricao}>
              desbloqueia categorias com carga emocional mais pesada.{'\n'}
              ative só se o grupo for maior de 18.
            </Text>
          </View>
          <Switch
            value={incluirMais18}
            onValueChange={(v) => {
              void Haptics.selectionAsync();
              setIncluirMais18(v);
            }}
            trackColor={{ false: cores.borda, true: COR_D010 }}
            thumbColor={cores.superficie}
            accessibilityLabel="Incluir categorias +18"
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
    marginTop: espacamento.sm,
  },
  linhaSwitch: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
  },
  switchDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    lineHeight: 15,
    marginTop: 2,
  },
  switchLabel: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
  },
  switchTextos: {
    flex: 1,
  },
});
