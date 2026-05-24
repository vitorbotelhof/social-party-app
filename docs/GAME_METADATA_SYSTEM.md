# Entre Nós — Game Metadata System

## Objetivo

Metadata é a base do catálogo, descoberta e recomendação.

Todo jogo deve ser descrito como experiência social, não apenas como regra.

## Campos Obrigatórios

Cada jogo deve ter:

- `id`;
- `nome`;
- `descricaoCurta`;
- `descricaoDetalhada`;
- `minJogadores`;
- `maxJogadores`;
- `duracaoMinutos`;
- `disponivel`;
- `modosSuportados`;
- `categoriaPrincipal`;
- `categoriasSecundarias`;
- `socialTags`;
- `contexts`;
- `energia`;
- `intimidade`;
- `complexidade`;
- `assets`.

## Categorias Principais

Categorias principais são estáveis e poucas.

Elas respondem:

"que tipo de experiência social é essa?"

Exemplos:

- desconfiança e blefe;
- exposição e julgamento;
- atuação e improviso;
- conversa e intimidade;
- pressão e rapidez;
- conhecimento do grupo.

## Tags Sociais

Tags são flexíveis e múltiplas.

Elas respondem:

"que comportamento esse jogo provoca?"

Exemplos:

- paranoia;
- gritaria;
- vergonha;
- manipulação;
- reconhecimento;
- casal;
- política social;
- caos físico;
- memória;
- votação.

## Contextos

Contextos respondem:

"quando esse jogo funciona melhor?"

Exemplos:

- bar;
- viagem;
- date;
- churrasco;
- after;
- grupo novo;
- grupo íntimo;
- casa de praia;
- pré-festa;
- fim de noite.

## Energia

Escala recomendada:

- baixa;
- média;
- alta;
- colapso.

Energia não é dificuldade. Energia é quanto o jogo move o ambiente.

## Intimidade

Escala recomendada:

- segura;
- pessoal leve;
- íntima;
- vulnerável.

Jogos de alta intimidade exigem onboarding emocional mais cuidadoso.

## Complexidade

Escala recomendada:

- imediata;
- simples;
- moderada;
- estratégica.

Complexidade deve ser percebida pelo jogador, não pelo código.

## Assets

Cada jogo deve declarar:

- cover quadrada;
- banner horizontal;
- fallback;
- cor/acento.

## Uso Na Home

Metadata deve alimentar:

- destaque rotativo;
- recentes;
- fileiras por categoria;
- curadorias;
- filtros;
- recomendações pós-jogo.

## Regra De Escalabilidade

Um jogo pode pertencer a várias categorias e tags.

Não forçar taxonomia exclusiva. O catálogo é vivo.

