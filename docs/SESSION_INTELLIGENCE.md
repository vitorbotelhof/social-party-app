# Entre Nós — Session Intelligence

## Objetivo

Session Intelligence transforma jogos isolados em noite social contínua.

Ela captura:

- jogos jogados;
- momentos memoráveis;
- estatísticas de jogador;
- temperatura emocional;
- identidade do grupo;
- callbacks;
- dossiê.

## SessionStore

Responsável por:

- iniciar sessão;
- registrar jogo iniciado/finalizado;
- registrar momentos;
- atualizar jogadores;
- manter estado em memória;
- alimentar recomendações.

## Adapters

Cada jogo deve ter adapter quando emite sinais relevantes.

Adapters traduzem:

- rodada;
- turno;
- missão;
- votação;
- resultado.

Em:

- momentos memoráveis;
- stats de jogo;
- stats por jogador;
- atualização emocional.

## Momentos Memoráveis

Momentos devem ser:

- poucos;
- socialmente fortes;
- úteis para callbacks;
- úteis para dossiê;
- ligados a comportamento real.

Exemplos:

- clutch;
- unanimidade;
- leitura perfeita;
- missão sabotada;
- rejeição em cadeia;
- atuação duvidosa.

## Callbacks

Callbacks devem soar como host social:

- curtos;
- observadores;
- contextuais;
- sem bloquear fluxo.

## Dossiê

O dossiê deve resumir:

- temperatura;
- identidade do grupo;
- destaques individuais;
- momento da sessão;
- frase final.

Objetivo futuro:

- retenção;
- compartilhamento;
- personalização.

