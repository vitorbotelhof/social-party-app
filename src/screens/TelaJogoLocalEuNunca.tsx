import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BotaoEncerrarJogo,
  BotaoPrimario,
  CombinadoDeConforto,
  FeedbackSessao,
} from '@/components';
import {
  calcularFase,
  getCategoria,
  selecionarCartaEuNunca,
  type CartaEuNunca,
  type CategoriaEuNuncaId,
  type IntensidadeEuNunca,
} from '@/games/eu-nunca';
import type { RootStackParamList } from '@/navigation/types';
import { processarResultadoEuNunca } from '@/session/euNuncaLocalAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalEuNunca'>;

// ─── Cor de identidade ────────────────────────────────────────────────────────
const COR_EU_NUNCA = '#E8407A';
const COR_EU_NUNCA_MEDIA = 'rgba(232, 64, 122, 0.18)';
const COR_EU_NUNCA_SUAVE = 'rgba(232, 64, 122, 0.10)';

// ─── Label de intensidade ─────────────────────────────────────────────────────
function labelIntensidade(intensidade: IntensidadeEuNunca): string {
  const labels: Record<IntensidadeEuNunca, string> = {
    leve: 'leve',
    social: 'social',
    pessoal: 'pessoal',
    caotico: 'caótico',
  };
  return labels[intensidade];
}

function corIntensidade(intensidade: IntensidadeEuNunca): string {
  const cores_: Record<IntensidadeEuNunca, string> = {
    leve: '#4D7CFE',
    social: '#22C55E',
    pessoal: COR_EU_NUNCA,
    caotico: '#FF5A5F',
  };
  return cores_[intensidade];
}

const PESO_INTENSIDADE: Record<IntensidadeEuNunca, number> = {
  leve: 1,
  social: 2,
  pessoal: 3,
  caotico: 4,
};

// ─── Componente principal ─────────────────────────────────────────────────────
export function TelaJogoLocalEuNunca({ navigation, route }: Props) {
  const {
    categorias,
    intensidade,
    incluirMais18,
    totalCartas: metaCartas,
  } = route.params;

  const [cartasUsadas, setCartasUsadas] = useState<string[]>([]);
  const [cartaAtual, setCartaAtual] = useState<CartaEuNunca | null>(null);
  const [totalExibidas, setTotalExibidas] = useState(0);
  const [cartasPuladas, setCartasPuladas] = useState(0);
  const [intensidadeMaxima, setIntensidadeMaxima] =
    useState<IntensidadeEuNunca | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [iniciou, setIniciou] = useState(false);
  const resultadoProcessado = useRef(false);
  const iniciouEm = useRef(Date.now());
  const transicaoEmAndamento = useRef(false);

  // Animações da carta
  const opacidadeCarta = useRef(new Animated.Value(0)).current;
  const translateYCarta = useRef(new Animated.Value(24)).current;
  const escalaCarta = useRef(new Animated.Value(0.97)).current;

  const avancar = useCallback(
    (pulou = false) => {
      if (transicaoEmAndamento.current) return;
      transicaoEmAndamento.current = true;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (pulou && cartaAtual) setCartasPuladas((quantidade) => quantidade + 1);

      // Fade out atual
      Animated.parallel([
        Animated.timing(opacidadeCarta, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateYCarta, {
          toValue: -16,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Seleciona próxima carta
        const novasUsadas = cartaAtual
          ? [...cartasUsadas, cartaAtual.id]
          : cartasUsadas;
        const novoTotal = totalExibidas + (cartaAtual ? 1 : 0);

        const proxima = selecionarCartaEuNunca(
          novasUsadas,
          categorias as CategoriaEuNuncaId[] | 'todas',
          intensidade as IntensidadeEuNunca | 'todas',
          incluirMais18,
          novoTotal,
        );

        if (proxima) {
          setCartasUsadas(novasUsadas);
          setTotalExibidas(novoTotal);
          setCartaAtual(proxima);
          setIntensidadeMaxima((atual) =>
            !atual ||
            PESO_INTENSIDADE[proxima.intensidade] > PESO_INTENSIDADE[atual]
              ? proxima.intensidade
              : atual,
          );
        }

        // Reset posição e fade in
        translateYCarta.setValue(24);
        escalaCarta.setValue(0.97);

        Animated.parallel([
          Animated.timing(opacidadeCarta, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.spring(translateYCarta, {
            toValue: 0,
            damping: 22,
            stiffness: 260,
            useNativeDriver: true,
          }),
          Animated.spring(escalaCarta, {
            toValue: 1,
            damping: 22,
            stiffness: 260,
            useNativeDriver: true,
          }),
        ]).start(() => {
          transicaoEmAndamento.current = false;
        });
      });
    },
    [
      cartaAtual,
      cartasUsadas,
      categorias,
      escalaCarta,
      incluirMais18,
      intensidade,
      opacidadeCarta,
      totalExibidas,
      translateYCarta,
    ],
  );

  // Inicializa primeira carta
  useEffect(() => {
    if (iniciou) return;
    setIniciou(true);
    const primeira = selecionarCartaEuNunca(
      [],
      categorias as CategoriaEuNuncaId[] | 'todas',
      intensidade as IntensidadeEuNunca | 'todas',
      incluirMais18,
      0,
    );
    if (primeira) {
      setCartaAtual(primeira);
      setIntensidadeMaxima(primeira.intensidade);
      Animated.parallel([
        Animated.timing(opacidadeCarta, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYCarta, {
          toValue: 0,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.spring(escalaCarta, {
          toValue: 1,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    categorias,
    escalaCarta,
    incluirMais18,
    iniciou,
    intensidade,
    opacidadeCarta,
    translateYCarta,
  ]);

  function finalizarPartida(
    totalPulos = cartasPuladas,
    encerradaVoluntariamente = true,
  ) {
    if (!resultadoProcessado.current) {
      resultadoProcessado.current = true;
      processarResultadoEuNunca({
        totalCartas: totalExibidas + (cartaAtual ? 1 : 0),
        cartasPuladas: totalPulos,
        categorias: categorias === 'todas' ? ['todas'] : categorias,
        intensidadeMaxima,
        encerradaVoluntariamente,
        duracaoMs: Date.now() - iniciouEm.current,
      });
    }
    setFinalizado(true);
  }

  const categoria = cartaAtual ? getCategoria(cartaAtual.categoria) : null;
  const fase = calcularFase(totalExibidas);
  const cartasVistas = totalExibidas + (cartaAtual ? 1 : 0);
  const atingiuMeta = metaCartas !== null && cartasVistas >= metaCartas;

  function avancarOuFinalizar(pulou: boolean) {
    if (atingiuMeta) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (pulou) setCartasPuladas((quantidade) => quantidade + 1);
      finalizarPartida(pulou ? cartasPuladas + 1 : cartasPuladas, false);
      return;
    }
    avancar(pulou);
  }

  if (finalizado) {
    return (
      <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
        <View style={estilos.final}>
          <Text style={estilos.finalLabel}>fim de sessão</Text>
          <Text style={estilos.finalTitulo}>as histórias ficam na roda.</Text>
          <Text style={estilos.finalResumo}>
            {cartasVistas}{' '}
            {cartasVistas === 1 ? 'carta vista' : 'cartas vistas'}
            {cartasPuladas > 0
              ? ` · ${cartasPuladas} passadas sem pressão`
              : ''}
          </Text>
          <FeedbackSessao jogoId="eu-nunca" />
          <BotaoPrimario
            titulo="escolher outro jogo"
            onPress={() => navigation.navigate('Inicio')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <BotaoEncerrarJogo onConfirmar={finalizarPartida} />
      {/* Header */}
      <View style={estilos.header}>
        <View style={estilos.headerEspaco} />
        <View style={estilos.headerCentro}>
          <Text style={estilos.contadorTexto}>
            {totalExibidas > 0
              ? `${totalExibidas} vista${totalExibidas === 1 ? '' : 's'}`
              : 'pronto'}
          </Text>
        </View>
        <View style={estilos.headerEspaco} />
      </View>

      {/* Área central — o palco */}
      <View style={estilos.palco}>
        {/* Rótulo fixo "EU NUNCA" */}
        <View style={estilos.rotuloContainer}>
          <Text style={estilos.rotulo}>EU NUNCA</Text>
          <View style={estilos.rotuloLinha} />
        </View>

        {/* Card animado com o complemento */}
        <Animated.View
          style={[
            estilos.card,
            {
              opacity: opacidadeCarta,
              transform: [
                { translateY: translateYCarta },
                { scale: escalaCarta },
              ],
            },
          ]}
        >
          {cartaAtual ? (
            <>
              <Text
                style={estilos.complemento}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {cartaAtual.complemento}
              </Text>

              {/* Metadados da carta */}
              <View style={estilos.metadados}>
                {categoria && (
                  <View style={estilos.chipCategoria}>
                    <Text style={estilos.chipEmoji}>{categoria.emoji}</Text>
                    <Text style={estilos.chipNome}>{categoria.nome}</Text>
                  </View>
                )}
                {cartaAtual.mais18 && (
                  <View style={estilos.chip18}>
                    <Text style={estilos.chip18Texto}>+18</Text>
                  </View>
                )}
                <View
                  style={[
                    estilos.chipIntensidade,
                    {
                      backgroundColor:
                        corIntensidade(cartaAtual.intensidade) + '18',
                    },
                  ]}
                >
                  <Text
                    style={[
                      estilos.chipIntensidadeTexto,
                      { color: corIntensidade(cartaAtual.intensidade) },
                    ]}
                  >
                    {labelIntensidade(cartaAtual.intensidade)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={estilos.semCartas}>
              nenhuma carta disponível com as configurações atuais.
            </Text>
          )}
        </Animated.View>

        {/* Indicador de fase */}
        <View style={estilos.faseContainer}>
          <View
            style={[
              estilos.faseDot,
              fase === 'aquecimento' && estilos.faseDotAtiva,
            ]}
          />
          <View
            style={[estilos.faseDot, fase === 'subida' && estilos.faseDotAtiva]}
          />
          <View
            style={[estilos.faseDot, fase === 'pico' && estilos.faseDotAtiva]}
          />
          <View
            style={[
              estilos.faseDot,
              fase === 'release' && estilos.faseDotAtiva,
            ]}
          />
        </View>
      </View>

      {/* Rodapé — botão de ação principal */}
      <View style={estilos.rodape}>
        <CombinadoDeConforto compacto texto="vale passar sem explicar." />
        <Text style={estilos.instrucao}>quem já fez levanta a mão</Text>
        <Pressable
          onPress={() => avancarOuFinalizar(false)}
          disabled={!cartaAtual}
          accessibilityRole="button"
          accessibilityLabel="Próxima carta"
          style={({ pressed }) => [
            estilos.botaoProxima,
            !cartaAtual && estilos.botaoProximaDesabilitado,
            pressed && estilos.botaoProximaPressionado,
          ]}
        >
          <Text style={estilos.botaoProximaTexto}>
            {atingiuMeta ? 'encerrar sessão' : 'próxima →'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => avancarOuFinalizar(true)}
          disabled={!cartaAtual}
          accessibilityRole="button"
          accessibilityLabel="Pular carta sem comentar"
          style={({ pressed }) => [
            estilos.botaoPular,
            pressed && estilos.pressionado,
          ]}
        >
          <Text style={estilos.botaoPularTexto}>
            {atingiuMeta ? 'encerrar sem comentar' : 'pular sem falar'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  final: {
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'center',
    padding: espacamento.xl,
  },
  finalLabel: {
    color: COR_EU_NUNCA,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLabelSecao,
    fontWeight: tipografia.pesoExtraBold,
    textTransform: 'uppercase',
  },
  finalResumo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    lineHeight: 24,
  },
  finalTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
  },
  botaoProxima: {
    alignItems: 'center',
    backgroundColor: COR_EU_NUNCA,
    borderRadius: raio.lg,
    height: 56,
    justifyContent: 'center',
    shadowColor: COR_EU_NUNCA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  botaoProximaDesabilitado: {
    backgroundColor: cores.borda,
    shadowOpacity: 0,
    elevation: 0,
  },
  botaoProximaPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  botaoProximaTexto: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.4,
  },
  botaoPular: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },
  botaoPularTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  card: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    gap: espacamento.lg,
    justifyContent: 'space-between',
    marginHorizontal: espacamento.lg,
    padding: espacamento.xl,
    shadowColor: cores.texto,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  chip18: {
    alignItems: 'center',
    backgroundColor: COR_EU_NUNCA_SUAVE,
    borderRadius: raio.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chip18Texto: {
    color: COR_EU_NUNCA,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  chipCategoria: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipIntensidade: {
    alignItems: 'center',
    borderRadius: raio.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipIntensidadeTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  chipNome: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
  },
  complemento: {
    color: cores.texto,
    flex: 1,
    fontFamily: familias.sans,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  contadorTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  faseDot: {
    backgroundColor: cores.borda,
    borderRadius: 4,
    height: 4,
    width: 24,
  },
  faseDotAtiva: {
    backgroundColor: COR_EU_NUNCA,
  },
  faseContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: espacamento.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.md,
  },
  headerCentro: {
    alignItems: 'center',
    flex: 1,
  },
  headerEspaco: {
    height: 36,
    width: 36,
  },
  instrucao: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  metadados: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  palco: {
    flex: 1,
    gap: espacamento.sm,
    paddingVertical: espacamento.md,
  },
  pressionado: {
    opacity: 0.72,
  },
  rodape: {
    gap: espacamento.xs,
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.sm,
  },
  rotulo: {
    color: COR_EU_NUNCA,
    fontFamily: familias.sans,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 3.5,
  },
  rotuloContainer: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: espacamento.lg,
  },
  rotuloLinha: {
    backgroundColor: COR_EU_NUNCA_MEDIA,
    borderRadius: 2,
    height: 2,
    width: '100%',
  },
  semCartas: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpo,
    textAlign: 'center',
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
