# ENTRE NÓS — GAME ENGINE

Entre Nós — Game Engine Architecture
Social Session Engine System
1. Filosofia Central

O engine do Entre Nós NÃO existe para:

controlar partidas tradicionais
maximizar mecânicas competitivas
criar sistemas “gamey”
parecer backend de multiplayer
parecer arquitetura de videogame clássico

O engine existe para:

modular energia social entre pessoas reais.
2. O Verdadeiro Produto

O produto NÃO entrega:

gameplay isolado.

O produto entrega:

sessões emocionais sociais.

O engine deve ser construído para:

pacing emocional
energia coletiva
replayability social
caos controlado
memória coletiva
dinâmica humana
3. Unidade Principal do Sistema

A unidade principal NÃO é:

match.

A unidade principal é:

sessão social.
Toda sessão possui:
identidade
energia
progressão
temperatura emocional
callbacks
aftermath
memória coletiva
4. Filosofia de Engine

O engine deve:

desaparecer visualmente
parecer invisível
preservar flow social
minimizar burocracia
acelerar interação humana
O usuário nunca deve sentir:
sistema técnico
backend
estado complexo
arquitetura
loading multiplayer
5. Arquitetura Geral

Estrutura macro:

Session
 ├── Energy State
 ├── Emotional Progression
 ├── Group Identity
 ├── Memory System
 ├── Current Game
 ├── Current Round
 └── Social Momentum
6. Session-First Architecture

O engine deve pensar:

primeiro na sessão,

depois:

no jogo individual.
Exemplo correto
A sessão está:
- caótica
- intensa
- cansada

→ sugerir cooldown emocional
Exemplo incorreto
Partida acabou.
Voltar ao menu.
7. Emotional State System

Toda sessão possui:

estado emocional global.
Exemplos
leve
energética
paranoica
íntima
caótica
colapsada
competitiva
Isso deve influenciar:
pacing
commentary
transitions
recommendations
UI intensity
game suggestions
8. Group Identity Engine

O engine deve detectar:

grupo caótico
grupo silencioso
grupo extremamente competitivo
grupo paranoico
grupo vulnerável
grupo destrutivo
grupo altamente eficiente
Isso deve alimentar:
commentary
recommendations
aftermath
dossiê do caos
pacing
9. Social Momentum System

Momentum é:

extremamente importante.
O engine deve:
preservar flow
evitar interrupções
minimizar waits
evitar telas mortas
manter energia viva
Momentum NÃO deve ser quebrado por:
menus
confirms
loading
transições lentas
burocracia
10. Emotional Pacing Engine

Toda sessão deve seguir:

uma curva emocional.
Estrutura desejada
Início

leve
social
seguro

Meio

energia
flow
caos

Intensificação

pressão
hesitação
desespero

Colapso

gritaria
improviso extremo
explosão emocional

Aftermath

silêncio
memória
alívio

11. Engine Philosophy by Game

Cada jogo:

ativa emoções diferentes
possui pacing diferente
possui energia diferente

Mas:

todos pertencem ao mesmo ecossistema emocional.
12. Mr White Engine Philosophy

Objetivo:

paranoia social progressiva.
O engine deve priorizar:
suspeita
hesitação
leitura humana
silêncio estratégico
votação emocional
13. Most Likely To Engine Philosophy

Objetivo:

julgamento social divertido.
O engine deve priorizar:
revelação rápida
consenso
reação coletiva
caos social leve
14. Na Ponta da Língua Engine Philosophy

Objetivo:

colapso cognitivo coletivo.
O engine deve priorizar:
velocidade
pressão
improviso
momentum contínuo
explosão emocional
15. Multiplayer Philosophy

Multiplayer NÃO deve parecer:

sincronização
networking
backend Firebase
Multiplayer deve parecer:
experiência contínua.
O usuário nunca deve perceber:
reconnection system
sync state
room recovery
replication logic
16. Local-First Architecture

O produto é:

presencial-first.

Mesmo no multiplayer:
o foco é:

pessoas no mesmo espaço físico.
17. Anti-Friction Philosophy

O engine deve reduzir:

setup
configuração
confirmação
espera
leitura
burocracia
Objetivo:
entrar no caos o mais rápido possível.
18. Round Design Philosophy

Rounds NÃO devem:

parecer isolados
reiniciar emoção completamente
Rounds devem:
acumular tensão
acumular memória
acumular energia
19. State Machine Philosophy

As state machines devem:

ser simples
previsíveis
resilientes
rápidas
Evitar:
estados excessivos
waits artificiais
dead states
loops complexos
20. Dead Zone Prevention

Toda sessão deve evitar:

zonas mortas sociais.
Detectar:
silêncio longo
hesitação
energia baixa
confusão
espera excessiva
E reagir:
acelerando
simplificando
provocando
reduzindo fricção
21. Session Memory System

O engine deve lembrar:

colapsos
traições
julgamentos
clutch moments
rounds absurdos
Objetivo:
narrativa emergente.
22. Callback Engine

O sistema deve gerar callbacks como:

“vocês continuam piorando.”
“ninguém superou aquela rodada.”
“o grupo azul perdeu o controle.”
Objetivo:
sensação de sessão viva.
23. Replayability System

Replayability NÃO vem de:

grind
XP
unlocks artificiais
Replayability vem de:
comportamento humano imprevisível.
O engine deve maximizar:
novas dinâmicas sociais
novas combinações emocionais
novas histórias
24. Card/Prompt Distribution

Distribuição deve evitar:

repetição emocional
repetição cognitiva
repetição estrutural
O sistema deve balancear:
intensidade
velocidade
caos
acessibilidade
pressão
25. Adaptive Session System

O engine deve detectar:

fadiga emocional
intensidade excessiva
caos excessivo
energia baixa
E adaptar:
pacing
intensidade
suggestions
transitions
próximos jogos
26. Sound + Haptics Philosophy

Som e haptics existem para:

amplificar energia social.
NÃO:
espetáculo audiovisual
feedback gamer exagerado
SIM:
ritmo
pressão
release
timing emocional
27. Transition Philosophy

Transitions devem:

preservar momentum
parecer instantâneas
manter continuidade emocional
Evitar:
cinematic slow fades
waits dramáticos
telas contemplativas
28. Failure Philosophy

Falha deve parecer:

caos humano
improviso falhando
pressão vencendo
Falha NÃO deve parecer:
punição
incompetência
humilhação
29. Dossiê do Caos

Ao final:
o engine gera:

memória coletiva estruturada.
Exemplos:
maior colapso
mais suspeito
mais julgado
clutch da sessão
momento mais absurdo
Objetivo:
replayability
compartilhamento
retenção emocional
30. Performance Philosophy

O engine deve parecer:

instantâneo
leve
contínuo
O usuário nunca deve perceber:
complexidade técnica
sincronização
processamento
carregamento
31. Anti-Patterns

Evitar:

❌ flow técnico
❌ excesso de estados
❌ multiplayer burocrático
❌ waits longos
❌ reconnection confuso
❌ pacing lento
❌ setup excessivo
❌ gameplay interrompido

32. Product Principle

O engine NÃO existe para:

rodar jogos.

O engine existe para:

facilitar noites memoráveis entre pessoas reais.

Toda decisão arquitetural deve responder:

“isso melhora a energia social da sessão?”

Se não:
não implementar.