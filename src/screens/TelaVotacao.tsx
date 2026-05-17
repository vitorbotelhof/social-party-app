import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarraAcoesJogo, IndicadorConexao } from '@/components';
import { tocar } from '@/services/audio';

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
  PistaDada,
} from '@/games/mr-white/types';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import { observarJogadores } from '@/services/roomService';
import {
  PALETA_AVATARES,
  cores,
  espacamento,
  raio,
  tipografia,
} from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
}

export function TelaVotacao({ estado, roomCode, jogoId, jogadorId }: Props) {
  const [jogadores, setJogadores] = useState<Player[]>([]);
  const [selecionado, setSelecionado] = useState<PlayerId | null>(null);
  const [enviando, setEnviando] = useState(false);
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const ultimoCliqueRef = useRef(0);

  useEffect(() => observarJogadores(roomCode, setJogadores), [roomCode]);

  const meuVoto = estado.estadoPublico.votos[jogadorId] ?? null;
  const votos = estado.estadoPublico.votos;
  const totalVotos = Object.keys(votos).length;
  const total = estado.estadoPublico.ordemJogadores.length;
  const todosVotaram = totalVotos >= total;

  // Defensive: se todos votaram mas a fase não avançou (race do RTDB),
  // o primeiro cliente a detectar força a resolução depois de ~10s.
  useEffect(() => {
    if (!meuVoto) return;
    const stuckSinceRef = { atual: null as number | null };
    const id = setInterval(() => {
      const e = estadoRef.current;
      const t = e.estadoPublico.ordemJogadores.length;
      const a = Object.keys(e.estadoPublico.votos).length;
      const travado = a >= t && e.estadoPublico.subFase === 'votando';
      if (!travado) {
        stuckSinceRef.atual = null;
        return;
      }
      if (stuckSinceRef.atual === null) {
        stuckSinceRef.atual = Date.now();
        return;
      }
      if (Date.now() - stuckSinceRef.atual > 10000) {
        stuckSinceRef.atual = null;
        void despacharAcao(
          roomCode,
          jogoId,
          criarAcao('forcar_resolucao_votacao', jogadorId, {}),
        ).catch(() => {});
      }
    }, 3000);
    return () => clearInterval(id);
  }, [meuVoto, roomCode, jogoId, jogadorId]);

  const pistasDaRodada = useMemo(
    () =>
      estado.estadoPublico.pistas.filter((p) => p.rodada === estado.rodada),
    [estado.estadoPublico.pistas, estado.rodada],
  );

  const dicaPorJogador = useMemo(() => {
    const m = new Map<PlayerId, string>();
    for (const p of pistasDaRodada) m.set(p.jogadorId, p.texto);
    return m;
  }, [pistasDaRodada]);

  const votosPorAlvo = useMemo(() => {
    const m = new Map<PlayerId, number>();
    for (const alvo of Object.values(votos)) {
      m.set(alvo, (m.get(alvo) ?? 0) + 1);
    }
    return m;
  }, [votos]);

  const nomeDe = (id: PlayerId) => jogadores.find((j) => j.id === id)?.nome ?? '...';

  async function aoSelecionar(id: PlayerId) {
    if (meuVoto || enviando) return;
    if (id === jogadorId) return;
    setSelecionado(id);
    void tocar('click');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function aoConfirmar() {
    if (!selecionado || meuVoto || enviando) return;
    const agora = Date.now();
    if (agora - ultimoCliqueRef.current < 1000) return;
    ultimoCliqueRef.current = agora;
    setEnviando(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await despacharAcao(
        roomCode,
        jogoId,
        criarAcao('votar', jogadorId, { alvoId: selecionado }),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <View style={estilos.cabecalho}>
        <View style={estilos.cabecalhoLinha}>
          <Text style={estilos.legenda}>VOTAÇÃO</Text>
          <Text style={estilos.contador}>
            {totalVotos} de {total} votaram
          </Text>
        </View>
        <Text style={estilos.titulo}>quem é o mr white?</Text>
        <Text style={estilos.subtitulo}>vota em quem tá suspeito</Text>
      </View>

      <ScrollView
        style={estilos.scroll}
        contentContainerStyle={estilos.scrollConteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.rotuloSecao}>DICAS DA RODADA</Text>
        <View style={estilos.blocoDicas}>
          {pistasDaRodada.length === 0 ? (
            <Text style={estilos.dicasVazio}>nenhuma dica registrada.</Text>
          ) : (
            pistasDaRodada.map((p, i) => (
              <DicaCompacta
                key={`${p.jogadorId}-${i}`}
                pista={p}
                nome={nomeDe(p.jogadorId)}
              />
            ))
          )}
        </View>

        <Text style={[estilos.rotuloSecao, estilos.rotuloSecaoEspaco]}>
          ESCOLHA UM SUSPEITO
        </Text>
        <View style={estilos.cards}>
          {jogadores.map((j) => {
            const ehVoce = j.id === jogadorId;
            const ehSelecionado = selecionado === j.id;
            const ehMeuVoto = meuVoto === j.id;
            const destacado = ehMeuVoto || (ehSelecionado && !meuVoto);
            const opaco = !!meuVoto && !ehMeuVoto;
            return (
              <CardVoto
                key={j.id}
                jogador={j}
                ehVoce={ehVoce}
                destacado={destacado}
                opaco={opaco}
                desabilitado={ehVoce || !!meuVoto || enviando}
                dica={dicaPorJogador.get(j.id) ?? null}
                votos={meuVoto ? (votosPorAlvo.get(j.id) ?? 0) : null}
                onPress={() => aoSelecionar(j.id)}
              />
            );
          })}
        </View>
      </ScrollView>

      <RodapeAcao
        meuVoto={meuVoto}
        selecionado={selecionado}
        nomeSelecionado={selecionado ? nomeDe(selecionado) : null}
        totalVotos={totalVotos}
        total={total}
        todosVotaram={todosVotaram}
        enviando={enviando}
        onConfirmar={aoConfirmar}
      />
    </SafeAreaView>
  );
}

function DicaCompacta({ pista, nome }: { pista: PistaDada; nome: string }) {
  const [corA, corB] = gradienteAvatarDe(pista.jogadorId);
  const inicial = (nome.trim().charAt(0) || '?').toUpperCase();
  return (
    <View style={estilos.dicaItem}>
      <LinearGradient
        colors={[corA, corB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.dicaAvatar}
      >
        <Text style={estilos.dicaAvatarTexto}>{inicial}</Text>
      </LinearGradient>
      <Text style={estilos.dicaNome}>{nome}:</Text>
      <Text style={estilos.dicaTexto} numberOfLines={1}>
        “{pista.texto}”
      </Text>
    </View>
  );
}

interface CardVotoProps {
  jogador: Player;
  ehVoce: boolean;
  destacado: boolean;
  opaco: boolean;
  desabilitado: boolean;
  dica: string | null;
  votos: number | null;
  onPress: () => void;
}

function CardVoto({
  jogador,
  ehVoce,
  destacado,
  opaco,
  desabilitado,
  dica,
  votos,
  onPress,
}: CardVotoProps) {
  const escala = useRef(new Animated.Value(1)).current;
  const [corA, corB] = gradienteAvatarDe(jogador.id);
  const inicial = (jogador.nome.trim().charAt(0) || '?').toUpperCase();

  function aoPressIn() {
    if (desabilitado) return;
    Animated.spring(escala, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  }

  function aoPressOut() {
    Animated.spring(escala, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={aoPressIn}
        onPressOut={aoPressOut}
        disabled={desabilitado}
      >
        <View
          style={[
            estilos.card,
            destacado && estilos.cardDestacado,
            opaco && estilos.cardOpaco,
            ehVoce && estilos.cardEhVoce,
          ]}
        >
          <LinearGradient
            colors={[corA, corB]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={estilos.avatar}
          >
            <Text style={estilos.avatarTexto}>{inicial}</Text>
          </LinearGradient>

          <View style={estilos.cardCorpo}>
            <View style={estilos.cardCabecalho}>
              <Text style={estilos.cardNome} numberOfLines={1}>
                {jogador.nome}
                {ehVoce ? ' (você)' : ''}
              </Text>
              {votos !== null && (
                <View
                  style={[
                    estilos.badgeVotos,
                    votos > 0 && estilos.badgeVotosAtivo,
                  ]}
                >
                  <Text style={estilos.badgeVotosTexto}>
                    {votos} {votos === 1 ? 'voto' : 'votos'}
                  </Text>
                </View>
              )}
            </View>
            {dica ? (
              <Text style={estilos.cardDica} numberOfLines={2}>
                “{dica}”
              </Text>
            ) : (
              <Text style={estilos.cardSemDica}>sem dica registrada</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface RodapeAcaoProps {
  meuVoto: PlayerId | null;
  selecionado: PlayerId | null;
  nomeSelecionado: string | null;
  totalVotos: number;
  total: number;
  todosVotaram: boolean;
  enviando: boolean;
  onConfirmar: () => void;
}

function RodapeAcao({
  meuVoto,
  selecionado,
  nomeSelecionado,
  totalVotos,
  total,
  todosVotaram,
  enviando,
  onConfirmar,
}: RodapeAcaoProps) {
  if (meuVoto) {
    return <RodapeEspera totalVotos={totalVotos} total={total} todosVotaram={todosVotaram} />;
  }

  if (!selecionado) {
    return (
      <View style={estilos.rodape}>
        <Text style={estilos.rodapeDica}>
          toca em quem tá suspeito
        </Text>
      </View>
    );
  }

  return (
    <View style={estilos.rodape}>
      <Pressable
        onPress={onConfirmar}
        disabled={enviando}
        style={({ pressed }) => [
          estilos.botaoConfirmar,
          pressed && estilos.botaoConfirmarPressionado,
          enviando && estilos.botaoConfirmarDesabilitado,
        ]}
      >
        <Text style={estilos.botaoConfirmarTexto}>
          {enviando ? 'votando...' : `é ${nomeSelecionado} mesmo!`}
        </Text>
      </Pressable>
    </View>
  );
}

function RodapeEspera({
  totalVotos,
  total,
  todosVotaram,
}: {
  totalVotos: number;
  total: number;
  todosVotaram: boolean;
}) {
  const pulso = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  return (
    <View style={estilos.rodape}>
      <Animated.View
        style={[estilos.esperaBloco, { opacity: pulso }]}
      >
        <Text style={estilos.esperaTitulo}>
          {todosVotaram ? 'calculando...' : 'aguardando os outros'}
        </Text>
      </Animated.View>
      <Text style={estilos.esperaContador}>
        {totalVotos} de {total} votaram
      </Text>
    </View>
  );
}

function gradienteAvatarDe(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % PALETA_AVATARES.length;
  const idx2 =
    (idx + Math.floor(PALETA_AVATARES.length / 2)) % PALETA_AVATARES.length;
  return [PALETA_AVATARES[idx]!, PALETA_AVATARES[idx2]!];
}

const TAMANHO_AVATAR = 56;

const estilos = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: TAMANHO_AVATAR / 2,
    height: TAMANHO_AVATAR,
    justifyContent: 'center',
    width: TAMANHO_AVATAR,
  },
  avatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 22,
    fontWeight: tipografia.pesoExtraBold,
  },
  badgeVotos: {
    backgroundColor: cores.fundo,
    borderRadius: raio.pill,
    paddingHorizontal: espacamento.sm + 2,
    paddingVertical: 3,
  },
  badgeVotosAtivo: {
    backgroundColor: cores.primaria,
  },
  badgeVotosTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.3,
  },
  blocoDicas: {
    backgroundColor: cores.fundoSecundario,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    gap: espacamento.sm,
    marginTop: espacamento.sm,
    padding: espacamento.md,
  },
  botaoConfirmar: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    elevation: 8,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  botaoConfirmarDesabilitado: {
    opacity: 0.6,
  },
  botaoConfirmarPressionado: {
    backgroundColor: cores.primariaPressionada,
    transform: [{ scale: 0.98 }],
  },
  botaoConfirmarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 16,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
  },
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  cabecalhoLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: espacamento.md,
    padding: espacamento.md,
  },
  cardCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
    justifyContent: 'space-between',
  },
  cardCorpo: {
    flex: 1,
    gap: 2,
  },
  cardDestacado: {
    backgroundColor: cores.acentoEscuro,
    borderColor: cores.primaria,
    borderWidth: 2,
  },
  cardDica: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  cardEhVoce: {
    opacity: 0.45,
  },
  cardNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoExtraBold,
  },
  cardOpaco: {
    opacity: 0.5,
  },
  cardSemDica: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
  },
  cards: {
    gap: espacamento.sm,
    marginTop: espacamento.sm,
  },
  contador: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  dicaAvatar: {
    alignItems: 'center',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  dicaAvatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 11,
    fontWeight: tipografia.pesoExtraBold,
  },
  dicaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  dicaNome: {
    color: cores.texto,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  dicaTexto: {
    color: cores.textoSecundario,
    flex: 1,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
  },
  dicasVazio: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  esperaBloco: {
    alignItems: 'center',
  },
  esperaContador: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoSemibold,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  esperaTitulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.spacingTitulo,
  },
  legenda: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  rodape: {
    alignItems: 'stretch',
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  rodapeDica: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  rotuloSecao: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  rotuloSecaoEspaco: {
    marginTop: espacamento.lg,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollConteudo: {
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  titulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.sm,
  },
});
