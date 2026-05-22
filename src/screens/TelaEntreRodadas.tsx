import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraAcoesJogo, IndicadorConexao } from '@/components';
import type {
  GameId,
  GameState,
  Player,
  PlayerId,
  RoomCode,
} from '@/engine/types';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
} from '@/games/mr-white/types';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  jogadores: Player[];
}

function temEmpate(votos: Record<PlayerId, PlayerId>): boolean {
  const contagem = new Map<PlayerId, number>();
  for (const alvo of Object.values(votos)) {
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
  }
  const max = Math.max(...contagem.values(), 0);
  if (max <= 0) return false;
  return [...contagem.values()].filter((total) => total === max).length > 1;
}

// Staged reveal timing (ms) — social momentum:
// Beat 1 (header):   0   → 220
// Beat 2 (name):     400 → 660
// Beat 3 (role):     840 → 1100
// Beat 4 (counts):   1280 → 1500
// Beat 5 (button):   1680 → 1900

export function TelaEntreRodadas({
  estado,
  roomCode,
  jogoId,
  jogadorId,
  jogadores,
}: Props) {
  const pub = estado.estadoPublico;
  const avancouRef = useRef(false);
  const houveEmpate = temEmpate(pub.votos) && !pub.ultimoEliminadoId;

  const nomeEliminado = pub.ultimoEliminadoId
    ? (jogadores.find((j) => j.id === pub.ultimoEliminadoId)?.nome ?? '?')
    : null;
  const eraMrWhite = pub.ultimoEliminadoEraMrWhite;

  const mrWhitesVivos = pub.numeroMrWhites - pub.mrWhitesEliminados;
  const civilsVivos =
    pub.ordemJogadores.length - pub.numeroMrWhites - pub.civilsEliminados;

  // Animation values — each beat controls one semantic layer
  const op1 = useRef(new Animated.Value(0)).current; // header
  const op2 = useRef(new Animated.Value(0)).current; // name
  const ty2 = useRef(new Animated.Value(28)).current; // name rise
  const op3 = useRef(new Animated.Value(0)).current; // role
  const opHair = useRef(new Animated.Value(0)).current; // counts hairline
  const op4 = useRef(new Animated.Value(0)).current; // counts
  const op5 = useRef(new Animated.Value(0)).current; // button

  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    op1.setValue(0);
    op2.setValue(0);
    ty2.setValue(28);
    op3.setValue(0);
    opHair.setValue(0);
    op4.setValue(0);
    op5.setValue(0);

    const dur = (ms: number) => ({ duration: ms, useNativeDriver: true });

    // Botão disponível imediatamente — não espera a sequência de conteúdo.
    Animated.timing(op5, { toValue: 1, ...dur(180) }).start();

    // Sequência de conteúdo roda em paralelo, apenas visual.
    animRef.current = Animated.sequence([
      // Beat 1: contexto da rodada
      Animated.timing(op1, { toValue: 1, ...dur(220) }),
      Animated.delay(120),
      // Beat 2: nome sobe
      Animated.parallel([
        Animated.timing(op2, { toValue: 1, ...dur(220) }),
        Animated.timing(ty2, { toValue: 0, ...dur(220) }),
      ]),
      Animated.delay(100),
      // Beat 3: veredicto
      Animated.timing(op3, { toValue: 1, ...dur(200) }),
      Animated.delay(100),
      // Beat 4: placar
      Animated.parallel([
        Animated.timing(opHair, { toValue: 1, ...dur(180) }),
        Animated.sequence([
          Animated.delay(60),
          Animated.timing(op4, { toValue: 1, ...dur(180) }),
        ]),
      ]),
    ]);

    animRef.current.start();
    return () => {
      animRef.current?.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function avancar() {
    if (avancouRef.current) return;
    avancouRef.current = true;
    await despacharAcao(
      roomCode,
      jogoId,
      criarAcao('avancar_proxima_rodada', jogadorId, {}),
    );
  }

  useEffect(() => {
    const prazo = pub.prazoProximaRodadaEm;
    if (!prazo) return;
    const delay = prazo - Date.now();
    if (delay <= 0) {
      void avancar();
      return;
    }
    const id = setTimeout(() => void avancar(), delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pub.prazoProximaRodadaEm]);

  const papelTexto = houveEmpate
    ? 'ninguém saiu.'
    : eraMrWhite === true
      ? 'era o mr white.'
      : eraMrWhite === false
        ? 'era inocente.'
        : null;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />

      <View style={estilos.corpo}>
        {/* Beat 1 — Round context */}
        <Animated.View style={[estilos.cabecalho, { opacity: op1 }]}>
          <Text style={estilos.rodadaTexto}>rodada {pub.rodadaVotacao}</Text>
          <View style={estilos.hairlineCurta} />
          <Text style={estilos.eliminadoLabel}>
            {houveEmpate ? 'empate' : 'eliminado'}
          </Text>
        </Animated.View>

        {/* Beat 2 — Name: the person who carried this weight */}
        <Animated.View
          style={[
            estilos.nomeWrap,
            { opacity: op2, transform: [{ translateY: ty2 }] },
          ]}
        >
          <Text
            style={estilos.nomeTexto}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {houveEmpate ? 'votos divididos' : (nomeEliminado ?? '—')}
          </Text>
        </Animated.View>

        {/* Beat 3 — Verdict */}
        {papelTexto !== null && (
          <Animated.Text
            style={[
              estilos.papelBase,
              eraMrWhite ? estilos.papelMrWhite : estilos.papelCivil,
              { opacity: op3 },
            ]}
          >
            {papelTexto}
          </Animated.Text>
        )}

        {/* Beat 4 — Stakes: who still breathes */}
        <Animated.View style={[estilos.contagemWrap, { opacity: op4 }]}>
          <Animated.View style={[estilos.hairlineLarga, { opacity: opHair }]} />
          <View style={estilos.contagem}>
            <View style={estilos.contagemItem}>
              <Text style={estilos.contagemValor}>{civilsVivos}</Text>
              <Text style={estilos.contagemRotulo}>
                {civilsVivos === 1 ? 'inocente' : 'inocentes'}
              </Text>
            </View>
            <View style={estilos.contagemDiv} />
            <View style={estilos.contagemItem}>
              <Text
                style={[
                  estilos.contagemValor,
                  mrWhitesVivos > 0 && estilos.contagemMrWhite,
                ]}
              >
                {mrWhitesVivos}
              </Text>
              <Text style={estilos.contagemRotulo}>
                {mrWhitesVivos === 1 ? 'impostor' : 'impostores'}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Beat 5 — Continuation */}
      <Animated.View style={[estilos.rodape, { opacity: op5 }]}>
        <Pressable
          onPress={() => void avancar()}
          style={({ pressed }) => [
            estilos.botao,
            pressed && estilos.botaoPressionado,
          ]}
          accessibilityLabel="Continuar para a próxima rodada"
          accessibilityRole="button"
        >
          <Text style={estilos.botaoTexto}>continuar</Text>
        </Pressable>
        <Text style={estilos.rodapeDica}>todos podem avançar</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },

  corpo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
    gap: 0,
  },

  // Beat 1 ────────────────────────────────────────────────────────────────────
  cabecalho: {
    alignItems: 'center',
    gap: espacamento.sm,
    marginBottom: espacamento.xl,
  },
  rodadaTexto: {
    fontSize: tipografia.tamanhoMicro,
    color: cores.textoMudo,
    letterSpacing: tipografia.spacingLabel,
    textTransform: 'uppercase',
  },
  hairlineCurta: {
    width: 32,
    height: 1,
    backgroundColor: cores.borda,
  },
  eliminadoLabel: {
    fontSize: tipografia.tamanhoMicro,
    color: cores.textoSecundario,
    letterSpacing: tipografia.spacingLegenda,
    textTransform: 'uppercase',
  },

  // Beat 2 ────────────────────────────────────────────────────────────────────
  nomeWrap: {
    alignItems: 'center',
    marginBottom: espacamento.md,
  },
  nomeTexto: {
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoTituloGrande,
    color: cores.texto,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: tipografia.spacingTitulo,
  },

  // Beat 3 ────────────────────────────────────────────────────────────────────
  papelBase: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    textAlign: 'center',
    marginBottom: espacamento.xl,
  },
  papelMrWhite: {
    color: cores.erro,
  },
  papelCivil: {
    color: cores.textoSecundario,
  },

  // Beat 4 ────────────────────────────────────────────────────────────────────
  contagemWrap: {
    alignItems: 'center',
    gap: espacamento.lg,
  },
  hairlineLarga: {
    width: '60%',
    height: 1,
    backgroundColor: cores.borda,
  },
  contagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.xl,
  },
  contagemItem: {
    alignItems: 'center',
    gap: espacamento.xs,
  },
  contagemValor: {
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: tipografia.tamanhoSubtituloGrande,
    color: cores.texto,
  },
  contagemMrWhite: {
    color: cores.erro,
  },
  contagemRotulo: {
    fontSize: tipografia.tamanhoMicro,
    color: cores.textoMudo,
    letterSpacing: tipografia.spacingLegenda,
    textTransform: 'uppercase',
  },
  contagemDiv: {
    width: 1,
    height: 36,
    backgroundColor: cores.borda,
  },

  // Beat 5 ────────────────────────────────────────────────────────────────────
  rodape: {
    paddingHorizontal: espacamento.xl,
    paddingBottom: espacamento.lg,
    gap: espacamento.sm,
    alignItems: 'stretch',
  },
  botao: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: raio.pill,
    backgroundColor: cores.primaria,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  botaoPressionado: {
    backgroundColor: cores.primariaPressionada,
    transform: [{ scale: 0.98 }],
  },
  botaoTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.spacingLeve,
  },
  rodapeDica: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
