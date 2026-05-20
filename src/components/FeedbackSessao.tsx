/**
 * FeedbackSessao — presença da sessão na tela de resultado.
 *
 * Tom: anfitrião social que observa o grupo, não IA analisando dados.
 * Aparece após o resultado. Invisível quando não há nada a dizer.
 *
 * Contém:
 *   1. Callback do host — comentário contextual (itálico, mudo)
 *   2. Temperatura — pulso emocional da sessão (ponto + palavra)
 *   3. Sugestão — próximo jogo baseado na energia (uma linha, natural)
 */

import { useRef, useState, useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { obterCallback } from '@/session/callbackEngine';
import { getSessaoAtual } from '@/session/sessionStore';
import { sugerirProximoJogo } from '@/session/sugestaoJogo';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';
import type { TemperaturaEmocional } from '@/session/types';

// ─── Configuração visual por temperatura ────────────────────────────────────

const TEMP_CONFIG: Record<TemperaturaEmocional, { cor: string; rotulo: string }> = {
  frio:    { cor: cores.textoMudo,        rotulo: 'começando' },
  morno:   { cor: '#FFBE0B',              rotulo: 'esquentando' },
  quente:  { cor: '#FF7A7F',              rotulo: 'quente' },
  colapso: { cor: cores.primaria,         rotulo: 'sem controle' },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface FeedbackSessaoProps {
  /** ID do jogo que acaba de terminar — usado para a sugestão. */
  jogoId: string;
}

// ─── Componente ─────────────────────────────────────────────────────────────

export function FeedbackSessao({ jogoId }: FeedbackSessaoProps) {
  // Obtém callback exatamente uma vez no mount — tem side-effect (marca como usado)
  const [callback] = useState<string | null>(() => obterCallback('pos_jogo'));
  const sessao = getSessaoAtual();
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada suave — não compete com o reveal do resultado
    const t = setTimeout(() => {
      Animated.timing(op, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }, 400);
    return () => clearTimeout(t);
  }, [op]);

  // Só aparece quando há sessão com temperatura acima de frio
  if (!sessao || sessao.temperatura === 'frio') {
    if (!callback) return null;
  }

  const temp = sessao?.temperatura ?? 'frio';
  const config = TEMP_CONFIG[temp];
  const sugestao = sugerirProximoJogo(jogoId);

  const mostrarTemp = sessao != null && temp !== 'frio';
  const temConteudo = !!callback || mostrarTemp || !!sugestao;
  if (!temConteudo) return null;

  return (
    <Animated.View style={[estilos.container, { opacity: op }]}>

      {/* Linha do callback — observação do host, nunca congratulatória */}
      {callback && (
        <Text style={estilos.callbackTexto}>{callback}</Text>
      )}

      {/* Temperatura — pulso da sessão, invisível quando frio */}
      {mostrarTemp && (
        <View style={estilos.tempLinha}>
          <View style={[estilos.tempPonto, { backgroundColor: config.cor }]} />
          <Text style={[estilos.tempTexto, { color: config.cor }]}>
            {config.rotulo}
          </Text>
        </View>
      )}

      {/* Sugestão — uma linha natural, sem CTA explícita */}
      {sugestao && (
        <Text style={estilos.sugestaoTexto}>
          que tal {sugestao.nome.toLowerCase()} a seguir?
        </Text>
      )}

    </Animated.View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────

const estilos = StyleSheet.create({
  container: {
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    gap: espacamento.sm,
    marginTop: espacamento.lg,
    paddingTop: espacamento.lg,
  },

  // Callback: observação discreta do host — nunca empolgada
  callbackTexto: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },

  // Temperatura: pulso visual mínimo
  tempLinha: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  tempPonto: {
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  tempTexto: {
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    fontWeight: tipografia.pesoMedio,
    letterSpacing: 0.3,
  },

  // Sugestão: convite leve — não botão, não CTA
  sugestaoTexto: {
    color: cores.textoMudo,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoLegenda,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
