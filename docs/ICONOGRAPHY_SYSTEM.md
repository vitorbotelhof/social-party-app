# Entre Nós — Iconography System

## Objetivo

Definir padrão visual para logos, covers e banners dos jogos.

O catálogo precisa parecer premium e coerente, mesmo com identidades individuais fortes.

## Assets Por Jogo

Cada pasta `assets/games/[id]` deve conter:

- `cover.png`: card quadrado;
- `banner.png`: destaque horizontal;
- assets auxiliares apenas se necessários.

## Cover

Especificação recomendada:

- PNG;
- 1024 x 1024;
- composição central;
- sujeito ocupando 70% a 88%;
- fundo limpo ou transparente controlado;
- sem borda acidental;
- cantos preparados para clipping do app;
- legível em card pequeno.

## Banner

Especificação recomendada:

- PNG;
- 2048 x 1024;
- proporção 2:1;
- área segura para texto no terço inferior/esquerdo;
- sujeito principal não deve ficar escondido pelo CTA;
- contraste suficiente para overlay;
- sem detalhes importantes nas bordas extremas.

## Estilo Visual

Direção:

- social premium;
- iluminação suave;
- personagens expressivos;
- objetos reconhecíveis;
- composição limpa;
- cores ligadas à emoção do jogo.

Evitar:

- stock genérico;
- blur escuro demais;
- fundo poluído;
- logo com texto dentro da imagem;
- transparência com halos ou pixels estranhos;
- assets de tamanhos inconsistentes.

## Aplicação No App

O app deve:

- usar `resizeMode` consistente;
- cortar de forma intencional;
- aplicar radius via componente;
- nunca depender de borda interna da imagem;
- ter fallback visual por jogo.

