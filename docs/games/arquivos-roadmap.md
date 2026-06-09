# ARQUIVOS — ROADMAP

## Status do Projeto

MVP completo. 15 sprints executados.

Arquivos está pronto para release interno: o jogo aparece no catálogo, aceita salas de 6 jogadores, conduz a partida do início ao fim sem intervenção manual, libera nova evidência sincronizada, processa ações secretas com recompensas, registra veredito coletivo e revela verdade completa com pontuação individual.

O primeiro caso (O Dossiê Sumido) é jogável de ponta a ponta em sessão presencial com múltiplos celulares.

Para releases e suporte: `docs/games/arquivos-release-v1.md`
Para playtest: `docs/games/arquivos-playtest-checklist.md`
Para bugs conhecidos: `docs/games/arquivos-bugs-conhecidos.md`
Para criar novos casos: `docs/games/arquivos-segundo-caso.md`

---

## Sprints Executadas

| Sprint | Nome | Status |
|--------|------|--------|
| 0 | Alinhamento e Escopo Jogável | ✅ concluída |
| 1 | Modelo de Domínio e Contratos | ✅ concluída |
| 2 | Engine Local Pura | ✅ concluída |
| 3 | Caso MVP: O Dossiê Sumido | ✅ concluída |
| 4 | Firebase e Realtime | ✅ concluída |
| 5 | Fluxo de Navegação e Catálogo | ✅ concluída |
| 6 | UI de Gameplay: Fases Principais | ✅ concluída |
| 7 | Ações Secretas e Informação Viva | ✅ concluída |
| 8 | Veredito, Pontuação e Revelação Final | ✅ concluída |
| 9 | SessionStore, Memória e Sinais Sociais | ✅ concluída |
| 10 | QA Técnico e Segurança de Segredo | ✅ concluída |
| 11 | Playtest Alpha | ✅ concluída |
| 12 | Iteração Editorial e Pacing | ✅ concluída |
| 13 | Polimento Visual e Conteúdo de Lançamento | ✅ concluída |
| 14 | Beta Fechado | ✅ concluída |
| 15 | Release Interno | ✅ concluída |

---

## Backlog Pós-Release

**Prioridade alta:**
- segundo caso completo
- variação para 4 jogadores
- variação para 8 jogadores
- melhoria de reconexão avançada (transferência de host)
- resumo compartilhável pós-jogo (share sheet nativo)
- ferramenta interna simples para validar casos

**Prioridade média:**
- modo caso rápido
- biblioteca de ações secretas reutilizáveis
- novos títulos pós-jogo
- linha do tempo colaborativa
- export de dados de playtest

**Prioridade baixa:**
- editor visual de casos
- casos criados por comunidade
- imagens reais em documentos
- casos sazonais
- modo espectador

---

## Riscos Conhecidos

**Texto demais** — jogadores leem em vez de conversar.
Mitigação: arquivos curtos, destaque de pistas, leitura privada com tempo sugerido.

**Vazamento de segredo** — reconexão ou tela compartilhada expõe informação privada.
Mitigação: separação rígida public/private state, Firebase rules, logs estruturados.

**Jogador irrelevante** — uma pessoa não tem informação útil e some da conversa.
Mitigação: cada personagem tem pista útil, prompts chamam todos, ações secretas distribuem protagonismo.

**Final confuso** — grupo sente que o caso foi injusto.
Mitigação: linha do tempo clara, pistas decisivas mostradas, verdade escrita antes das pistas.

---

## Arquitetura

```
src/games/arquivos/         engine, tipos, casos, helpers
src/screens/arquivos/       telas específicas do jogo
src/services/arquivosRealtime.ts
src/services/arquivosLogger.ts
src/session/arquivosAdapter.ts
assets/games/arquivos/      cover.png, banner.png
docs/games/arquivos*.md     documentação operacional
```
