# OPERAÇÃO RESGATE — DEFINIÇÃO CANÔNICA

## O que é o jogo

Operação Resgate é um jogo social de negociação, dedução e movimentação de jogadores para 1 celular.

O grupo faz parte de uma operação secreta. Existe um Alvo que precisa ser protegido. Existe uma Ameaça tentando se aproximar dele. Cada jogador sabe algo diferente — ou nada.

A partida é uma série de rodadas de discussão e troca: quem vai para qual zona? No final, o app verifica se o Alvo terminou longe ou perto da Ameaça.

A emoção central é **confiança sob pressão**:

> "a gente precisa se organizar rápido, mas eu não sei se posso confiar em você."

---

## Decisões canônicas

### Plataforma

- **Jogo local**, 1 dispositivo compartilhado.
- Sem Firebase. Toda lógica é client-side.
- Futuro: multiplayer pode usar Firebase, mas não no MVP.

### Jogadores

- Mínimo: 4 jogadores
- Máximo: 12 jogadores
- Ideal: 6–8 jogadores

### Duração

| Modo | Rodadas | Duração estimada |
|------|---------|------------------|
| Rápido | 3 | 15–20 min |
| Padrão | 4 | 25–35 min |
| Avançado | 5 | 40–50 min |

### Zonas

Dois grupos simbólicos: **Zona A** e **Zona B**.

Os jogadores podem ficar em lados opostos da mesa para tornar as zonas visíveis, mas separação física não é obrigatória. O app é o árbitro das zonas.

### Liderança

- App sorteia o líder de cada zona a cada rodada (rotativo ou aleatório).
- O líder decide quem será enviado para a outra zona.
- Os demais membros da zona podem argumentar, pressionar e negociar.

### Trocas por rodada

| Modo | Trocas |
|------|--------|
| Rápido | 1 troca total (1 zona envia 1) |
| Padrão | 2 trocas (1 por zona) |
| Avançado | 2 trocas + possível evento especial |

### Condição de vitória (v1)

- **Sabotagem vence** se Ameaça e Alvo terminam na **mesma zona**.
- **Resgate vence** se Ameaça e Alvo terminam em **zonas diferentes**.

Simples, forte, fácil de explicar.

---

## Papéis (v1)

### Alvo
- Não sabe quem é a Ameaça.
- Objetivo: terminar longe da Ameaça.
- Facção: Resgate.

### Ameaça
- Sabe que é a Ameaça.
- Objetivo: terminar na mesma zona que o Alvo.
- Facção: Sabotagem.
- Pode mentir livremente.

### Agente
- Sabe que faz parte do Resgate.
- Objetivo: proteger o Alvo sem saber quem ele é.
- Sem informação especial — apenas facção revelada.

### Informante
- Facção: Resgate (geralmente).
- Recebe um fragmento de informação privada:
  - ex: "você sabe que a Ameaça começou na Zona A."
  - ex: "você sabe que o Alvo não é Bruno nem Diego."
  - ex: "você sabe que há pelo menos 1 membro da Sabotagem na Zona B."
- Pode revelar, mentir sobre ou esconder sua informação.

### Operador
- Sem papel especial.
- Sem facção revelada (ou facção Resgate sem saber disso).
- Observa, vota e influencia.

### Duplo Agente *(modo Avançado)*
- Aparece como Operador para si mesmo.
- Na verdade é Sabotagem.
- Gera paranoia sem que o grupo saiba quantos Duplos existem.

---

## Facções

| Facção | Objetivo |
|--------|----------|
| Resgate | Alvo e Ameaça em zonas diferentes no final |
| Sabotagem | Alvo e Ameaça na mesma zona no final |

A maioria dos jogadores é Resgate. A minoria é Sabotagem.

---

## Distribuição de papéis (1 celular)

O app exibe: **"Passe para [Nome]"**

O jogador vê sua carta privada em silêncio.

Toca: **"Entendi"** → tela neutra antes de passar.

Todos os jogadores passam pelo mesmo fluxo.

**Regras de UX para segurança:**
- Fundo neutro para todos os papéis (sem cor por facção que reflita no rosto)
- Mesmo tempo de leitura sugerido para todos
- Texto curto, objetivo, em 2–3 linhas
- Botão de ocultação antes de entregar o celular

---

## Informações privadas dos Informantes

Exemplos de fragmentos para v1:

```
"A Ameaça começou na Zona A."
"A Ameaça começou na Zona B."
"O Alvo não é [nome1] nem [nome2]."
"Há pelo menos 1 membro da Sabotagem na Zona [A/B]."
"[Nome] não é a Ameaça."
"O Alvo está nervoso. Observe quem ele evita trocar."
```

Cada Informante recebe apenas **1 fragmento**.

Mais de 1 Informante pode existir — com fragmentos diferentes ou o mesmo (para dificultar confirmação).

---

## Fluxo de uma rodada

```
[Discussão livre — 2-4 min]
     ↓
[App: "Zona A — [Líder], escolha quem enviar"]
     ↓
[Líder escolhe 1 jogador da Zona A]
     ↓
[App: "Zona B — [Líder], escolha quem enviar"]
     ↓
[Líder escolhe 1 jogador da Zona B]
     ↓
[App mostra nova composição das zonas]
     ↓
[Possível evento especial (modo Avançado)]
     ↓
[Próxima rodada ou verificação final]
```

---

## Eventos especiais (modo Avançado)

Acontecem entre rodadas (sorteados pelo app):

| Evento | Efeito |
|--------|--------|
| Comunicação cortada | Líder ouve no máximo 30s de argumento na próxima rodada |
| Vazamento | App revela que uma zona contém "alguém perigoso" (sem revelar quem) |
| Ordem superior | Próxima troca deve incluir exatamente 2 jogadores por zona |
| Última chance | Na última rodada, trocas são duplicadas (2 por zona) |
| Informação plantada | Um jogador recebe nova pista (pode ser verdadeira ou falsa) |

---

## Verificação final e debrief

Após a última rodada, o app:

1. Verifica zonas finais de Alvo e Ameaça
2. Declara vencedor (Resgate ou Sabotagem)
3. Revela debrief:
   - Quem era quem (papel e facção)
   - A decisão mais crítica (rodada e troca que definiu o resultado)
   - Quais informações os Informantes tinham
   - Quem enganou quem

---

## Identidade visual

Cor: `#F97316` (laranja — urgência, alerta, operação).

Paleta complementar:
- Zona A: azul (`#3B82F6`)
- Zona B: emerald (`#10B981`)
- Ameaça: vermelho (`#EF4444`)
- Alvo: amarelo (`#EAB308`)
- Neutro: cinza (`cores.textoMudo`)

---

## Categorias no catálogo

- Principal: `blefe_deducao`
- Secundária: `conhecimento_grupo`
- Tags: `deducao`, `conversa`, `segredo`, `paranoia`, `competitivo`
- Contextos: `ninguem_confia`, `pra_gerar_historia`, `grupo_intimo`

---

## Fora do MVP v1

- Multiplayer (Firebase)
- Modo Duplo Agente (Avançado)
- Objetivos secundários individuais
- Eventos especiais (implementação básica no Sprint 6)
- Modo comunicação separada (isolamento por sala)
- Casos narrativos (como Arquivos)
- Histórico de partidas por grupo

---

## Documentação relacionada

- `docs/games/operacao-resgate-roadmap.md` — sprints de implementação
