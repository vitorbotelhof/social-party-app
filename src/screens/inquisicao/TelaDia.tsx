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
  const [mensagemSistemaVisivel, setMensagemSistemaVisivel] = useState(false);
  const [mensagemPrivadaVisivel, setMensagemPrivadaVisivel] = useState(false);

  const opacidadeEvento = useRef(new Animated.Value(0)).current;
  const opacidadeMensagemSistema = useRef(new Animated.Value(0)).current;
  const barraLargura = useRef(new Animated.Value(BARRA_LARGURA)).current;
  const timerEventoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerMensagemSistemaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopMensagemExibidaRef = useRef<number | null>(null);
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

  // ── Mensagem do sistema (pós-noite) ────────────────────────────────────────
  // Exibe a mensagem ambígua que o engine escreve ao resolver a noite.
  // Aparece uma vez por loop (primeira entrada em conversa após noite).
  // Fade in → permanece 4s → fade out.
  useEffect(() => {
    const mensagem = estadoPublico.mensagemDoSistema;
    const loop = estadoPublico.loop;

    // Só exibe se: há mensagem, loop > 1 (primeiro loop não tem noite prévia),
    // e ainda não foi exibida para este loop.
    if (!mensagem || loop <= 1 || loopMensagemExibidaRef.current === loop) return;

    loopMensagemExibidaRef.current = loop;
    setMensagemSistemaVisivel(true);

    if (timerMensagemSistemaRef.current) clearTimeout(timerMensagemSistemaRef.current);

    // Fade in
    opacidadeMensagemSistema.setValue(0);
    Animated.timing(opacidadeMensagemSistema, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Após 4s, fade out
    timerMensagemSistemaRef.current = setTimeout(() => {
      Animated.timing(opacidadeMensagemSistema, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setMensagemSistemaVisivel(false));
    }, 4000);

    return () => {
      if (timerMensagemSistemaRef.current) clearTimeout(timerMensagemSistemaRef.current);
    };
  }, [estadoPublico.mensagemDoSistema, estadoPublico.loop, opacidadeMensagemSistema]);

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

  // ── Mensagem privada (notificação de corrupção) ─────────────────────────────
  const mensagemPrivada = estadoPrivado?.mensagemPrivada ?? null;
  const mensagemPrivadaNaoLida = mensagemPrivada !== null && estadoPrivado?.mensagemLida === false;

  const handleDismissarMensagemPrivada = useCallback(async () => {
    setMensagemPrivadaVisivel(true);
    await realtime.marcarMensagemLida(jogadorId);
  }, [realtime, jogadorId]);

  const eventoAtual = estadoPublico.eventoAtivo;

  return (
    <SafeAreaView style={estilos.container}>
      {/* Cabeçalho */}
      <View style={estilos.cabecalho}>
        <Text style={estilos.labelLoop}>loop {estadoPublico.loop}</Text>
        <Text style={estilos.labelTimer}>{segundosRestantes}s</Text>
      </View>

      {/* Área central de eventos — silêncio quando não há evento ativo */}
      <View style={estilos.centro}>
        {eventoAtual && eventoVisivelId === eventoAtual.id && (
          <Animated.Text style={[estilos.textoEvento, { opacity: opacidadeEvento }]}>
            {eventoAtual.texto}
          </Animated.Text>
        )}

        {/* Mensagem pós-noite — aparece no início de cada nova conversa */}
        {mensagemSistemaVisivel && estadoPublico.mensagemDoSistema && (
          <Animated.Text
            style={[estilos.mensagemSistema, { opacity: opacidadeMensagemSistema }]}
          >
            {estadoPublico.mensagemDoSistema}
          </Animated.Text>
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

      {/* Card de mensagem privada — notificação de corrupção (dismiss manual) */}
      {mensagemPrivadaNaoLida && !mensagemPrivadaVisivel && (
        <View style={estilos.cardPrivadoContainer}>
          <TouchableOpacity
            style={estilos.cardMensagemPrivada}
            onPress={handleDismissarMensagemPrivada}
            activeOpacity={0.85}
          >
            <Text style={estilos.cardPrivadoTextoAberto}>mensagem para você</Text>
          </TouchableOpacity>
        </View>
      )}

      {mensagemPrivadaVisivel && mensagemPrivada && (
        <View style={estilos.cardPrivadoContainer}>
          <View style={[estilos.cardPrivado, estilos.cardPrivadoAberto]}>
            <Text style={estilos.cardPrivadoTextoAberto}>{mensagemPrivada}</Text>
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
  // Card de notificação de corrupção — visual distinto do evento privado
  cardMensagemPrivada: {
    backgroundColor: cores.superficieElevada,
    borderRadius: 12,
    paddingVertical: espacamento.lg,
    paddingHorizontal: espacamento.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: cores.borda,
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
