# Entre Nós — Game Creation Framework

## Objetivo

Processo oficial para criar novos jogos.

Antes de implementar UI, definir a experiência emocional.

## Perguntas Obrigatórias

1. Qual é a emoção central?
2. Que frase o jogador diria no meio do jogo?
3. O celular aparece para fazer o quê?
4. Quando o celular deve desaparecer?
5. Qual é o core loop?
6. Quanto tempo dura uma rodada?
7. Como o grupo vence ou recebe release?
8. Qual é a principal fricção?
9. O jogo funciona em grupo barulhento?
10. O que torna o jogo replayable?

## Documento Inicial Do Jogo

Todo jogo novo deve definir:

- manifesto;
- núcleo emocional;
- loop;
- tipos;
- categorias/conteúdo;
- pacing;
- difficulty system;
- arquitetura;
- SessionStore signals;
- modos suportados;
- riscos de gameplay.

## Ordem De Implementação Recomendada

1. Manifesto e gameplay thesis.
2. Engine/types.
3. Conteúdo mínimo.
4. Configuração local.
5. UI local.
6. SessionStore adapter.
7. Polimento/playtest.
8. Realtime, se necessário.

## Critério De Aprovação

Um jogo só está pronto para escalar quando:

- 3 a 5 rodadas são jogáveis sem explicação externa;
- o grupo entende o objetivo;
- há vitória/reveal frequente;
- a fricção não quebra conversa;
- o conteúdo sustenta replay;
- o SessionStore captura sinais úteis.

