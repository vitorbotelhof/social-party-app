import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
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

import {
  BadgeUmCelular,
  BotaoPrimario,
  BotaoSecundario,
  TelaCarregamento,
} from '@/components';
import type { GameState, Player, PlayerId } from '@/engine/types';
import type {
  MrWhitePrivateState,
  MrWhitePublicState,
} from '@/games/mr-white/types';
import type { RootStackParamList } from '@/navigation/types';
import { criarAcao } from '@/services/gameActions';
import {
  despacharAcaoLocal,
  getJogadoresLocais,
  limparEstadoMantendoJogadores,
  observarEstadoLocal,
  resetarJogoLocal,
} from '@/services/jogoLocal';
import {
  PALETA_AVATARES,
  cores,
  espacamento,
  raio,
  tipografia,
} from '@/theme/colors';

type EstadoMrWhite = GameState<MrWhitePublicState, MrWhitePrivateState>;
type Navegacao = NativeStackNavigationProp<RootStackParamList>;

export function TelaJogoLocal() {
  const navigation = useNavigation<Navegacao>();
  const [estado, setEstado] = useState<EstadoMrWhite | null>(null);
  const permitirSaidaRef = useRef(false);

  useEffect(() => observarEstadoLocal(setEstado), []);

  // Intercepta qualquer tentativa de voltar (swipe iOS, hardware back
  // Android, etc.) e pede confirmação, exceto quando a saída é
  // disparada pelos botões da tela de resultado.
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (permitirSaidaRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Sair da partida?',
        'O progresso será perdido.',
        [
          { text: 'cancelar', style: 'cancel' },
          {
            text: 'sair',
            style: 'destructive',
            onPress: () => {
              permitirSaidaRef.current = true;
              resetarJogoLocal();
              navigation.dispatch(e.data.action);
            },
          },
        ],
      );
    });
    return sub;
  }, [navigation]);

  function sairLimpo(destino: 'jogarDeNovo' | 'encerrar') {
    permitirSaidaRef.current = true;
    if (destino === 'jogarDeNovo') {
      limparEstadoMantendoJogadores();
      navigation.replace('ConfiguracaoLocal');
    } else {
      resetarJogoLocal();
      navigation.popToTop();
    }
  }

  if (!estado) {
    return <TelaCarregamento mensagem="Preparando partida..." />;
  }

  const jogadores = getJogadoresLocais();

  function renderFase() {
    if (!estado) return null;
    switch (estado.estadoPublico.subFase) {
      case 'revelando':
        return <FaseRevelarLocal estado={estado} jogadores={jogadores} />;
      case 'dando_dicas':
        return <FaseRodadaLocal estado={estado} jogadores={jogadores} />;
      case 'votando':
        return <FaseVotacaoLocal estado={estado} jogadores={jogadores} />;
      case 'palpite_final':
        return <FasePalpiteLocal estado={estado} jogadores={jogadores} />;
      case 'finalizado':
        return (
          <FaseResultadoLocal
            estado={estado}
            jogadores={jogadores}
            aoEncerrar={() => sairLimpo('encerrar')}
            aoJogarDeNovo={() => sairLimpo('jogarDeNovo')}
          />
        );
    }
  }

  return (
    <View style={estilos.flex}>
      {renderFase()}
      <BadgeUmCelular />
    </View>
  );
}

// ============================================================
//  FASE 1: Revelar palavra (4 etapas — pass the phone)
// ============================================================

interface PropsFase {
  estado: EstadoMrWhite;
  jogadores: Player[];
}

type EtapaRevelar = 'passe' | 'confirma' | 'revelar' | 'vire';

const MS_HABILITAR_PROXIMO = 1000;

function FaseRevelarLocal({ estado, jogadores }: PropsFase) {
  const ordem = estado.estadoPublico.ordemJogadores;
  const queViram = estado.estadoPublico.jogadoresQueViram;
  const indiceAtual = queViram.length;
  const total = ordem.length;
  const ehUltimo = indiceAtual === total - 1;
  const jogadorAtualId = ordem[indiceAtual];
  const jogadorAtual = jogadores.find((j) => j.id === jogadorAtualId);
  const [etapa, setEtapa] = useState<EtapaRevelar>('passe');

  // Sempre que o jogador da vez muda, volta pra etapa A.
  useEffect(() => {
    setEtapa('passe');
  }, [indiceAtual]);

  if (!jogadorAtual) return null;
  const meuEstado = estado.estadosPrivados[jogadorAtual.id];
  if (!meuEstado) return null;

  function confirmarEAvancar() {
    if (!jogadorAtual) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    despacharAcaoLocal(
      criarAcao('jogador_viu_palavra', jogadorAtual.id, {}),
    );
    // Se não foi o último, o useEffect [indiceAtual] reseta pra 'passe'.
    // Se foi o último, o engine avança subFase e a tela desmonta.
  }

  switch (etapa) {
    case 'passe':
      return (
        <EtapaPasse
          nomeProximo={jogadorAtual.nome}
          indice={indiceAtual + 1}
          total={total}
          onContinuar={() => setEtapa('confirma')}
        />
      );
    case 'confirma':
      return (
        <EtapaConfirmaIdentidade
          nome={jogadorAtual.nome}
          onSim={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setEtapa('revelar');
          }}
          onNao={() => setEtapa('passe')}
        />
      );
    case 'revelar':
      return (
        <EtapaRevelarPalavra
          ehMrWhite={meuEstado.ehMrWhite}
          palavra={meuEstado.palavraSecreta}
          onProximo={() => setEtapa('vire')}
        />
      );
    case 'vire':
      return (
        <EtapaVireCelular
          ehUltimo={ehUltimo}
          onProximo={confirmarEAvancar}
        />
      );
  }
}

// ----- Etapa A: passe o celular -----

function EtapaPasse({
  nomeProximo,
  indice,
  total,
  onContinuar,
}: {
  nomeProximo: string;
  indice: number;
  total: number;
  onContinuar: () => void;
}) {
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
  }, [pulso]);

  return (
    <SafeAreaView
      style={[estilos.tela, estilos.fundoPreto]}
      edges={['top', 'bottom']}
    >
      <View style={estilos.centroFlex}>
        <Animated.Text
          style={[estilos.emojiPasseGrande, { transform: [{ scale: pulso }] }]}
        >
          📱
        </Animated.Text>
        <Text style={estilos.legendaProgresso}>
          {indice} de {total}
        </Text>
        <Text style={estilos.passeTitulo}>PASSE O CELULAR</Text>
        <Text style={estilos.passeSubtitulo}>para {nomeProximo}</Text>
      </View>
      <View style={estilos.rodapeFlex}>
        <BotaoPrimario titulo="estou com o celular" onPress={onContinuar} />
      </View>
    </SafeAreaView>
  );
}

// ----- Etapa B: confirma identidade -----

function EtapaConfirmaIdentidade({
  nome,
  onSim,
  onNao,
}: {
  nome: string;
  onSim: () => void;
  onNao: () => void;
}) {
  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.centroFlex}>
        <Text style={estilos.confirmaTexto}>você é</Text>
        <Text style={estilos.tituloGrande}>{nome}?</Text>
      </View>
      <View style={[estilos.rodapeFlex, estilos.rodapeGap]}>
        <BotaoPrimario titulo="sim, sou eu" onPress={onSim} />
        <BotaoSecundario titulo="não sou eu" onPress={onNao} />
      </View>
    </SafeAreaView>
  );
}

// ----- Etapa C: revelar palavra (hold to reveal) -----

function EtapaRevelarPalavra({
  ehMrWhite,
  palavra,
  onProximo,
}: {
  ehMrWhite: boolean;
  palavra: string | null;
  onProximo: () => void;
}) {
  const [segurando, setSegurando] = useState(false);
  const [jaSegurouOSuficiente, setJaSegurouOSuficiente] = useState(false);

  useEffect(() => {
    if (!segurando) return;
    const id = setTimeout(
      () => setJaSegurouOSuficiente(true),
      MS_HABILITAR_PROXIMO,
    );
    return () => clearTimeout(id);
  }, [segurando]);

  const corFundo = segurando
    ? ehMrWhite
      ? estilos.fundoMrWhite
      : estilos.fundoCivil
    : null;

  return (
    <SafeAreaView style={[estilos.tela, corFundo]} edges={['top', 'bottom']}>
      <Pressable
        onPressIn={() => {
          setSegurando(true);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }}
        onPressOut={() => setSegurando(false)}
        style={estilos.areaSegurar}
      >
        {segurando ? (
          <View style={estilos.centroFlexInterno}>
            {ehMrWhite ? (
              <>
                <Text style={estilos.papelMrWhite}>
                  você é o{'\n'}MR WHITE 🤫
                </Text>
                <Text style={estilos.subtextoMrWhiteReveal}>
                  descubra a palavra sem ser pego
                </Text>
              </>
            ) : (
              <>
                <Text style={estilos.legendaPalavra}>SUA PALAVRA</Text>
                <Text style={estilos.palavra}>{palavra}</Text>
              </>
            )}
            <Text style={estilos.instrucaoMemorize}>
              memorize e solte quando terminar
            </Text>
          </View>
        ) : (
          <View style={estilos.centroFlexInterno}>
            <Text style={estilos.emojiSegurar}>👆</Text>
            <Text style={estilos.segurarTitulo}>SEGURAR PARA VER</Text>
            <Text style={estilos.segurarSubtitulo}>
              ninguém mais pode estar vendo
            </Text>
          </View>
        )}
      </Pressable>

      <View style={estilos.rodapeFlex}>
        {jaSegurouOSuficiente ? (
          <BotaoPrimario
            titulo="já memorizei, próximo"
            onPress={onProximo}
          />
        ) : (
          <Text style={estilos.aguardandoSegurar}>
            segure pelo menos 1 segundo para liberar
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ----- Etapa D: vire o celular -----

function EtapaVireCelular({
  ehUltimo,
  onProximo,
}: {
  ehUltimo: boolean;
  onProximo: () => void;
}) {
  return (
    <SafeAreaView
      style={[estilos.tela, estilos.fundoPreto]}
      edges={['top', 'bottom']}
    >
      <View style={estilos.centroFlex}>
        <Text style={estilos.emojiVire}>🙈</Text>
        <Text style={estilos.passeTitulo}>VIRE O CELULAR</Text>
        <Text style={estilos.passeSubtitulo}>não deixe ninguém ver</Text>
      </View>
      <View style={estilos.rodapeFlex}>
        <BotaoPrimario
          titulo={
            ehUltimo ? 'todos viram, começar o jogo' : 'próximo jogador'
          }
          onPress={onProximo}
        />
      </View>
    </SafeAreaView>
  );
}

// ============================================================
//  FASE 2: Rodada de dicas (verbal — só controla turnos)
// ============================================================
//
// No modo 1 celular não há texto digitado. Os jogadores falam em voz
// alta; o celular só anuncia de quem é a vez. Quando todos passaram,
// despachamos N enviar_pista em sequência pra avançar o engine pra
// fase de votação.

function FaseRodadaLocal({ estado, jogadores }: PropsFase) {
  const ordem = estado.estadoPublico.ordemJogadores;
  const total = ordem.length;
  const [indiceLocal, setIndiceLocal] = useState(0);
  const [todasDadas, setTodasDadas] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [fade, indiceLocal, todasDadas]);

  const jogadorAtual = jogadores.find((j) => j.id === ordem[indiceLocal]);
  const ehUltimo = indiceLocal === total - 1;

  function aoProximo() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (ehUltimo) {
      setTodasDadas(true);
    } else {
      setIndiceLocal((i) => i + 1);
    }
  }

  function aoIrParaVotacao() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Despacha N enviar_pista pra avançar o engine até votação.
    // O engine aceita texto vazio (armazena "(passou)" no histórico,
    // mas a votação local não exibe esse histórico).
    for (const id of ordem) {
      despacharAcaoLocal(criarAcao('enviar_pista', id, { texto: '' }));
    }
  }

  if (todasDadas) {
    return (
      <Animated.View style={[estilos.flex, { opacity: fade }]}>
        <SafeAreaView
          style={[estilos.tela, estilos.fundoRoxoEscuro]}
          edges={['top', 'bottom']}
        >
          <View style={estilos.centroFlex}>
            <Text style={estilos.emojiTransicao}>✅</Text>
            <Text style={estilos.tituloTransicao}>
              todos deram suas dicas
            </Text>
            <Text style={estilos.subtituloTransicao}>
              agora é hora de votar
            </Text>
          </View>
          <View style={estilos.rodapeFlex}>
            <BotaoPrimario
              titulo="ir para votação →"
              onPress={aoIrParaVotacao}
            />
          </View>
        </SafeAreaView>
      </Animated.View>
    );
  }

  if (!jogadorAtual) return null;

  return (
    <Animated.View style={[estilos.flex, { opacity: fade }]}>
      <SafeAreaView
        style={[estilos.tela, estilos.fundoRoxoEscuro]}
        edges={['top', 'bottom']}
      >
        <View style={estilos.centroFlex}>
          <Text style={estilos.progressoRodada}>
            {indiceLocal} de {total} jogadores já deram suas dicas
          </Text>
          <Text style={estilos.legendaVezRoxa}>VEZ DE</Text>
          <Text style={estilos.nomeVezGrande}>{jogadorAtual.nome}</Text>
          <Text style={estilos.subtituloRodada}>
            dê uma dica sobre a palavra em voz alta
          </Text>
        </View>
        <View style={estilos.rodapeFlex}>
          <BotaoPrimario titulo="próximo →" onPress={aoProximo} />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

// ============================================================
//  FASE 3: Votação (4 etapas — pass the phone, secret vote)
// ============================================================
//
// No modo 1 celular cada jogador vota em sequência passando o celular.
// Os votos são coletados localmente e só ao final são despachados em
// lote pro engine, que então transita pra palpite_final/finalizado.

type EtapaVotar = 'passe' | 'confirma' | 'votar' | 'registrado';

function FaseVotacaoLocal({ estado, jogadores }: PropsFase) {
  const ordem = estado.estadoPublico.ordemJogadores;
  const total = ordem.length;
  const [indiceVotante, setIndiceVotante] = useState(0);
  const [etapa, setEtapa] = useState<EtapaVotar>('passe');
  const [selecionado, setSelecionado] = useState<PlayerId | null>(null);
  const [votos, setVotos] = useState<Record<PlayerId, PlayerId>>({});

  const votanteAtual = jogadores.find((j) => j.id === ordem[indiceVotante]);
  const ehUltimo = indiceVotante === total - 1;
  const totalJaVotou = Object.keys(votos).length;

  if (!votanteAtual) return null;

  function aoConfirmarVoto() {
    if (!selecionado || !votanteAtual) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVotos((v) => ({ ...v, [votanteAtual.id]: selecionado }));
    setSelecionado(null);
    setEtapa('registrado');
  }

  function aoAvancar() {
    if (ehUltimo) {
      // Despacha todos os votos coletados pro engine — ele resolve a
      // votação (incluindo desempate via idsPorAntiguidade) e transita
      // pra palpite_final ou finalizado.
      for (const [eleitor, alvo] of Object.entries(votos)) {
        despacharAcaoLocal(criarAcao('votar', eleitor, { alvoId: alvo }));
      }
      // O TelaJogoLocal observer detecta a nova subFase e renderiza
      // a próxima fase. Nada mais a fazer aqui.
      return;
    }
    setIndiceVotante((i) => i + 1);
    setEtapa('passe');
  }

  switch (etapa) {
    case 'passe':
      return (
        <EtapaPasse
          nomeProximo={votanteAtual.nome}
          indice={totalJaVotou + 1}
          total={total}
          onContinuar={() => setEtapa('confirma')}
        />
      );
    case 'confirma':
      return (
        <EtapaConfirmaIdentidade
          nome={votanteAtual.nome}
          onSim={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setEtapa('votar');
          }}
          onNao={() => setEtapa('passe')}
        />
      );
    case 'votar':
      return (
        <EtapaVotarSecreto
          votante={votanteAtual}
          candidatos={jogadores.filter((j) => j.id !== votanteAtual.id)}
          selecionado={selecionado}
          totalJaVotou={totalJaVotou}
          total={total}
          onSelecionar={(id) => {
            setSelecionado(id);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          onConfirmar={aoConfirmarVoto}
        />
      );
    case 'registrado':
      return (
        <EtapaVotoRegistrado ehUltimo={ehUltimo} onProximo={aoAvancar} />
      );
  }
}

// ----- Etapa C: tela de votação secreta -----

function EtapaVotarSecreto({
  votante,
  candidatos,
  selecionado,
  totalJaVotou,
  total,
  onSelecionar,
  onConfirmar,
}: {
  votante: Player;
  candidatos: Player[];
  selecionado: PlayerId | null;
  totalJaVotou: number;
  total: number;
  onSelecionar: (id: PlayerId) => void;
  onConfirmar: () => void;
}) {
  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <View style={estilos.cabecalhoVotar}>
        <Text style={estilos.legendaProgressoVotar}>
          {totalJaVotou} de {total} já votaram
        </Text>
        <Text style={estilos.tituloVotar}>
          {votante.nome}, em quem você vota?
        </Text>
        <Text style={estilos.subtituloVotar}>
          seu voto é secreto • escolha quem você acha que é o mr white
        </Text>
      </View>

      <ScrollView contentContainerStyle={estilos.listaVotos}>
        {candidatos.map((j) => {
          const ehSelecionado = selecionado === j.id;
          return (
            <Pressable
              key={j.id}
              onPress={() => onSelecionar(j.id)}
              style={[
                estilos.cardVoto,
                ehSelecionado && estilos.cardVotoSelecionado,
              ]}
            >
              <AvatarLocal id={j.id} nome={j.nome} />
              <Text style={estilos.cardVotoNome}>{j.nome}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={estilos.rodapeFlex}>
        <BotaoPrimario
          titulo={
            selecionado
              ? `confirmar voto em ${candidatos.find((c) => c.id === selecionado)?.nome}`
              : 'toque em alguém'
          }
          disabled={!selecionado}
          onPress={onConfirmar}
        />
      </View>
    </SafeAreaView>
  );
}

// ----- Etapa D: voto registrado (tela de cobertura) -----

function EtapaVotoRegistrado({
  ehUltimo,
  onProximo,
}: {
  ehUltimo: boolean;
  onProximo: () => void;
}) {
  return (
    <SafeAreaView
      style={[estilos.tela, estilos.fundoPreto]}
      edges={['top', 'bottom']}
    >
      <View style={estilos.centroFlex}>
        <Text style={estilos.emojiRegistrado}>🔒</Text>
        <Text style={estilos.passeTitulo}>VOTO REGISTRADO</Text>
        <Text style={estilos.passeSubtitulo}>não mostre para ninguém</Text>
      </View>
      <View style={estilos.rodapeFlex}>
        <BotaoPrimario
          titulo={ehUltimo ? 'ver resultado' : 'próximo votante'}
          onPress={onProximo}
        />
      </View>
    </SafeAreaView>
  );
}

// ============================================================
//  FASE 4: Palpite final do Mr White (passe + input)
// ============================================================

function FasePalpiteLocal({ estado, jogadores }: PropsFase) {
  const adivinhandoId = estado.estadoPublico.jogadorAdivinhandoId;
  const adivinhando = jogadores.find((j) => j.id === adivinhandoId);
  const [etapa, setEtapa] = useState<'passe' | 'palpite'>('passe');
  const [palpite, setPalpite] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (!adivinhando) return null;

  if (etapa === 'passe') {
    return (
      <PassePalpite
        nome={adivinhando.nome}
        onContinuar={() => setEtapa('palpite')}
      />
    );
  }

  const podeEnviar = palpite.trim().length > 0 && !enviando;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <View style={estilos.cabecalhoVez}>
          <Text style={estilos.legendaPalpiteTopo}>VOCÊ FOI DESCOBERTO</Text>
          <Text style={estilos.tituloGrande}>{adivinhando.nome},</Text>
          <Text style={estilos.subtituloPalpite}>
            qual é a palavra?
          </Text>
          <Text style={estilos.dicaPalpite}>
            acertou, vira o jogo. errou, civis vencem.
          </Text>
        </View>

        <View style={estilos.corpoPalpite}>
          <TextInput
            value={palpite}
            onChangeText={setPalpite}
            placeholder="digita a palavra..."
            placeholderTextColor={cores.textoMudo}
            maxLength={40}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            style={estilos.inputPalpite}
          />
        </View>

        <View style={estilos.rodapeFlex}>
          <BotaoPrimario
            titulo="confirmar palpite"
            disabled={!podeEnviar}
            carregando={enviando}
            onPress={() => {
              if (!podeEnviar) return;
              setEnviando(true);
              void Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              despacharAcaoLocal(
                criarAcao('palpite_final', adivinhando.id, {
                  palavra: palpite.trim(),
                }),
              );
              // engine transita pra 'finalizado' — FaseResultadoLocal renderiza.
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PassePalpite({
  nome,
  onContinuar,
}: {
  nome: string;
  onContinuar: () => void;
}) {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
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
  }, [pulso]);

  return (
    <SafeAreaView
      style={[estilos.tela, estilos.fundoPreto]}
      edges={['top', 'bottom']}
    >
      <View style={estilos.centroFlex}>
        <Animated.Text
          style={[estilos.emojiPasseGrande, { transform: [{ scale: pulso }] }]}
        >
          👁
        </Animated.Text>
        <Text style={estilos.passeTitulo}>PASSE O CELULAR</Text>
        <Text style={estilos.passeSubtitulo}>para {nome}</Text>
        <Text style={estilos.dicaMrWhiteDescoberto}>
          mr white descoberto — última chance
        </Text>
      </View>
      <View style={estilos.rodapeFlex}>
        <BotaoPrimario titulo="estou com o celular" onPress={onContinuar} />
      </View>
    </SafeAreaView>
  );
}

// ============================================================
//  FASE 5: Resultado
// ============================================================

const ETAPA_RESULTADO = {
  REVELANDO: 0,
  LEGENDA: 1,
  NOME: 2,
  BANNER: 3,
  CONTEUDO: 4,
} as const;

const TEMPOS_RESULTADO = {
  LEGENDA: 1500,
  NOME: 2500,
  BANNER: 3500,
  CONTEUDO: 4500,
};

function FaseResultadoLocal({
  estado,
  jogadores,
  aoEncerrar,
  aoJogarDeNovo,
}: PropsFase & {
  aoEncerrar: () => void;
  aoJogarDeNovo: () => void;
}) {
  const [etapa, setEtapa] = useState<number>(ETAPA_RESULTADO.REVELANDO);

  const venc = estado.estadoPublico.vencedor;
  const ehVitoriaMrWhite = venc === 'mrwhite';
  const mrWhiteIds = estado.estadoPublico.mrWhiteIdsRevelados;
  const nomesMrWhites = mrWhiteIds
    .map((id) => jogadores.find((j) => j.id === id)?.nome ?? '...')
    .join(' e ');

  useEffect(() => {
    const timers = [
      setTimeout(() => setEtapa(ETAPA_RESULTADO.LEGENDA), TEMPOS_RESULTADO.LEGENDA),
      setTimeout(() => setEtapa(ETAPA_RESULTADO.NOME), TEMPOS_RESULTADO.NOME),
      setTimeout(() => {
        setEtapa(ETAPA_RESULTADO.BANNER);
        void Haptics.notificationAsync(
          ehVitoriaMrWhite
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success,
        );
      }, TEMPOS_RESULTADO.BANNER),
      setTimeout(() => setEtapa(ETAPA_RESULTADO.CONTEUDO), TEMPOS_RESULTADO.CONTEUDO),
    ];
    return () => timers.forEach(clearTimeout);
  }, [ehVitoriaMrWhite]);

  if (etapa < ETAPA_RESULTADO.LEGENDA) {
    return <RevelandoPulsando />;
  }

  const votos = estado.estadoPublico.votos;
  const eliminadosIds = estado.estadoPublico.eliminadosIds;
  const ultimoEliminadoId = eliminadosIds[eliminadosIds.length - 1] ?? null;
  const nomeDe = (id: string) =>
    jogadores.find((j) => j.id === id)?.nome ?? '...';

  const contagem = new Map<string, number>();
  for (const alvo of Object.values(votos)) {
    contagem.set(alvo, (contagem.get(alvo) ?? 0) + 1);
  }
  const votosUltimoEliminado = ultimoEliminadoId
    ? (contagem.get(ultimoEliminadoId) ?? 0)
    : 0;

  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={estilos.conteudoResultado}>
        <BlocoLegendaMrWhite
          quantidade={mrWhiteIds.length}
          visivel={etapa >= ETAPA_RESULTADO.LEGENDA}
        />
        <NomeMrWhiteAnimado
          nomes={nomesMrWhites || '...'}
          visivel={etapa >= ETAPA_RESULTADO.NOME}
        />

        {etapa >= ETAPA_RESULTADO.BANNER && (
          <BannerResultado ehVitoriaMrWhite={ehVitoriaMrWhite} />
        )}

        {etapa >= ETAPA_RESULTADO.CONTEUDO && (
          <View style={estilos.blocoResumo}>
            <View style={estilos.cardResumo}>
              <Text style={estilos.rotuloResumo}>A PALAVRA ERA</Text>
              <Text style={estilos.palavraResumo}>
                {estado.estadoPublico.palavraRevelada}
              </Text>
            </View>

            {estado.estadoPublico.palpiteFinal && (
              <View style={estilos.cardResumo}>
                <Text style={estilos.rotuloResumo}>PALPITE DO MR WHITE</Text>
                <Text style={estilos.palpiteResumo}>
                  “{estado.estadoPublico.palpiteFinal}”
                </Text>
                <View
                  style={[
                    estilos.tagPalpite,
                    estado.estadoPublico.palpiteCorreto
                      ? estilos.tagCorreto
                      : estilos.tagErrado,
                  ]}
                >
                  <Text
                    style={[
                      estilos.tagPalpiteTexto,
                      {
                        color: estado.estadoPublico.palpiteCorreto
                          ? cores.sucesso
                          : cores.erro,
                      },
                    ]}
                  >
                    {estado.estadoPublico.palpiteCorreto
                      ? 'ACERTOU ✓'
                      : 'ERROU ✗'}
                  </Text>
                </View>
              </View>
            )}

            {ultimoEliminadoId && (
              <View style={estilos.cardResumo}>
                <Text style={estilos.rotuloResumo}>ELIMINADO NA VOTAÇÃO</Text>
                <Text style={estilos.nomeResumo}>
                  {nomeDe(ultimoEliminadoId)}
                </Text>
                <Text style={estilos.subResumo}>
                  {votosUltimoEliminado}{' '}
                  {votosUltimoEliminado === 1 ? 'voto' : 'votos'}
                </Text>
              </View>
            )}

            {Object.keys(votos).length > 0 && (
              <View style={estilos.cardResumo}>
                <Text style={estilos.rotuloResumo}>PLACAR DE VOTOS</Text>
                <View style={estilos.listaVotosResumo}>
                  {Object.entries(votos).map(([eleitor, alvo]) => (
                    <Text key={eleitor} style={estilos.linhaVotoResumo}>
                      <Text style={estilos.linhaVotoNome}>
                        {nomeDe(eleitor)}
                      </Text>
                      <Text style={estilos.linhaVotoSeta}> → </Text>
                      <Text style={estilos.linhaVotoNome}>
                        {nomeDe(alvo)}
                      </Text>
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {etapa >= ETAPA_RESULTADO.CONTEUDO && (
        <View style={estilos.rodape}>
          <BotaoPrimario
            titulo="jogar de novo com o mesmo grupo"
            onPress={aoJogarDeNovo}
          />
          <BotaoSecundario titulo="encerrar" onPress={aoEncerrar} />
        </View>
      )}
    </SafeAreaView>
  );
}

function RevelandoPulsando() {
  const pulso = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  return (
    <View style={[estilos.tela, estilos.centroFlex]}>
      <Animated.Text style={[estilos.revelandoTexto, { opacity: pulso }]}>
        revelando...
      </Animated.Text>
    </View>
  );
}

function BlocoLegendaMrWhite({
  quantidade,
  visivel,
}: {
  quantidade: number;
  visivel: boolean;
}) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, {
      toValue: visivel ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [op, visivel]);
  return (
    <Animated.Text style={[estilos.legendaMrWhite, { opacity: op }]}>
      {quantidade > 1 ? 'OS MR WHITES ERAM...' : 'O MR WHITE ERA...'}
    </Animated.Text>
  );
}

function NomeMrWhiteAnimado({
  nomes,
  visivel,
}: {
  nomes: string;
  visivel: boolean;
}) {
  const escala = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visivel) return;
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.2,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(escala, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 6,
        }),
      ]),
    ]).start();
  }, [escala, op, visivel]);
  return (
    <Animated.Text
      style={[
        estilos.nomeMrWhiteResultado,
        { opacity: op, transform: [{ scale: escala }] },
      ]}
    >
      {nomes}
    </Animated.Text>
  );
}

function BannerResultado({ ehVitoriaMrWhite }: { ehVitoriaMrWhite: boolean }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(ty, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, [op, ty]);
  return (
    <Animated.View
      style={[
        estilos.bannerResultado,
        ehVitoriaMrWhite
          ? estilos.bannerResultadoMrWhite
          : estilos.bannerResultadoCivis,
        { opacity: op, transform: [{ translateY: ty }] },
      ]}
    >
      <Text style={estilos.bannerEmoji}>{ehVitoriaMrWhite ? '👁' : '🎉'}</Text>
      <Text style={estilos.bannerTitulo}>
        {ehVitoriaMrWhite ? 'MR WHITE VENCEU' : 'CIVIS VENCERAM'}
      </Text>
    </Animated.View>
  );
}

// ============================================================
//  Helper: avatar gradiente
// ============================================================

function AvatarLocal({ id, nome }: { id: string; nome: string }) {
  const [corA, corB] = gradienteAvatarDe(id);
  const inicial = (nome.trim().charAt(0) || '?').toUpperCase();
  return (
    <LinearGradient
      colors={[corA, corB]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={estilos.avatar}
    >
      <Text style={estilos.avatarTexto}>{inicial}</Text>
    </LinearGradient>
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

// Animated import kept to avoid unused-vars complaints if expanded later.
void Animated;

const estilos = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 18,
    fontWeight: tipografia.pesoExtraBold,
  },
  bannerEmoji: {
    fontSize: 56,
    marginBottom: espacamento.sm,
  },
  bannerResultado: {
    alignItems: 'center',
    borderRadius: raio.lg,
    padding: espacamento.xl,
  },
  bannerResultadoCivis: {
    backgroundColor: '#064E3B',
  },
  bannerResultadoMrWhite: {
    backgroundColor: '#3B0764',
  },
  bannerTitulo: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  cabecalhoVez: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  cardResumo: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    marginTop: espacamento.md,
    padding: espacamento.lg,
  },
  cardVoto: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: espacamento.md,
    marginBottom: espacamento.sm,
    padding: espacamento.md,
  },
  cardVotoNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
  },
  cardVotoSelecionado: {
    backgroundColor: cores.acentoEscuro,
    borderColor: cores.primaria,
    borderWidth: 2,
  },
  cardVotoVoce: {
    opacity: 0.4,
  },
  centroFlex: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  conteudoResultado: {
    padding: espacamento.lg,
  },
  corpoPalpite: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
  },
  flex: { flex: 1 },
  aguardandoSegurar: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  areaSegurar: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
  },
  centroFlexInterno: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  confirmaTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoSemibold,
    marginBottom: espacamento.sm,
  },
  emojiPasseGrande: {
    fontSize: 96,
    marginBottom: espacamento.xl,
  },
  emojiSegurar: {
    fontSize: 80,
    marginBottom: espacamento.lg,
  },
  emojiVire: {
    fontSize: 88,
    marginBottom: espacamento.xl,
  },
  fundoCivil: {
    backgroundColor: '#064E3B',
  },
  fundoEscuro: {
    backgroundColor: '#000',
  },
  fundoMrWhite: {
    backgroundColor: '#7F1D1D',
  },
  fundoPreto: {
    backgroundColor: '#000',
  },
  fundoRoxoEscuro: {
    backgroundColor: cores.acentoEscuro,
  },
  emojiTransicao: {
    fontSize: 80,
    marginBottom: espacamento.xl,
    textAlign: 'center',
  },
  tituloTransicao: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  subtituloTransicao: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: tipografia.tamanhoCorpo,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  progressoRodada: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  legendaVezRoxa: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  nomeVezGrande: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoHero,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  subtituloRodada: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: tipografia.tamanhoCorpoMaior,
    marginTop: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    textAlign: 'center',
  },
  cabecalhoVotar: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  legendaProgressoVotar: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    textTransform: 'uppercase',
  },
  tituloVotar: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.sm,
  },
  subtituloVotar: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.sm,
  },
  emojiRegistrado: {
    fontSize: 88,
    marginBottom: espacamento.xl,
  },
  legendaPalpiteTopo: {
    color: cores.erro,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  subtituloPalpite: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoBold,
    marginTop: espacamento.xs,
  },
  dicaPalpite: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    marginTop: espacamento.md,
  },
  dicaMrWhiteDescoberto: {
    color: cores.erro,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
    marginTop: espacamento.lg,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  revelandoTexto: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  legendaMrWhite: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  nomeMrWhiteResultado: {
    color: cores.acento,
    fontSize: 44,
    fontWeight: tipografia.pesoBlack,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  blocoResumo: {
    gap: espacamento.md,
    marginTop: espacamento.lg,
  },
  subResumo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: 4,
  },
  listaVotosResumo: {
    gap: espacamento.xs,
    marginTop: espacamento.sm,
  },
  linhaVotoResumo: {
    fontSize: tipografia.tamanhoCorpoMenor,
    lineHeight: 22,
  },
  linhaVotoNome: {
    color: cores.texto,
    fontWeight: tipografia.pesoSemibold,
  },
  linhaVotoSeta: {
    color: cores.primaria,
    fontWeight: tipografia.pesoBold,
  },
  tagPalpiteTexto: {
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.5,
  },
  passeSubtitulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoMedio,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  passeTitulo: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  rodapeGap: {
    gap: espacamento.sm,
  },
  segurarSubtitulo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  segurarTitulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    textAlign: 'center',
  },
  subtextoMrWhiteReveal: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  historico: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
  },
  historicoConteudo: {
    paddingVertical: espacamento.md,
  },
  instrucaoMemorize: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  inputPalpite: {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    color: cores.texto,
    fontSize: 22,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
    textAlign: 'center',
  },
  legendaPalavra: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  legendaProgresso: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    textAlign: 'center',
  },
  legendaSecao: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginBottom: espacamento.sm,
  },
  legendaVez: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
    marginTop: espacamento.lg,
    textAlign: 'center',
  },
  linhaDica: {
    flexDirection: 'row',
    gap: espacamento.sm,
    marginBottom: espacamento.sm,
  },
  linhaDicaNome: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    minWidth: 70,
  },
  linhaDicaTexto: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
  },
  listaVotos: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
  },
  nomeResumo: {
    color: cores.acento,
    fontSize: 28,
    fontWeight: tipografia.pesoExtraBold,
    marginTop: espacamento.sm,
  },
  palavra: {
    color: cores.textoSobrePrimaria,
    fontSize: 56,
    fontWeight: tipografia.pesoExtraBold,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  palavraResumo: {
    color: cores.acentoQuente,
    fontSize: 32,
    fontWeight: tipografia.pesoExtraBold,
    marginTop: espacamento.sm,
  },
  palpiteResumo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtitulo,
    fontStyle: 'italic',
    marginTop: espacamento.sm,
  },
  papelMrWhite: {
    color: cores.textoSobrePrimaria,
    fontSize: 36,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    lineHeight: 44,
    textAlign: 'center',
  },
  rodape: {
    gap: espacamento.sm,
    padding: espacamento.lg,
  },
  rodapeFlex: {
    paddingBottom: espacamento.md,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  rotuloResumo: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoBold,
    letterSpacing: tipografia.letraSpacingLegenda,
  },
  subtituloCentro: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.md,
    paddingHorizontal: espacamento.lg,
    textAlign: 'center',
  },
  tagCorreto: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: cores.sucesso,
  },
  tagErrado: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: cores.erro,
  },
  tagPalpite: {
    alignSelf: 'flex-start',
    borderRadius: raio.sm,
    borderWidth: 1,
    marginTop: espacamento.sm,
    paddingHorizontal: espacamento.md - 4,
    paddingVertical: 4,
  },
  tela: {
    backgroundColor: cores.fundo,
    flex: 1,
  },
  tituloGrande: {
    color: cores.texto,
    fontSize: 40,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  transicao: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
    padding: espacamento.lg,
  },
  transicaoDica: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    marginTop: espacamento.xl,
    textAlign: 'center',
  },
  transicaoEmoji: {
    fontSize: 64,
    marginBottom: espacamento.lg,
  },
  transicaoSubtitulo: {
    color: cores.texto,
    fontSize: tipografia.tamanhoSubtituloGrande,
    fontWeight: tipografia.pesoMedio,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  transicaoTitulo: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoTitulo,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
    textAlign: 'center',
  },
  vazio: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
