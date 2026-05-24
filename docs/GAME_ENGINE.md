# Entre Nós — Game Engine

## Objetivo

O engine existe para organizar interação social, não para simular videogame.

Ele deve:

- manter estado previsível;
- proteger informação privada;
- reduzir fricção;
- preservar momentum social;
- suportar jogos locais e realtime;
- alimentar SessionStore;
- permitir expansão para muitos jogos.

## Unidade Principal

A unidade técnica principal do app é o jogo.

A unidade de produto principal é a sessão social.

Engines de jogos devem emitir eventos que a sessão entende:

- rodada resolvida;
- resultado final;
- momento memorável;
- estatísticas por jogador;
- sinais emocionais.

## State Machines

Toda state machine deve ser:

- explícita;
- curta;
- sem estados mortos;
- resiliente a toque duplo;
- fácil de depurar;
- independente de UI.

Cada fase deve responder:

- quem pode agir?
- qual informação é pública?
- qual informação é privada?
- o que avança a fase?
- qual evento é emitido?

## Padrão De Engine Local

Usar quando:

- o celular circula fisicamente;
- não há necessidade de sincronização;
- o jogo depende de segredo presencial;
- o pacing precisa ser muito rápido.

Padrão:

- engine em memória;
- estado público separado de estado privado;
- UI consulta informação privada apenas no momento correto;
- callbacks para SessionStore;
- sem Firebase.

Exemplos:

- Faz Aí;
- Inquisição local;
- Aliança local;
- Você Me Conhece? local.

## Padrão Realtime

Usar quando:

- cada jogador precisa interagir no próprio celular;
- respostas simultâneas importam;
- sala/código é parte da experiência;
- sync entre dispositivos é necessário.

Padrão:

- estado persistido no Firebase;
- jogador tem visão privada;
- transições precisam ser idempotentes;
- reconexão não pode quebrar a partida;
- UI não deve expor o backend.

## Informação Pública E Privada

Regra:

Estado público nunca deve expor segredo.

Informação privada deve ser acessada por:

- jogador atual;
- momento de reveal;
- final do jogo quando apropriado.

Em jogos como Aliança/Inquisição, o segredo é o coração da experiência. Vazamento de papel mata o jogo.

## Timers

Timers devem ser usados para pacing, não para teatralidade.

Usar timers para:

- limitar atuação;
- acelerar passagem;
- evitar espera;
- cadenciar reveal curto.

Evitar:

- suspense artificial;
- countdown longo;
- loader sem função;
- delay que impede conversa.

## Callbacks

Engines devem aceitar callbacks opcionais:

- `onRodadaResolvida`;
- `onTurnoResolvido`;
- `onEquipeRejeitada`;
- `onJogoFinalizado`;
- outros eventos específicos validados.

Callbacks traduzem gameplay em SessionStore. A UI não deve fazer analytics emocional diretamente quando o engine pode emitir o evento.

## Padrões Recentes

### Inquisição

Padrões importantes:

- paranoia social progressiva;
- corrupção dinâmica;
- microfases rápidas;
- informação privada controlada;
- evitar eliminação passiva;
- eventos sociais que provocam comportamento, não lore.

### Aliança

Padrões importantes:

- liderança circular;
- votação secreta;
- missão secreta;
- reveal sem autoria;
- limite de rejeições;
- callbacks para missão sabotada e rejeição em cadeia.

## Critérios De Qualidade

Um engine está saudável quando:

- dá para testar fluxo sem UI;
- as fases são legíveis;
- o estado público é seguro;
- a UI não contém regra central;
- o SessionStore recebe sinais úteis;
- não há waits artificiais;
- o jogo termina sem travar ou depender de fechar app.

