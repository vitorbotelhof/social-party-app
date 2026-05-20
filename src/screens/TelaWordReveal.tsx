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
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  jogadores: Player[];
}

// Nenhuma cor diferenciada por papel — o ambiente visual é idêntico para todos.

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

  const escalaPalavra = useRef(new Animated.Value(0.5)).current;
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

  // Revela imediatamente ao segurar — sem delay artificial.
  useEffect(() => {
    if (!segurando) {
      setEstagio('inicial');
      return;
    }
    setEstagio('revelado');
    void tocar('whoosh');
  }, [segurando]);

  // Escala da palavra — spring ao revelar, reset ao fechar.
  useEffect(() => {
    (estagio === 'revelado'
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
        })
    ).start();
  }, [escalaPalavra, estagio]);

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

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <View style={estilos.conteudo}>
        <BarraProgresso atual={totalQueViram} total={total} />

        {jaVi ? (
          <View style={estilos.blocoCentralAguardando}>
            <Text style={estilos.aguardandoTitulo}>você já viu.</Text>
            <Text style={estilos.aguardando}>
              {todosViram
                ? 'o grupo está pronto.'
                : `${totalQueViram} de ${total} já viram`}
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
            <Text style={estilos.legendaVez}>vez de</Text>
            <Text style={estilos.nomeVez}>{meuNome}</Text>

            {/* Cartão neutro — mesmo fundo para todos os papéis */}
            <View style={estilos.cartao}>
              <Pressable
                onPressIn={aoPressionar}
                onPressOut={aoSoltar}
                style={estilos.areaToque}
              >
                {estagio === 'inicial' && (
                  <View style={estilos.escondidoBloco}>
                    <Text style={estilos.instrucaoEsconder}>
                      segure a tela para revelar
                    </Text>
                  </View>
                )}
                {estagio === 'revelado' && (
                  <View style={estilos.reveladoBloco}>
                    <Animated.View
                      style={[
                        estilos.reveladoConteudo,
                        { transform: [{ scale: escalaPalavra }] },
                      ]}
                    >
                      {/* Mesma estrutura visual para civil e mr white */}
                      <Text style={estilos.labelPalavra}>sua palavra</Text>
                      <Text
                        style={estilos.palavra}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        {ehMrWhite && !meuEstado.palavraSecreta
                          ? 'improvise.'
                          : meuEstado.palavraSecreta ?? ''}
                      </Text>
                    </Animated.View>
                    <Text style={estilos.instrucaoRevelado}>
                      {ehMrWhite && !meuEstado.palavraSecreta
                        ? 'descubra a dos outros.'
                        : ehMrWhite
                          ? 'a palavra dos outros é diferente.'
                          : 'memorize. solte quando terminar.'}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

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
      <View style={estilos.progressoTrilho}>
        <View
          style={[
            estilos.progressoPreenchido,
            { width: `${proporcao * 100}%` },
          ]}
        />
      </View>
      <Text style={estilos.progressoContador}>{atual} de {total}</Text>
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
              <Text style={estilos.itemListaCheck}>·</Text>
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
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  aguardandoTitulo: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoSubtitulo,
    marginBottom: espacamento.xs,
    textAlign: 'center',
  },
  aguardandoNomes: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
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
  instrucaoEsconder: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMaior,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  instrucaoRevelado: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    letterSpacing: 0.2,
    marginTop: espacamento.xl,
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
    color: cores.textoSecundario,
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
  labelPalavra: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.3,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  legendaVez: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
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
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: 32,
    letterSpacing: 0,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  palavra: {
    color: cores.texto,
    fontFamily: familias.sans, fontWeight: '800' as const,
    fontSize: 52,
    letterSpacing: tipografia.spacingApertado,
    textAlign: 'center',
  },
  progressoBloco: {
    alignItems: 'flex-end',
    gap: espacamento.xs,
  },
  progressoContador: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },
  progressoPreenchido: {
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    height: '100%',
  },
  progressoTrilho: {
    backgroundColor: cores.superficie,
    borderRadius: raio.pill,
    height: 3,
    overflow: 'hidden',
    width: '100%',
  },
  reveladoBloco: {
    alignItems: 'center',
    gap: 0,
  },
  reveladoConteudo: {
    alignItems: 'center',
  },
  rodape: {
    minHeight: 60,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
});
