# Entre Nós — Architecture

## Filosofia

A arquitetura deve permitir criar muitos jogos sociais sem transformar o app em um sistema rígido demais.

Prioridades:

- experiência social primeiro;
- modularidade;
- TypeScript estrito;
- engine separado de UI;
- metadata consistente;
- SessionStore como camada de inteligência;
- extração apenas depois de padrão validado.

## Regra Contra Abstração Prematura

Não extrair sistema antes de existir repetição real.

Extrair quando:

- 3 ou mais jogos repetem padrão;
- a duplicação causa bug;
- a API local está estável;
- o componente reduz fricção futura.

Não extrair por estética arquitetural.

## Camadas

### Games

`src/games/[jogo]`

Contém:

- engine;
- tipos;
- conteúdo;
- categorias internas;
- textos editoriais;
- helpers;
- adapters locais quando fizer sentido.

### Screens

`src/screens/[jogo]`

Contém:

- orquestração de UI;
- navegação;
- telas de configuração;
- fases visuais.

Não deve conter regra central do jogo.

### Components

`src/components`

Contém:

- componentes compartilhados;
- botões universais;
- configuração local;
- cadastro de jogadores;
- controles recorrentes.

### Session

`src/session`

Contém:

- SessionStore;
- adapters de jogos;
- emotional tracker;
- group profile;
- callback engine;
- dossiê;
- recomendação.

## Metadata

O catálogo deve ser dirigido por metadata.

Cada jogo deve expor:

- id;
- nome;
- descrição;
- jogadores mínimo/máximo;
- duração;
- modos suportados;
- categoria principal;
- categorias secundárias;
- tags sociais;
- contextos;
- energia;
- intensidade;
- assets.

Ver: `GAME_METADATA_SYSTEM.md`.

## Local Vs Realtime

Jogos locais:

- priorizam celular circulando;
- usam engine em memória;
- protegem segredo por fase;
- têm pacing mais rápido.

Jogos realtime:

- priorizam múltiplos celulares;
- usam sala/código;
- precisam de sincronização;
- exigem reconexão segura.

Ver: `MULTIPLAYER_PHILOSOPHY.md`.

## Catálogo

Home e descoberta devem consumir registry/metadata, não lógica hardcoded espalhada.

Categorias, tags e curadorias devem ser adicionadas como dados, não como telas customizadas por jogo.

## UI

UI deve traduzir estado em sensação.

Ela pode:

- animar;
- organizar;
- reduzir fricção;
- proteger segredo visualmente;
- reforçar feedback.

Ela não deve:

- decidir vencedor;
- armazenar papel secreto;
- duplicar regra de engine;
- fazer analytics emocional quando há callback de engine.

## Assets

Cada jogo deve ter pasta própria em `assets/games/[id]`.

Recomendado:

- `cover.png`;
- `banner.png`;
- logos auxiliares quando necessário.

Ver: `ICONOGRAPHY_SYSTEM.md`.

## Documentação

Docs são parte da arquitetura.

Ao criar novo jogo, consultar:

- `GAME_CREATION_FRAMEWORK.md`;
- `GAME_ENGINE.md`;
- `GAME_METADATA_SYSTEM.md`;
- `SOCIAL_PACING.md`;
- `CONTENT_DIFFICULTY_SYSTEM.md`;
- `PARTY_DYNAMICS.md`.

