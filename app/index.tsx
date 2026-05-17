/**
 * Rota raiz do Expo Router (URL "/").
 *
 * ⚠️ ONDA 1 — placeholder.
 *
 * Não é executado em runtime — o app inicia via `index.ts` → `App.tsx`.
 * Na Onda 2, este arquivo recebe o conteúdo de `src/screens/TelaInicio.tsx`
 * (renomeado pra fazer sentido como "home").
 *
 * Mantemos um esqueleto válido pra que o Expo Router consiga indexar
 * o diretório /app sem erros caso o sistema de typed routes seja
 * habilitado mais tarde.
 */
import { StyleSheet, Text, View } from 'react-native';

import { cores, tipografia } from '@/theme/colors';

export default function HomeRoute() {
  return (
    <View style={estilos.tela}>
      <Text style={estilos.texto}>
        Expo Router instalado — entry ainda usa App.tsx
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    alignItems: 'center',
    backgroundColor: cores.fundo,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  texto: {
    color: cores.textoSecundario,
    fontSize: tipografia.tamanhoCorpoMenor,
    textAlign: 'center',
  },
});
