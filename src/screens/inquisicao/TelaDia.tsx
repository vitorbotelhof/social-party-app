/**
 * TelaDia — Fase conversa.
 *
 * Exibe eventos sociais públicos (aparecem 6s e somem),
 * mensagem do sistema, timer com barra de progresso,
 * e eventos privados como card "toque para ver".
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlayerId } from '@/engine/types';
import type { EstadoFirebaseInquisicao, EstadoPrivadoInquisicao } from '@/games/inquisicao/types';
import type { InquisicaoRealtimeService } from '@/services/inquisicaoRealtime';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

const { width: LARGURA_TELA } = Dimensions.get('window');
const BARRA_LARGURA = LARGURA_TELA;

interface Props {
  estadoPublico: EstadoFirebaseInquisicao;
  estadoPrivado: EstadoPrivadoInquisicao | null;
  jogadorId: PlayerId;
  realtime: InquisicaoRealtimeService;
}

export function TelaDia({ estadoPublico, estadoPrivado, jogadorId, realtime }: Props) {
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [eventoVisivelId, setEventoVisivelId] = useState<string | null>(null);
  const [eventoPrivadoVisivel, setEventoPrivadoVisivel] = useState(false);

  const opacidadeEvento = useRef(new Animated.Value(0)).current;
  const barraLargura = useRef(new Animated.Value(BARRA_LARGURA)).current;
  const timerEventoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duracaoTotalRef = useRef(0);

  // ── Timer countdown ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!estadoPublico.prazoFaseEm) return;

    const calcular = () => {
      const restante = Math.max(0, Math.ceil((estadoPublico.prazoFaseEm! - Date.now()) / 1000));
      setSegundosRestantes(restante);
    };

    calcular();
    const intervalo = setInterval(calcular, 1000);
    return () => clearInterval(intervalo);
  }, [estadoPublico.prazoFaseEm]);

  // ── Barra de progresso ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!estadoPublico.prazoFaseEm) return;
    const duracao = estadoPublico.configuracao.duracaoConversaSegundos * 1000;
    duracaoTotalRef.current = duracao;
    const restante = Math.max(0, estadoPublico.prazoFaseEm - Date.now());
    const proporcao = restante / duracao;

    Animated.timing(barraLargura, {
      toValue: BARRA_LARGURA * proporcao,
      duration: restante,
      useNativeDriver: false,
    }).start();
  }, [estadoPublico.prazoFaseEm, estadoPublico.configuracao.duracaoConversaSegundos, barraLargura]);

  // ── Animação de evento público ──────────────────────────────────────────────
  useEffect(() => {
    const evento = estadoPublico.eventoAtivo;
    if (!evento) return;
    if (evento.id === eventoVisivelId) return;

    setEventoVisivelId(evento.id);

    // Limpar timer anterior
    if (timerEventoRef.current) clearTimeout(timerEventoRef.current);

    // Fade in
    opacidadeEvento.setValue(0);
    Animated.timing(opacidadeEvento, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Após 5s, fade out
    timerEventoRef.current = setTimeout(() => {
      Animated.timing(opacidadeEvento, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setEventoVisivelId(null));
    }, 5000);

    return () => {
      if (timerEventoRef.current) clearTimeout(timerEventoRef.current);
    };
  }, [estadoPublico.eventoAtivo, eventoVisivelId, opacidadeEvento]);

  // ── Evento privado ──────────────────────────────────────────────────────────
  const eventoPrivado = estadoPrivado?.eventoPrivado;
  const temEventoPrivadoPendente = eventoPrivado !== null && eventoPrivado !== undefined && !eventoPrivado.lido;

  const handleVerEventoPrivado = useCallback(async () => {
    setEventoPrivadoVisivel(true);
    setTimeout(async () => {
      await realtime.marcarEventoPrivadoLido(jogadorId);
      setEventoPrivadoVisivel(false);
    }, 4000);
  }, [realtime, jogadorId]);

  const eventoAtual = estadoPublico.eventoAtivo;

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.labelLoop}>loop {estadoPublico.loop}</Text>
        <Text style={estilos.labelTimer}>{segundosRestantes}s</Text>
      </View>

      {/* Área central de eventos */}
      <View style={estilos.centro}>
        {eventoAtual && eventoVisivelId === eventoAtual.id && (
          <Animated.Text style={[estilos.textoEvento, { opacity: opacidadeEvento }]}>
            {eventoAtual.texto}
          </Animated.Text>
        )}

        {(!eventoAtual || eventoVisivelId !== eventoAtual?.id) &&
          estadoPublico.mensagemDoSistema && (
            <Text style={estilos.mensagemSistema}>{estadoPublico.mensagemDoSistema}</Text>
          )}
      </View>

      {/* Card de evento privado */}
      {temEventoPrivadoPendente && !eventoPrivadoVisivel && (
        <View style={estilos.cardPrivadoContainer}>
          <TouchableOpacity
            style={estilos.cardPrivado}
            onPress={handleVerEventoPrivado}
            activeOpacity={0.85}
          >
            <Text style={estilos.cardPrivadoTexto}>toque para ver sua mensagem</Text>
          </TouchableOpacity>
        </View>
      )}

      {eventoPrivadoVisivel && eventoPrivado && (
        <View style={estilos.cardPrivadoContainer}>
          <View style={[estilos.cardPrivado, estilos.cardPrivadoAberto]}>
            <Text style={estilos.cardPrivadoTextoAberto}>{eventoPrivado.texto}</Text>
          </View>
        </View>
      )}

      {/* Barra de timer */}
      <Animated.View style={[estilos.barra, { width: barraLargura }]} />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: espacamento.lg,
    paddingTop: espacamento.md,
  },
  labelLoop: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  labelTimer: {
    fontSize: 13,
    fontFamily: familias.sans,
    color: cores.textoMudo,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
  },
  textoEvento: {
    fontSize: 30,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
    letterSpacing: tipografia.spacingTitulo,
    lineHeight: 38,
  },
  mensagemSistema: {
    fontSize: tipografia.tamanhoCorpoMaior,
    fontFamily: familias.sans,
    color: cores.textoMudo,
    textAlign: 'center',
  },
  cardPrivadoContainer: {
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.lg,
  },
  cardPrivado: {
    backgroundColor: cores.texto,
    borderRadius: 12,
    paddingVertical: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    alignItems: 'center',
  },
  cardPrivadoAberto: {
    backgroundColor: cores.superficieElevada,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  cardPrivadoTexto: {
    fontSize: tipografia.tamanhoCorpo,
    fontFamily: familias.sans,
    color: cores.fundo,
    fontWeight: tipografia.pesoBold,
  },
  cardPrivadoTextoAberto: {
    fontSize: tipografia.tamanhoSubtitulo,
    fontFamily: familias.serifDisplay,
    color: cores.texto,
    textAlign: 'center',
  },
  barra: {
    height: 2,
    backgroundColor: cores.primaria,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});
