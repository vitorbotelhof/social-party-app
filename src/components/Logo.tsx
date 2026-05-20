import { Image } from 'react-native';

interface Props {
  tamanho?: number;
}

/**
 * Logo do app — borderRadius aplicado diretamente no Image.
 *
 * O logo.png não tem canal alpha (RGB sólido), então precisamos cortar
 * os cantos escuros. Em React Native, aplicar borderRadius no próprio
 * Image é o método confiável — o View wrapper com overflow:hidden
 * não garante o recorte em todas as plataformas.
 *
 * Proporção 0.22 = superelipse iOS (padrão de ícone de app).
 */
export function Logo({ tamanho = 120 }: Props) {
  const raio = Math.round(tamanho * 0.22);
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={{ width: tamanho, height: tamanho, borderRadius: raio }}
      resizeMode="cover"
    />
  );
}
