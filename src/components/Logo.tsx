import { Image, StyleSheet } from 'react-native';

interface Props {
  tamanho?: number;
}

export function Logo({ tamanho = 120 }: Props) {
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={[estilos.imagem, { width: tamanho, height: tamanho }]}
      resizeMode="contain"
    />
  );
}

const estilos = StyleSheet.create({
  imagem: {},
});
