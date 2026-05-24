# Entre Nós — Design System

## Filosofia Visual

O Entre Nós deve parecer um produto social premium, não um app gamer.

A interface deve ser:

- clara em ambiente barulhento;
- bonita sem roubar a cena;
- rápida de escanear;
- confortável no iPhone;
- consistente entre jogos;
- viva o bastante para parecer social;
- contida o bastante para não virar espetáculo visual.

## Princípio Central

Design deve amplificar momentum social.

Boas telas:

- mostram o que importa primeiro;
- reduzem decisão desnecessária;
- usam poucos textos;
- mantêm alinhamento e respiro;
- deixam o gesto principal óbvio;
- somem quando o grupo precisa agir.

## Home Como Streaming Social

A home deve seguir lógica de catálogo:

- header simples com marca e entrada por código;
- jogo em destaque com banner forte, descrição curta e CTA;
- "jogados recentemente";
- fileiras horizontais por categorias estáveis;
- curadorias dinâmicas;
- "ver mais" aplicando filtro/contexto;
- cards com imagem, título, descrição curta e metadados essenciais.

Não usar home como grid seco de apps.

## Layout

Regras:

- margens horizontais consistentes;
- conteúdo alinhado pelo mesmo eixo visual;
- seções em bandas ou listas, não cards dentro de cards;
- botões fixos no rodapé quando a decisão principal é iniciar/continuar;
- texto grande apenas quando é o foco real da tela;
- listas horizontais com começo claramente alinhado;
- nada deve parecer cortado por acidente.

## Paleta

Base:

- Fundo: `#F6F3EE`
- Superfície: `#FFFFFF`
- Texto primário: `#161616`
- Texto secundário: `#5E5E5E`
- Texto mudo: tons cinza quentes
- Borda: `#E7E2DA`

Acentos:

- Vermelho social: `#FF5A5F`
- Azul confiança/conversa: `#4D7CFE`
- Verde acerto/alívio: `#22C55E`
- Amarelo energia: `#FFBE0B`
- Roxo caos cognitivo: `#8B5CF6`

Evitar:

- neon gamer;
- roxo dominante em todo o app;
- preto absoluto como fundo padrão;
- gradientes decorativos sem função;
- paletas monocromáticas por tela.

## Tipografia

A tipografia deve ser expressiva, mas legível.

Usar:

- display para títulos de alto impacto;
- sans para corpo, labels, botões e metadados;
- pesos fortes para decisões e nomes de jogos;
- labels pequenos apenas como apoio, nunca como informação essencial.

Evitar:

- textos longos em gameplay;
- heading gigante dentro de cards compactos;
- texto cortado em cards;
- letter spacing negativo.

## Cards De Jogos

Todo card de jogo deve ter:

- imagem ou logo premium;
- título claro;
- descrição curta;
- metadados mínimos quando úteis;
- tamanho estável;
- clipping intencional;
- raio consistente.

Cards devem vender uma experiência social, não explicar regra.

## Banners

Banners devem:

- usar imagem horizontal 2:1;
- permitir texto sobre imagem com overlay legível;
- preservar o sujeito principal sem corte estranho;
- ter área segura para título, descrição e CTA;
- evitar imagem genérica escura demais.

## Logos E Ícones

Cada jogo deve ter identidade visual própria, mas pertencer ao mesmo universo.

Regras rápidas:

- logos quadradas;
- composição central;
- iluminação premium;
- fundo limpo ou transparente controlado;
- sem bordas acidentais;
- sem recortes inesperados;
- assets padronizados por pasta do jogo.

Ver também: `ICONOGRAPHY_SYSTEM.md`.

## Telas De Configuração

Configuração deve ser:

- mínima;
- direta;
- familiar entre jogos;
- baseada em componentes compartilhados.

Usar:

- `TelaConfigLocal`;
- `CadastroJogadores`;
- `SecaoConfig`;
- `SegmentControl`;
- `ControladorNumerico`;
- botão universal de voltar/fechar.

## Gameplay UI

Durante gameplay:

- tela deve priorizar instrução de ação;
- botões devem ser grandes e inequívocos;
- fases privadas devem esconder informação com clareza;
- reveals devem ser curtos;
- haptics podem reforçar sucesso, sabotagem, erro ou tensão;
- confirmações só entram para ações destrutivas ou saída de jogo.

## Anti-Padrões

Evitar:

- explicar funcionalidades em texto visível;
- transformar cada jogo em visual isolado demais;
- hero marketing sem jogo real;
- cards aninhados;
- estados vazios sem ação;
- tela bonita que desacelera a mesa.

