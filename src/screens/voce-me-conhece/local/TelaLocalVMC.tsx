/**
 * TelaLocalVMC — Orquestrador do modo 1 celular.
 *
 * Telas inline:
 *   TelaAguardandoRanqueador  (fase: aguardando_ranqueador)
 *   TelaRanqueadorEscolhendo  (fase: ranqueador_escolhendo)
 *   TelaColetandoPrevisoes    (fase: coletando_previsoes — keyed por indiceAtual)
 *   TelaRevelando             (fase: revelando)
 *   TelaResultadoRodada       (fase: resultado_rodada)
 *
 * Tela externa:
 *   TelaResultadoLocalVMC     (fase: finalizado)
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControleEncerrarJogo } from '@/components';
import { VMCLocalEngine } from '@/games/voce-me-conhece/local/localEngine';
import type {
  ConfiguracaoVMC,
  EstadoVMCPublico,
  JogadorVMC,
  LeituraVMC,
  PlayerId,
  ResultadoVMCFinalizado,
  TipoEscolha,
} from '@/games/voce-me-conhece/local/types';
import { assegurarSessaoIniciada } from '@/session/sessionStore';
import {
  processarRodadaVMC,
  processarResultadoVMC,
} from '@/session/vmcLocalAdapter';
import { cores, espacamento, familias, raio, tipografia } from '@/theme/colors';

import { TelaResultadoLocalVMC } from './TelaResultadoLocalVMC';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  jogadores: JogadorVMC[];
  config: ConfiguracaoVMC;
  onVoltar: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constantes visuais
// ─────────────────────────────────────────────────────────────────────────────

const COR_ACERTO = '#22C55E';

/** Cor emocional por tipo de leitura — usada no cabeçalho do reveal. */
const COR_LEITURA: Record<LeituraVMC, string> = {
  leitura_perfeita: '#22C55E',
  sincronizados: '#4D7CFE',
  divididos: '#F59E0B',
  surpresa: '#EF4444',
  leitura_solo: '#F97316',
  desconhecido: cores.textoMudo,
};

function textoLeitura(leitura: LeituraVMC): string {
  switch (leitura) {
    case 'leitura_perfeita':
      return 'leitura perfeita.';
    case 'sincronizados':
      return 'sincronizados.';
    case 'divididos':
      return 'divididos.';
    case 'surpresa':
      return 'ninguém esperava.';
    case 'leitura_solo':
      return 'só um acertou.';
    case 'desconhecido':
      return 'ninguém acertou.';
  }
}

function textoPergunta(tipo: TipoEscolha, nomeRanqueador: string): string {
  if (tipo === 'top1') return `o que ${nomeRanqueador} escolheria primeiro?`;
  return `o que ${nomeRanqueador} deixaria por último?`;
}

/** Cria N Animated.Values inicializadas em 0 de forma estável. */
function useAnimValues(count: number) {
  return useRef<Animated.Value[]>(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;
}

/** Anima um valor de 0→1 com easing de saída suave. */
function fadeSlideIn(
  anim: Animated.Value,
  duration = 260,
  delay = 0,
): Animated.CompositeAnimation {
  return Animated.timing(anim, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Orquestrador
// ─────────────────────────────────────────────────────────────────────────────

export function TelaLocalVMC({ jogadores, config, onVoltar }: Props) {
  const engineRef = useRef<VMCLocalEngine | null>(null);
  const [estado, setEstado] = useState<EstadoVMCPublico | null>(null);
  const [resultado, setResultado] = useState<ResultadoVMCFinalizado | null>(
    null,
  );

  useEffect(() => {
    assegurarSessaoIniciada(jogadores, 'voce-me-conhece');

    const engine = new VMCLocalEngine(
      jogadores,
      config,
      (novoEstado) => setEstado(novoEstado),
      {
        onRodadaResolvida: (rodada) => processarRodadaVMC(rodada),
        onJogoFinalizado: (res) => {
          processarResultadoVMC({
            ...res,
            categorias: config.categorias,
          });
          setResultado(res);
        },
      },
    );
    engineRef.current = engine;
    setEstado(engine.getEstado());
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!estado || !engineRef.current) return null;

  const engine = engineRef.current;

  function comEncerrar(children: React.ReactNode) {
    return (
      <ControleEncerrarJogo onConfirmar={onVoltar}>
        {children}
      </ControleEncerrarJogo>
    );
  }

  // ── Routing ──────────────────────────────────────────────────────────────

  switch (estado.fase) {
    case 'aguardando_ranqueador': {
      const ranqueador = engine.getRanqueadorAtual();
      return comEncerrar(
        <TelaAguardandoRanqueador
          nomeRanqueador={ranqueador?.nome ?? ''}
          rodadaAtual={estado.rodadaAtual}
          totalRodadas={estado.totalRodadas}
          onConfirmar={() => engine.confirmarPassagem()}
        />,
      );
    }

    case 'ranqueador_escolhendo':
      return comEncerrar(
        <TelaRanqueadorEscolhendo
          estado={estado}
          nomeRanqueador={engine.getRanqueadorAtual()?.nome ?? ''}
          onEscolheu={(opcao) => engine.ranqueadorEscolheu(opcao)}
        />,
      );

    case 'coletando_previsoes': {
      const previsor = engine.getPrevisortAtual();
      return comEncerrar(
        <TelaColetandoPrevisoes
          key={estado.coletandoPrevisoes?.indiceAtual ?? 0}
          estado={estado}
          nomePrevisor={previsor?.nome ?? ''}
          nomeRanqueador={engine.getRanqueadorAtual()?.nome ?? ''}
          onPrevisao={(opcao) => engine.registrarPrevisao(opcao)}
        />,
      );
    }

    case 'revelando':
      return comEncerrar(
        <TelaRevelando
          estado={estado}
          engine={engine}
          onContinuar={() => engine.confirmarRevelacao()}
        />,
      );

    case 'resultado_rodada':
      return comEncerrar(
        <TelaResultadoRodada
          estado={estado}
          engine={engine}
          onProxima={() => engine.confirmarResultado()}
        />,
      );

    case 'finalizado':
      if (!resultado) return null;
      return (
        <TelaResultadoLocalVMC
          resultado={resultado}
          jogadores={jogadores}
          onVoltar={onVoltar}
        />
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaAguardandoRanqueador
// Nome grande + "toque para ver". Anima na entrada.
// ─────────────────────────────────────────────────────────────────────────────

function TelaAguardandoRanqueador({
  nomeRanqueador,
  rodadaAtual,
  totalRodadas,
  onConfirmar,
}: {
  nomeRanqueador: string;
  rodadaAtual: number;
  totalRodadas: number;
  onConfirmar: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeSlideIn(anim, 300).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  return (
    <SafeAreaView style={estilosBase.container}>
      <TouchableOpacity
        style={estilosBase.areaTouch}
        onPress={onConfirmar}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            estilosBase.centro,
            { opacity: anim, transform: [{ translateY }] },
          ]}
        >
          <Text style={estilosAguardando.nome}>{nomeRanqueador}</Text>
          <Text style={estilosAguardando.instrucao}>toque para ver</Text>
        </Animated.View>

        <Text style={estilosBase.progresso}>
          {rodadaAtual} de {totalRodadas}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaRanqueadorEscolhendo
// O ranqueador vê o card e escolhe em segredo.
// Opções entram com stagger. Ao tocar: overlay preto faz fade até 1
// antes de acionar o engine (substituindo o swap abrupto de tela).
// ─────────────────────────────────────────────────────────────────────────────

function TelaRanqueadorEscolhendo({
  estado,
  nomeRanqueador,
  onEscolheu,
}: {
  estado: EstadoVMCPublico;
  nomeRanqueador: string;
  onEscolheu: (opcao: string) => void;
}) {
  const card = estado.cartaoAtual;
  const tipo = estado.tipoEscolhaNaRodada;

  const optAnims = useAnimValues(card?.opcoes.length ?? 4);
  const blackoutAnim = useRef(new Animated.Value(0)).current;
  const escolhaPendente = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Stagger das opções: primeira aparece em 60ms, cada próxima +45ms
    Animated.stagger(
      45,
      optAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 220,
          delay: 60,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [optAnims]);

  function handleEscolha(opcao: string) {
    if (escolhaPendente.current !== null) return; // bloqueia double-tap
    void Haptics.selectionAsync();
    escolhaPendente.current = opcao;

    // Fade do overlay preto em 350ms, depois aguarda mais 450ms
    // (total ~800ms) antes de acionar o engine
    Animated.timing(blackoutAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();

    timer.current = setTimeout(() => {
      onEscolheu(opcao);
    }, 800);
  }

  if (!card || !tipo) return null;

  const pergunta =
    tipo === 'top1'
      ? 'o que você escolheria primeiro?'
      : 'o que você deixaria por último?';

  return (
    <SafeAreaView style={estilosBase.container}>
      <View style={estilosEscolhendo.cabecalho}>
        <Text style={estilosEscolhendo.pergunta}>{pergunta}</Text>
        <Text style={estilosEscolhendo.nomeRanqueador}>{nomeRanqueador}</Text>
      </View>

      <View style={estilosEscolhendo.opcoes}>
        {card.opcoes.map((opcao, i) => {
          const translateY = (optAnims[i] ?? new Animated.Value(1)).interpolate(
            {
              inputRange: [0, 1],
              outputRange: [14, 0],
            },
          );
          return (
            <Animated.View
              key={opcao}
              style={{
                opacity: optAnims[i],
                transform: [{ translateY }],
              }}
            >
              <TouchableOpacity
                style={estilosEscolhendo.botaoOpcao}
                onPress={() => handleEscolha(opcao)}
                activeOpacity={0.7}
              >
                <Text style={estilosEscolhendo.textoOpcao}>{opcao}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Overlay de blackout — fade gradual antes de passar o celular */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: '#0D0D0D', opacity: blackoutAnim },
        ]}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaColetandoPrevisoes
// Keyed por indiceAtual — remonta a cada troca de previsor.
// aguardando → anima entrada do nome
// prevendo   → anima pergunta + opções (stagger)
// ─────────────────────────────────────────────────────────────────────────────

function TelaColetandoPrevisoes({
  estado,
  nomePrevisor,
  nomeRanqueador,
  onPrevisao,
}: {
  estado: EstadoVMCPublico;
  nomePrevisor: string;
  nomeRanqueador: string;
  onPrevisao: (opcao: string) => void;
}) {
  const [etapa, setEtapa] = useState<'aguardando' | 'prevendo'>('aguardando');

  // Animação da tela de aguardando
  const aguardandoAnim = useRef(new Animated.Value(0)).current;

  // Animação do cabeçalho da tela de previsão
  const perguntaAnim = useRef(new Animated.Value(0)).current;

  // Animações das opções (stagger)
  const card = estado.cartaoAtual;
  const optAnims = useAnimValues(card?.opcoes.length ?? 4);

  useEffect(() => {
    fadeSlideIn(aguardandoAnim, 280).start();
  }, [aguardandoAnim]);

  function aoRevelar() {
    setEtapa('prevendo');
    // Pergunta e opções entram em sequência
    fadeSlideIn(perguntaAnim, 240).start();
    Animated.stagger(
      40,
      optAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 200,
          delay: 80,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }

  const tipo = estado.tipoEscolhaNaRodada;
  const coleta = estado.coletandoPrevisoes;
  if (!card || !tipo || !coleta) return null;

  const pergunta = textoPergunta(tipo, nomeRanqueador);
  const progresso = `${coleta.indiceAtual + 1} de ${coleta.ordemJogadores.length}`;

  // ── Aguardando: passa o celular ─────────────────────────────────────────
  if (etapa === 'aguardando') {
    const translateY = aguardandoAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [28, 0],
    });
    return (
      <SafeAreaView style={estilosBase.container}>
        <TouchableOpacity
          style={estilosBase.areaTouch}
          onPress={aoRevelar}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              estilosBase.centro,
              { opacity: aguardandoAnim, transform: [{ translateY }] },
            ]}
          >
            <Text style={estilosAguardando.nome}>{nomePrevisor}</Text>
            <Text style={estilosAguardando.instrucao}>toque para ver</Text>
          </Animated.View>
          <Text style={estilosBase.progresso}>{progresso}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Prevendo: vê a pergunta e responde ──────────────────────────────────
  const perguntaTranslateY = perguntaAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <SafeAreaView style={estilosBase.container}>
      <Animated.View
        style={[
          estilosPrevisao.cabecalho,
          {
            opacity: perguntaAnim,
            transform: [{ translateY: perguntaTranslateY }],
          },
        ]}
      >
        <Text style={estilosPrevisao.pergunta}>{pergunta}</Text>
      </Animated.View>

      <View style={estilosEscolhendo.opcoes}>
        {card.opcoes.map((opcao, i) => {
          const translateY = (optAnims[i] ?? new Animated.Value(1)).interpolate(
            {
              inputRange: [0, 1],
              outputRange: [14, 0],
            },
          );
          return (
            <Animated.View
              key={opcao}
              style={{
                opacity: optAnims[i],
                transform: [{ translateY }],
              }}
            >
              <TouchableOpacity
                style={estilosEscolhendo.botaoOpcao}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onPrevisao(opcao);
                }}
                activeOpacity={0.7}
              >
                <Text style={estilosEscolhendo.textoOpcao}>{opcao}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <Text style={[estilosBase.progresso, { paddingBottom: espacamento.xl }]}>
        {progresso}
      </Text>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaRevelando
// Beat dramático em quatro fases:
//   0ms   — haptic + cabeçalho de leitura faz fade (colorido por tipo)
//   120ms — opções entram com stagger
//   500ms — opção escolhida pulsa com spring (scale 1→1.04→1)
//   680ms — nomes dos acertadores fazem fade
// ─────────────────────────────────────────────────────────────────────────────

function TelaRevelando({
  estado,
  engine,
  onContinuar,
}: {
  estado: EstadoVMCPublico;
  engine: VMCLocalEngine;
  onContinuar: () => void;
}) {
  const card = estado.cartaoAtual;
  const escolha = estado.escolhaRevelada;
  const acertos = estado.acertosRevelados ?? [];
  const leitura = estado.leituraRevelada;

  const headerAnim = useRef(new Animated.Value(0)).current;
  const optAnims = useAnimValues(card?.opcoes.length ?? 4);
  const escolhaScale = useRef(new Animated.Value(1)).current;
  const acertosAnim = useRef(new Animated.Value(0)).current;
  const rodapeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!leitura) return;

    // Fase 0: haptic por tipo de leitura
    if (leitura === 'leitura_perfeita') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (leitura === 'desconhecido') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Fase 0: cabeçalho
    fadeSlideIn(headerAnim, 240).start();

    // Fase 1: opções em stagger (começam em 120ms)
    Animated.stagger(
      50,
      optAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 220,
          delay: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();

    // Fase 2: pulso na opção escolhida (em 500ms)
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(escolhaScale, {
          toValue: 1.04,
          tension: 280,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(escolhaScale, {
          toValue: 1,
          tension: 280,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // Fase 3: nomes dos acertadores (em 680ms)
    Animated.timing(acertosAnim, {
      toValue: 1,
      duration: 240,
      delay: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Rodapé aparece junto com acertadores
    Animated.timing(rodapeAnim, {
      toValue: 1,
      duration: 200,
      delay: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!card || !escolha || !leitura) return null;

  const leituraColor = COR_LEITURA[leitura];
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <SafeAreaView style={estilosBase.container}>
      {/* Cabeçalho: leitura emocional colorida por tipo */}
      <Animated.View
        style={[
          estilosRevelando.cabecalho,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <Text style={[estilosRevelando.leitura, { color: leituraColor }]}>
          {textoLeitura(leitura)}
        </Text>
      </Animated.View>

      {/* Opções — escolha destacada com pulso, resto apagado */}
      <View style={estilosRevelando.opcoes}>
        {card.opcoes.map((opcao, i) => {
          const isEscolha = opcao === escolha;
          const translateY = (optAnims[i] ?? new Animated.Value(1)).interpolate(
            {
              inputRange: [0, 1],
              outputRange: [12, 0],
            },
          );

          const inner = (
            <Animated.View
              style={[
                estilosRevelando.linhaOpcao,
                isEscolha && [
                  estilosRevelando.linhaOpcaoDestacada,
                  {
                    borderColor: `${leituraColor}40`,
                    backgroundColor: `${leituraColor}0C`,
                  },
                ],
              ]}
            >
              <Text
                style={[
                  estilosRevelando.textoOpcao,
                  isEscolha
                    ? { color: cores.texto, fontWeight: tipografia.pesoBold }
                    : estilosRevelando.textoOpcaoApagado,
                ]}
              >
                {opcao}
              </Text>
            </Animated.View>
          );

          return (
            <Animated.View
              key={opcao}
              style={{
                opacity: optAnims[i],
                transform: [
                  { translateY },
                  ...(isEscolha ? [{ scale: escolhaScale }] : []),
                ],
              }}
            >
              {inner}
            </Animated.View>
          );
        })}
      </View>

      {/* Quem acertou */}
      <Animated.View
        style={[estilosRevelando.acertos, { opacity: acertosAnim }]}
      >
        {acertos.length === 0 ? (
          <Text style={estilosRevelando.semAcertos}>ninguém acertou.</Text>
        ) : (
          acertos.map((id) => (
            <Text key={id} style={estilosRevelando.nomeAcerto}>
              {engine.getNome(id)}
            </Text>
          ))
        )}
      </Animated.View>

      {/* Botão */}
      <Animated.View style={[estilosBase.rodape, { opacity: rodapeAnim }]}>
        <TouchableOpacity
          style={estilosBase.botaoContinuar}
          onPress={onContinuar}
          activeOpacity={0.8}
        >
          <Text style={estilosBase.textoContinuar}>próxima</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TelaResultadoRodada
// Placar leve + CTA. Linhas entram com stagger.
// ─────────────────────────────────────────────────────────────────────────────

function TelaResultadoRodada({
  estado,
  engine,
  onProxima,
}: {
  estado: EstadoVMCPublico;
  engine: VMCLocalEngine;
  onProxima: () => void;
}) {
  const jogadores = engine.getJogadores();

  // Calcula placar corrente a partir do histórico
  const acertosPorJogador: Record<PlayerId, number> = {};
  jogadores.forEach((j) => {
    acertosPorJogador[j.id] = 0;
  });
  estado.historico.forEach((r) => {
    r.acertos.forEach((id) => {
      acertosPorJogador[id] = (acertosPorJogador[id] ?? 0) + 1;
    });
  });

  const jogadoresOrdenados = [...jogadores].sort(
    (a, b) => (acertosPorJogador[b.id] ?? 0) - (acertosPorJogador[a.id] ?? 0),
  );

  // Animações: cada linha + rodapé
  const linhaAnims = useAnimValues(jogadoresOrdenados.length);
  const rodapeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(
      35,
      linhaAnims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 220,
          delay: 40,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();

    Animated.timing(rodapeAnim, {
      toValue: 1,
      duration: 200,
      delay: 40 + jogadoresOrdenados.length * 35 + 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUltimaRodada = estado.rodadaAtual === estado.totalRodadas;

  return (
    <SafeAreaView style={estilosBase.container}>
      <View style={estilosPlacar.lista}>
        {jogadoresOrdenados.map((j, idx) => {
          const acertos = acertosPorJogador[j.id] ?? 0;
          const translateY = (
            linhaAnims[idx] ?? new Animated.Value(1)
          ).interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          });
          return (
            <Animated.View
              key={j.id}
              style={[
                estilosPlacar.linha,
                { opacity: linhaAnims[idx], transform: [{ translateY }] },
              ]}
            >
              <Text style={estilosPlacar.nome}>{j.nome}</Text>
              <Text style={estilosPlacar.acertos}>
                {acertos} {acertos === 1 ? 'leitura' : 'leituras'}
              </Text>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View style={[estilosBase.rodape, { opacity: rodapeAnim }]}>
        <TouchableOpacity
          style={estilosBase.botaoContinuar}
          onPress={onProxima}
          activeOpacity={0.8}
        >
          <Text style={estilosBase.textoContinuar}>
            {isUltimaRodada ? 'ver resultado' : 'próxima rodada'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Estilos compartilhados
// ─────────────────────────────────────────────────────────────────────────────

const estilosBase = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  areaTouch: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: espacamento.xl,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
    gap: espacamento.sm,
  },
  progresso: {
    fontSize: 12,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
    opacity: 0.5,
  },
  rodape: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
    paddingTop: espacamento.md,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  botaoContinuar: {
    backgroundColor: cores.texto,
    borderRadius: raio.lg,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoContinuar: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: cores.fundo,
  },
});

// Nome grande — compartilhado por aguardando e coleta
const estilosAguardando = StyleSheet.create({
  nome: {
    fontSize: tipografia.tamanhoDisplay,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingHero,
  },
  instrucao: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    letterSpacing: 0.3,
  },
});

// Tela do ranqueador escolhendo
const estilosEscolhendo = StyleSheet.create({
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.lg,
    gap: espacamento.xs,
  },
  pergunta: {
    fontSize: tipografia.tamanhoTitulo,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    letterSpacing: tipografia.spacingTitulo,
  },
  nomeRanqueador: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  opcoes: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
    gap: espacamento.sm,
    justifyContent: 'center',
  },
  botaoOpcao: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingVertical: espacamento.md,
    paddingHorizontal: espacamento.lg,
    minHeight: 56,
    justifyContent: 'center',
  },
  textoOpcao: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.texto,
  },
});

// Cabeçalho da tela de previsão (pergunta sobre o ranqueador)
const estilosPrevisao = StyleSheet.create({
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.lg,
  },
  pergunta: {
    fontSize: tipografia.tamanhoTitulo,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    letterSpacing: tipografia.spacingTitulo,
  },
});

// Tela de reveal
const estilosRevelando = StyleSheet.create({
  cabecalho: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    paddingBottom: espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  leitura: {
    fontSize: tipografia.tamanhoTitulo,
    fontFamily: familias.serifDisplay,
    letterSpacing: tipografia.spacingTitulo,
    // cor injetada inline por tipo de leitura
  },
  opcoes: {
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    gap: espacamento.sm,
  },
  linhaOpcao: {
    paddingVertical: espacamento.sm,
    paddingHorizontal: espacamento.md,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  linhaOpcaoDestacada: {
    // borderColor e backgroundColor injetados inline (cor da leitura)
  },
  textoOpcao: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    color: cores.texto,
  },
  textoOpcaoApagado: {
    color: cores.textoMudo,
    opacity: 0.4,
  },
  acertos: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.lg,
    gap: 4,
  },
  nomeAcerto: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: tipografia.pesoBold,
    color: COR_ACERTO,
  },
  semAcertos: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
});

// Placar entre rodadas
const estilosPlacar = StyleSheet.create({
  lista: {
    flex: 1,
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.xl,
    gap: 2,
  },
  linha: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  nome: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    fontWeight: '500',
    color: cores.texto,
  },
  acertos: {
    fontSize: tipografia.tamanhoCorpoMenor,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
});
