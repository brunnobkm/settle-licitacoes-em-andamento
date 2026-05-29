# UX — Licitações em Andamento (Fase 1)

> **Data:** 29 de maio de 2026
> **Live demo:** https://brunnobkm.github.io/settle-licitacoes-em-andamento/
> **Repositório:** https://github.com/brunnobkm/settle-licitacoes-em-andamento
> **Escopo deste documento:** mudanças nas views **Board** (kanban) e **Tabela**.
> **Fora do escopo:** Calendário — entra em documento separado da Fase 2.

---

## Sumário rápido (TL;DR)

1. **Pipeline de 7 colunas** no kanban (antes eram 5), com duas novas etapas (*Suspensa*, *Fase de Recursos*) e *Resultados Finais* substituindo *Homologação*.
2. **Badge de Resultado** (*Ganhou e foi habilitado* / *Perdeu a licitação*) aparece nos cards que estão em "Resultados Finais", logo abaixo do número do edital.
3. **Edição inline na Tabela**: clicar em qualquer célula editável abre o mesmo editor do card do board (popover ou input). 8 colunas editáveis, 2 read-only.
4. **UX da Tabela**: célula inteira clicável, wrap de texto em vez de truncar com reticências, scroll horizontal preservado entre edições.
5. **Labels em português** nas view tabs: "Table" → **Tabela**, "Calendar" → **Calendário**.

---

## 1. Pipeline — colunas do Kanban

### O que mudou

A pipeline passou de **5 → 7 etapas**. A ordem reflete o fluxo natural do processo da licitação, do início ao desfecho:

| # | Coluna | Cor (dot) | Status |
|---|---|---|---|
| 1 | Análise de Oportunidades | `#F59E0B` âmbar | existente (capitalização ajustada) |
| 2 | **Suspensa** | `#9CA3AF` cinza | **nova** |
| 3 | Preparação de Proposta | `#3B82F6` azul | existente |
| 4 | Disputa de Classificação | `#8B5CF6` violeta | existente |
| 5 | Processo de Habilitação | `#F97316` laranja | existente |
| 6 | **Fase de Recursos** | `#06B6D4` ciano | **nova** |
| 7 | **Resultados Finais** | `#22C55E` verde | **renomeada** (era "Homologação") |

### Por que

- A pipeline anterior agrupava o estágio final em "Homologação", que misturava sub-estágios distintos. **Resultados Finais** deixa o estado terminal explícito e separa **Fase de Recursos** como etapa intermediária dedicada.
- **Suspensa** virou coluna explícita: licitações suspensas precisam ser visualmente isoladas das ativas, não diluídas dentro de outras etapas.

### Como funciona

- Cards podem ser movidos entre as 7 colunas via **drag-and-drop** no Board.
- A coluna "Etapa" da Tabela mostra a etapa atual de cada licitação como um pill colorido (a cor do dot da lane).
- Migração de dados: todos os cards que estavam em `etapa: "homologacao"` foram migrados para `etapa: "resultados"` (mapeamento 1:1, sem perda de informação).

### Regra importante — não confundir Etapa com Status do edital

São **dois campos independentes**:

- **Etapa** (`etapa`) — estágio interno do processo, refletido como coluna do kanban. Reflete *o que estamos fazendo internamente*.
- **Status do edital** (`status`) — situação oficial publicada pelo órgão. Reflete *o estado oficial publicado*. Valores: *Abertas para participação, Em disputa ou Homologação, Suspensa, Anulada, Revogada, Homologada, Deserta ou Fracassada*.

Um edital pode estar com **status = "Suspensa"** e ainda assim ter um histórico em outras etapas internas, ou vice-versa. A coluna kanban "Suspensa" e o status "Suspensa" são leituras independentes — não há sincronização automática entre os dois.

---

## 2. Badge de Resultado (Ganhou / Perdeu)

### O que é

Pill colorida que aparece **logo após o número do edital** nos cards que estão em "Resultados Finais". Indica o desfecho da licitação para a empresa.

| Valor | Label exibida | Cor |
|---|---|---|
| `ganhou` | "Ganhou e foi habilitado" | verde (fundo `#dcfce7`, texto `#15803d`) |
| `perdeu` | "Perdeu a licitação" | vermelho (fundo `#fee2e2`, texto `#dc2626`) |

### Onde aparece

- **Card do Board** — segunda linha do card (imediatamente após "Edital XXX/YYYY"). Só renderiza se `etapa === "resultados"`.
- **Tabela** — nova coluna "Resultado", posicionada entre "Status do edital" e "Responsável".

### Por que logo após o Edital

Decisão tomada porque, na coluna "Resultados Finais", **saber o desfecho é a informação mais crítica do card**. Posicionar a badge no topo permite escanear visualmente os ganhos vs. perdas sem precisar abrir cada card individualmente.

### Regras

- A badge **só faz sentido em Resultados Finais**. Em cards de outras etapas:
  - **Card do Board**: a linha "Resultado" simplesmente não é renderizada.
  - **Tabela**: a célula "Resultado" fica vazia e **não-clicável** (não dá pra abrir o editor).
- Quando um card está em Resultados Finais mas ainda não tem resultado definido, aparece o empty-hint "Definir resultado" — clicável.
- **Edição inline**: click na pill (ou no hint) → popover com as 2 opções + opção "Limpar resultado".
- Quando um card sai de Resultados Finais (movido para outra etapa via drag), o campo `resultado` é **preservado** internamente — se ele voltar pra Resultados Finais a badge reaparece com o último valor.

---

## 3. Edição inline na Tabela

### O que mudou

A Tabela agora **espelha o comportamento de edição do card do Board**. Click em qualquer célula editável → abre o editor inline (popover ou input que substitui o conteúdo da célula). Antes, a Tabela era read-only — qualquer edição exigia ir para o Board.

### Colunas editáveis (8) e seus editores

| Coluna | Tipo de editor |
|---|---|
| **Segmento** | Multi-select com busca + opção de criar novo |
| **Órgão** | Input de texto |
| **Objeto** | Textarea multi-linha (Cmd/Ctrl+Enter ou blur salva) |
| **Status do edital** | Single-select popover (7 opções + "Limpar status") |
| **Resultado** | Single-select popover (2 opções + "Limpar resultado") — só editável em Resultados Finais |
| **Responsável** | Multi-select com busca |
| **Data de envio da proposta** | Mini-calendar |
| **Cidade e Estado** | Popover com 2 selects dependentes (UF → Cidade) |
| **Valor global** | Input numérico com formatação BRL |

### Colunas read-only (2)

- **Edital** (`codigoEdital`) — identificador da licitação, imutável.
- **Etapa** — só pode ser alterada via drag-and-drop no Board (mudança de etapa é um gesto físico intencional, não uma edição de campo).

### Por que

- **Reduz fricção**: antes, qualquer edição exigia sair da Tabela e ir pro Board. Agora dá pra triar muitas licitações em sequência sem trocar de view.
- **Mantém consistência**: a mesma UX de edição em todas as views ajuda na curva de aprendizado — quem aprendeu no Board já sabe usar na Tabela.

### Regras de comportamento

- **Compartilhamento de editores entre views**: os mesmos editores rodam em Board e Tabela (e no popover de hover do Calendar). Quando um editor for atualizado, a mudança aparece em todas as views automaticamente — eles vivem num registro único (`INLINE_EDITORS`).
- **Multi-select editores** (Segmento, Responsável): popover **continua aberto** enquanto o usuário escolhe múltiplas opções; só fecha com click fora ou Escape.
- **Single-select editores** (Status, Resultado, Cidade e Estado): commit no click da opção e fecham automaticamente.
- **Input/textarea** (Órgão, Objeto, Valor): commit no `blur` ou tecla `Enter`; `Escape` cancela sem salvar.

### Tratamento de campos vazios

Propriedades opcionais que ainda não foram preenchidas mostram um **empty-hint clicável** ("Adicionar órgão", "Definir status", "Sem data programada", etc.). Click no hint abre o mesmo editor inline. Aplicado consistentemente em Card e Tabela.

---

## 4. UX da Tabela — melhorias adicionais

### 4.1 Célula inteira clicável

**Antes:** só o texto da propriedade era clicável; o espaço "morto" (padding ao redor) não disparava nada.

**Agora:** a célula **inteira** abre o editor — cursor pointer + hover bg cobrindo toda a área.

**Por que:** reduz a precisão exigida do usuário. Padrão Notion / Airtable. Click "em qualquer lugar" da célula faz a coisa esperada.

### 4.2 Wrap em vez de truncar

**Antes:** textos longos (Órgão, Objeto, Cidade) eram cortados com reticências (`...`). Para ler o texto completo era preciso abrir o card.

**Agora:** textos quebram linha dentro da largura da coluna e a altura da linha cresce naturalmente.

**Por que:** facilita leitura sem precisar abrir o card. Especialmente útil pra **Objeto** (que pode ter parágrafos inteiros) e **Órgão** (com sub-órgãos longos).

### 4.3 Scroll horizontal preservado entre edições

**Antes:** quando você scrollava a Tabela pra direita e editava uma célula, a Tabela "saltava" de volta pra origem ao salvar.

**Agora:** o scroll fica fixo no commit do editor.

**Por que (detalhe técnico):** edições disparam um re-render completo da Tabela. O re-render perdia o `scrollLeft` ao reconstruir o DOM, e em alguns casos o navegador ainda rolava o container pra "trazer pra viewport" um input recém-focado. Agora o re-render salva/restaura `scrollLeft` e `scrollTop`, e todos os `.focus()` usam `preventScroll: true`.

### 4.4 Labels traduzidos nas view tabs

- "Table" → **Tabela**
- "Calendar" → **Calendário**

---

## Anexo A — Convenções de labels canônicas

As **mesmas labels** são usadas em todos os lugares onde uma propriedade aparece: tooltip no card do Board, header de coluna da Tabela e tooltip no hover popover do Calendar. Quando uma label muda, atualizar **nos três lugares** simultaneamente.

| Chave interna | Label canônica |
|---|---|
| `codigoEdital` | Edital |
| `segmentos` | Segmento |
| `orgao` | Órgão |
| `objeto` | Objeto |
| `status` | Status do edital |
| `resultado` | Resultado |
| `responsaveis` | Responsável |
| `dataEnvio` | Data de envio da proposta |
| `local` *(cidade + estado)* | Cidade e Estado |
| `valor` | Valor global |
| `etapa` *(só na Tabela)* | Etapa |

---

## Anexo B — Onde mexer no código (para o time de dev)

| O quê | Onde |
|---|---|
| Pipeline / colunas do kanban | `data.js` → `ETAPAS` |
| Resultados disponíveis (valores e cores) | `data.js` → `RESULTADOS_DISPONIVEIS` e helper `getResultado(id)` |
| Status do edital disponíveis | `data.js` → `STATUS_EDITAL` |
| Propriedades do card do Board (e a ordem em que aparecem) | `app.js` → função `cardProperties(item)`. Props com `_only: false` são filtradas no render — usado para "Resultado" só renderizar em Resultados Finais. |
| Colunas da Tabela | `app.js` → array `TABLE_COLS` |
| Mapeamento "coluna da tabela → editor" | `app.js` → função `tableColPropKey(colKey, item)`. Retorna `null` quando a coluna não é editável naquela linha (ex: Resultado fora de Resultados Finais). |
| Editores inline (registro central) | `app.js` → constante `INLINE_EDITORS` |
| Re-render global | `app.js` → função `render()` — caminho seguro pra refletir mudanças. Reconstrói Board + Tabela + Calendar conforme a view ativa. |

---

## Próximos passos (Fase 2)

A view de **Calendário** será documentada separadamente, incluindo:
- Tratamento de licitações sem data de envio da proposta.
- Filtros e modos de visualização (por exemplo, dia/semana/mês).
- Drag de eventos entre dias.

Esta Fase 1 não altera o Calendar além das mudanças de label da tab e do tooltip ("Data de envio da proposta" é a label canônica).
