import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import {
  CadastroJogadores,
  ControladorNumerico,
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
  'ConfiguracaoLocalMostLikely'
>;

const MIN_JOGADORES = 3;
const MAX_JOGADORES = 12;
const MIN_RODADAS = 3;
const MAX_RODADAS = 20;

const OPCOES_MODO = [
  { valor: 'classico' as const, rotulo: 'clássico' },
  { valor: 'sincero' as const, rotulo: 'sincero' },
];

export function TelaConfiguracaoLocalMostLikely({ navigation }: Props) {
  const [nomes, setNomes] = useState<string[]>([]);
  const [totalRodadas, setTotalRodadas] = useState(8);
  const [modo, setModo] = useState<'classico' | 'sincero'>('classico');

  const podeIniciar = nomes.length >= MIN_JOGADORES;
  const avisoRodape =
    nomes.length < MIN_JOGADORES
      ? `faltam ${MIN_JOGADORES - nomes.length} jogador${
          MIN_JOGADORES - nomes.length === 1 ? '' : 'es'
        }`
      : undefined;

  function aoComecar() {
    if (!podeIniciar) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void salvarGrupoRecente(nomes);
    const jogadores = nomes.map((nome, i) => ({ id: `local-${i}`, nome }));
    assegurarSessaoIniciada(jogadores, 'most-likely-to');
    navigation.replace('JogoLocalMostLikely', {
      jogadores,
      totalRodadas,
      modo,
    });
  }

  return (
    <TelaConfigLocal
      titulo="most likely to"
      subtitulo="todos apontam juntos. sem filtro."
      onVoltar={() => navigation.goBack()}
      rodape={{
        titulo: 'começa aí',
        disabled: !podeIniciar,
        aviso: avisoRodape,
        onPress: aoComecar,
      }}
    >
      {/* ── 1. Jogadores ── */}
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

      {/* ── 2. Modo ── */}
      <SecaoConfig titulo="que tipo de pergunta?">
        <SegmentControl opcoes={OPCOES_MODO} valor={modo} onChange={setModo} />
        <Text style={estilos.ajuda}>
          {modo === 'sincero'
            ? 'perguntas mais intensas a partir da 4ª rodada.'
            : 'perguntas divertidas e sem risco até o fim.'}
        </Text>
      </SecaoConfig>

      {/* ── 3. Rodadas ── */}
      <SecaoConfig titulo="quanto tempo?">
        <ControladorNumerico
          valor={totalRodadas}
          minimo={MIN_RODADAS}
          maximo={MAX_RODADAS}
          onChange={setTotalRodadas}
          sublabel="rodadas"
        />
        <Text style={estilos.ajuda}>
          {totalRodadas <= 5
            ? 'sessão rápida e direta.'
            : totalRodadas <= 10
              ? 'ritmo ideal para a maioria.'
              : 'noite longa — muita revelação.'}
        </Text>
      </SecaoConfig>
    </TelaConfigLocal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCaption,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
});
