import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cores, tipografia } from '@/theme/colors';

interface Props {
  segundosTotais: number;
  segundosRestantes: number;
  tamanho?: number;
}

const TAMANHO_PADRAO = 120;
const ESPESSURA = 8;

/**
 * Anel circular de progresso com número no centro.
 * Componente apresentacional: o tick fica com o pai (`setInterval`).
 *
 * Cores:
 *   Normal  → conversa (azul) — fluxo tranquilo
 *   Acabando → primaria (vermelho) — urgência social
 * Track → borda quente (visível no novo fundo claro)
 */
export function Temporizador({
  segundosTotais,
  segundosRestantes,
  tamanho = TAMANHO_PADRAO,
}: Props) {
  const raioCirculo = (tamanho - ESPESSURA) / 2;
  const circunferencia = 2 * Math.PI * raioCirculo;
  const total = Math.max(1, segundosTotais);
  const progresso = Math.max(0, Math.min(1, segundosRestantes / total));
  const offset = circunferencia * (1 - progresso);
  const centro = tamanho / 2;
  const acabando = segundosRestantes <= 5;

  return (
    <View style={[estilos.wrapper, { width: tamanho, height: tamanho }]}>
      <Svg width={tamanho} height={tamanho}>
        {/* Track: borda quente — visível no fundo papel */}
        <Circle
          cx={centro}
          cy={centro}
          r={raioCirculo}
          stroke={cores.borda}
          strokeWidth={ESPESSURA}
          fill="none"
        />
        {/* Progress: azul calmo → vermelho urgente */}
        <Circle
          cx={centro}
          cy={centro}
          r={raioCirculo}
          stroke={acabando ? cores.primaria : cores.conversa}
          strokeWidth={ESPESSURA}
          fill="none"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${centro} ${centro})`}
        />
      </Svg>
      <View style={[estilos.centro, { width: tamanho, height: tamanho }]}>
        <Text
          style={[
            estilos.numero,
            acabando && estilos.numeroAcabando,
          ]}
        >
          {Math.max(0, Math.ceil(segundosRestantes))}
        </Text>
        <Text style={[estilos.unidade, acabando && estilos.unidadeAcabando]}>
          seg
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  numero: {
    color: cores.texto,
    fontSize: 36,
    fontWeight: tipografia.pesoExtraBold,
  },
  numeroAcabando: {
    color: cores.primaria,
  },
  unidade: {
    color: cores.textoMudo,
    fontSize: 11,
    fontWeight: tipografia.pesoBold,
    letterSpacing: 1.5,
    marginTop: -4,
  },
  unidadeAcabando: {
    color: cores.primaria,
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
