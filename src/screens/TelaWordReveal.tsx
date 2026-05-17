import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BarraAcoesJogo,
  BotaoPrimario,
  IndicadorConexao,
} from '@/components';
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
import { tocar } from '@/services/audio';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import { cores, espacamento, raio, tipografia } from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  jogadores: Player[];
}

const COR_FUNDO_MRWHITE = '#7F1D1D';
const COR_FUNDO_CIVIL = '#064E3B';
const COR_FUNDO_PREPARANDO = '#0A0A0A';
const COR_PERIGO = '#FCA5A5';
const MS_PREPARO = 1500;

export function TelaWordReveal({
  estado,
  roomCode,
  jogoId,
  jogadorId,
  jogadores,
}: Props) {
  const [segurando, setSegurando] = useState(false);
  const [jaSegurou, setJaSegurou] = useState(false);
  const [estagio, setEstagio] = useState<
    'inicial' | 'preparando' | 'revelado'
  >('inicial');
  const [enviando, setEnviando] = useState(false);

  const pulso = useRef(new Animated.Value(1)).current;
  const escalaPalavra = useRef(new Animated.Value(0.5)).current;
  const fundoAnim = useRef(new Animated.Value(0)).current;
  const opacidadeIntro = useRef(new Animated.Value(0)).current;
  const pulsoOlho = useRef(new Animated.Value(1)).current;
  const ultimoCliqueRef = useRef(0);

  const meuEstado = estado.estadosPrivados[jogadorId];
  const queViram = estado.estadoPublico.jogadoresQueViram;
  const ordem = estado.estadoPublico.ordemJogadores;
  const totalQueViram = queViram.length;
  const total = ordem.length;
  const jaVi = queViram.includes(jogadorId);
  const todosViram = totalQueViram === total;

  const mapaNomes = useMemo(() => {
    const m = new Map<PlayerId, string>();
    for (const j of jogadores) m.set(j.id, j.nome);
    return m;
  }, [jogadores]);

  const meuNome = mapaNomes.get(jogadorId) ?? 'Você';
  const proximoNome = useMemo(() => {
    for (const id of ordem) {
      if (id === jogadorId) continue;
      if (queViram.includes(id)) continue;
      return mapaNomes.get(id) ?? null;
    }
    return null;
  }, [jogadorId, mapaNomes, ordem, queViram]);

  // Pulso suave no ícone enquanto aguarda primeiro toque.
  useEffect(() => {
    if (jaVi || segurando || jaSegurou) {
      pulso.stopAnimation();
      pulso.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [jaSegurou, jaVi, pulso, segurando]);

  // Sequência de estágios enquanto o jogador segura.
  useEffect(() => {
    if (!segurando) {
      setEstagio('inicial');
      return;
    }
    setEstagio('preparando');
    const id = setTimeout(() => {
      setEstagio('revelado');
      void tocar('whoosh');
    }, MS_PREPARO);
    return () => clearTimeout(id);
  }, [segurando]);

  // Pulso do 👁 durante o preparo do Mr White.
  useEffect(() => {
    if (estagio !== 'preparando') {
      pulsoOlho.stopAnimation();
      pulsoOlho.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulsoOlho, {
          toValue: 1.25,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(pulsoOlho, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [estagio, pulsoOlho]);

  // Fade-in do texto introdutório ("só você pode ver isso...").
  useEffect(() => {
    Animated.timing(opacidadeIntro, {
      toValue: estagio === 'preparando' ? 1 : 0,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [estagio, opacidadeIntro]);

  // Cor de fundo do cartão + escala da palavra conforme o estágio.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fundoAnim, {
        toValue: estagio === 'inicial' ? 0 : estagio === 'preparando' ? 1 : 2,
        duration: 280,
        useNativeDriver: false,
      }),
      estagio === 'revelado'
        ? Animated.spring(escalaPalavra, {
            toValue: 1,
            useNativeDriver: true,
            tension: 60,
            friction: 7,
          })
        : Animated.timing(escalaPalavra, {
            toValue: 0.5,
            duration: 120,
            useNativeDriver: true,
          }),
    ]).start();
  }, [escalaPalavra, estagio, fundoAnim]);

  function aoPressionar() {
    if (jaVi || enviando) return;
    setSegurando(true);
    setJaSegurou(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  function aoSoltar() {
    if (jaVi) return;
    setSegurando(false);
  }

  async function aoConfirmar() {
    if (enviando) return;
    const agora = Date.now();
    if (agora - ultimoCliqueRef.current < 1000) return;
    ultimoCliqueRef.current = agora;
    setEnviando(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await despacharAcao(
        roomCode,
        jogoId,
        criarAcao('jogador_viu_palavra', jogadorId, {}),
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!meuEstado) {
    return (
      <SafeAreaView style={[estilos.tela, estilos.centralizada]}>
        <Text style={estilos.aguardando}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  const ehMrWhite = meuEstado.ehMrWhite;
  const corRevelacao = ehMrWhite ? COR_FUNDO_MRWHITE : COR_FUNDO_CIVIL;
  const corFundo = fundoAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [cores.superficie, COR_FUNDO_PREPARANDO, corRevelacao],
  });

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <View style={estilos.conteudo}>
        <BarraProgresso atual={totalQueViram} total={total} />

        {jaVi ? (
          <View style={estilos.blocoCentralAguardando}>
            <Text style={estilos.aguardandoTitulo}>você já viu ✓</Text>
            <Text style={estilos.aguardando}>
              {todosViram
                ? 'todo mundo pronto!'
                : `${totalQueViram} de ${total} já viram a palavra`}
            </Text>
            {!todosViram && (
              <Text style={estilos.aguardandoNomes}>
                falta {ordem
                  .filter((id) => !queViram.includes(id))
                  .map((id) => mapaNomes.get(id) ?? '...')
                  .join(', ')}
              </Text>
            )}
          </View>
        ) : (
          <>
            <Text style={estilos.legendaVez}>VEZ DE</Text>
            <Text style={estilos.nomeVez}>{meuNome}</Text>

            <Animated.View
              style={[estilos.cartao, { backgroundColor: corFundo }]}
            >
              <Pressable
                onPressIn={aoPressionar}
                onPressOut={aoSoltar}
                style={estilos.areaToque}
              >
                {estagio === 'inicial' && (
                  <View style={estilos.escondidoBloco}>
                    <Animated.Text
                      style={[
                        estilos.iconeDedo,
                        { transform: [{ scale: pulso }] },
                      ]}
                    >
                      👆
                    </Animated.Text>
                    <Text style={estilos.instrucaoEsconder}>
                      segure a tela para revelar
                    </Text>
                  </View>
                )}
                {estagio === 'preparando' && (
                  <Animated.View
                    style={[
                      estilos.preparandoBloco,
                      { opacity: opacidadeIntro },
                    ]}
                  >
                    {ehMrWhite && (
                      <Animated.Text
                        style={[
                          estilos.olhoMrWhite,
                          { transform: [{ scale: pulsoOlho }] },
                        ]}
                      >
                        👁
                      </Animated.Text>
                    )}
                    <Text style={estilos.textoPreparo}>
                      só você pode ver isso...
                    </Text>
                  </Animated.View>
                )}
                {estagio === 'revelado' && (
                  <View style={estilos.reveladoBloco}>
                    <Animated.View
                      style={{ transform: [{ scale: escalaPalavra }] }}
                    >
                      {ehMrWhite ? (
                        <>
                          <Text style={estilos.tituloMrWhite}>
                            🤫 psiu...{'\n'}você é o MR WHITE
                          </Text>
                          <Text style={estilos.subtextoMrWhite}>
                            descubra a palavra sem ser pego
                          </Text>
                        </>
                      ) : (
                        <Text style={estilos.palavra}>
                          {meuEstado.palavraSecreta}
                        </Text>
                      )}
                    </Animated.View>
                    <Text style={estilos.instrucaoRevelado}>
                      memorize e solte quando terminar
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            <View style={estilos.rodape}>
              {jaSegurou && !segurando && (
                <BotaoPrimario
                  titulo={
                    proximoNome
                      ? `passar para ${proximoNome}`
                      : 'já memorizei'
                  }
                  carregando={enviando}
                  onPress={aoConfirmar}
                />
              )}
            </View>
          </>
        )}

        <ListaJogadores
          ordem={ordem}
          queViram={queViram}
          mapaNomes={mapaNomes}
          jogadorId={jogadorId}
        />
      </View>
    </SafeAreaView>
  );
}

function BarraProgresso({ atual, total }: { atual: number; total: number }) {
  const proporcao = total === 0 ? 0 : atual / total;
  return (
    <View style={estilos.progressoBloco}>
      <View style={estilos.progressoCabecalho}>
        <Text style={estilos.progressoTexto}>jogadores prontos</Text>
        <Text style={estilos.progressoContador}>
          {atual} de {total}
        </Text>
      </View>
      <View style={estilos.progressoTrilho}>
        <View
          style={[
            estilos.progressoPreenchido,
            { width: `${proporcao * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

interface ListaJogadoresProps {
  ordem: PlayerId[];
  queViram: PlayerId[];
  mapaNomes: Map<PlayerId, string>;
  jogadorId: PlayerId;
}

function ListaJogadores({
  ordem,
  queViram,
  mapaNomes,
  jogadorId,
}: ListaJogadoresProps) {
  return (
    <View style={estilos.lista}>
      {ordem.map((id) => {
        const viu = queViram.includes(id);
        const nome = mapaNomes.get(id) ?? '...';
        const sou = id === jogadorId;
        return (
          <View key={id} style={estilos.itemLista}>
            <Text
              style={[
                estilos.itemListaNome,
                viu && estilos.itemListaNomeFeito,
                sou && estilos.itemListaNomeEu,
              ]}
              numberOfLines={1}
            >
              {nome}
              {sou ? ' (você)' : ''}
            </Text>
            {viu ? (
              <Text style={estilos.itemListaCheck}>✓</Text>
            ) : (
              <Text style={estilos.itemListaAguardando}>aguardando</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const ALTURA_CARTAO = 280;

const estilos = StyleSheet.create({
  aguardando: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
  aguardandoTitulo: {
    color: cores.sucesso,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  aguardandoNomes: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    marginTop: espacamento.sm,
    paddingHorizontal: espacamento.lg,
    textAlign: 'center',
  },
  areaToque: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: espacamento.lg,
    width: '100%',
  },
  blocoCentralAguardando: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: espacamento.xl,
    paddingVertical: espacamento.xl,
  },
  cartao: {
    alignItems: 'center',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    height: ALTURA_CARTAO,
    justifyContent: 'center',
    marginVertical: espacamento.lg,
    overflow: 'hidden',
  },
  centralizada: {
    alignItems: 'center',
    gap: espacamento.md,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  conteudo: {
    flex: 1,
    padding: espacamento.lg,
  },
  escondidoBloco: {
    alignItems: 'center',
    gap: espacamento.md,
  },
  iconeDedo: {
    fontSize: 64,
  },
  instrucaoEsconder: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
    textAlign: 'center',
  },
  instrucaoRevelado: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.lg,
    textAlign: 'center',
  },
  itemLista: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: espacamento.sm,
  },
  itemListaAguardando: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
  },
  itemListaCheck: {
    color: cores.sucesso,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  itemListaNome: {
    color: cores.textoSecundario,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontWeight: tipografia.pesoMedio,
  },
  itemListaNomeEu: {
    color: cores.texto,
  },
  itemListaNomeFeito: {
    color: cores.texto,
    fontWeight: tipografia.pesoSemibold,
  },
  legendaVez: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginTop: espacamento.lg,
    textAlign: 'center',
  },
  lista: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    marginTop: 'auto',
    paddingTop: espacamento.md,
  },
  nomeVez: {
    color: cores.texto,
    fontSize: 32,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  palavra: {
    color: cores.textoSobrePrimaria,
    fontSize: 48,
    fontWeight: tipografia.pesoExtraBold,
    textAlign: 'center',
  },
  progressoBloco: {
    gap: espacamento.sm,
  },
  progressoCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressoContador: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  progressoPreenchido: {
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    height: '100%',
  },
  progressoTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  progressoTrilho: {
    backgroundColor: cores.superficie,
    borderRadius: raio.pill,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  reveladoBloco: {
    alignItems: 'center',
    gap: espacamento.sm,
  },
  preparandoBloco: {
    alignItems: 'center',
    gap: espacamento.md,
  },
  textoPreparo: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: tipografia.tamanhoSubtitulo,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  olhoMrWhite: {
    fontSize: 72,
    marginBottom: espacamento.sm,
  },
  subtextoMrWhite: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  rodape: {
    minHeight: 60,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloMrWhite: {
    color: COR_PERIGO,
    fontSize: 36,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 42,
    textAlign: 'center',
  },
});
