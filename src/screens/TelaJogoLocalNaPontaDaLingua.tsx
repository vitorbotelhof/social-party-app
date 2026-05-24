import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoEncerrarJogo } from '@/components';
import { FeedbackSessao } from '@/components/FeedbackSessao';
import { selecionarCartaInteligente } from '@/games/na-ponta-da-lingua/cardSelection';
import {
  inicializarAudio,
  liberarAudio,
  iniciarDrone,
  pararDrone,
  setIntensidadeDrone,
  tocarTick,
  tocarFalha,
  tocarAcerto,
  tocarRoubo,
} from '@/games/na-ponta-da-lingua/audioEngine';
import { calcularIntensidade } from '@/games/na-ponta-da-lingua/types';
import type {
  Carta,
  DificuldadeNPL,
  HistoricoTurnoItem,
  IntensidadeVisual,
} from '@/games/na-ponta-da-lingua/types';
import type { RootStackParamList } from '@/navigation/types';
import { processarResultadoNPL } from '@/session/nplAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

const SCREEN_W = Dimensions.get('window').width;

type Props = NativeStackScreenProps<
  RootStackParamList,
  'JogoLocalNaPontaDaLingua'
>;
type Fase = 'preparo' | 'jogando' | 'roubo' | 'resumo_turno' | 'entre' | 'fim';

interface TimesConfig {
  nomeA: string;
  idsA: string[];
  nomeB: string;
  idsB: string[];
}

interface TurnoSummary {
  acertos: number;
  passados: number;
  melhorStreak: number;
  historico: HistoricoTurnoItem[];
  intensidadeFinal: IntensidadeVisual;
  ultimaPalavra: string;
}

interface TurnoSessao {
  jogadorId: string;
  acertos: number;
  passados: number;
  melhorStreak: number;
  historico: HistoricoTurnoItem[];
  intensidadeFinal: IntensidadeVisual;
}

interface Jogador {
  id: string;
  nome: string;
}

// ─── Paleta de intensidade ────────────────────────────────────────────────────

const COR_TIMER: Record<IntensidadeVisual, string> = {
  calmo: '#C9893A',
  pressao: '#D4633A',
  panico: '#E86A5A',
  colapso: '#FF4040',
};

const OPACIDADE_VIGNETTE: Record<IntensidadeVisual, number> = {
  calmo: 0,
  pressao: 0.18,
  panico: 0.42,
  colapso: 0.62,
};

const COR_BORDA_PROIBIDA: Record<IntensidadeVisual, string> = {
  calmo: 'transparent',
  pressao: 'rgba(201,137,58,0.35)',
  panico: 'rgba(232,106,90,0.6)',
  colapso: 'rgba(255,64,64,0.85)',
};

const BG_PROIBIDA: Record<IntensidadeVisual, string> = {
  calmo: 'transparent',
  pressao: 'rgba(201,137,58,0.04)',
  panico: 'rgba(232,106,90,0.08)',
  colapso: 'rgba(255,64,64,0.12)',
};

// ─── Utilitários ──────────────────────────────────────────────────────────────

function escolher<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function gerarMomentoDaSessao(
  historico: TurnoSessao[],
  jogadores: Jogador[],
): string | null {
  if (historico.length < 3) return null;

  // momento impossível: streak >= 3 em colapso
  const impossivel = historico.find(
    (t) => t.intensidadeFinal === 'colapso' && t.melhorStreak >= 3,
  );
  if (impossivel) {
    const j = jogadores.find((p) => p.id === impossivel.jogadorId);
    if (j)
      return `${j.nome} fez ${impossivel.melhorStreak} seguidas em colapso. o grupo não vai esquecer.`;
  }

  // rodada mais caótica
  let maxTotal = 0;
  let maisCaros: TurnoSessao | null = null;
  for (const t of historico) {
    const tot = t.acertos + t.passados;
    if (tot > maxTotal) {
      maxTotal = tot;
      maisCaros = t;
    }
  }
  if (maisCaros && maxTotal >= 8) {
    const j = jogadores.find((p) => p.id === maisCaros!.jogadorId);
    if (j) return `${j.nome} tentou ${maxTotal} palavras. o ritmo foi absurdo.`;
  }

  // virada após zeros consecutivos
  for (let i = 1; i < historico.length; i++) {
    if (
      (historico[i - 1]?.acertos ?? 1) === 0 &&
      (historico[i]?.acertos ?? 0) >= 4
    ) {
      const j = jogadores.find((p) => p.id === historico[i]!.jogadorId);
      if (j)
        return `${j.nome} acertou ${historico[i]!.acertos} após rodada zerada. virada.`;
    }
  }

  // colapso com zero
  const colapsoZero = historico.find(
    (t) => t.intensidadeFinal === 'colapso' && t.acertos === 0,
  );
  if (colapsoZero) {
    const j = jogadores.find((p) => p.id === colapsoZero.jogadorId);
    if (j)
      return `${j.nome} não acertou nenhuma em colapso. o timer ganhou essa.`;
  }

  return null;
}

function gerarComentarioTurno(
  acertos: number,
  passados: number,
  melhorStreak: number,
  intensidadeFinal: IntensidadeVisual,
  sessaoTensao: number,
  streakColetivo: number,
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time',
  progressaoSessao: number,
  ultimoTurno: TurnoSessao | null,
): string {
  const total = acertos + passados;
  const coletivo = modoJogo === 'todos_juntos' || modoJogo === 'time_vs_time';
  const isTvT = modoJogo === 'time_vs_time';
  const sessFinal = progressaoSessao > 0.75;

  if (total === 0)
    return escolher([
      'nenhuma palavra tentada.',
      'o timer passou em silêncio.',
      sessFinal
        ? 'paralisia nas últimas rodadas. o timer venceu.'
        : 'paralisia total. acontece.',
    ]);

  if (acertos === 0)
    return escolher([
      'bloqueou em tudo. as proibidas sabem o que fazem.',
      sessFinal
        ? 'zero acertos. nas últimas rodadas, isso pesa.'
        : 'zero acertos. a pressão cobrou.',
      isTvT
        ? 'o adversário não perdoa isso.'
        : 'as proibidas venceram essa rodada.',
      coletivo ? 'o grupo ficou em silêncio.' : 'bloqueio total.',
    ]);

  // sequência coletiva em andamento
  if (streakColetivo >= 5)
    return escolher([
      `${streakColetivo} rodadas seguidas. o grupo é perigoso.`,
      'esse nível de ritmo é raro.',
      coletivo
        ? `${streakColetivo} seguidas. o grupo está em outro patamar.`
        : `${streakColetivo} rodadas acertando. o ritmo tomou conta.`,
    ]);
  if (streakColetivo >= 3 && acertos > 0)
    return escolher([
      `${streakColetivo} rodadas no ritmo. o grupo não para.`,
      coletivo
        ? 'o grupo entrou em flow. isso é real.'
        : `${streakColetivo} seguidas acertando.`,
      'encadeou. a dinâmica mudou.',
    ]);
  if (streakColetivo >= 2 && acertos > 0)
    return escolher([
      'segunda rodada acertando. o ritmo começa.',
      coletivo
        ? 'o grupo respondeu de novo. algo aconteceu.'
        : 'segunda seguida. não é coincidência.',
    ]);

  // streak individual forte
  if (melhorStreak >= 5)
    return escolher([
      `${melhorStreak} seguidas sem parar. isso é pressão real.`,
      `sequência de ${melhorStreak}. o timer quase não importou.`,
      `${melhorStreak} consecutivas. o grupo não sabia o que estava vindo.`,
    ]);
  if (melhorStreak >= 3)
    return escolher([
      `${melhorStreak} seguidas. bom ritmo.`,
      `sequência de ${melhorStreak}. ${coletivo ? 'o grupo respondeu.' : 'limpo.'}`,
    ]);

  // clutch
  if (intensidadeFinal === 'colapso' && acertos > 0)
    return escolher([
      'acertou no caos. isso tem valor.',
      'sobreviveu ao colapso. o grupo não esperava.',
      'o timer quase ganhou. quase.',
      coletivo
        ? 'o grupo respondeu quando o relógio já gritava.'
        : 'no limite. funcionou.',
    ]);

  // callbacks de sessão — memória editorial
  if (ultimoTurno) {
    if (ultimoTurno.acertos === 0 && acertos >= 3)
      return escolher([
        'redenção. o grupo não esperava.',
        `zerou antes. ${acertos} agora. a virada foi real.`,
        'o turno anterior assombrou. esse limpou.',
      ]);
    if (ultimoTurno.acertos === 0 && acertos === 0)
      return escolher([
        'dois zeros seguidos. o grupo está com medo.',
        'outra rodada zerada. as proibidas ganharam de novo.',
        coletivo
          ? 'o grupo travou duas vezes.'
          : 'bloqueio consecutivo. a pressão chegou.',
      ]);
    if (ultimoTurno.melhorStreak >= 4 && melhorStreak <= 1 && acertos < 3)
      return escolher([
        `a sequência de ${ultimoTurno.melhorStreak} ficou no passado.`,
        'o ritmo não voltou. pelo menos por enquanto.',
      ]);
    if (
      ultimoTurno.intensidadeFinal === 'colapso' &&
      intensidadeFinal !== 'colapso' &&
      acertos > 0
    )
      return escolher([
        'saiu do colapso ainda de pé.',
        'depois do colapso, o grupo respirou.',
      ]);
  }

  // recuperação no pânico
  if (intensidadeFinal === 'panico' && acertos >= 2)
    return escolher([
      'manteve a cabeça em pânico.',
      'a pressão estava alta. a resposta veio.',
      coletivo ? 'o grupo não travou.' : 'controlou no pânico.',
    ]);

  const taxa = acertos / total;

  // round perfeita
  if (taxa === 1 && acertos >= 4)
    return escolher([
      `${acertos} palavras, zero erros. o grupo vai compensar isso.`,
      `sem uma passada. ${acertos} direto.`,
      coletivo
        ? `${acertos} palavras. o grupo estava afiado.`
        : 'rodada limpa.',
    ]);

  // alto volume + boa taxa
  if (taxa >= 0.75 && acertos >= 6)
    return escolher([
      `${acertos} palavras. em ritmo. difícil de parar.`,
      coletivo
        ? `${acertos} palavras. o grupo estava acordado.`
        : 'palavra atrás de palavra.',
      'velocidade e precisão. raro.',
    ]);

  if (taxa >= 0.75 && acertos >= 3)
    return escolher([
      `${acertos} palavras. sólido.`,
      'quase tudo acertado.',
      'foi bem. o grupo vai cobrar mais.',
    ]);

  if (taxa >= 0.75)
    return escolher(['quase tudo acertado.', 'sólido.', 'limpou bem.']);

  // muitas passadas
  if (passados >= 5)
    return escolher([
      `${passados} descartadas. as proibidas fecharam caminhos.`,
      `muitas passadas. cada bloqueio custa.`,
      coletivo
        ? `${passados} palavras devolvidas. o grupo ficou esperando.`
        : `${passados} descartadas. foi seletivo demais.`,
    ]);
  if (passados >= 3)
    return escolher([
      `${passados} descartadas. a pressão aumenta.`,
      coletivo
        ? 'o grupo esperou, mas as palavras não vieram.'
        : 'muitas passadas. o grupo está observando.',
    ]);

  // tensão acumulada alta
  if (sessaoTensao > 0.65 && acertos > 0)
    return escolher([
      'nesse clima, não era fácil.',
      'depois de tanta tensão, cada acerto pesa.',
      coletivo ? 'o grupo respondeu mesmo assim.' : 'conseguiu se manter.',
    ]);

  // desempenho mediano — tom escala com sessão
  if (sessFinal)
    return escolher([
      isTvT
        ? 'o adversário está observando cada rodada.'
        : 'nas últimas rodadas. cada palavra conta.',
      `${acertos} acerto${acertos !== 1 ? 's' : ''}. não é o suficiente.`,
      'o timer está ficando menor. o erro também.',
    ]);

  return escolher([
    `${acertos} acerto${acertos !== 1 ? 's' : ''}.`,
    coletivo ? 'o grupo fez o que podia.' : 'passou pela vez.',
    'nem tudo sai como planejado.',
    isTvT ? 'o adversário anota tudo.' : 'o grupo vai cobrar mais.',
  ]);
}

function gerarTituloTurno(acertos: number): string {
  if (acertos === 0) return 'colapso.';
  if (acertos >= 6) return `${acertos} acertos. destruiu.`;
  if (acertos === 1) return 'um acerto.';
  return `${acertos} acertos.`;
}

function gerarTituloTurnoIntensidade(intensidade: IntensidadeVisual): string {
  if (intensidade === 'colapso') return 'em colapso';
  if (intensidade === 'panico') return 'em pânico';
  if (intensidade === 'pressao') return 'sob pressão';
  return 'tranquilo';
}

function calcularVelocidade(total: number, duracaoSegundos: number): string {
  const ppm = Math.round((total * 60) / duracaoSegundos);
  if (ppm === 0) return '0 palavras/min';
  if (ppm === 1) return '1 palavra/min';
  return `${ppm} palavras/min`;
}

function gerarTituloFim(totalAcertos: number, totalPalavras: number): string {
  if (totalPalavras === 0) return 'sessão encerrada.';
  const taxa = totalAcertos / totalPalavras;
  if (taxa >= 0.8) return 'o grupo se saiu bem.';
  if (taxa >= 0.6) return 'quase sem colapso.';
  if (taxa >= 0.4) return 'a língua travou algumas vezes.';
  if (taxa >= 0.25) return 'foi tenso.';
  return 'o grupo entrou em colapso.';
}

function gerarDestaques(
  jogadores: Jogador[],
  pontos: Record<string, number>,
  historico: TurnoSessao[],
  melhorStreakColetivo: number,
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time',
): string[] {
  const destaques: string[] = [];

  const ranking = [...jogadores].sort(
    (a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0),
  );
  const top = ranking[0];
  if (top && (pontos[top.id] ?? 0) > 0) {
    const pts = pontos[top.id] ?? 0;
    const frase =
      modoJogo === 'todos_juntos'
        ? `${top.nome} puxou mais — ${pts} acerto${pts !== 1 ? 's' : ''}.`
        : `${top.nome} carregou — ${pts} acerto${pts !== 1 ? 's' : ''}.`;
    destaques.push(frase);
  }

  if (melhorStreakColetivo >= 4 && modoJogo === 'todos_juntos') {
    destaques.push(
      `${melhorStreakColetivo} rodadas seguidas acertando. o grupo entrou em flow.`,
    );
  }

  let globalBestStreak = 0;
  let globalBestStreakId: string | null = null;
  for (const t of historico) {
    if (t.melhorStreak > globalBestStreak) {
      globalBestStreak = t.melhorStreak;
      globalBestStreakId = t.jogadorId;
    }
  }
  if (globalBestStreak >= 3 && globalBestStreakId && destaques.length < 3) {
    const j = jogadores.find((p) => p.id === globalBestStreakId);
    if (j) {
      destaques.push(
        `${j.nome} fez sequência de ${globalBestStreak}. o grupo ficou nervoso.`,
      );
    }
  }

  const clutch = historico.find(
    (t) => t.intensidadeFinal === 'colapso' && t.acertos > 0,
  );
  if (clutch && destaques.length < 3) {
    const j = jogadores.find((p) => p.id === clutch.jogadorId);
    if (j)
      destaques.push(`${j.nome} acertou em colapso. o grupo vai falar nisso.`);
  }

  const zerados = historico.filter((t) => t.acertos === 0).length;
  if (zerados >= 2 && destaques.length < 3) {
    destaques.push(`${zerados} rodadas zeradas. as proibidas tiveram bom dia.`);
  }

  const totalPassadas = historico.reduce((acc, t) => acc + t.passados, 0);
  if (totalPassadas >= 5 && destaques.length < 3) {
    destaques.push(
      `${totalPassadas} palavras descartadas. o grupo é seletivo.`,
    );
  }

  return destaques.slice(0, 3);
}

// ─── Identidade do grupo ──────────────────────────────────────────────────────

interface IdentidadeGrupo {
  frase: string;
  aftermath: string;
}

function detectarIdentidade(historico: TurnoSessao[]): IdentidadeGrupo {
  const total = historico.length;
  if (total === 0) return { frase: 'sessão encerrada.', aftermath: '' };

  const zerados = historico.filter((t) => t.acertos === 0).length;
  const colapsos = historico.filter(
    (t) => t.intensidadeFinal === 'colapso',
  ).length;
  const totalAcertos = historico.reduce((a, t) => a + t.acertos, 0);
  const totalPalavras = historico.reduce(
    (a, t) => a + t.acertos + t.passados,
    0,
  );
  const totalPassadas = historico.reduce((a, t) => a + t.passados, 0);
  const taxa = totalPalavras > 0 ? totalAcertos / totalPalavras : 0;
  const clutches = historico.filter(
    (t) => t.intensidadeFinal === 'colapso' && t.acertos > 0,
  ).length;
  const mediaPalavras = totalPalavras / total;

  if (zerados >= total * 0.5 || colapsos >= total * 0.65)
    return {
      frase: 'esse grupo claramente entra em pânico.',
      aftermath: 'o timer venceu mais batalhas do que deveria.',
    };
  if (taxa >= 0.78 && colapsos <= 1)
    return {
      frase: 'vocês ficaram perigosamente eficientes.',
      aftermath: 'o grupo funcionou como uma máquina.',
    };
  if (clutches >= 2)
    return {
      frase: 'vocês sobreviveram no caos.',
      aftermath: 'o grupo não cedeu quando deveria ter cedido.',
    };
  if (totalPassadas >= totalAcertos * 1.6 || taxa < 0.38)
    return {
      frase: 'isso saiu do controle muito rápido.',
      aftermath: 'as proibidas ganharam mais do que perderam.',
    };
  if (mediaPalavras < 3)
    return {
      frase: 'esse grupo opera no silêncio.',
      aftermath: 'as palavras vieram devagar. mas vieram.',
    };
  if (zerados === 0 && totalPalavras >= total * 3)
    return {
      frase: 'nenhuma rodada zerada. raro.',
      aftermath: 'o grupo aguentou tudo o que o timer jogou.',
    };
  return {
    frase: 'ninguém manteve a calma por muito tempo.',
    aftermath: 'foi tenso do começo ao fim.',
  };
}

// ─── Observação editorial entre rodadas ──────────────────────────────────────

function gerarObservacaoEntre(
  historico: TurnoSessao[],
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time',
  times?: TimesConfig,
  pontosA?: number,
  pontosB?: number,
): string | null {
  if (historico.length < 2) return null;

  const last = historico[historico.length - 1]!;
  const penult = historico[historico.length - 2]!;

  if (last.acertos === 0 && penult.acertos === 0)
    return 'vocês continuam piorando.';

  if (
    modoJogo === 'time_vs_time' &&
    times &&
    pontosA !== undefined &&
    pontosB !== undefined
  ) {
    const diff = Math.abs(pontosA - pontosB);
    if (diff >= 5) {
      const lider = pontosA > pontosB ? times.nomeA : times.nomeB;
      return `${lider} está dominando.`;
    }
  }

  const recentes = historico.slice(-3);
  const colapsosRecentes = recentes.filter(
    (t) => t.intensidadeFinal === 'colapso',
  ).length;
  if (colapsosRecentes >= 2) return 'ninguém sobrevive bem ao colapso.';

  if (penult.acertos === 0 && last.acertos >= 4) return 'a virada chegou.';

  const altos = historico.slice(-4).filter((t) => t.acertos >= 4).length;
  if (altos >= 3) return 'o ritmo está alto demais para durar.';

  const ultimasTres = historico.slice(-3);
  const totalPassadasRecentes = ultimasTres.reduce((a, t) => a + t.passados, 0);
  if (totalPassadasRecentes >= 9)
    return 'o grupo é seletivo demais. as proibidas sabem.';

  return null;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TelaJogoLocalNaPontaDaLingua({ navigation, route }: Props) {
  const {
    jogadores,
    duracaoSegundos,
    rodadasPorJogador,
    dificuldade,
    categorias,
    modoJogo,
    times,
  } = route.params;
  const insets = useSafeAreaInsets();
  const duracaoMs = duracaoSegundos * 1000;
  const totalTurnos = jogadores.length * rodadasPorJogador;

  const [fase, setFase] = useState<Fase>('preparo');
  const [indiceTurno, setIndiceTurno] = useState(0);
  const [turnosJogados, setTurnosJogados] = useState(0);
  const [pontos, setPontos] = useState<Record<string, number>>(
    Object.fromEntries(jogadores.map((j) => [j.id, 0])),
  );
  const [historico, setHistorico] = useState<TurnoSessao[]>([]);
  const [sessaoTensao, setSessaoTensao] = useState(0);
  const [turnoAtualSummary, setTurnoAtualSummary] =
    useState<TurnoSummary | null>(null);
  const [comentarioTurno, setComentarioTurno] = useState('');

  const cartasUsadasRef = useRef<string[]>([]);
  const sessaoTensaoRef = useRef(0);
  const primeiroTurnoRef = useRef(true);
  const streakColetivoRef = useRef(0);
  const melhorStreakColetivoRef = useRef(0);
  const progressaoSessaoRef = useRef(0);
  const pontosTimeARef = useRef(0);
  const pontosTimeBRef = useRef(0);

  const [streakColetivo, setStreakColetivo] = useState(0);
  const [melhorStreakColetivo, setMelhorStreakColetivo] = useState(0);
  const [progressaoSessao, setProgressaoSessao] = useState(0);
  const [pontosTimeA, setPontosTimeA] = useState(0);
  const [pontosTimeB, setPontosTimeB] = useState(0);
  const [palavraParaRoubo, setPalavraParaRoubo] = useState('');

  // Phase transition animation
  const phaseSlideX = useRef(new Animated.Value(0)).current;
  const phaseOp = useRef(new Animated.Value(1)).current;
  const ultimaFaseTransicaoRef = useRef<Fase>('preparo');

  useEffect(() => {
    if (ultimaFaseTransicaoRef.current === fase) return;
    const anterior = ultimaFaseTransicaoRef.current;
    ultimaFaseTransicaoRef.current = fase;

    // Direção: 0 = fade puro, 1 = entra pela direita
    let dir = 1;
    if (fase === 'fim' || fase === 'roubo') dir = 0;
    else if (fase === 'resumo_turno' && anterior === 'jogando') dir = 0;

    phaseSlideX.setValue(dir * SCREEN_W * 0.22);
    phaseOp.setValue(0);

    Animated.parallel([
      dir !== 0
        ? Animated.spring(phaseSlideX, {
            toValue: 0,
            damping: 28,
            mass: 0.75,
            stiffness: 190,
            useNativeDriver: true,
          })
        : Animated.timing(phaseSlideX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
      Animated.timing(phaseOp, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  // Inicialização do áudio
  useEffect(() => {
    void inicializarAudio();
    return () => {
      void liberarAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getTimeDoJogador(id: string): 'A' | 'B' {
    return times?.idsA.includes(id) ? 'A' : 'B';
  }

  function getNomeTimeAdversario(): string {
    const timeAtual = getTimeDoJogador(jogadorAtual.id);
    return timeAtual === 'A'
      ? (times?.nomeB ?? 'Time B')
      : (times?.nomeA ?? 'Time A');
  }

  const jogadorAtual = jogadores[indiceTurno % jogadores.length]!;

  function sortearProxima(): Carta {
    const carta = selecionarCartaInteligente(
      cartasUsadasRef.current,
      dificuldade as DificuldadeNPL | 'todas',
      categorias,
      turnosJogados,
      totalTurnos,
    );
    cartasUsadasRef.current = [...cartasUsadasRef.current, carta.id];
    return carta;
  }

  function atualizarTensao(
    intensidade: IntensidadeVisual,
    acertos: number,
    passados: number,
  ) {
    const peso =
      intensidade === 'colapso'
        ? 0.3
        : intensidade === 'panico'
          ? 0.2
          : intensidade === 'pressao'
            ? 0.1
            : 0.05;
    const total = acertos + passados;
    const taxa = total > 0 ? acertos / total : 0;
    const delta = taxa < 0.3 ? peso : taxa > 0.7 ? -0.05 : 0;
    const nova = Math.max(0, Math.min(1, sessaoTensaoRef.current + delta));
    sessaoTensaoRef.current = nova;
    setSessaoTensao(nova);
  }

  function aoTurnoCompleto(summary: TurnoSummary) {
    setPontos((p) => ({
      ...p,
      [jogadorAtual.id]: (p[jogadorAtual.id] ?? 0) + summary.acertos,
    }));

    // Team scores for TvT
    if (modoJogo === 'time_vs_time' && times) {
      if (getTimeDoJogador(jogadorAtual.id) === 'A') {
        pontosTimeARef.current += summary.acertos;
        setPontosTimeA(pontosTimeARef.current);
      } else {
        pontosTimeBRef.current += summary.acertos;
        setPontosTimeB(pontosTimeBRef.current);
      }
    }

    const sessao: TurnoSessao = { jogadorId: jogadorAtual.id, ...summary };
    setHistorico((h) => [...h, sessao]);
    atualizarTensao(
      summary.intensidadeFinal,
      summary.acertos,
      summary.passados,
    );

    // Session progression
    const novaProgressao = Math.min(1, (turnosJogados + 1) / totalTurnos);
    progressaoSessaoRef.current = novaProgressao;
    setProgressaoSessao(novaProgressao);

    if (summary.acertos > 0) {
      const novoStreak = streakColetivoRef.current + 1;
      streakColetivoRef.current = novoStreak;
      melhorStreakColetivoRef.current = Math.max(
        melhorStreakColetivoRef.current,
        novoStreak,
      );
      setStreakColetivo(novoStreak);
      setMelhorStreakColetivo(melhorStreakColetivoRef.current);
    } else {
      streakColetivoRef.current = 0;
      setStreakColetivo(0);
    }

    const comentario = gerarComentarioTurno(
      summary.acertos,
      summary.passados,
      summary.melhorStreak,
      summary.intensidadeFinal,
      sessaoTensaoRef.current,
      streakColetivoRef.current,
      modoJogo,
      progressaoSessaoRef.current,
      historico[historico.length - 1] ?? null,
    );
    setComentarioTurno(comentario);
    setTurnoAtualSummary(summary);
    primeiroTurnoRef.current = false;

    if (modoJogo === 'time_vs_time') {
      setPalavraParaRoubo(summary.ultimaPalavra);
      setFase('roubo');
    } else {
      setFase('resumo_turno');
    }
  }

  function aoRoubou() {
    if (!times) return;
    const timeAdversario =
      getTimeDoJogador(jogadorAtual.id) === 'A' ? 'B' : 'A';
    if (timeAdversario === 'A') {
      pontosTimeARef.current += 1;
      setPontosTimeA(pontosTimeARef.current);
    } else {
      pontosTimeBRef.current += 1;
      setPontosTimeB(pontosTimeBRef.current);
    }
    setFase('resumo_turno');
  }

  function aoNinguemRoubou() {
    setFase('resumo_turno');
  }

  function proximoTurno() {
    const novosTurnos = turnosJogados + 1;
    setTurnosJogados(novosTurnos);
    if (novosTurnos >= totalTurnos) {
      setFase('fim');
      return;
    }
    // Não incrementa indiceTurno aqui — incrementa ao confirmar FaseEntre,
    // para que proximoJogador exibido coincida com jogadorAtual em FasePreparo.
    setFase('entre');
  }

  function sairLimpo() {
    navigation.navigate('Inicio');
  }

  if (fase === 'fim') {
    return (
      <FaseFim
        jogadores={jogadores}
        pontos={pontos}
        historico={historico}
        modoJogo={modoJogo}
        melhorStreakColetivo={melhorStreakColetivo}
        times={times}
        pontosTimeA={pontosTimeA}
        pontosTimeB={pontosTimeB}
        onSair={sairLimpo}
        insets={insets}
      />
    );
  }

  const proximoJogador = jogadores[(indiceTurno + 1) % jogadores.length];

  return (
    <View
      style={[
        estilos.tela,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <BotaoEncerrarJogo onConfirmar={sairLimpo} />

      <View style={estilos.cabecalho}>
        <Text style={estilos.progresso}>
          {turnosJogados} / {totalTurnos}
        </Text>
      </View>

      <Animated.View
        style={[
          estilos.phaseContainer,
          { transform: [{ translateX: phaseSlideX }], opacity: phaseOp },
        ]}
      >
        {fase === 'preparo' && (
          <FasePreparo
            jogador={jogadorAtual}
            sessaoTensao={sessaoTensao}
            isFirst={primeiroTurnoRef.current}
            modoJogo={modoJogo}
            streakColetivo={streakColetivo}
            progressaoSessao={progressaoSessao}
            times={times}
            onPronto={() => setFase('jogando')}
          />
        )}
        {fase === 'jogando' && (
          <FaseJogando
            sortearProxima={sortearProxima}
            duracaoMs={duracaoMs}
            modoJogo={modoJogo}
            progressaoSessao={progressaoSessao}
            onTurnoCompleto={aoTurnoCompleto}
          />
        )}
        {fase === 'resumo_turno' && turnoAtualSummary && (
          <FaseTurnoSummary
            jogadorNome={jogadorAtual.nome}
            summary={turnoAtualSummary}
            comentario={comentarioTurno}
            duracaoSegundos={duracaoSegundos}
            modoJogo={modoJogo}
            streakColetivo={streakColetivo}
            onProximo={proximoTurno}
            isUltimo={turnosJogados + 1 >= totalTurnos}
          />
        )}
        {fase === 'roubo' && (
          <FaseRoubo
            nomeTimeAdversario={getNomeTimeAdversario()}
            palavraParaRoubo={palavraParaRoubo}
            onRoubou={aoRoubou}
            onNinguem={aoNinguemRoubou}
          />
        )}
        {fase === 'entre' && (
          <FaseEntre
            jogadores={jogadores}
            pontos={pontos}
            proximoJogador={proximoJogador ?? jogadores[0]!}
            modoJogo={modoJogo}
            streakColetivo={streakColetivo}
            times={times}
            pontosTimeA={pontosTimeA}
            pontosTimeB={pontosTimeB}
            historico={historico}
            onPronto={() => {
              setIndiceTurno((i) => i + 1);
              setFase('preparo');
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}

// ─── FasePreparo ──────────────────────────────────────────────────────────────

function FasePreparo({
  jogador,
  sessaoTensao,
  isFirst,
  modoJogo,
  streakColetivo,
  progressaoSessao,
  times,
  onPronto,
}: {
  jogador: Jogador;
  sessaoTensao: number;
  isFirst: boolean;
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time';
  streakColetivo: number;
  progressaoSessao: number;
  times?: TimesConfig;
  onPronto: () => void;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const nomeY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.timing(nomeY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTvT = modoJogo === 'time_vs_time';
  const isColetivo = modoJogo === 'todos_juntos' || isTvT;

  const teamDoJogador =
    isTvT && times
      ? times.idsA.includes(jogador.id)
        ? times.nomeA
        : times.nomeB
      : null;

  const instrucao =
    streakColetivo >= 4
      ? 'o grupo está quente. mantém.'
      : streakColetivo >= 2
        ? 'o ritmo está bom. não quebra.'
        : progressaoSessao > 0.75
          ? isTvT
            ? 'o adversário está contando os seus erros.'
            : 'as últimas rodadas. não dá pra voltar.'
          : progressaoSessao > 0.5
            ? isTvT
              ? 'o adversário observa cada palavra.'
              : 'o grupo já sente a pressão.'
            : sessaoTensao < 0.3
              ? isColetivo
                ? 'grupo todo responde. outros viram.'
                : 'outros virem o celular.'
              : sessaoTensao < 0.65
                ? isColetivo
                  ? isTvT
                    ? 'só o time pode responder.'
                    : 'o grupo vai responder junto.'
                  : 'o grupo está te observando.'
                : isTvT
                  ? 'o timer está contra vocês dois.'
                  : isColetivo
                    ? 'o grupo está tenso. você também.'
                    : 'o grupo não vai te ajudar.';

  const tutorial = isTvT
    ? 'faça seu time adivinhar o máximo.\nse não acertarem — o adversário pode roubar.'
    : isColetivo
      ? 'faça o grupo adivinhar o máximo de palavras.\ntodos podem responder. o timer não para.'
      : 'faça o grupo adivinhar o máximo de palavras\nsem dizer as proibidas. o timer não para.';

  const label = isTvT
    ? teamDoJogador
      ? `${teamDoJogador} explica`
      : 'explica agora'
    : isColetivo
      ? 'explica agora'
      : 'é a vez de';

  return (
    <Pressable style={estilos.faseTela} onPress={onPronto}>
      <Animated.View style={[estilos.preparoContainer, { opacity: op }]}>
        <Text style={estilos.preparoLabel}>{label}</Text>
        <Animated.Text
          style={[estilos.preparoNome, { transform: [{ translateY: nomeY }] }]}
        >
          {jogador.nome}
        </Animated.Text>
        {isFirst && <Text style={estilos.preparoTutorial}>{tutorial}</Text>}
        {streakColetivo >= 2 && (
          <View style={estilos.preparoMomentumBadge}>
            <Text style={estilos.preparoMomentumTexto}>
              {streakColetivo >= 4
                ? `${streakColetivo} rodadas em ritmo`
                : `${streakColetivo} seguidas`}
            </Text>
          </View>
        )}
        {progressaoSessao > 0.75 && streakColetivo < 2 && (
          <View style={estilos.preparoSessaoFinalBadge}>
            <Text style={estilos.preparoSessaoFinalTexto}>últimas rodadas</Text>
          </View>
        )}
        <Text style={estilos.preparoInstrucao}>{instrucao}</Text>
        <Text style={estilos.preparoToque}>toque quando estiver pronto.</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── FaseJogando ──────────────────────────────────────────────────────────────

function FaseJogando({
  sortearProxima,
  duracaoMs,
  modoJogo,
  progressaoSessao,
  onTurnoCompleto,
}: {
  sortearProxima: () => Carta;
  duracaoMs: number;
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time';
  progressaoSessao: number;
  onTurnoCompleto: (summary: TurnoSummary) => void;
}) {
  const [cartaAtual, setCartaAtual] = useState<Carta>(() => sortearProxima());
  const [tempoRestanteMs, setTempoRestanteMs] = useState(duracaoMs);
  const [intensidade, setIntensidade] = useState<IntensidadeVisual>('calmo');
  const [streakAtual, setStreakAtual] = useState(0);
  const [acertosDisplay, setAcertosDisplay] = useState(0);

  // ── Condições especiais da carta atual ────────────────────────────────────
  const [proibidasOcultas, setProibidasOcultas] = useState(
    () => cartaAtual.condicao === 'proibidas_ocultas',
  );
  const [surtoAtivo, setSurtoAtivo] = useState(
    () => cartaAtual.condicao === 'surto',
  );
  const [colapsoVisualExtra, setColapsoVisualExtra] = useState(() =>
    cartaAtual.condicao === 'colapso_visual' ? 0.3 : 0,
  );
  const proibidasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const terminouRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const startRef = useRef(Date.now());
  const intensidadeRef = useRef<IntensidadeVisual>('calmo');
  const cartaRef = useRef<Carta>(cartaAtual);
  const lastActionRef = useRef(Date.now());
  const quaseFalouFiredRef = useRef(false);

  // Turn accumulators
  const acertosRef = useRef(0);
  const passadosRef = useRef(0);
  const streakRef = useRef(0);
  const melhorStreakRef = useRef(0);
  const historicoRef = useRef<HistoricoTurnoItem[]>([]);

  // Animations — pressure system
  const shakeX = useRef(new Animated.Value(0)).current;
  const vignetteOp = useRef(new Animated.Value(0)).current;
  const palavraScale = useRef(new Animated.Value(1)).current;
  const respiracaoOp = useRef(new Animated.Value(1)).current;
  const timerScale = useRef(new Animated.Value(1)).current;
  const proibidasPulse = useRef(new Animated.Value(1)).current;
  const proibidasInvasaoY = useRef(new Animated.Value(0)).current;

  // Animations — card transition
  const cardSlideX = useRef(new Animated.Value(0)).current;
  const cardOp = useRef(new Animated.Value(1)).current;

  // Áudio — drone
  const ultimoSegundoRef = useRef(Math.ceil(duracaoMs / 1000));

  useEffect(() => {
    void iniciarDrone();
    // Aplica condição da carta inicial (sorteada no useState)
    aplicarCondicaoCarta(cartaRef.current);
    return () => {
      void pararDrone();
      if (proibidasTimerRef.current) clearTimeout(proibidasTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shakeLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulsoRef = useRef<Animated.CompositeAnimation | null>(null);
  const respiracaoRef = useRef<Animated.CompositeAnimation | null>(null);

  const pct = tempoRestanteMs / duracaoMs;
  // Session escalation: pressure kicks in earlier in later rounds
  // colapso_visual cards add extra offset to make UI collapse sooner
  const pctVisual = Math.max(
    0,
    pct - progressaoSessao * 0.12 - colapsoVisualExtra,
  );
  // surto cards force colapso intensity from the very first second
  const intensidadeVisual: IntensidadeVisual = surtoAtivo
    ? 'colapso'
    : calcularIntensidade(pctVisual);
  const corTimer = COR_TIMER[intensidadeVisual];
  const segundosExibidos = Math.ceil(tempoRestanteMs / 1000);

  // Timer loop — includes quase falou detection
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const restante = Math.max(0, duracaoMs - elapsed);
      setTempoRestanteMs(restante);

      const pctNow = restante / duracaoMs;

      // Tick de áudio por segundo (últimos 15s)
      const segundoAtual = Math.ceil(restante / 1000);
      if (segundoAtual < ultimoSegundoRef.current && restante > 0) {
        ultimoSegundoRef.current = segundoAtual;
        if (
          segundoAtual <= 12 &&
          calcularIntensidade(restante / duracaoMs) !== 'calmo'
        ) {
          void tocarTick();
        }
      }

      // Quase falou: idle > 7s during active play, not in final 15%
      const idleSecs = (Date.now() - lastActionRef.current) / 1000;
      if (
        idleSecs > 7 &&
        !quaseFalouFiredRef.current &&
        pctNow > 0.15 &&
        pctNow < 0.85 &&
        !terminouRef.current
      ) {
        quaseFalouFiredRef.current = true;
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Animated.sequence([
          Animated.timing(shakeX, {
            toValue: 5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeX, {
            toValue: -5,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shakeX, {
            toValue: 3,
            duration: 55,
            useNativeDriver: true,
          }),
          Animated.timing(shakeX, {
            toValue: 0,
            duration: 55,
            useNativeDriver: true,
          }),
        ]).start();
        Animated.sequence([
          Animated.timing(proibidasPulse, {
            toValue: 1.05,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(proibidasPulse, {
            toValue: 0.96,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(proibidasPulse, {
            toValue: 1.0,
            duration: 140,
            useNativeDriver: true,
          }),
        ]).start();
      }

      if (restante <= 0 && !terminouRef.current) {
        terminouRef.current = true;
        clearInterval(interval);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
        onTurnoCompleto({
          acertos: acertosRef.current,
          passados: passadosRef.current,
          melhorStreak: melhorStreakRef.current,
          historico: historicoRef.current,
          intensidadeFinal: intensidadeRef.current,
          ultimaPalavra: cartaRef.current.palavra,
        });
      }
    }, 80);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hesitation pulse at 40% elapsed
  useEffect(() => {
    const t = setTimeout(() => {
      if (terminouRef.current) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.timing(proibidasPulse, {
          toValue: 1.025,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(proibidasPulse, {
          toValue: 0.985,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(proibidasPulse, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, duracaoMs * 0.4);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intensity transitions — visual uses session-escalated pctVisual; stored uses true pct for summary
  useEffect(() => {
    const novaReal = calcularIntensidade(pct);
    if (novaReal !== intensidade) {
      setIntensidade(novaReal);
      intensidadeRef.current = novaReal;
    }
    const novaVisual = calcularIntensidade(pctVisual);
    if (novaVisual !== intensidade) {
      aplicarIntensidade(novaVisual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestanteMs]);

  function pararAnimacoesPressao() {
    shakeLoopRef.current?.stop();
    pulsoRef.current?.stop();
    respiracaoRef.current?.stop();
    shakeX.setValue(0);
    respiracaoOp.setValue(1);
  }

  function aplicarIntensidade(nivel: IntensidadeVisual) {
    pararAnimacoesPressao();

    void setIntensidadeDrone(nivel);

    Animated.timing(vignetteOp, {
      toValue: OPACIDADE_VIGNETTE[nivel],
      duration: nivel === 'colapso' ? 400 : 600,
      useNativeDriver: true,
    }).start();

    // Proibidas invasion — palavras proibidas sobem em direção à palavra
    const invasaoTargets: Record<IntensidadeVisual, number> = {
      calmo: 0,
      pressao: -5,
      panico: -12,
      colapso: -22,
    };
    Animated.timing(proibidasInvasaoY, {
      toValue: invasaoTargets[nivel],
      duration: nivel === 'colapso' ? 700 : 700,
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
          Animated.timing(palavraScale, {
            toValue: 1.02,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(palavraScale, {
            toValue: 1.0,
            duration: 320,
            useNativeDriver: true,
          }),
        ]),
      );
      pulsoRef.current.start();
      respiracaoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(respiracaoOp, {
            toValue: 0.97,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(respiracaoOp, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      );
      respiracaoRef.current.start();
      return;
    }

    if (nivel === 'panico') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      pulsoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(palavraScale, {
            toValue: 1.045,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(palavraScale, {
            toValue: 0.97,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
      );
      pulsoRef.current.start();
      respiracaoRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(respiracaoOp, {
            toValue: 0.93,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(respiracaoOp, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
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
        Animated.timing(palavraScale, {
          toValue: 1.06,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(palavraScale, {
          toValue: 0.96,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    );
    pulsoRef.current.start();
    respiracaoRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(respiracaoOp, {
          toValue: 0.87,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(respiracaoOp, {
          toValue: 1.0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    respiracaoRef.current.start();
    iniciarShake(7);
    Animated.sequence([
      Animated.timing(timerScale, {
        toValue: 1.1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(timerScale, {
        toValue: 0.93,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(timerScale, {
        toValue: 1.0,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function aplicarCondicaoCarta(carta: Carta) {
    const condicao = carta.condicao;

    // Limpa timer anterior de proibidas_ocultas se existir
    if (proibidasTimerRef.current) {
      clearTimeout(proibidasTimerRef.current);
      proibidasTimerRef.current = null;
    }

    setProibidasOcultas(condicao === 'proibidas_ocultas');
    setSurtoAtivo(condicao === 'surto');
    setColapsoVisualExtra(condicao === 'colapso_visual' ? 0.3 : 0);

    if (condicao === 'relampago') {
      // Rouba 15s do tempo restante avançando o ponto de início
      startRef.current = Math.min(
        startRef.current - 15_000,
        Date.now() - Math.max(0, duracaoMs - 1000), // garante pelo menos 1s restante
      );
    }

    if (condicao === 'proibidas_ocultas') {
      proibidasTimerRef.current = setTimeout(() => {
        setProibidasOcultas(false);
      }, 10_000);
    }
  }

  function iniciarShake(amplitude: number) {
    shakeLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeX, {
          toValue: amplitude,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: -amplitude * 0.8,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: amplitude * 0.4,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.timing(shakeX, {
          toValue: 0,
          duration: 45,
          useNativeDriver: true,
        }),
      ]),
    );
    shakeLoopRef.current.start();
  }

  function registrarEAvancar(resultado: 'acertou' | 'passou') {
    if (terminouRef.current || isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    lastActionRef.current = Date.now();
    quaseFalouFiredRef.current = false;

    const cartaAnterior = cartaRef.current;
    historicoRef.current = [
      ...historicoRef.current,
      { palavra: cartaAnterior.palavra, resultado },
    ];

    if (resultado === 'acertou') {
      acertosRef.current += 1;
      streakRef.current += 1;
      melhorStreakRef.current = Math.max(
        melhorStreakRef.current,
        streakRef.current,
      );
      setAcertosDisplay(acertosRef.current);
      setStreakAtual(streakRef.current);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void tocarAcerto();
    } else {
      streakRef.current = 0;
      passadosRef.current += 1;
      setStreakAtual(0);
      // Medium impact — dismissal feel, not a hit
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      void tocarFalha();
    }

    // acertou exits LEFT (forward), passou exits RIGHT (discarded back)
    const exitX = resultado === 'acertou' ? -SCREEN_W * 0.6 : SCREEN_W * 0.6;
    const enterX = resultado === 'acertou' ? SCREEN_W * 0.6 : -SCREEN_W * 0.6;

    Animated.parallel([
      Animated.timing(cardSlideX, {
        toValue: exitX,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(cardOp, {
        toValue: 0,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const novaCarta = sortearProxima();
      cartaRef.current = novaCarta;
      setCartaAtual(novaCarta);
      aplicarCondicaoCarta(novaCarta);
      cardSlideX.setValue(enterX);
      cardOp.setValue(0);
      Animated.parallel([
        Animated.timing(cardSlideX, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(cardOp, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isTransitioningRef.current = false;
      });
    });
  }

  return (
    <Animated.View
      style={[
        estilos.jogandoContainer,
        { transform: [{ translateX: shakeX }], opacity: respiracaoOp },
      ]}
    >
      {/* Header row: streak | timer | count */}
      <View style={estilos.jogandoHeader}>
        <View style={estilos.jogandoHeaderSide}>
          {streakAtual >= 2 && (
            <View style={estilos.streakBadge}>
              <Text style={estilos.streakBadgeTexto}>{streakAtual}×</Text>
            </View>
          )}
        </View>
        <Animated.Text
          style={[
            estilos.timerNumero,
            { color: corTimer, transform: [{ scale: timerScale }] },
          ]}
        >
          {segundosExibidos}
        </Animated.Text>
        <View style={estilos.jogandoHeaderSide}>
          <Text
            style={[
              estilos.acertosCounter,
              { color: acertosDisplay > 0 ? cores.acento : cores.textoMudo },
            ]}
          >
            {acertosDisplay > 0 ? `${acertosDisplay} ✓` : '—'}
          </Text>
        </View>
      </View>

      {/* Timer bar */}
      <View style={estilos.timerBarra}>
        <View
          style={[
            estilos.timerBarraPreenchida,
            { width: `${Math.max(0, pct * 100)}%`, backgroundColor: corTimer },
          ]}
        />
      </View>

      {modoJogo === 'todos_juntos' && (
        <View style={estilos.todosRespondemBadge}>
          <Text style={estilos.todosRespondemTexto}>TODOS RESPONDEM</Text>
        </View>
      )}

      {/* Card: word + proibidas — slides on transition */}
      <Animated.View
        style={[
          estilos.cardContainer,
          {
            transform: [{ translateX: cardSlideX }, { scale: palavraScale }],
            opacity: cardOp,
          },
        ]}
      >
        <Text style={estilos.palavraPrincipal}>{cartaAtual.palavra}</Text>
        <Animated.View
          style={[
            estilos.proibidasBloco,
            {
              transform: [
                { scale: proibidasPulse },
                { translateY: proibidasInvasaoY },
              ],
            },
          ]}
        >
          {proibidasOcultas ? (
            <Text style={estilos.proibidasOcultasTexto}>
              proibidas ocultas por 10s…
            </Text>
          ) : (
            cartaAtual.proibidas.map((p, i) => (
              <ProibidaItem
                key={`${cartaAtual.id}-${i}`}
                palavra={p}
                index={i}
                intensidade={intensidadeVisual}
              />
            ))
          )}
        </Animated.View>
      </Animated.View>

      {/* Buttons */}
      <View style={estilos.controlesContainer}>
        <Pressable
          onPress={() => registrarEAvancar('passou')}
          style={({ pressed }) => [
            estilos.btnPassou,
            pressed && estilos.btnPressionado,
          ]}
        >
          <Text style={estilos.btnPassouTexto}>passou</Text>
        </Pressable>
        <Pressable
          onPress={() => registrarEAvancar('acertou')}
          style={({ pressed }) => [
            estilos.btnAcertou,
            pressed && estilos.btnPressionado,
          ]}
        >
          <Text style={estilos.btnAcertouTexto}>acertou ✓</Text>
        </Pressable>
      </View>

      {/* Vignette overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          estilos.vignette,
          { opacity: vignetteOp },
        ]}
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
  const breatheY = useRef(new Animated.Value(0)).current;
  const flickerRef = useRef<Animated.CompositeAnimation | null>(null);
  const breatheRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    flickerRef.current?.stop();
    breatheRef.current?.stop();
    flickerOp.setValue(1);
    breatheY.setValue(0);

    if (intensidade === 'pressao') {
      // Pressao: breatheY fica em 0 — proibidas ficam estáticas, sem float atmosférico
      return undefined;
    }

    if (intensidade === 'panico') {
      // Irregular opacity oscillation — each word at different speed
      const delay = index * 80;
      const t = setTimeout(() => {
        flickerRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(flickerOp, {
              toValue: 0.55 + index * 0.06,
              duration: 320 + index * 60,
              useNativeDriver: true,
            }),
            Animated.timing(flickerOp, {
              toValue: 1,
              duration: 380 + index * 45,
              useNativeDriver: true,
            }),
            Animated.delay(300 + index * 70),
          ]),
        );
        flickerRef.current.start();
      }, delay);
      return () => clearTimeout(t);
    }

    if (intensidade === 'colapso') {
      // Aggressive flicker — unpredictable, each word different timing
      const delay = index * 100;
      const t = setTimeout(() => {
        flickerRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(flickerOp, {
              toValue: 0.15 + index * 0.04,
              duration: 55 + index * 22,
              useNativeDriver: true,
            }),
            Animated.timing(flickerOp, {
              toValue: 1,
              duration: 90 + index * 12,
              useNativeDriver: true,
            }),
            Animated.delay(120 + index * 65),
          ]),
        );
        flickerRef.current.start();
      }, delay);
      return () => clearTimeout(t);
    }

    return undefined;
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
          transform: [{ translateY: breatheY }],
        },
      ]}
    >
      <Text style={estilos.proibidaTexto}>{palavra}</Text>
    </Animated.View>
  );
}

// ─── FaseRoubo ────────────────────────────────────────────────────────────────

function FaseRoubo({
  nomeTimeAdversario,
  palavraParaRoubo,
  onRoubou,
  onNinguem,
}: {
  nomeTimeAdversario: string;
  palavraParaRoubo: string;
  onRoubou: () => void;
  onNinguem: () => void;
}) {
  type RouboFase = 'silencio' | 'reveal' | 'countdown';
  const [rouboFase, setRouboFase] = useState<RouboFase>('silencio');
  const [contagem, setContagem] = useState(5);
  const [roubado, setRoubado] = useState(false);

  const fundoOp = useRef(new Animated.Value(0)).current;
  const tempoOp = useRef(new Animated.Value(0)).current;
  const palavraOp = useRef(new Animated.Value(0)).current;
  const teamOp = useRef(new Animated.Value(0)).current;
  const contagemScale = useRef(new Animated.Value(0.6)).current;
  const contagemOp = useRef(new Animated.Value(0)).current;
  const btnOp = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Entrada direta — sem silêncio atmosférico
    Animated.timing(fundoOp, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    void tocarRoubo();

    // "tempo." aparece
    const t1 = setTimeout(() => {
      Animated.timing(tempoOp, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }, 200);

    // palavra revelada
    const t2 = setTimeout(() => {
      Animated.timing(palavraOp, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }, 500);

    // time adversário pode roubar
    const t3 = setTimeout(() => {
      setRouboFase('reveal');
      Animated.timing(teamOp, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 700);

    // countdown começa
    const t4 = setTimeout(() => {
      setRouboFase('countdown');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Animated.parallel([
        Animated.timing(contagemOp, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(contagemScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
      // botão aparece logo após
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(btnOp, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(btnScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    }, 900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown tick
  useEffect(() => {
    if (rouboFase !== 'countdown' || roubado) return;
    if (contagem <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onNinguem();
      return;
    }
    const t = setTimeout(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Pulse the countdown number
      Animated.sequence([
        Animated.timing(contagemScale, {
          toValue: 1.18,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(contagemScale, {
          toValue: 1.0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      setContagem((c) => c - 1);
    }, 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rouboFase, contagem, roubado]);

  function aoRoubar() {
    if (roubado) return;
    setRoubado(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // flash
    Animated.sequence([
      Animated.timing(fundoOp, {
        toValue: 0.6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fundoOp, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => onRoubou());
  }

  return (
    <Animated.View style={[estilos.rouboTela, { opacity: fundoOp }]}>
      <Animated.Text style={[estilos.rouboTempoTexto, { opacity: tempoOp }]}>
        tempo.
      </Animated.Text>

      {palavraParaRoubo.length > 0 && (
        <Animated.Text style={[estilos.rouboPalavra, { opacity: palavraOp }]}>
          {palavraParaRoubo}
        </Animated.Text>
      )}

      {(rouboFase === 'reveal' || rouboFase === 'countdown') && (
        <Animated.Text style={[estilos.rouboTimeTexto, { opacity: teamOp }]}>
          {nomeTimeAdversario} pode roubar.
        </Animated.Text>
      )}

      {rouboFase === 'countdown' && (
        <>
          <Animated.Text
            style={[
              estilos.rouboContagem,
              { opacity: contagemOp, transform: [{ scale: contagemScale }] },
            ]}
          >
            {contagem}
          </Animated.Text>

          <Animated.View
            style={{ opacity: btnOp, transform: [{ scale: btnScale }] }}
          >
            <Pressable
              onPress={aoRoubar}
              style={({ pressed }) => [
                estilos.rouboBotao,
                pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={estilos.rouboBotaoTexto}>ROUBAMOS</Text>
            </Pressable>
          </Animated.View>
        </>
      )}

      {roubado && <Text style={estilos.rouboConfirmado}>roubado.</Text>}
    </Animated.View>
  );
}

// ─── FaseTurnoSummary ─────────────────────────────────────────────────────────

function HistoricoItemAnimado({
  item,
  index,
}: {
  item: HistoricoTurnoItem;
  index: number;
}) {
  const op = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const t = setTimeout(
      () => {
        Animated.parallel([
          Animated.timing(op, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(y, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      },
      280 + index * 75,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const corResultado =
    item.resultado === 'acertou' ? cores.sucesso : cores.textoMudo;
  const simbolo = item.resultado === 'acertou' ? '✓' : '—';

  return (
    <Animated.View
      style={[
        estilos.historicoItem,
        { opacity: op, transform: [{ translateY: y }] },
      ]}
    >
      <Text style={[estilos.historicoSimbolo, { color: corResultado }]}>
        {simbolo}
      </Text>
      <Text style={estilos.historicoPalavra}>{item.palavra}</Text>
    </Animated.View>
  );
}

function FaseTurnoSummary({
  jogadorNome,
  summary,
  comentario,
  duracaoSegundos,
  modoJogo,
  streakColetivo,
  onProximo,
  isUltimo,
}: {
  jogadorNome: string;
  summary: TurnoSummary;
  comentario: string;
  duracaoSegundos: number;
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time';
  streakColetivo: number;
  onProximo: () => void;
  isUltimo: boolean;
}) {
  // Silence gate: turno zerado → pausa contemplativa antes do resumo
  const ehColapsoTotal =
    summary.acertos === 0 && summary.intensidadeFinal === 'colapso';
  const [silencioAtivo, setSilencioAtivo] = useState(ehColapsoTotal);
  const silencioOp = useRef(new Animated.Value(ehColapsoTotal ? 0 : 1)).current;

  useEffect(() => {
    if (!ehColapsoTotal) return;
    Animated.timing(silencioOp, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(silencioOp, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSilencioAtivo(false);
      });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (silencioAtivo) {
    return (
      <Animated.View style={[estilos.silencioTela, { opacity: silencioOp }]}>
        <Text style={estilos.silencioTexto}>colapso.</Text>
        <Text style={estilos.silencioSub}>o timer ganhou essa.</Text>
      </Animated.View>
    );
  }

  const tituloOp = useRef(new Animated.Value(0)).current;
  const comentarioOp = useRef(new Animated.Value(0)).current;
  const botaoOp = useRef(new Animated.Value(0)).current;

  const palavrasDelay = 280 + summary.historico.length * 75 + 280;
  const comentarioDelay = palavrasDelay + 200;
  const botaoDelay = Math.max(2200, comentarioDelay + 700);

  useEffect(() => {
    Animated.timing(tituloOp, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    const t1 = setTimeout(() => {
      Animated.timing(comentarioOp, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }, comentarioDelay);
    const t2 = setTimeout(() => {
      Animated.timing(botaoOp, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, botaoDelay);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titulo = gerarTituloTurno(summary.acertos);
  const totalPalavras = summary.acertos + summary.passados;
  const velocidade = calcularVelocidade(totalPalavras, duracaoSegundos);
  const tensaoLabel = gerarTituloTurnoIntensidade(summary.intensidadeFinal);
  const nomeLabel =
    modoJogo === 'todos_juntos' ? `o grupo com ${jogadorNome}` : jogadorNome;
  const showMomentum = streakColetivo >= 2 && summary.acertos > 0;

  return (
    <ScrollView
      style={estilos.resumoScroll}
      contentContainerStyle={estilos.resumoContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: tituloOp }}>
        <Text style={estilos.resumoTitulo}>{titulo}</Text>
        <Text style={estilos.resumoJogador}>{nomeLabel}</Text>
        <View style={estilos.resumoMetaRow}>
          <Text style={estilos.resumoMetaItem}>{tensaoLabel}</Text>
          {totalPalavras > 0 && (
            <>
              <Text style={estilos.resumoMetaDivisor}>·</Text>
              <Text style={estilos.resumoMetaItem}>{velocidade}</Text>
            </>
          )}
          {showMomentum && (
            <>
              <Text style={estilos.resumoMetaDivisor}>·</Text>
              <Text style={estilos.resumoMetaMomentum}>
                {streakColetivo}× ritmo
              </Text>
            </>
          )}
        </View>
      </Animated.View>

      {summary.historico.length > 0 && (
        <View style={estilos.historicoBlocoContainer}>
          {summary.historico.map((item, i) => (
            <HistoricoItemAnimado
              key={`${item.palavra}-${i}`}
              item={item}
              index={i}
            />
          ))}
        </View>
      )}

      <Animated.Text
        style={[estilos.resumoComentario, { opacity: comentarioOp }]}
      >
        {comentario}
      </Animated.Text>

      <Animated.View style={{ opacity: botaoOp, marginTop: espacamento.xl }}>
        <Pressable
          onPress={onProximo}
          style={({ pressed }) => [
            estilos.btnProximo,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={estilos.btnProximoTexto}>
            {isUltimo ? 'ver resultado →' : 'próximo →'}
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// ─── FaseEntre ────────────────────────────────────────────────────────────────

function FaseEntre({
  jogadores,
  pontos,
  proximoJogador,
  modoJogo,
  streakColetivo,
  times,
  pontosTimeA,
  pontosTimeB,
  historico,
  onPronto,
}: {
  jogadores: Jogador[];
  pontos: Record<string, number>;
  proximoJogador: Jogador;
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time';
  streakColetivo: number;
  times?: TimesConfig;
  pontosTimeA: number;
  pontosTimeB: number;
  historico: TurnoSessao[];
  onPronto: () => void;
}) {
  const isTvT = modoJogo === 'time_vs_time';
  const observacao = gerarObservacaoEntre(
    historico,
    modoJogo,
    times,
    pontosTimeA,
    pontosTimeB,
  );
  const ranking = [...jogadores].sort(
    (a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0),
  );
  const totalAcertos = ranking.reduce((acc, j) => acc + (pontos[j.id] ?? 0), 0);
  const tituloOp = useRef(new Animated.Value(0)).current;
  const rankingOp = useRef(new Animated.Value(0)).current;
  const proximoOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tituloOp, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    const t1 = setTimeout(() => {
      Animated.timing(rankingOp, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 250);
    const t2 = setTimeout(() => {
      Animated.timing(proximoOp, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={estilos.entreContainer} onPress={onPronto}>
      <View style={estilos.entreCabecalho}>
        <Animated.Text style={[estilos.entreTitulo, { opacity: tituloOp }]}>
          {isTvT ? 'times' : 'placar'}
        </Animated.Text>
        {modoJogo === 'todos_juntos' && (
          <Animated.Text
            style={[estilos.entreTotalColetivo, { opacity: tituloOp }]}
          >
            {totalAcertos} coletivos
          </Animated.Text>
        )}
      </View>

      {/* Time vs Time scoreboard */}
      {isTvT && times && (
        <Animated.View style={[estilos.tvtScoreboard, { opacity: rankingOp }]}>
          <View style={estilos.tvtTime}>
            <Text style={estilos.tvtTimeNome}>{times.nomeA}</Text>
            <Text style={estilos.tvtTimePontos}>{pontosTimeA}</Text>
          </View>
          <Text style={estilos.tvtVs}>vs</Text>
          <View style={estilos.tvtTime}>
            <Text style={estilos.tvtTimeNome}>{times.nomeB}</Text>
            <Text style={estilos.tvtTimePontos}>{pontosTimeB}</Text>
          </View>
        </Animated.View>
      )}
      {observacao && (
        <Animated.View
          style={[estilos.entreObservacao, { opacity: rankingOp }]}
        >
          <Text style={estilos.entreObservacaoTexto}>{observacao}</Text>
        </Animated.View>
      )}
      {streakColetivo >= 2 && !observacao && (
        <Animated.View style={[estilos.entreMomentum, { opacity: rankingOp }]}>
          <Text style={estilos.entreMomentumTexto}>
            {streakColetivo >= 4
              ? `${streakColetivo} rodadas em ritmo. não para.`
              : 'em ritmo. o grupo está acordado.'}
          </Text>
        </Animated.View>
      )}
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
        <Text style={estilos.entreProximo}>
          {modoJogo === 'todos_juntos'
            ? `explica ${proximoJogador.nome} →`
            : `vez de ${proximoJogador.nome} →`}
        </Text>
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
  modoJogo,
  melhorStreakColetivo,
  times,
  pontosTimeA,
  pontosTimeB,
  onSair,
  insets,
}: {
  jogadores: Jogador[];
  pontos: Record<string, number>;
  historico: TurnoSessao[];
  modoJogo: 'todos_juntos' | 'individual' | 'time_vs_time';
  melhorStreakColetivo: number;
  times?: TimesConfig;
  pontosTimeA: number;
  pontosTimeB: number;
  onSair: () => void;
  insets: { top: number; bottom: number };
}) {
  const adaptadorChamado = useRef(false);
  const isTvT = modoJogo === 'time_vs_time';
  const totalAcertos = historico.reduce((acc, t) => acc + t.acertos, 0);
  const totalPalavras = historico.reduce(
    (acc, t) => acc + t.acertos + t.passados,
    0,
  );
  const totalPassadas = historico.reduce((acc, t) => acc + t.passados, 0);
  const titulo = isTvT
    ? pontosTimeA > pontosTimeB
      ? `${times?.nomeA ?? 'Time A'} venceu.`
      : pontosTimeB > pontosTimeA
        ? `${times?.nomeB ?? 'Time B'} venceu.`
        : 'empate.'
    : gerarTituloFim(totalAcertos, totalPalavras);
  const destaques = gerarDestaques(
    jogadores,
    pontos,
    historico,
    melhorStreakColetivo,
    modoJogo,
  );
  const momentoDaSessao = gerarMomentoDaSessao(historico, jogadores);
  const ranking = [...jogadores].sort(
    (a, b) => (pontos[b.id] ?? 0) - (pontos[a.id] ?? 0),
  );
  const taxa =
    totalPalavras > 0 ? Math.round((totalAcertos / totalPalavras) * 100) : 0;
  const identidade = detectarIdentidade(historico);

  // Social momentum — revelação rápida, conteúdo disponível imediatamente
  const identidadeOp = useRef(new Animated.Value(0)).current;
  const tituloOp = useRef(new Animated.Value(0)).current;
  const destaquesOp = useRef(new Animated.Value(0)).current;
  const rankingOp = useRef(new Animated.Value(0)).current;
  const aftermathOp = useRef(new Animated.Value(0)).current;

  // Processa resultado na sessão — uma única vez ao montar
  useEffect(() => {
    if (adaptadorChamado.current) return;
    adaptadorChamado.current = true;

    const totalPalavrasTotal = historico.reduce(
      (acc, t) => acc + t.acertos + t.passados,
      0,
    );
    const totalAcertosTotal = historico.reduce((acc, t) => acc + t.acertos, 0);

    // Jogador com mais pontos = mais acertos
    let maisAcertosId: string | null = null;
    let maiorPontos = -1;
    for (const [id, pts] of Object.entries(pontos)) {
      if (pts > maiorPontos) {
        maiorPontos = pts;
        maisAcertosId = id;
      }
    }

    processarResultadoNPL({
      totalTurnos: historico.length,
      melhorStreak: melhorStreakColetivo,
      jogadorMaisAcertos: maisAcertosId as string | null,
      taxaAcerto:
        totalPalavrasTotal > 0 ? totalAcertosTotal / totalPalavrasTotal : 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Animated.timing(identidadeOp, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
    const t0 = setTimeout(() => {
      Animated.timing(tituloOp, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }, 300);
    const t1 = setTimeout(() => {
      Animated.timing(aftermathOp, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    }, 600);
    const t2 = setTimeout(() => {
      Animated.timing(destaquesOp, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 900);
    const t3 = setTimeout(() => {
      Animated.timing(rankingOp, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 1200);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={[
        estilos.fimTela,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Abertura: identidade do grupo — o app como observador */}
      {historico.length >= 3 && (
        <Animated.View
          style={[estilos.fimIdentidade, { opacity: identidadeOp }]}
        >
          <Text style={estilos.fimIdentidadeFrase}>{identidade.frase}</Text>
        </Animated.View>
      )}

      <Animated.View style={{ opacity: tituloOp, alignSelf: 'stretch' }}>
        <Text style={estilos.fimTitulo}>{titulo}</Text>
        {(modoJogo === 'todos_juntos' || isTvT) && (
          <Text style={estilos.fimSubtitulo}>
            {isTvT ? `${pontosTimeA} × ${pontosTimeB}` : 'resultado coletivo'}
          </Text>
        )}

        {/* TvT team scoreboard */}
        {isTvT && times && (
          <View style={estilos.tvtScoreboardFim}>
            <View
              style={[
                estilos.tvtTimeFim,
                pontosTimeA > pontosTimeB && estilos.tvtTimeVencedor,
              ]}
            >
              <Text style={estilos.tvtTimeNomeFim}>{times.nomeA}</Text>
              <Text style={estilos.tvtTimePontosFim}>{pontosTimeA}</Text>
            </View>
            <Text style={estilos.tvtVsFim}>vs</Text>
            <View
              style={[
                estilos.tvtTimeFim,
                pontosTimeB > pontosTimeA && estilos.tvtTimeVencedor,
              ]}
            >
              <Text style={estilos.tvtTimeNomeFim}>{times.nomeB}</Text>
              <Text style={estilos.tvtTimePontosFim}>{pontosTimeB}</Text>
            </View>
          </View>
        )}
        <View style={estilos.fimStats}>
          <View style={estilos.fimStat}>
            <Text style={estilos.fimStatNumero}>{totalAcertos}</Text>
            <Text style={estilos.fimStatLabel}>acertos</Text>
          </View>
          <View style={estilos.fimStatDivisor} />
          <View style={estilos.fimStat}>
            <Text style={estilos.fimStatNumero}>{taxa}%</Text>
            <Text style={estilos.fimStatLabel}>taxa</Text>
          </View>
          <View style={estilos.fimStatDivisor} />
          {modoJogo === 'todos_juntos' && melhorStreakColetivo >= 2 ? (
            <View style={estilos.fimStat}>
              <Text style={estilos.fimStatNumero}>{melhorStreakColetivo}×</Text>
              <Text style={estilos.fimStatLabel}>ritmo máx.</Text>
            </View>
          ) : (
            <View style={estilos.fimStat}>
              <Text style={estilos.fimStatNumero}>{totalPassadas}</Text>
              <Text style={estilos.fimStatLabel}>passadas</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {identidade.aftermath.length > 0 && historico.length >= 3 && (
        <Animated.View style={[estilos.fimAftermath, { opacity: aftermathOp }]}>
          <Text style={estilos.fimAftermathTexto}>{identidade.aftermath}</Text>
        </Animated.View>
      )}

      {momentoDaSessao && (
        <Animated.View style={[estilos.fimMomento, { opacity: destaquesOp }]}>
          <Text style={estilos.fimMomentoLabel}>momento da sessão</Text>
          <Text style={estilos.fimMomentoTexto}>{momentoDaSessao}</Text>
        </Animated.View>
      )}

      {destaques.length > 0 && (
        <Animated.View style={[estilos.fimDestaques, { opacity: destaquesOp }]}>
          {destaques.map((d, i) => (
            <Text key={i} style={estilos.fimDestaqueTexto}>
              {d}
            </Text>
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

      <FeedbackSessao jogoId="na-ponta-da-lingua" />

      <Pressable
        onPress={onSair}
        style={({ pressed }) => [estilos.fimSair, pressed && { opacity: 0.6 }]}
      >
        <Text style={estilos.fimSairTexto}>jogar de novo →</Text>
      </Pressable>
    </ScrollView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  tela: { backgroundColor: cores.fundo, flex: 1 },

  // Phase transition wrapper
  phaseContainer: { flex: 1 },

  // Silence gate — colapso total
  silencioTela: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
    gap: espacamento.sm,
  },
  silencioTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 40,
    letterSpacing: -1,
    textAlign: 'center',
  },
  silencioSub: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 15,
    textAlign: 'center',
    marginTop: espacamento.xs,
  },
  cabecalho: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
  },
  progresso: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  faseTela: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
  },

  // Preparo
  preparoContainer: { alignItems: 'center', gap: espacamento.sm },
  preparoSessaoFinalBadge: {
    backgroundColor: 'rgba(232,106,90,0.1)',
    borderColor: 'rgba(232,106,90,0.25)',
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingVertical: 4,
  },
  preparoSessaoFinalTexto: {
    color: 'rgba(232,106,90,0.8)',
    fontSize: 11,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 1,
  },
  preparoMomentumBadge: {
    backgroundColor: 'rgba(201,137,58,0.14)',
    borderColor: 'rgba(201,137,58,0.35)',
    borderRadius: raio.pill,
    borderWidth: 1,
    marginTop: espacamento.xs,
    paddingHorizontal: espacamento.md,
    paddingVertical: 4,
  },
  preparoMomentumTexto: {
    color: cores.acento,
    fontSize: 12,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.8,
  },
  preparoLabel: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  preparoNome: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 44,
    letterSpacing: -1,
    textAlign: 'center',
  },
  preparoTutorial: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 14,
    lineHeight: 22,
    marginTop: espacamento.sm,
    textAlign: 'center',
  },
  preparoInstrucao: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 16,
    lineHeight: 24,
    marginTop: espacamento.md,
    textAlign: 'center',
  },
  preparoToque: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.xs,
    textAlign: 'center',
  },

  // Jogando
  jogandoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: espacamento.lg,
  },
  jogandoHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espacamento.sm,
    width: '100%',
  },
  jogandoHeaderSide: {
    alignItems: 'center',
    width: 64,
  },
  streakBadge: {
    backgroundColor: 'rgba(201,137,58,0.18)',
    borderColor: 'rgba(201,137,58,0.4)',
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  streakBadgeTexto: {
    color: cores.acento,
    fontSize: 13,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
  },
  timerNumero: {
    fontSize: 32,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  acertosCounter: {
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.3,
  },
  todosRespondemBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(201,137,58,0.08)',
    borderColor: 'rgba(201,137,58,0.22)',
    borderRadius: raio.pill,
    borderWidth: 1,
    marginBottom: espacamento.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  todosRespondemTexto: {
    color: 'rgba(201,137,58,0.65)',
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 1.5,
  },
  timerBarra: {
    backgroundColor: cores.borda,
    borderRadius: 2,
    height: 3,
    marginBottom: espacamento.lg,
    overflow: 'hidden',
    width: '100%',
  },
  timerBarraPreenchida: { borderRadius: 2, height: 3 },
  cardContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  palavraPrincipal: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 52,
    letterSpacing: -1.5,
    marginBottom: espacamento.xl,
    textAlign: 'center',
  },
  proibidasOcultasTexto: {
    color: cores.textoMudo,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: espacamento.lg,
  },
  proibidasBloco: { alignSelf: 'stretch', gap: espacamento.xs },
  proibidaItem: {
    borderLeftWidth: 3,
    borderRadius: raio.sm,
    borderColor: cores.borda,
    borderWidth: 1,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm + 1,
  },
  proibidaTexto: {
    color: cores.textoSecundario,
    fontSize: 16,
    fontWeight: tipografia.pesoSemibold,
  },
  controlesContainer: {
    flexDirection: 'row',
    gap: espacamento.md,
    marginTop: 'auto' as unknown as number,
    paddingBottom: espacamento.lg,
    width: '100%',
  },
  btnPassou: {
    alignItems: 'center',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md + 4,
  },
  btnAcertou: {
    alignItems: 'center',
    backgroundColor: cores.primaria,
    borderRadius: raio.lg,
    flex: 2,
    paddingVertical: espacamento.md + 4,
  },
  btnPressionado: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  btnPassouTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  btnAcertouTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  vignette: { backgroundColor: '#1a0500' },

  // Roubo
  rouboTela: {
    alignItems: 'center',
    backgroundColor: '#080402',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.xl,
    gap: espacamento.lg,
  },
  rouboTempoTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 22,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  rouboPalavra: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 44,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  rouboTimeTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  rouboContagem: {
    color: cores.primaria,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 72,
    letterSpacing: -3,
    textAlign: 'center',
  },
  rouboBotao: {
    backgroundColor: 'rgba(201,137,58,0.12)',
    borderColor: cores.primaria,
    borderRadius: raio.lg,
    borderWidth: 1.5,
    paddingHorizontal: espacamento.xxl,
    paddingVertical: espacamento.lg,
  },
  rouboBotaoTexto: {
    color: cores.primaria,
    fontSize: 18,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  rouboConfirmado: {
    color: cores.sucesso,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 28,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // Resumo do turno
  resumoScroll: { flex: 1 },
  resumoContainer: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: espacamento.xxl,
    paddingHorizontal: espacamento.xl,
    paddingTop: espacamento.lg,
  },
  resumoTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 36,
    letterSpacing: -0.5,
    marginBottom: espacamento.xs,
    textAlign: 'center',
  },
  resumoJogador: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.5,
    marginBottom: espacamento.sm,
    textAlign: 'center',
  },
  resumoMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: espacamento.xl,
    gap: 6,
  },
  resumoMetaItem: {
    color: cores.textoMudo,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  resumoMetaDivisor: {
    color: cores.textoMudo,
    fontSize: 12,
    opacity: 0.5,
  },
  resumoMetaMomentum: {
    color: cores.acento,
    fontSize: 12,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 0.5,
  },
  historicoBlocoContainer: {
    alignSelf: 'stretch',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: 2,
    marginBottom: espacamento.xl,
    overflow: 'hidden',
  },
  historicoItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm + 2,
  },
  historicoSimbolo: {
    fontSize: 14,
    fontWeight: tipografia.pesoBold,
    width: 16,
  },
  historicoPalavra: {
    color: cores.textoSecundario,
    flex: 1,
    fontSize: 15,
    fontWeight: tipografia.pesoSemibold,
  },
  resumoComentario: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  btnProximo: {
    borderColor: cores.borda,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.md,
  },
  btnProximoTexto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpo,
    letterSpacing: 0.3,
  },

  // Time vs Time shared
  tvtScoreboard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: espacamento.md,
    paddingVertical: espacamento.md,
  },
  tvtTime: { alignItems: 'center', flex: 1 },
  tvtTimeNome: {
    color: cores.textoMudo,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tvtTimePontos: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 36,
    lineHeight: 42,
  },
  tvtVs: {
    color: cores.borda,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Entre
  entreObservacao: {
    alignSelf: 'stretch',
    borderColor: 'rgba(232,106,90,0.2)',
    borderRadius: raio.md,
    borderWidth: 1,
    backgroundColor: 'rgba(232,106,90,0.06)',
    marginBottom: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm + 2,
  },
  entreObservacaoTexto: {
    color: 'rgba(232,106,90,0.85)',
    fontFamily: familias.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  entreContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: espacamento.lg,
  },
  entreCabecalho: {
    alignItems: 'center',
    marginBottom: espacamento.md,
  },
  entreTitulo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  entreTotalColetivo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.5,
    marginTop: 2,
    opacity: 0.7,
  },
  entreMomentum: {
    backgroundColor: 'rgba(201,137,58,0.1)',
    borderColor: 'rgba(201,137,58,0.25)',
    borderRadius: raio.md,
    borderWidth: 1,
    marginBottom: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.sm,
  },
  entreMomentumTexto: {
    color: cores.acento,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  entreRanking: {
    alignSelf: 'stretch',
    gap: espacamento.sm,
    marginBottom: espacamento.xl,
  },
  entreItem: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  entrePos: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    width: 20,
  },
  entreNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
    marginLeft: espacamento.sm,
  },
  entrePontos: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 22,
  },
  entreRodape: { alignItems: 'center' },
  entreProximo: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoBold,
  },
  entreContinuar: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    marginTop: espacamento.xs,
  },

  // TvT Fim
  tvtScoreboardFim: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: espacamento.lg,
    marginTop: espacamento.sm,
  },
  tvtTimeFim: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flex: 1,
    paddingVertical: espacamento.md,
  },
  tvtTimeVencedor: {
    backgroundColor: 'rgba(201,137,58,0.1)',
    borderColor: 'rgba(201,137,58,0.4)',
  },
  tvtTimeNomeFim: {
    color: cores.textoMudo,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tvtTimePontosFim: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 40,
    lineHeight: 48,
  },
  tvtVsFim: {
    alignSelf: 'center',
    color: cores.textoMudo,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: espacamento.sm,
  },

  // Fim — identidade do grupo + aftermath
  fimIdentidade: {
    alignSelf: 'stretch',
    marginBottom: espacamento.lg,
    paddingHorizontal: espacamento.sm,
  },
  fimIdentidadeFrase: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 30,
    textAlign: 'center',
  },
  fimAftermath: {
    alignSelf: 'stretch',
    marginBottom: espacamento.lg,
    paddingHorizontal: espacamento.sm,
  },
  fimAftermathTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Fim
  fimTela: { alignItems: 'center', paddingHorizontal: espacamento.lg },
  fimTitulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 30,
    marginBottom: espacamento.xs,
    textAlign: 'center',
  },
  fimSubtitulo: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 1.5,
    marginBottom: espacamento.lg,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  fimStats: {
    backgroundColor: cores.superficieElevada,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: espacamento.lg,
    paddingVertical: espacamento.md,
    width: '100%',
  },
  fimStat: { alignItems: 'center', flex: 1, gap: 2 },
  fimStatNumero: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 28,
  },
  fimStatLabel: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoMicro,
    letterSpacing: 0.5,
  },
  fimStatDivisor: { backgroundColor: cores.borda, width: 1 },
  fimMomento: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(201,137,58,0.06)',
    borderColor: 'rgba(201,137,58,0.22)',
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: 6,
    marginBottom: espacamento.lg,
    padding: espacamento.lg,
  },
  fimMomentoLabel: {
    color: cores.acento,
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  fimMomentoTexto: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  fimDestaques: {
    alignSelf: 'stretch',
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    gap: espacamento.md,
    marginBottom: espacamento.lg,
    padding: espacamento.lg,
  },
  fimDestaqueTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  fimRanking: {
    alignSelf: 'stretch',
    gap: espacamento.sm,
    marginBottom: espacamento.xl,
  },
  fimRankingItem: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  fimRankingPos: {
    color: cores.textoMudo,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoExtraBold,
    width: 20,
  },
  fimRankingNome: {
    color: cores.texto,
    flex: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
    marginLeft: espacamento.sm,
  },
  fimRankingPontos: {
    color: cores.acento,
    fontFamily: familias.sans,
    fontWeight: '800' as const,
    fontSize: 22,
  },
  fimSair: {
    borderColor: cores.primaria,
    borderRadius: raio.pill,
    borderWidth: 1,
    paddingHorizontal: espacamento.xl,
    paddingVertical: espacamento.md,
  },
  fimSairTexto: {
    color: cores.primaria,
    fontSize: tipografia.tamanhoCorpo,
    fontWeight: tipografia.pesoSemibold,
  },
});
