import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  GameId,
  GameState,
  Player,
  PlayerId,
  RoomCode,
} from '@/engine/types';
import { BarraAcoesJogo, IndicadorConexao, Temporizador } from '@/components';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
  PistaDada,
} from '@/games/mr-white/types';
import { criarAcao, despacharAcao } from '@/services/gameActions';
import {
  PALETA_AVATARES,
  cores,
  espacamento,
  familias,
  raio,
  tipografia,
} from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;

interface Props {
  estado: EstadoMrWhite;
  roomCode: RoomCode;
  jogoId: GameId;
  jogadorId: PlayerId;
  jogadores: Player[];
}

const MAX_CARACTERES = 50;

interface EstadoTimer {
  segundosRestantes: number;
  percentual: number;
  expirou: boolean;
  semLimite: boolean;
}

function useTimer(
  prazoTurnoEm: number | null,
  totalSegundos: number,
): EstadoTimer {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (prazoTurnoEm === null) return;
    setAgora(Date.now());
    const id = setInterval(() => setAgora(Date.now()), 250);
    return () => clearInterval(id);
  }, [prazoTurnoEm]);

  if (prazoTurnoEm === null) {
    return {
      segundosRestantes: 0,
      percentual: 1,
      expirou: false,
      semLimite: true,
    };
  }

  const restanteMs = Math.max(0, prazoTurnoEm - agora);
  const segundosRestantes = restanteMs / 1000;
  const total = Math.max(1, totalSegundos);
  const percentual = Math.max(0, Math.min(1, segundosRestantes / total));
  return {
    segundosRestantes,
    percentual,
    expirou: restanteMs === 0,
    semLimite: false,
  };
}

export function TelaRodada({ estado, roomCode, jogoId, jogadorId, jogadores: listaJogadores }: Props) {
  const [dica, setDica] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [tempoEsgotadoVisivel, setTempoEsgotadoVisivel] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const turnoAutoEnviadoRef = useRef<number | null>(null);
  const ultimoCliqueRef = useRef(0);

  const jogadores = useMemo(
    () => Object.fromEntries(listaJogadores.map((j) => [j.id, j])),
    [listaJogadores],
  );

  const ordem = estado.estadoPublico.ordemJogadores;
  const indiceTurno = estado.estadoPublico.indiceTurno;
  const pistas = estado.estadoPublico.pistas;
  const jogadorDaVezId = ordem[indiceTurno] ?? null;
  const eMinhaVez = jogadorDaVezId === jogadorId;
  const nomeDaVez = jogadorDaVezId ? jogadores[jogadorDaVezId]?.nome : null;
  const prazoTurnoEm = estado.estadoPublico.prazoTurnoEm;
  const duracaoTurnoSegundos = estado.estadoPublico.duracaoTurnoSegundos;

  const timer = useTimer(prazoTurnoEm, duracaoTurnoSegundos);

  const dicasDaRodadaAtual = useMemo(
    () => pistas.filter((p) => p.rodada === estado.rodada),
    [pistas, estado.rodada],
  );

  function nomeDe(id: PlayerId): string {
    return jogadores[id]?.nome ?? '...';
  }

  const aoEnviar = useCallback(
    async (textoArg?: string) => {
      const texto = (textoArg ?? dica).trim();
      if (texto.length === 0 && textoArg === undefined) return;
      if (enviando) return;
      // Debounce: ignora cliques duplos dentro de 1s.
      const agora = Date.now();
      if (agora - ultimoCliqueRef.current < 1000) return;
      ultimoCliqueRef.current = agora;
      setEnviando(true);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await despacharAcao(
          roomCode,
          jogoId,
          criarAcao('enviar_pista', jogadorId, { texto }),
        );
        setDica('');
      } finally {
        setEnviando(false);
      }
    },
    [dica, enviando, jogadorId, jogoId, roomCode],
  );

  // Auto-skip quando o timer expira e ainda é minha vez.
  useEffect(() => {
    if (!timer.expirou) return;
    if (!eMinhaVez) return;
    if (turnoAutoEnviadoRef.current === indiceTurno) return;
    turnoAutoEnviadoRef.current = indiceTurno;

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTempoEsgotadoVisivel(true);
    const timeoutId = setTimeout(() => setTempoEsgotadoVisivel(false), 1800);
    void aoEnviar('');

    return () => clearTimeout(timeoutId);
  }, [aoEnviar, eMinhaVez, indiceTurno, timer.expirou]);

  const restante = MAX_CARACTERES - dica.length;
  const podeEnviar = dica.trim().length > 0 && !enviando;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <IndicadorConexao />
      <BarraAcoesJogo />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <Cabecalho
          eMinhaVez={eMinhaVez}
          nomeDaVez={nomeDaVez}
          rodada={estado.rodada}
          timer={timer}
          duracaoTurnoSegundos={duracaoTurnoSegundos}
          tempoEsgotadoVisivel={tempoEsgotadoVisivel}
        />

        <IndicadorTurno
          ordem={ordem}
          indiceTurno={indiceTurno}
          jogadores={jogadores}
        />

        <ScrollView
          ref={scrollRef}
          style={estilos.historico}
          contentContainerStyle={estilos.historicoConteudo}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          <Text style={estilos.legendaHistorico}>
            dicas ({dicasDaRodadaAtual.length}/{ordem.length})
          </Text>

          {dicasDaRodadaAtual.length === 0 ? (
            <Text style={estilos.vazio}>
              ainda não chegou nenhuma dica nesta rodada.
            </Text>
          ) : (
            dicasDaRodadaAtual.map((p, i) => (
              <ItemDica
                key={`${p.jogadorId}-${p.rodada}-${i}`}
                pista={p}
                nome={nomeDe(p.jogadorId)}
                ehVoce={p.jogadorId === jogadorId}
              />
            ))
          )}
        </ScrollView>

        {eMinhaVez && (
          <View style={estilos.blocoInput}>
            <View style={estilos.inputCabecalho}>
              <Text style={estilos.inputLabel}>sua dica</Text>
              <Text
                style={[
                  estilos.contador,
                  restante <= 10 && estilos.contadorAlerta,
                ]}
              >
                {restante}
              </Text>
            </View>
            <TextInput
              value={dica}
              onChangeText={(t) => setDica(t.slice(0, MAX_CARACTERES))}
              placeholder="sua dica..."
              placeholderTextColor={cores.textoMudo}
              maxLength={MAX_CARACTERES}
              returnKeyType="send"
              onSubmitEditing={() => aoEnviar()}
              style={estilos.input}
              autoFocus
            />
            <Pressable
              onPress={() => aoEnviar()}
              disabled={!podeEnviar}
              style={({ pressed }) => [
                estilos.botaoEnviar,
                !podeEnviar && estilos.botaoEnviarDesabilitado,
                pressed && podeEnviar && estilos.botaoEnviarPressionado,
              ]}
            >
              <Text style={estilos.botaoEnviarTexto}>
                {enviando ? 'mandando...' : 'mandar dica'}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Cabecalho({
  eMinhaVez,
  nomeDaVez,
  rodada,
  timer,
  duracaoTurnoSegundos,
  tempoEsgotadoVisivel,
}: {
  eMinhaVez: boolean;
  nomeDaVez: string | null;
  rodada: number;
  timer: EstadoTimer;
  duracaoTurnoSegundos: number;
  tempoEsgotadoVisivel: boolean;
}) {
  return (
    <View
      style={[estilos.cabecalho, eMinhaVez && estilos.cabecalhoMinhaVez]}
    >
      <Text style={estilos.legendaRodada}>rodada {rodada}</Text>
      {eMinhaVez ? (
        <>
          <Text style={estilos.tituloMinhaVez}>sua vez</Text>
          <Text style={estilos.subtituloMinhaVez}>
            solta uma dica sobre a palavra
          </Text>
          {tempoEsgotadoVisivel ? (
            <Text style={estilos.tempoEsgotado}>⏱ tempo esgotado!</Text>
          ) : timer.semLimite ? null : (
            <View style={estilos.temporizadorWrapper}>
              <Temporizador
                segundosTotais={duracaoTurnoSegundos}
                segundosRestantes={timer.segundosRestantes}
                tamanho={88}
              />
            </View>
          )}
        </>
      ) : (
        <>
          <Text style={estilos.legendaVez}>vez de</Text>
          <Text style={estilos.nomeDaVez}>{nomeDaVez ?? '...'}</Text>
          <Text style={estilos.subtitulo}>preste atenção na dica dele...</Text>
          {!timer.semLimite && (
            <View style={estilos.barraProgresso}>
              <View
                style={[
                  estilos.barraProgressoPreenchida,
                  { width: `${Math.round(timer.percentual * 100)}%` },
                ]}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

function IndicadorTurno({
  ordem,
  indiceTurno,
  jogadores,
}: {
  ordem: PlayerId[];
  indiceTurno: number;
  jogadores: Record<PlayerId, Player>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.indicador}
      contentContainerStyle={estilos.indicadorConteudo}
    >
      {ordem.map((id, indice) => {
        const jogador = jogadores[id];
        const ehAtual = indice === indiceTurno;
        const jaFalou = indice < indiceTurno;
        return (
          <Avatar
            key={id}
            id={id}
            nome={jogador?.nome ?? '...'}
            estado={ehAtual ? 'atual' : jaFalou ? 'falou' : 'pendente'}
          />
        );
      })}
    </ScrollView>
  );
}

interface AvatarProps {
  id: PlayerId;
  nome: string;
  estado: 'atual' | 'falou' | 'pendente';
  tamanho?: number;
}

function Avatar({ id, nome, estado, tamanho = 40 }: AvatarProps) {
  const [corA, corB] = gradienteAvatarDe(id);
  const inicial = (nome.trim().charAt(0) || '?').toUpperCase();
  const tamanhoFinal = estado === 'atual' ? tamanho + 12 : tamanho;

  return (
    <View style={estilos.avatarWrapper}>
      <View
        style={[
          estilos.avatarBorda,
          {
            width: tamanhoFinal + 6,
            height: tamanhoFinal + 6,
            borderRadius: (tamanhoFinal + 6) / 2,
          },
          estado === 'atual' && estilos.avatarBordaAtual,
          estado === 'falou' && estilos.avatarBordaFalou,
        ]}
      >
        <LinearGradient
          colors={[corA, corB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            alignItems: 'center',
            borderRadius: tamanhoFinal / 2,
            height: tamanhoFinal,
            justifyContent: 'center',
            opacity: estado === 'pendente' ? 0.5 : 1,
            width: tamanhoFinal,
          }}
        >
          <Text
            style={[
              estilos.avatarInicial,
              { fontSize: tamanhoFinal * 0.42 },
            ]}
          >
            {inicial}
          </Text>
        </LinearGradient>
        {estado === 'falou' && (
          <View style={estilos.avatarCheckBadge}>
            <Text style={estilos.avatarCheckTexto}>✓</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          estilos.avatarNome,
          estado === 'atual' && estilos.avatarNomeAtual,
          estado === 'pendente' && estilos.avatarNomePendente,
        ]}
        numberOfLines={1}
      >
        {nome}
      </Text>
    </View>
  );
}

function ItemDica({
  pista,
  nome,
  ehVoce,
}: {
  pista: PistaDada;
  nome: string;
  ehVoce: boolean;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(ty, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, [op, ty]);

  const [corA, corB] = gradienteAvatarDe(pista.jogadorId);
  const inicial = (nome.trim().charAt(0) || '?').toUpperCase();

  return (
    <Animated.View
      style={[
        estilos.itemDica,
        ehVoce && estilos.itemDicaVoce,
        { opacity: op, transform: [{ translateY: ty }] },
      ]}
    >
      <LinearGradient
        colors={[corA, corB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={estilos.itemDicaAvatar}
      >
        <Text style={estilos.itemDicaAvatarTexto}>{inicial}</Text>
      </LinearGradient>
      <View style={estilos.itemDicaCorpo}>
        <Text style={estilos.itemDicaNome}>
          {nome}
          {ehVoce ? ' • você' : ''}
        </Text>
        <Text style={estilos.itemDicaTexto}>“{pista.texto}”</Text>
      </View>
    </Animated.View>
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

const estilos = StyleSheet.create({
  avatarBorda: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    borderColor: 'transparent',
    borderWidth: 2,
    justifyContent: 'center',
    position: 'relative',
  },
  barraProgresso: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: raio.pill,
    height: 4,
    marginTop: espacamento.md,
    overflow: 'hidden',
    width: '100%',
  },
  barraProgressoPreenchida: {
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    height: '100%',
  },
  avatarBordaAtual: {
    borderColor: cores.primaria,
    elevation: 6,
    shadowColor: cores.primaria,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  avatarBordaFalou: {
    borderColor: cores.sucesso,
  },
  avatarCheckBadge: {
    alignItems: 'center',
    backgroundColor: cores.sucesso,
    borderColor: cores.fundo,
    borderRadius: 10,
    borderWidth: 2,
    bottom: -2,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 18,
  },
  avatarCheckTexto: {
    color: cores.fundo,
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    lineHeight: 12,
  },
  avatarInicial: {
    color: cores.textoSobrePrimaria,
    fontWeight: tipografia.pesoExtraBold,
  },
  avatarNome: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoSemibold,
    marginTop: espacamento.xs,
    maxWidth: 64,
    textAlign: 'center',
  },
  avatarNomeAtual: {
    color: cores.texto,
    fontWeight: tipografia.pesoBold,
  },
  avatarNomePendente: {
    color: cores.textoMudo,
  },
  avatarWrapper: {
    alignItems: 'center',
    minWidth: 64,
  },
  blocoInput: {
    backgroundColor: cores.fundoSecundario,
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    padding: espacamento.lg,
  },
  botaoEnviar: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.pill,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  botaoEnviarDesabilitado: {
    backgroundColor: cores.borda,
  },
  botaoEnviarPressionado: {
    backgroundColor: cores.primariaPressionada,
    transform: [{ scale: 0.98 }],
  },
  botaoEnviarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 16,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
  },
  cabecalho: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  cabecalhoMinhaVez: {
    backgroundColor: cores.acentoEscuro,
  },
  contador: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
  },
  contadorAlerta: {
    color: cores.alerta,
  },
  flex: {
    flex: 1,
  },
  historico: {
    flex: 1,
  },
  historicoConteudo: {
    paddingBottom: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  indicador: {
    flexGrow: 0,
    paddingVertical: espacamento.md,
  },
  indicadorConteudo: {
    alignItems: 'flex-end',
    gap: espacamento.md,
    paddingHorizontal: espacamento.lg,
  },
  input: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    fontSize: 17,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  inputCabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },
  itemDica: {
    alignItems: 'flex-start',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    marginBottom: espacamento.sm,
    padding: espacamento.md,
  },
  itemDicaAvatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  itemDicaAvatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 15,
    fontWeight: tipografia.pesoExtraBold,
  },
  itemDicaCorpo: {
    flex: 1,
    gap: 2,
  },
  itemDicaNome: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  itemDicaTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  itemDicaVoce: {
    borderColor: cores.acento,
  },
  legendaHistorico: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
    marginBottom: espacamento.sm,
  },
  legendaRodada: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },
  legendaVez: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
    marginTop: espacamento.sm,
  },
  nomeDaVez: {
    color: cores.texto,
    fontSize: 32,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.xs,
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  subtituloMinhaVez: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },
  tempoEsgotado: {
    color: cores.alerta,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.5,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  temporizadorWrapper: {
    alignItems: 'center',
    marginTop: espacamento.md,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloMinhaVez: {
    color: cores.textoSobrePrimaria,
    fontFamily: familias.serifDisplay,
    fontSize: 36,
    letterSpacing: 0,
    marginTop: espacamento.xs,
  },
  vazio: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    marginTop: espacamento.md,
    textAlign: 'center',
  },
});
