import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CARTAS } from '@/games/na-ponta-da-lingua/prompts';
import { calcularIntensidade } from '@/games/na-ponta-da-lingua/types';
import type { Carta, IntensidadeVisual } from '@/games/na-ponta-da-lingua/types';
import type { RootStackParamList } from '@/navigation/types';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'JogoLocalNaPontaDaLingua'>;

type Fase = 'preparo' | 'revelando' | 'jogando' | 'resultado' | 'entre' | 'fim';
type ResultadoTurno = 'acertou' | 'passou' | 'tempo_esgotado';

interface Jogador { id: string; nome: string }
interface Turno {
  jogadorId: string;
  carta: Carta;
  resultado: ResultadoTurno;
  duracaoMs: number;
  intensidade: IntensidadeVisual;
}

// ─── Paleta de intensidade ────────────────────────────────────────────────────

const COR_TIMER: Record<IntensidadeVisual, string> = {
  calmo:   '#C9893A',
  pressao: '#D4633A',
  panico:  '#E86A5A',
  colapso: '#FF4040',
};

const OPACIDADE_VIGNETTE: Record<IntensidadeVisual, number> = {
  calmo:   0,
  pressao: 0.18,
  panico:  0.42,
  colapso: 0.62,
};

const COR_BORDA_PROIBIDA: Record<IntensidadeVisual, string> = {
  calmo:   'transparent',
  pressao: 'rgba(201,137,58,0.35)',
  panico:  'rgba(232,106,90,0.6)',
  colapso: 'rgba(255,64,64,0.85)',
};

const BG_PROIBIDA: Record<IntensidadeVisual, string> = {
  calmo:   'transparent',
  pressao: 'rgba(201,137,58,0.04)',
  panico:  'rgba(232,106,90,0.08)',
  colapso: 'rgba(255,64,64,0.12)',
};

// ─── Funções utilitárias ──────────────────────────────────────────────────────

function sortearCarta(usadas: string[], dificuldade: string): Carta {
  const pool = CARTAS.filter(
    (c) => !usadas.includes(c.id) && (dificuldade === 'todas' || c.dificuldade === dificuldade),
  );
  const fonte = pool.length > 0
    ? pool
    : CARTAS.filter((c) => dificuldade === 'todas' || c.dificuldade === dificuldade);
  const lista = fonte.length > 0 ? fonte : [...CARTAS];
  return lista[Math.floor(Math.random() * lista.length)]!;
}

function escolher<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function gerarComentario(
  resultado: ResultadoTurno,
  pctUsado: number,
  intensidade: IntensidadeVisual,
  streak: number,
  passesConsecutivos: number,
  sessaoTensao: number,
): string {
  if (resultado === 'acertou') {
    if (intensidade === 'colapso') return escolher([
      'um milagre verbal.',
      'sobreviveu por um fio.',
      'o grupo não acreditou.',
    ]);
    if (intensidade === 'panico') return escolher([
      'perigosamente perto.',
      'o timer quase venceu.',
      'correu o risco e funcionou.',
    ]);
    if (streak >= 3) return escolher([
      `${streak} seguidas. o grupo fica nervoso.`,
      'em ritmo. isso é perigoso.',
    ]);
    if (pctUsado < 0.3) return escolher([
      'foi fácil demais.',
      'nem suou.',
      'o grupo quer mais difícil.',
    ]);
    if (sessaoTensao > 0.6) return escolher([
      'nesse clima, não era óbvio.',
      'depois de tanta tensão, sobreviveu.',
    ]);
    return escolher(['sobreviveu.', 'passou pela pressão.', 'conseguiu.']);
  }

  if (resultado === 'passou') {
    if (passesConsecutivos >= 2) return escolher([
      'o grupo está gostando de assistir.',
      'ninguém está ajudando.',
    ]);
    if (intensidade === 'colapso') return escolher([
      'desistiu no pior momento.',
      'o colapso venceu.',
    ]);
    return escolher([
      'não quis arriscar.',
      'preferiu não tentar.',
      'o grupo discorda.',
    ]);
  }

  if (intensidade === 'colapso') return escolher([
    'as proibidas venceram.',
    'colapso total.',
    'o timer não perdoa.',
  ]);
  if (intensidade === 'panico') return escolher([
    'perdeu o fio.',
    'a cabeça travou.',
  ]);
  return escolher([
    'o tempo não esperou.',
    'um segundo a mais bastaria.',
  ]);
}

function gerarTituloFim(taxaAcerto: number, totalTurnos: number): string {
  if (totalTurnos === 0) return 'sessão encerrada.';
  if (taxaAcerto >= 80) return 'o grupo se saiu bem.';
  if (taxaAcerto >= 60) return 'quase sem colapso.';
  if (taxaAcerto >= 40) return 'a língua travou algumas vezes.';
  if (taxaAcerto >= 25) return 'foi tenso.';
  return 'o grupo entrou em colapso.';
}

function gerarDestaques(
  jogadores: Jogador[],
  pontos: Record<string, number>,
  historico: Turno[],
): string[] {
  const destaques: string[] = [];

  const ranking = [...jogadores].sort((a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0));
  const top = ranking[0];
  if (top && (pontos[top.id] ?? 0) > 0) {
    const pts = pontos[top.id] ?? 0;
    destaques.push(`${top.nome} carregou — ${pts} acerto${pts !== 1 ? 's' : ''}.`);
  }

  const clutch = historico.find((t) => t.resultado === 'acertou' && t.intensidade === 'colapso');
  if (clutch) {
    const j = jogadores.find((p) => p.id === clutch.jogadorId);
    if (j) destaques.push(`${j.nome} acertou em colapso. o grupo vai falar nisso.`);
  }

  const timeouts = historico.filter((t) => t.resultado === 'tempo_esgotado').length;
  if (timeouts >= 2) {
    destaques.push(`o timer expirou ${timeouts} vezes. as proibidas tiveram bom dia.`);
  }

  const passes = historico.filter((t) => t.resultado === 'passou').length;
  if (passes >= 3 && destaques.length < 3) {
    destaques.push(`${passes} palavras descartadas. o grupo é seletivo.`);
  }

  let maxS = 0, curS = 0;
  for (const t of historico) {
    if (t.resultado === 'acertou') { curS++; maxS = Math.max(maxS, curS); }
    else curS = 0;
  }
  if (maxS >= 3 && destaques.length < 3) {
    destaques.push(`sequência de ${maxS} acertos seguidos. aí ficou tenso.`);
  }

  return destaques.slice(0, 3);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TelaJogoLocalNaPontaDaLingua({ navigation, route }: Props) {
  const { jogadores, duracaoSegundos, rodadasPorJogador, dificuldade } = route.params;
  const insets = useSafeAreaInsets();
  const duracaoMs = duracaoSegundos * 1000;
  const totalTurnos = jogadores.length * rodadasPorJogador;

  const [fase, setFase] = useState<Fase>('preparo');
  const [indiceTurno, setIndiceTurno] = useState(0);
  const [turnosJogados, setTurnosJogados] = useState(0);
  const [cartaAtual, setCartaAtual] = useState<Carta | null>(null);
  const [cartasUsadas, setCartasUsadas] = useState<string[]>([]);
  const [resultadoTurno, setResultadoTurno] = useState<ResultadoTurno | null>(null);
  const [historico, setHistorico] = useState<Turno[]>([]);
  const [pontos, setPontos] = useState<Record<string, number>>(
    Object.fromEntries(jogadores.map((j) => [j.id, 0])),
  );
  const [sessaoTensao, setSessaoTensao] = useState(0);
  const [comentarioAtual, setComentarioAtual] = useState('');
  const [intensidadeFinalTurno, setIntensidadeFinalTurno] = useState<IntensidadeVisual>('calmo');

  const streakRef = useRef(0);
  const passesRef = useRef(0);
  const sessaoTensaoRef = useRef(0);
  const turnoStartRef = useRef(0);
  const primeiroTurnoRef = useRef(true);

  const jogadorAtual = jogadores[indiceTurno % jogadores.length]!;

  function atualizarTensao(resultado: ResultadoTurno, intensidade: IntensidadeVisual) {
    const peso = intensidade === 'colapso' ? 0.3 : intensidade === 'panico' ? 0.2 : intensidade === 'pressao' ? 0.1 : 0.05;
    const delta = resultado === 'tempo_esgotado' ? peso : resultado === 'passou' ? peso * 0.5 : -0.05;
    const nova = Math.max(0, Math.min(1, sessaoTensaoRef.current + delta));
    sessaoTensaoRef.current = nova;
    setSessaoTensao(nova);
  }

  function irParaRevelando() {
    const carta = sortearCarta(cartasUsadas, dificuldade);
    setCartaAtual(carta);
    setCartasUsadas((u) => [...u, carta.id]);
    setFase('revelando');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function iniciarTimer() {
    turnoStartRef.current = Date.now();
    setFase('jogando');
  }

  function aoAcertar(intensidade: IntensidadeVisual) {
    const duracao = Date.now() - turnoStartRef.current;
    const pctUsado = duracao / duracaoMs;
    streakRef.current += 1;
    passesRef.current = 0;
    const novoStreak = streakRef.current;
    const comentario = gerarComentario('acertou', pctUsado, intensidade, novoStreak, 0, sessaoTensaoRef.current);
    setIntensidadeFinalTurno(intensidade);
    setComentarioAtual(comentario);
    atualizarTensao('acertou', intensidade);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPontos((p) => ({ ...p, [jogadorAtual.id]: (p[jogadorAtual.id] ?? 0) + 1 }));
    registrarHistorico('acertou', duracao, intensidade);
    setResultadoTurno('acertou');
    primeiroTurnoRef.current = false;
    setFase('resultado');
  }

  function aoPassar(intensidade: IntensidadeVisual) {
    const duracao = Date.now() - turnoStartRef.current;
    const pctUsado = duracao / duracaoMs;
    streakRef.current = 0;
    passesRef.current += 1;
    const passes = passesRef.current;
    const comentario = gerarComentario('passou', pctUsado, intensidade, 0, passes, sessaoTensaoRef.current);
    setIntensidadeFinalTurno(intensidade);
    setComentarioAtual(comentario);
    atualizarTensao('passou', intensidade);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    registrarHistorico('passou', duracao, intensidade);
    setResultadoTurno('passou');
    primeiroTurnoRef.current = false;
    setFase('resultado');
  }

  function aoTempoEsgotar() {
    streakRef.current = 0;
    passesRef.current += 1;
    const comentario = gerarComentario('tempo_esgotado', 1, 'colapso', 0, passesRef.current, sessaoTensaoRef.current);
    setIntensidadeFinalTurno('colapso');
    setComentarioAtual(comentario);
    atualizarTensao('tempo_esgotado', 'colapso');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    registrarHistorico('tempo_esgotado', duracaoMs, 'colapso');
    setResultadoTurno('tempo_esgotado');
    primeiroTurnoRef.current = false;
    setFase('resultado');
  }

  function registrarHistorico(resultado: ResultadoTurno, durMs: number, intensidade: IntensidadeVisual) {
    if (!cartaAtual) return;
    setHistorico((h) => [
      ...h,
      { jogadorId: jogadorAtual.id, carta: cartaAtual, resultado, duracaoMs: durMs, intensidade },
    ]);
  }

  function proximoTurno() {
    const novosTurnos = turnosJogados + 1;
    setTurnosJogados(novosTurnos);
    if (novosTurnos >= totalTurnos) {
      setFase('fim');
      return;
    }
    setIndiceTurno((i) => i + 1);
    setFase('entre');
  }

  function sairLimpo() {
    navigation.replace('SelecaoDinamica', { jogoId: 'na-ponta-da-lingua' });
  }

  if (fase === 'fim') {
    return (
      <FaseFim
        jogadores={jogadores}
        pontos={pontos}
        historico={historico}
        onSair={sairLimpo}
        insets={insets}
      />
    );
  }

  const proximoJogador = jogadores[(indiceTurno + 1) % jogadores.length];

  return (
    <View style={[estilos.tela, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={estilos.cabecalho}>
        <Pressable onPress={sairLimpo} hitSlop={12} style={estilos.botaoSair}>
          <Text style={estilos.botaoSairTexto}>×</Text>
        </Pressable>
        <Text style={estilos.progresso}>
          {turnosJogados + (fase === 'resultado' || fase === 'entre' ? 1 : 0)} / {totalTurnos}
        </Text>
      </View>

      {fase === 'preparo' && (
        <FasePreparo
          jogador={jogadorAtual}
          sessaoTensao={sessaoTensao}
          isFirst={primeiroTurnoRef.current}
          onPronto={irParaRevelando}
        />
      )}
      {fase === 'revelando' && cartaAtual && (
        <FaseRevelando
          carta={cartaAtual}
          isFirst={primeiroTurnoRef.current}
          onPronto={iniciarTimer}
        />
      )}
      {fase === 'jogando' && cartaAtual && (
        <FaseJogando
          carta={cartaAtual}
          duracaoMs={duracaoMs}
          onAcertar={aoAcertar}
          onPassar={aoPassar}
          onTempoEsgotar={aoTempoEsgotar}
        />
      )}
      {fase === 'resultado' && cartaAtual && resultadoTurno && (
        <FaseResultado
          carta={cartaAtual}
          resultado={resultadoTurno}
          jogadorNome={jogadorAtual.nome}
          comentario={comentarioAtual}
          intensidadeFinal={intensidadeFinalTurno}
          onProximo={proximoTurno}
          isUltimo={turnosJogados + 1 >= totalTurnos}
        />
      )}
      {fase === 'entre' && (
        <FaseEntre
          jogadores={jogadores}
          pontos={pontos}
          proximoJogador={proximoJogador ?? jogadores[0]!}
          onPronto={() => setFase('preparo')}
        />
      )}
    </View>
  );
}

// ─── FasePreparo ──────────────────────────────────────────────────────────────

function FasePreparo({
  jogador,
  sessaoTensao,
  isFirst,
  onPronto,
}: {
  jogador: Jogador;
  sessaoTensao: number;
  isFirst: boolean;
  onPronto: () => void;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const nomeY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(nomeY, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [op, nomeY]);

  const instrucao =
    sessaoTensao < 0.3 ? 'outros virem o celular.' :
    sessaoTensao < 0.65 ? 'o grupo está te observando.' :
    'o grupo não vai te ajudar.';

  return (
    <Pressable style={estilos.faseTela} onPress={onPronto}>
      <Animated.View style={[estilos.preparoContainer, { opacity: op }]}>
        <Text style={estilos.preparoLabel}>é a vez de</Text>
        <Animated.Text style={[estilos.preparoNome, { transform: [{ translateY: nomeY }] }]}>
          {jogador.nome}
        </Animated.Text>
        {isFirst && (
          <Text style={estilos.preparoTutorial}>
            você vai ver uma palavra{'\n'}e as restrições dela.
          </Text>
        )}
        <Text style={estilos.preparoInstrucao}>{instrucao}</Text>
        <Text style={estilos.preparoToque}>toque quando estiver pronto.</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── FaseRevelando ────────────────────────────────────────────────────────────

function FaseRevelando({
  carta,
  isFirst,
  onPronto,
}: {
  carta: Carta;
  isFirst: boolean;
  onPronto: () => void;
}) {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [op]);

  return (
    <Animated.View style={[estilos.faseTela, { opacity: op }]}>
      <View style={estilos.revelacaoCard}>
        <Text style={estilos.revelacaoHint}>sua palavra</Text>
        <Text style={estilos.revelacaoPalavra}>{carta.palavra}</Text>
        <View style={estilos.revelacaoDivisor} />
        <Text style={estilos.revelacaoProibidasLabel}>não pode dizer</Text>
        <View style={estilos.revelacaoProibidasLista}>
          {carta.proibidas.map((p) => (
            <View key={p} style={estilos.revelacaoProibidaItem}>
              <Text style={estilos.revelacaoProibidaCruz}>✕</Text>
              <Text style={estilos.revelacaoProibidaTexto}>{p}</Text>
            </View>
          ))}
        </View>
        {isFirst && (
          <Text style={estilos.revelacaoHintExtra}>nem sinônimos óbvios.</Text>
        )}
      </View>
      <Pressable
        onPress={onPronto}
        style={({ pressed }) => [estilos.botaoIniciar, pressed && estilos.botaoIniciarPressionado]}
      >
        <Text style={estilos.botaoIniciarTexto}>iniciar →</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── FaseJogando ──────────────────────────────────────────────────────────────

function FaseJogando({
  carta,
  duracaoMs,
  onAcertar,
  onPassar,
  onTempoEsgotar,
}: {
  carta: Carta;
  duracaoMs: number;
  onAcertar: (intensidade: IntensidadeVisual) => void;
  onPassar: (intensidade: IntensidadeVisual) => void;
  onTempoEsgotar: () => void;
}) {
  const [tempoRestanteMs, setTempoRestanteMs] = useState(duracaoMs);
  const [intensidade, setIntensidade] = useState<IntensidadeVisual>('calmo');
  const terminouRef = useRef(false);
  const startRef = useRef(Date.now());
  const intensidadeRef = useRef<IntensidadeVisual>('calmo');

  const shakeX = useRef(new Animated.Value(0)).current;
  const vignetteOp = useRef(new Animated.Value(0)).current;
  const palavraScale = useRef(new Animated.Value(1)).current;
  const respiracaoOp = useRef(new Animated.Value(1)).current;
  const timerScale = useRef(new Animated.Value(1)).current;
  const proibidasPulse = useRef(new Animated.Value(1)).current;

  const shakeLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulsoRef = useRef<Animated.CompositeAnimation | null>(null);
  const respiracaoRef = useRef<Animated.CompositeAnimation | null>(null);

  const pct = tempoRestanteMs / duracaoMs;
  const corTimer = COR_TIMER[intensidade];
  const segundosExibidos = Math.ceil(tempoRestanteMs / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const restante = Math.max(0, duracaoMs - elapsed);
      setTempoRestanteMs(restante);
      if (restante <= 0 && !terminouRef.current) {
        terminouRef.current = true;
        clearInterval(interval);
        onTempoEsgotar();
      }
    }, 80);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hesitation pulse at 40% elapsed — app reacts to player's desperation
  useEffect(() => {
    const t = setTimeout(() => {
      if (terminouRef.current) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(proibidasPulse, { toValue: 1.025, duration: 150, useNativeDriver: true }),
        Animated.timing(proibidasPulse, { toValue: 0.985, duration: 200, useNativeDriver: true }),
        Animated.timing(proibidasPulse, { toValue: 1.0, duration: 150, useNativeDriver: true }),
      ]).start();
    }, duracaoMs * 0.4);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nova = calcularIntensidade(pct);
    if (nova !== intensidade) {
      setIntensidade(nova);
      intensidadeRef.current = nova;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestanteMs]);

  useEffect(() => {
    aplicarIntensidade(intensidade);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensidade]);

  function pararAnimacoes() {
    shakeLoopRef.current?.stop();
    pulsoRef.current?.stop();
    respiracaoRef.current?.stop();
    shakeX.setValue(0);
    respiracaoOp.setValue(1);
  }

  function aplicarIntensidade(nivel: IntensidadeVisual) {
    pararAnimacoes();

    Animated.timing(vignetteOp, {
      toValue: OPACIDADE_VIGNETTE[nivel],
      duration: nivel === 'colapso' ? 400 : 1200,
      useNativeDriver: true,
    }).start();

    if (nivel === 'calmo') {
      palavraScale.setValue(1);
      return;
    }

    if (nivel === 'pressao') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pulsoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(palavraScale, { toValue: 1.02, duration: 800, useNativeDriver: true }),
          Animated.timing(palavraScale, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ]),
      );
      pulsoRef.current.start();
      respiracaoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(respiracaoOp, { toValue: 0.97, duration: 1200, useNativeDriver: true }),
          Animated.timing(respiracaoOp, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
        ]),
      );
      respiracaoRef.current.start();
      return;
    }

    if (nivel === 'panico') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      pulsoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(palavraScale, { toValue: 1.045, duration: 280, useNativeDriver: true }),
          Animated.timing(palavraScale, { toValue: 0.97, duration: 280, useNativeDriver: true }),
        ]),
      );
      pulsoRef.current.start();
      respiracaoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(respiracaoOp, { toValue: 0.93, duration: 700, useNativeDriver: true }),
          Animated.timing(respiracaoOp, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ]),
      );
      respiracaoRef.current.start();
      iniciarShake(3);
      return;
    }

    // colapso
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    pulsoRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(palavraScale, { toValue: 1.06, duration: 150, useNativeDriver: true }),
        Animated.timing(palavraScale, { toValue: 0.96, duration: 150, useNativeDriver: true }),
      ]),
    );
    pulsoRef.current.start();
    respiracaoRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(respiracaoOp, { toValue: 0.87, duration: 400, useNativeDriver: true }),
        Animated.timing(respiracaoOp, { toValue: 1.0, duration: 400, useNativeDriver: true }),
      ]),
    );
    respiracaoRef.current.start();
    iniciarShake(7);
    Animated.sequence([
      Animated.timing(timerScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
      Animated.timing(timerScale, { toValue: 0.93, duration: 100, useNativeDriver: true }),
      Animated.timing(timerScale, { toValue: 1.0, duration: 80, useNativeDriver: true }),
    ]).start();
  }

  function iniciarShake(amplitude: number) {
    shakeLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeX, { toValue: amplitude, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -amplitude * 0.8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: amplitude * 0.4, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]),
    );
    shakeLoopRef.current.start();
  }

  return (
    <Animated.View
      style={[
        estilos.jogandoContainer,
        { transform: [{ translateX: shakeX }], opacity: respiracaoOp },
      ]}
    >
      <View style={estilos.timerBarra}>
        <View
          style={[
            estilos.timerBarraPreenchida,
            { width: `${Math.max(0, pct * 100)}%`, backgroundColor: corTimer },
          ]}
        />
      </View>

      <Animated.Text style={[estilos.timerNumero, { color: corTimer, transform: [{ scale: timerScale }] }]}>
        {segundosExibidos}
      </Animated.Text>

      <Animated.View style={{ transform: [{ scale: palavraScale }] }}>
        <Text style={estilos.palavraPrincipal}>{carta.palavra}</Text>
      </Animated.View>

      <Animated.View style={[estilos.proibidasBloco, { transform: [{ scale: proibidasPulse }] }]}>
        {carta.proibidas.map((p, i) => (
          <ProibidaItem key={p} palavra={p} index={i} intensidade={intensidade} />
        ))}
      </Animated.View>

      <View style={estilos.controlesContainer}>
        <Pressable
          onPress={() => onPassar(intensidadeRef.current)}
          style={({ pressed }) => [estilos.btnPassou, pressed && estilos.btnPressionado]}
        >
          <Text style={estilos.btnPassouTexto}>passou</Text>
        </Pressable>
        <Pressable
          onPress={() => onAcertar(intensidadeRef.current)}
          style={({ pressed }) => [estilos.btnAcertou, pressed && estilos.btnPressionado]}
        >
          <Text style={estilos.btnAcertouTexto}>acertou ✓</Text>
        </Pressable>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, estilos.vignette, { opacity: vignetteOp }]}
      />
    </Animated.View>
  );
}

// ─── ProibidaItem ─────────────────────────────────────────────────────────────

function ProibidaItem({
  palavra,
  index,
  intensidade,
}: {
  palavra: string;
  index: number;
  intensidade: IntensidadeVisual;
}) {
  const flickerOp = useRef(new Animated.Value(1)).current;
  const flickerRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    flickerRef.current?.stop();
    if (intensidade !== 'colapso') {
      flickerOp.setValue(1);
      return;
    }
    const delay = index * 120;
    const t = setTimeout(() => {
      flickerRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(flickerOp, { toValue: 0.3, duration: 80 + index * 30, useNativeDriver: true }),
          Animated.timing(flickerOp, { toValue: 1, duration: 120 + index * 20, useNativeDriver: true }),
          Animated.delay(200 + index * 80),
        ]),
      );
      flickerRef.current.start();
    }, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensidade]);

  return (
    <Animated.View
      style={[
        estilos.proibidaItem,
        {
          opacity: flickerOp,
          borderLeftColor: COR_BORDA_PROIBIDA[intensidade],
          backgroundColor: BG_PROIBIDA[intensidade],
        },
      ]}
    >
      <Text style={estilos.proibidaTexto}>{palavra}</Text>
    </Animated.View>
  );
}

// ─── FaseResultado ────────────────────────────────────────────────────────────

function FaseResultado({
  carta,
  resultado,
  jogadorNome,
  comentario,
  intensidadeFinal,
  onProximo,
  isUltimo,
}: {
  carta: Carta;
  resultado: ResultadoTurno;
  jogadorNome: string;
  comentario: string;
  intensidadeFinal: IntensidadeVisual;
  onProximo: () => void;
  isUltimo: boolean;
}) {
  const badgeOp = useRef(new Animated.Value(0)).current;
  const palavraOp = useRef(new Animated.Value(0)).current;
  const palavraY = useRef(new Animated.Value(10)).current;
  const comentarioOp = useRef(new Animated.Value(0)).current;
  const proibidasOp = useRef(new Animated.Value(0)).current;
  const botaoOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(badgeOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const t1 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(palavraOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(palavraY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 600);

    const t2 = setTimeout(() => {
      Animated.timing(comentarioOp, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, 1200);

    const t3 = setTimeout(() => {
      Animated.timing(proibidasOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1800);

    const t4 = setTimeout(() => {
      Animated.timing(botaoOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badgeConfig = {
    acertou: { cor: cores.sucesso, texto: 'acertou.' },
    passou: { cor: cores.textoSecundario, texto: 'passou.' },
    tempo_esgotado: { cor: cores.erro, texto: 'tempo.' },
  }[resultado];

  const badgeCor =
    resultado === 'acertou' && intensidadeFinal === 'colapso' ? '#FF9040' : badgeConfig.cor;

  return (
    <View style={estilos.resultadoContainer}>
      <Animated.Text style={[estilos.resultadoBadge, { color: badgeCor, opacity: badgeOp }]}>
        {badgeConfig.texto}
      </Animated.Text>

      <Animated.Text
        style={[
          estilos.resultadoPalavra,
          { opacity: palavraOp, transform: [{ translateY: palavraY }] },
        ]}
      >
        {carta.palavra}
      </Animated.Text>

      <Text style={estilos.resultadoJogador}>{jogadorNome}</Text>

      <Animated.Text style={[estilos.resultadoComentario, { opacity: comentarioOp }]}>
        {comentario}
      </Animated.Text>

      <Animated.View style={[estilos.resultadoProibidas, { opacity: proibidasOp }]}>
        <Text style={estilos.resultadoProibidasLabel}>as proibidas eram</Text>
        {carta.proibidas.map((p) => (
          <View key={p} style={estilos.resultadoProibidaItem}>
            <Text style={estilos.resultadoProibidaTexto}>{p}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={{ opacity: botaoOp, marginTop: espacamento.lg }}>
        <Pressable
          onPress={onProximo}
          style={({ pressed }) => [estilos.btnProximo, pressed && { opacity: 0.6 }]}
        >
          <Text style={estilos.btnProximoTexto}>
            {isUltimo ? 'ver resultado →' : 'próximo →'}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── FaseEntre ────────────────────────────────────────────────────────────────

function FaseEntre({
  jogadores,
  pontos,
  proximoJogador,
  onPronto,
}: {
  jogadores: Jogador[];
  pontos: Record<string, number>;
  proximoJogador: Jogador;
  onPronto: () => void;
}) {
  const ranking = [...jogadores].sort((a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0));

  const tituloOp = useRef(new Animated.Value(0)).current;
  const rankingOp = useRef(new Animated.Value(0)).current;
  const proximoOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tituloOp, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const t1 = setTimeout(() => {
      Animated.timing(rankingOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 250);
    const t2 = setTimeout(() => {
      Animated.timing(proximoOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={estilos.entreContainer} onPress={onPronto}>
      <Animated.Text style={[estilos.entreTitulo, { opacity: tituloOp }]}>placar</Animated.Text>
      <Animated.View style={[estilos.entreRanking, { opacity: rankingOp }]}>
        {ranking.map((j, i) => (
          <View key={j.id} style={estilos.entreItem}>
            <Text style={estilos.entrePos}>{i + 1}</Text>
            <Text style={estilos.entreNome}>{j.nome}</Text>
            <Text style={estilos.entrePontos}>{pontos[j.id] ?? 0}</Text>
          </View>
        ))}
      </Animated.View>
      <Animated.View style={[estilos.entreRodape, { opacity: proximoOp }]}>
        <Text style={estilos.entreProximo}>vez de {proximoJogador.nome} →</Text>
        <Text style={estilos.entreContinuar}>toque para continuar</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── FaseFim ──────────────────────────────────────────────────────────────────

function FaseFim({
  jogadores,
  pontos,
  historico,
  onSair,
  insets,
}: {
  jogadores: Jogador[];
  pontos: Record<string, number>;
  historico: Turno[];
  onSair: () => void;
  insets: { top: number; bottom: number };
}) {
  const acertos = historico.filter((t) => t.resultado === 'acertou').length;
  const total = historico.length;
  const taxaAcerto = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const titulo = gerarTituloFim(taxaAcerto, total);
  const destaques = gerarDestaques(jogadores, pontos, historico);
  const ranking = [...jogadores].sort((a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0));

  const tituloOp = useRef(new Animated.Value(0)).current;
  const destaquesOp = useRef(new Animated.Value(0)).current;
  const rankingOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tituloOp, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    const t1 = setTimeout(() => {
      Animated.timing(destaquesOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 800);
    const t2 = setTimeout(() => {
      Animated.timing(rankingOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={[
        estilos.fimTela,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Animated.View style={{ opacity: tituloOp, alignSelf: 'stretch' }}>
        <Text style={estilos.fimTitulo}>{titulo}</Text>
        <View style={estilos.fimStats}>
          <View style={estilos.fimStat}>
            <Text style={estilos.fimStatNumero}>{acertos}</Text>
            <Text style={estilos.fimStatLabel}>acertos</Text>
          </View>
          <View style={estilos.fimStatDivisor} />
          <View style={estilos.fimStat}>
            <Text style={estilos.fimStatNumero}>{taxaAcerto}%</Text>
            <Text style={estilos.fimStatLabel}>taxa</Text>
          </View>
          <View style={estilos.fimStatDivisor} />
          <View style={estilos.fimStat}>
            <Text style={estilos.fimStatNumero}>{total - acertos}</Text>
            <Text style={estilos.fimStatLabel}>passadas</Text>
          </View>
        </View>
      </Animated.View>

      {destaques.length > 0 && (
        <Animated.View style={[estilos.fimDestaques, { opacity: destaquesOp }]}>
          {destaques.map((d, i) => (
            <Text key={i} style={estilos.fimDestaqueTexto}>{d}</Text>
          ))}
        </Animated.View>
      )}

      <Animated.View style={[estilos.fimRanking, { opacity: rankingOp }]}>
        {ranking.map((j, i) => (
          <View key={j.id} style={estilos.fimRankingItem}>
            <Text style={estilos.fimRankingPos}>{i + 1}</Text>
            <Text style={estilos.fimRankingNome}>{j.nome}</Text>
            <Text style={estilos.fimRankingPontos}>{pontos[j.id] ?? 0}</Text>
          </View>
        ))}
      </Animated.View>

      <Pressable
        onPress={onSair}
        style={({ pressed }) => [estilos.fimSair, pressed && { opacity: 0.6 }]}
      >
        <Text style={estilos.fimSairTexto}>jogar de novo →</Text>
      </Pressable>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  tela: { backgroundColor: cores.fundo, flex: 1 },
  cabecalho: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: espacamento.lg, paddingVertical: espacamento.sm },
  botaoSair: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  botaoSairTexto: { color: cores.textoMudo, fontSize: 28, lineHeight: 30 },
  progresso: { color: cores.textoMudo, fontFamily: familias.serifDisplay, fontSize: 16, letterSpacing: 0.5 },
  faseTela: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: espacamento.xl },

  // Preparo
  preparoContainer: { alignItems: 'center', gap: espacamento.sm },
  preparoLabel: { color: cores.textoMudo, fontSize: tipografia.tamanhoMicro, fontWeight: tipografia.pesoExtraBold, letterSpacing: 1.5, textTransform: 'uppercase' },
  preparoNome: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 44, letterSpacing: -1, textAlign: 'center' },
  preparoTutorial: { color: cores.textoMudo, fontFamily: familias.serifItalico, fontSize: 14, lineHeight: 22, marginTop: espacamento.sm, textAlign: 'center' },
  preparoInstrucao: { color: cores.textoSecundario, fontFamily: familias.serifItalico, fontSize: 16, lineHeight: 24, marginTop: espacamento.md, textAlign: 'center' },
  preparoToque: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, marginTop: espacamento.xs, textAlign: 'center' },

  // Revelando
  revelacaoCard: { alignSelf: 'stretch', backgroundColor: cores.superficie, borderColor: cores.borda, borderRadius: raio.xl, borderWidth: 1, gap: espacamento.md, padding: espacamento.xl },
  revelacaoHint: { color: cores.textoMudo, fontSize: tipografia.tamanhoMicro, fontWeight: tipografia.pesoExtraBold, letterSpacing: 1.8, textAlign: 'center', textTransform: 'uppercase' },
  revelacaoPalavra: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 40, letterSpacing: -0.5, textAlign: 'center' },
  revelacaoDivisor: { backgroundColor: cores.borda, height: 1 },
  revelacaoProibidasLabel: { color: cores.textoMudo, fontSize: 11, fontWeight: tipografia.pesoExtraBold, letterSpacing: 1.5, textAlign: 'center', textTransform: 'uppercase' },
  revelacaoProibidasLista: { gap: espacamento.xs },
  revelacaoProibidaItem: { alignItems: 'center', flexDirection: 'row', gap: espacamento.sm, paddingVertical: 2 },
  revelacaoProibidaCruz: { color: cores.erro, fontSize: 11, fontWeight: tipografia.pesoBold, width: 16 },
  revelacaoProibidaTexto: { color: cores.textoSecundario, fontSize: 15, fontWeight: tipografia.pesoSemibold },
  revelacaoHintExtra: { color: cores.textoMudo, fontFamily: familias.serifItalico, fontSize: 13, textAlign: 'center' },
  botaoIniciar: { borderColor: cores.primaria, borderRadius: raio.pill, borderWidth: 1, marginTop: espacamento.xl, paddingHorizontal: espacamento.xxl, paddingVertical: espacamento.md + 2 },
  botaoIniciarPressionado: { backgroundColor: 'rgba(160,82,45,0.12)', transform: [{ scale: 0.97 }] },
  botaoIniciarTexto: { color: cores.primaria, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoBold, letterSpacing: 0.3 },

  // Jogando
  jogandoContainer: { flex: 1, alignItems: 'center', paddingHorizontal: espacamento.lg },
  timerBarra: { backgroundColor: cores.borda, borderRadius: 2, height: 3, marginBottom: espacamento.md, overflow: 'hidden', width: '100%' },
  timerBarraPreenchida: { borderRadius: 2, height: 3 },
  timerNumero: { fontSize: tipografia.tamanhoMicro, fontWeight: tipografia.pesoExtraBold, letterSpacing: 1, marginBottom: espacamento.lg, textAlign: 'center' },
  palavraPrincipal: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 52, letterSpacing: -1.5, marginBottom: espacamento.xl, textAlign: 'center' },
  proibidasBloco: { alignSelf: 'stretch', gap: espacamento.xs, marginBottom: espacamento.xl },
  proibidaItem: { borderLeftWidth: 3, borderRadius: raio.sm, borderColor: cores.borda, borderWidth: 1, paddingHorizontal: espacamento.md, paddingVertical: espacamento.sm + 1 },
  proibidaTexto: { color: cores.textoSecundario, fontSize: 16, fontWeight: tipografia.pesoSemibold },
  controlesContainer: { flexDirection: 'row', gap: espacamento.md, marginTop: 'auto' as unknown as number, paddingBottom: espacamento.lg, width: '100%' },
  btnPassou: { alignItems: 'center', backgroundColor: cores.superficieElevada, borderColor: cores.borda, borderRadius: raio.lg, borderWidth: 1, flex: 1, paddingVertical: espacamento.md + 4 },
  btnAcertou: { alignItems: 'center', backgroundColor: cores.primaria, borderRadius: raio.lg, flex: 2, paddingVertical: espacamento.md + 4 },
  btnPressionado: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  btnPassouTexto: { color: cores.textoSecundario, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoBold },
  btnAcertouTexto: { color: cores.textoSobrePrimaria, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoBold },
  vignette: { backgroundColor: '#1a0500' },

  // Resultado
  resultadoContainer: { alignItems: 'center', flex: 1, paddingHorizontal: espacamento.xl, paddingTop: 60 },
  resultadoBadge: { fontFamily: familias.serifItalico, fontSize: 22, letterSpacing: 0.3, marginBottom: espacamento.md },
  resultadoPalavra: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 44, letterSpacing: -1, marginBottom: espacamento.xs, textAlign: 'center' },
  resultadoJogador: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, letterSpacing: 0.5, marginBottom: espacamento.lg },
  resultadoComentario: { color: cores.textoSecundario, fontFamily: familias.serifItalico, fontSize: 17, lineHeight: 26, marginBottom: espacamento.xl, textAlign: 'center' },
  resultadoProibidas: { alignSelf: 'stretch', gap: espacamento.xs },
  resultadoProibidasLabel: { color: cores.textoMudo, fontSize: 11, fontWeight: tipografia.pesoExtraBold, letterSpacing: 1.5, marginBottom: espacamento.sm, textAlign: 'center', textTransform: 'uppercase' },
  resultadoProibidaItem: { alignItems: 'center', paddingVertical: 2 },
  resultadoProibidaTexto: { color: cores.textoMudo, fontSize: 14 },
  btnProximo: { borderColor: cores.borda, borderRadius: raio.pill, borderWidth: 1, paddingHorizontal: espacamento.xl, paddingVertical: espacamento.md },
  btnProximoTexto: { color: cores.textoSecundario, fontSize: tipografia.tamanhoCorpo, letterSpacing: 0.3 },

  // Entre
  entreContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: espacamento.lg },
  entreTitulo: { color: cores.textoMudo, fontSize: tipografia.tamanhoMicro, fontWeight: tipografia.pesoExtraBold, letterSpacing: 2, marginBottom: espacamento.md, textTransform: 'uppercase' },
  entreRanking: { alignSelf: 'stretch', gap: espacamento.sm, marginBottom: espacamento.xl },
  entreItem: { alignItems: 'center', backgroundColor: cores.superficie, borderColor: cores.borda, borderRadius: raio.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: espacamento.md, paddingVertical: espacamento.md },
  entrePos: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, fontWeight: tipografia.pesoExtraBold, width: 20 },
  entreNome: { color: cores.texto, flex: 1, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoSemibold, marginLeft: espacamento.sm },
  entrePontos: { color: cores.acento, fontFamily: familias.serifDisplay, fontSize: 22 },
  entreRodape: { alignItems: 'center' },
  entreProximo: { color: cores.primaria, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoBold },
  entreContinuar: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, marginTop: espacamento.xs },

  // Fim
  fimTela: { alignItems: 'center', backgroundColor: cores.fundo, flex: 1, paddingHorizontal: espacamento.lg },
  fimTitulo: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 30, marginBottom: espacamento.lg, textAlign: 'center' },
  fimStats: { backgroundColor: cores.superficieElevada, borderColor: cores.borda, borderRadius: raio.lg, borderWidth: 1, flexDirection: 'row', marginBottom: espacamento.lg, paddingVertical: espacamento.md, width: '100%' },
  fimStat: { alignItems: 'center', flex: 1, gap: 2 },
  fimStatNumero: { color: cores.texto, fontFamily: familias.serifDisplay, fontSize: 28 },
  fimStatLabel: { color: cores.textoMudo, fontSize: tipografia.tamanhoMicro, letterSpacing: 0.5 },
  fimStatDivisor: { backgroundColor: cores.borda, width: 1 },
  fimDestaques: { alignSelf: 'stretch', borderColor: cores.borda, borderRadius: raio.lg, borderWidth: 1, gap: espacamento.md, marginBottom: espacamento.lg, padding: espacamento.lg },
  fimDestaqueTexto: { color: cores.textoSecundario, fontFamily: familias.serifItalico, fontSize: 15, lineHeight: 22 },
  fimRanking: { alignSelf: 'stretch', gap: espacamento.sm, marginBottom: espacamento.xl },
  fimRankingItem: { alignItems: 'center', backgroundColor: cores.superficie, borderColor: cores.borda, borderRadius: raio.md, borderWidth: 1, flexDirection: 'row', paddingHorizontal: espacamento.md, paddingVertical: espacamento.md },
  fimRankingPos: { color: cores.textoMudo, fontSize: tipografia.tamanhoLegenda, fontWeight: tipografia.pesoExtraBold, width: 20 },
  fimRankingNome: { color: cores.texto, flex: 1, fontSize: tipografia.tamanhoCorpoMaior, fontWeight: tipografia.pesoSemibold, marginLeft: espacamento.sm },
  fimRankingPontos: { color: cores.acento, fontFamily: familias.serifDisplay, fontSize: 22 },
  fimSair: { borderColor: cores.primaria, borderRadius: raio.pill, borderWidth: 1, paddingHorizontal: espacamento.xl, paddingVertical: espacamento.md },
  fimSairTexto: { color: cores.primaria, fontSize: tipografia.tamanhoCorpo, fontWeight: tipografia.pesoSemibold },
});
