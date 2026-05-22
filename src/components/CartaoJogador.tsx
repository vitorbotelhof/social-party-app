import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { Player } from '@/engine/types';
import {
  PALETA_AVATARES,
  cores,
  espacamento,
  raio,
  sombra,
  tipografia,
} from '@/theme/colors';

type EstadoVisual = 'normal' | 'voce' | 'votado';

interface Props {
  jogador: Player;
  estado?: EstadoVisual;
}

export function CartaoJogador({ jogador, estado = 'normal' }: Props) {
  const [corA, corB] = gradienteAvatarDe(jogador.id);
  const inicial = (jogador.nome.trim().charAt(0) || '?').toUpperCase();
  const desconectado = jogador.estaConectado === false;

  return (
    <View
      style={[
        estilos.cartao,
        estado === 'voce' && estilos.cartaoVoce,
        estado === 'votado' && estilos.cartaoVotado,
        desconectado && estilos.cartaoDesconectado,
      ]}
    >
      <LinearGradient
        colors={[corA, corB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[estilos.avatar, desconectado && estilos.avatarDesconectado]}
      >
        <Text style={estilos.avatarTexto}>{inicial}</Text>
      </LinearGradient>

      <View style={estilos.blocoNome}>
        <Text
          style={[estilos.nome, desconectado && estilos.nomeDesconectado]}
          numberOfLines={1}
        >
          {jogador.nome}
        </Text>
        {desconectado ? (
          <Text style={estilos.tagDesconectado}>SEM SINAL</Text>
        ) : (
          <>
            {estado === 'voce' && <Text style={estilos.tagVoce}>VOCÊ</Text>}
            {estado === 'votado' && (
              <Text style={estilos.tagVotado}>SEU VOTO</Text>
            )}
          </>
        )}
      </View>

      {jogador.ehAnfitriao && (
        <View style={estilos.badgeHost}>
          <Text style={estilos.badgeHostTexto}>ANFITRIÃO</Text>
        </View>
      )}
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

const TAMANHO_AVATAR = 44;
const COR_BADGE_HOST_FUNDO = 'rgba(255, 90, 95, 0.09)';

const estilos = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: TAMANHO_AVATAR / 2,
    height: TAMANHO_AVATAR,
    justifyContent: 'center',
    width: TAMANHO_AVATAR,
  },
  avatarDesconectado: {
    opacity: 0.45,
  },
  avatarTexto: {
    color: cores.textoSobrePrimaria,
    fontSize: 18,
    fontWeight: tipografia.pesoExtraBold,
  },
  // Badge: usa nova primary, sem hardcode de sienna
  badgeHost: {
    backgroundColor: COR_BADGE_HOST_FUNDO,
    borderColor: cores.primaria,
    borderRadius: raio.sm,
    borderWidth: 1,
    paddingHorizontal: espacamento.sm,
    paddingVertical: 3,
  },
  badgeHostTexto: {
    color: cores.primaria,
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 1,
  },
  blocoNome: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: espacamento.sm,
  },
  // Card: superfície branca com borda quente e sombra sutil
  cartao: {
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderRadius: raio.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: espacamento.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
    ...sombra.leve,
  },
  // "Você": destaque da borda com primaria
  cartaoVoce: {
    borderColor: cores.primaria,
    borderWidth: 1.5,
  },
  // "Votado": destaque mais forte
  cartaoVotado: {
    borderColor: cores.primaria,
    borderWidth: 2,
  },
  cartaoDesconectado: {
    opacity: 0.5,
  },
  nome: {
    color: cores.texto,
    flexShrink: 1,
    fontSize: tipografia.tamanhoCorpoMaior,
    fontWeight: tipografia.pesoSemibold,
  },
  nomeDesconectado: {
    color: cores.textoMudo,
  },
  tagDesconectado: {
    color: cores.alerta,
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.8,
  },
  tagVoce: {
    color: cores.primaria,
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.8,
  },
  tagVotado: {
    color: cores.primaria,
    fontSize: 10,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: 0.8,
  },
});
