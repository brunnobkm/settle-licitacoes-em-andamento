# Licitações em andamento — protótipo

Protótipo de visualização de licitações públicas (kanban / tabela / calendário) para o Settle, plataforma de inteligência de licitações.

## Demo ao vivo

[brunnobkm.github.io/settle-licitacoes-em-andamento](https://brunnobkm.github.io/settle-licitacoes-em-andamento/)

## Views

- **Board** — kanban com 5 etapas do pipeline (Análise → Preparação → Disputa → Habilitação → Homologação). Drag-and-drop entre colunas. Modo execução: card mostra contexto completo (órgão, objeto, status, responsáveis, data, valor).
- **Table** — todas as licitações em linhas, primeira coluna com título derivado do objeto (regex strip + Title Case), 12 colunas no total. Header sticky, scroll horizontal.
- **Calendar** — visão mensal estilo Notion, com chips coloridos por urgência da data de envio (vermelho = hoje, amarelo = ≤7 dias, neutro = restante). Mostra primeiros 3 eventos por dia + "+ N mais" abertura via popover.

## Detail panel

Clique em qualquer card (board ou tabela) ou chip (calendar) abre um painel à direita com o **card-fonte** (em `card.html`) renderizado num iframe, com edição inline de todas as propriedades.

## Stack

HTML estático + CSS + JS vanilla. Sem build, sem dependências externas (apenas Inter + JetBrains Mono via Google Fonts e Lucide via CDN no card.html).

## Rodar local

Qualquer servidor HTTP estático serve. Exemplo com Python:

```bash
python3 -m http.server 8765
```

Abrir `http://localhost:8765/` no navegador.

## Conceitos chave

- **Smart title**: o "título" da licitação é derivado do `objeto` em runtime via regex (strip de boilerplate dos portais + Title Case com siglas preservadas). Sem LLM, custo zero.
- **Etapa vs status**: `etapa` define a coluna do kanban (estágio do nosso processo). `status` define a situação do edital (abertas, em-disputa, suspensa, homologada, etc.) — vira pill colorido dentro do card.
- **Card como componente**: o `card.html` é a fonte canônica do card. Kanban, calendar e tabela são consumidoras — todas abrem o mesmo `card.html` no detail panel.
