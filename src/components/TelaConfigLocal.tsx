import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BadgeUmCelular } from '@/components/BadgeUmCelular';
import { BotaoVoltar } from '@/components/BotaoVoltar';
import { RodapeConfig } from '@/components/RodapeConfig';
import { cores, espacamento, familias, tipografia } from '@/theme/colors';

interface Props {
  titulo: string;
  subtitulo: string;
  children: ReactNode;
  rodape: {
    titulo: string;
    disabled?: boolean;
    carregando?: boolean;
    aviso?: string;
    onPress: () => void;
    usarInsetInferior?: boolean;
  };
  onVoltar?: () => void;
  tituloMultilinha?: boolean;
}

export function TelaConfigLocal({
  titulo,
  subtitulo,
  children,
  rodape,
  onVoltar,
  tituloMultilinha = false,
}: Props) {
  return (
    <SafeAreaView style={estilos.tela} edges={['top', 'bottom']}>
      {onVoltar ? <BotaoVoltar onPress={onVoltar} /> : null}
      <BadgeUmCelular />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.flex}
      >
        <ScrollView
          style={estilos.scroll}
          contentContainerStyle={estilos.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={estilos.cabecalho}>
            <Text
              style={[
                estilos.titulo,
                tituloMultilinha && estilos.tituloMultilinha,
              ]}
            >
              {titulo}
            </Text>
            <Text style={estilos.subtitulo}>{subtitulo}</Text>
          </View>

          {children}
        </ScrollView>

        <RodapeConfig {...rodape} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    marginBottom: espacamento.lg,
    marginTop: espacamento.xl,
  },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollConteudo: { padding: espacamento.lg },
  subtitulo: {
    color: cores.textoSecundario,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoCorpoMenor,
    marginTop: espacamento.xs,
  },
  tela: { backgroundColor: cores.fundo, flex: 1 },
  titulo: {
    color: cores.texto,
    fontFamily: familias.sans,
    fontSize: tipografia.tamanhoTituloGrande,
    fontWeight: tipografia.pesoExtraBold,
    letterSpacing: tipografia.spacingTitulo,
  },
  tituloMultilinha: {
    lineHeight: 40,
  },
});
