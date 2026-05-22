# Social Party App — Mr White

## Sobre o Projeto
App mobile-first de jogos sociais para festas, bares, encontros e viagens.
Público-alvo: brasileiros.
Idioma: Português (Brasil) em toda a interface.

## Primeiro Jogo: Mr White
A maioria dos jogadores recebe a mesma palavra secreta.
Um jogador (Mr White) não recebe palavra nenhuma.
Jogadores descrevem sua palavra. Mr White tenta descobrir e sobreviver.

## Filosofia do Produto
O celular é um catalisador social, não entretenimento de tela.
Os jogadores devem interagir entre si na vida real.

## Stack Técnica
- Expo (React Native) com TypeScript
- Firebase Realtime Database (multiplayer)
- Arquitetura modular (suportar centenas de jogos no futuro)

## Comandos do Projeto
- `npx expo start` — inicia o app
- `npm run build` — build de produção

## Regras de Código
- Todo texto da interface em Português (Brasil)
- TypeScript estrito
- Componentes reutilizáveis e modulares
- Game engine genérico (não acoplado ao Mr White)

## Arquitetura de Pastas
src/
  engine/       — motor de jogos genérico
  games/        — cada jogo em sua pasta
  screens/      — telas da navegação
  components/   — componentes reutilizáveis
  services/     — Firebase e APIs
  hooks/        — React hooks customizados
  types/        — TypeScript types
