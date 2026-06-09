# ARQUIVOS — RELEASE INTERNO v1.0

## O que foi construído

Arquivos é um jogo social de investigação cooperativa para 6 jogadores, implementado como experiência realtime presencial: cada jogador usa seu próprio celular, o estado público fica sincronizado pelo Firebase Realtime Database e os arquivos privados são acessíveis apenas pelo jogador correto.

### Loop completo implementado

1. Host cria sala específica de Arquivos pelo catálogo
2. Jogadores entram pelo código no próprio celular (máx. 6, mín. 6)
3. Lobby exibe presença e frase de identidade do jogo
4. Host abre o caso quando todos estão prontos
5. Cada jogador lê identidade, arquivos privados, conhecimentos, segredo e objetivo individual no próprio celular
6. Jogadores compartilham, omitem ou distorcem informações livremente em voz
7. App libera nova evidência pública sincronizada na fase Nova Evidência
8. Ações secretas são distribuídas por fase: o jogador pode cumprir, pular ou cumprir a alternativa
9. Recompensas privadas desbloqueiam arquivos extras ou metainformações
10. Host registra o veredito coletivo com as respostas às perguntas do caso
11. App revela verdade completa, linha do tempo real, pontuação coletiva e resultado individual

### Caso incluído

**O Dossiê Sumido** — 6 personagens, 15 arquivos privados, 13 evidências, 5 ações secretas, 4 perguntas de veredito (3 obrigatórias + 1 opcional). Duração alvo: 35 a 45 minutos.

Personagens:
- Clara Menezes — fundadora e CEO
- Rafael Torres — diretor financeiro
- Davi Sato — líder de produto e dados
- Bianca Prado — consultora de relações públicas
- Nanda Ribeiro — coordenadora de pessoas
- Marina Azevedo — assistente executiva

Verdade do caso: Rafael removeu o dossiê para impedir uma venda baseada em métricas infladas. O dossiê escondia que a Vértice contabilizava convites enviados como presença confirmada.

### Camadas técnicas entregues

- Engine local pura (sem UI, sem Firebase) — inicialização, fases, visão privada, ações secretas, pontuação coletiva, resultado individual
- Realtime Firebase — estado público, visão privada por jogador, ready state, veredito, resultado
- Telas de gameplay — introdução, leitura privada, investigação, nova evidência, confronto, veredito, revelação, resultado individual
- SessionStore — 5 TipoMomento, 12 callbacks, 3 destaques individuais no dossiê
- QA técnico — guards contra duplo veredito, duplo processamento, transições inválidas, boundary público/privado auditado
- Logger estruturado — 20 eventos, buffer em memória, sem conteúdo privado
- Reconexão — observer de conectividade, banner de degradação graciosa, re-registro de presença, tela de erro irrecuperável
- Identidade visual — COR_ARQUIVOS (azul investigação), haptics, transição de fase com fade, acessibilidade básica

---

## Como rodar uma sessão

### Preparação do host

1. Abrir o app e ir ao catálogo
2. Selecionar **Arquivos**
3. Tocar em **criar sala**
4. Compartilhar o código da sala (botão de compartilhamento no lobby)
5. Aguardar os 6 jogadores entrarem — todos devem aparecer no lobby antes de avançar
6. Tocar em **iniciar** quando todos estiverem prontos

### Entrada dos jogadores

1. Abrir o app
2. Tocar em **entrar em sala**
3. Digitar o código recebido do host
4. Aguardar no lobby

### Condução da partida (passo a passo)

**Fase 1 — Apresentação do Caso**
- Host lê o resumo em voz alta ou deixa todos lerem no celular
- Objetivo: criar curiosidade, alinhar o grupo sobre o que precisa ser descoberto
- Host toca **avançar** quando o grupo estiver alinhado

**Fase 2 — Leitura Privada**
- Cada jogador lê identidade, arquivos, conhecimentos, segredo e objetivo no próprio celular
- Recomendado: 3 a 5 minutos de silêncio
- Cada jogador toca **concluí a leitura** quando terminar
- Host pode forçar avanço se algum jogador desconectar (botão aparece automaticamente)
- Host avança quando todos concluírem

**Fase 3 — Investigação Inicial**
- Conversa livre — app não precisa estar na mão
- Prompts sugeridos aparecem na tela para guiar o debate
- Jogadores podem receber ação secreta: devem ler discretamente e decidir se cumprem
- Host avança quando o grupo sentir que explorou o suficiente

**Fase 4 — Nova Evidência**
- App libera evidência pública sincronizada para todos
- Host lê em voz alta ou deixa todos verem no celular
- A evidência foi projetada para quebrar ou recontextualizar a teoria do grupo
- Host avança quando o grupo processar a nova informação

**Fase 5 — Confronto**
- Fase de pressão — o app exibe prompts específicos para o caso
- Foco em inconsistências, omissões e arquivos que ainda não foram revelados
- Host avança quando o grupo estiver pronto para o veredito

**Fase 6 — Veredito**
- Apenas o host registra o veredito coletivo
- Três perguntas obrigatórias: quem removeu o dossiê, qual foi a motivação, o que o dossiê escondia
- Uma pergunta opcional: qual pista mais aproximou o grupo da verdade
- Host deve negociar com o grupo antes de confirmar cada resposta
- Tocar **enviar veredito** para encerrar

**Fase 7 — Revelação e Resultados**
- App revela a verdade completa, linha do tempo real e documentos decisivos
- Comparação visual entre o veredito do grupo e as respostas corretas
- Pontuação coletiva com barra de aproveitamento investigativo
- Cada jogador vê resultado individual no próprio celular
- Perguntas pós-jogo aparecem na tela de encerramento para guiar a conversa

---

## Limitações conhecidas

Ver `docs/games/arquivos-bugs-conhecidos.md` para lista completa.

Limitações principais para o release v1:

- Exatamente 6 jogadores — nem mais, nem menos
- Apenas 1 caso disponível (O Dossiê Sumido)
- Sem reconexão avançada de host (host desconectado por muito tempo pode travar a partida)
- Firebase Security Rules em modo v0.2 — protegem escrita mas não leitura individual por jogador no RTDB sem autenticação
- Logs apenas em memória — perdidos ao fechar o app
- Sem modo offline ou assíncrono

---

## O que observar durante o playtest

### Sinais de que o jogo está funcionando

- Jogadores falam diretamente uns com os outros sem olhar o celular
- Alguém diz "espera, isso não bate com o que você falou antes"
- O grupo muda de teoria após a Nova Evidência
- Pelo menos uma ação secreta gera suspeita ou pergunta na mesa
- A revelação final gera comentários como "eu sabia que tinha algo estranho nisso"
- O grupo continua conversando depois que o app mostra o resultado

### Sinais de problema

- Jogadores passam mais de 2 minutos em silêncio lendo o celular
- Uma pessoa domina toda a investigação sem que ninguém confronte
- O grupo trava no veredito sem conseguir chegar a uma resposta
- Alguém fica em silêncio por mais de 10 minutos
- O host não sabe quando avançar de fase

### Métricas a coletar

- Tempo total da partida (início do caso até veredito enviado)
- Tempo da leitura privada (fase 2)
- Acerto nas 3 perguntas obrigatórias (0, 1, 2 ou 3 corretas)
- Quantas ações secretas foram cumpridas vs. puladas
- Se houve alguma desconexão e como o grupo reagiu
- Nota do grupo ao final (satisfação com a experiência, 1 a 5)
