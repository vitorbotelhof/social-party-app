import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotaoPrimario, ContagemRegressiva } from '@/components';
import type { ModoMostLikely } from '@/games/most-likely-to/types';
import type { RootStackParamList } from '@/navigation/types';
import { iniciarJogo } from '@/services/roomService';
import { RoomServiceError } from '@/types/room';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfiguracaoJogo'>;

const TOTAL_RODADAS_MIN = 3;
const TOTAL_RODADAS_MAX = 20;
const TOTAL_RODADAS_PADRAO = 10;

const MODOS: { id: ModoMostLikely; rotulo: string; descricao: string }[] = [
  {
    id: 'classico',
    rotulo: 'clássico',
    descricao: 'leve e divertido — para qualquer grupo.',
  },
  {
    id: 'sincero',
    rotulo: 'sincero',
    descricao: 'perguntas mais intensas — para grupos com histórico.',
  },
];

export function TelaConfiguracaoMostLikely({ navigation, route }: Props) {
  const { roomCode, jogoId, jogadorId } = route.params;

  const [totalRodadas, setTotalRodadas] = useState(TOTAL_RODADAS_PADRAO);
  const [modo, setModo] = useState<ModoMostLikely>('classico');
  const [iniciando, setIniciando] = useState(false);
  const [mostrarContagem, setMostrarContagem] = useState(false);

  async function aoIniciar() {
    setIniciando(true);
    try {
      await iniciarJogo(roomCode, jogadorId, { totalRodadas, modo });
      setMostrarContagem(true);
    } catch (erro) {
      setIniciando(false);
      const mensagem =
        erro instanceof RoomServiceError
          ? erro.message
          : 'Algo deu errado, tenta de novo.';
      Alert.alert('Não rolou começar a partida', mensagem);
    }
  }

  if (mostrarContagem) {
    return (
      <ContagemRegressiva
        aoTerminar={() =>
          navigation.replace('Game', { roomCode, jogoId, jogadorId })
        }
      />
    );
  }

  const modoSelecionado = MODOS.find((m) => m.id === modo)!;

  return (
    <SafeAreaView style={estilos.tela} edges={['bottom']}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <Text style={estilos.tituloPagina}>como vai ser?</Text>

        {/* Rodadas — stepper */}
        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>rodadas</Text>
          <View style={estilos.stepper}>
            <Pressable
              onPress={() =>
                setTotalRodadas((n) => Math.max(TOTAL_RODADAS_MIN, n - 1))
              }
              disabled={totalRodadas <= TOTAL_RODADAS_MIN}
              style={[
                estilos.stepperBotao,
                totalRodadas <= TOTAL_RODADAS_MIN && estilos.stepperBotaoDesabilitado,
              ]}
            >
              <Text style={estilos.stepperBotaoTexto}>−</Text>
            </Pressable>

            <Text style={estilos.stepperValor}>{totalRodadas}</Text>

            <Pressable
              onPress={() =>
                setTotalRodadas((n) => Math.min(TOTAL_RODADAS_MAX, n + 1))
              }
              disabled={totalRodadas >= TOTAL_RODADAS_MAX}
              style={[
                estilos.stepperBotao,
                totalRodadas >= TOTAL_RODADAS_MAX && estilos.stepperBotaoDesabilitado,
              ]}
            >
              <Text style={estilos.stepperBotaoTexto}>+</Text>
            </Pressable>
          </View>
          <Text style={estilos.ajuda}>
            {totalRodadas <= 5
              ? 'sessão rápida — alta intensidade.'
              : totalRodadas >= 15
              ? 'sessão longa — mais revelações.'
              : 'ritmo ideal para a maioria dos grupos.'}
          </Text>
        </View>

        {/* Modo — dois segmentos */}
        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>modo</Text>
          <View style={estilos.segmentos}>
            {MODOS.map((m) => {
              const ativo = m.id === modo;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setModo(m.id)}
                  style={[estilos.segmento, ativo && estilos.segmentoAtivo]}
                >
                  <Text
                    style={[
                      estilos.segmentoTexto,
                      ativo && estilos.segmentoTextoAtivo,
                    ]}
                  >
                    {m.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* Descrição do modo selecionado — editorial, não técnica */}
          <Text style={estilos.modoDescricao}>{modoSelecionado.descricao}</Text>
        </View>
      </ScrollView>

      <View style={estilos.rodape}>
        <BotaoPrimario
          titulo="é hora de jogar"
          carregando={iniciando}
          disabled={iniciando}
          onPress={aoIniciar}
        />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  conteudo: {
    padding: espacamento.lg,
  },

  // Título — mesmo padrão da TelaConfiguracaoJogo
  tituloPagina: {
    color: cores.texto,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTitulo,
    letterSpacing: 0,
    lineHeight: 36,
    marginBottom: espacamento.xl,
  },

  // Seção
  secao: {
    marginBottom: espacamento.xl,
  },
  secaoTitulo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: tipografia.spacingLegenda,
    marginBottom: espacamento.md,
    textTransform: 'uppercase',
  },

  // Stepper de rodadas — idêntico ao Mr White mas mais espaçoso
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.lg,
    justifyContent: 'center',
  },
  stepperBotao: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 60,
  },
  stepperBotaoDesabilitado: {
    opacity: 0.35,
  },
  stepperBotaoTexto: {
    color: cores.texto,
    fontSize: 26,
    fontWeight: tipografia.pesoRegular,
    lineHeight: 30,
  },
  stepperValor: {
    color: cores.acento,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: 48,
    lineHeight: 56,
    minWidth: 64,
    textAlign: 'center',
  },

  // Texto auxiliar
  ajuda: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.md,
    textAlign: 'center',
  },

  // Segmentos de modo
  segmentos: {
    flexDirection: 'row',
    gap: espacamento.sm,
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
    backgroundColor: cores.acentoEscuro,
    borderColor: cores.acento,
    borderWidth: 1.5,
  },
  segmentoTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoSemibold,
  },
  segmentoTextoAtivo: {
    color: cores.acento,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: tipografia.tamanhoCorpoMenor,
  },
  // Descrição do modo — aparece abaixo, muda com a seleção
  modoDescricao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.md,
    textAlign: 'center',
  },

  rodape: {
    padding: espacamento.lg,
  },
});
