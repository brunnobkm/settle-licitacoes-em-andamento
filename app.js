(function () {
  "use strict";

  // ---------- helpers ----------
  function brl(v) {
    return v.toLocaleString("pt-BR", {
      style: "currency", currency: "BRL",
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  function formatDateBR(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  // Estado de urgência da data.
  // Regra (definida pelo cliente): today=red, 1-7 days remaining=yellow, else=neutral.
  // Overdue (data já passou) cai em "normal" — não há tratamento especial.
  const TODAY = new Date("2026-05-21T00:00:00");
  function getDateState(iso) {
    const target = new Date(iso + "T00:00:00");
    const diff = Math.round((target - TODAY) / 86400000);
    if (diff === 0)               return "today";
    if (diff >= 1 && diff <= 7)   return "urgent";
    return "normal";
  }
  const dateClasses = {
    today:  "date-today",
    urgent: "date-urgent",
    normal: "date-normal"
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  // ---------- smart objeto title (regex strip + Title Case, sem LLM) ----------
  const OBJETO_STRIP_PATTERNS = [
    /^\[[^\]]+\]\s*[-–—:]\s*/i,                                                                                              // [LICITANET] -
    /^SISTEMA\s+DE\s+REGISTRO\s+DE\s+PREÇOS\s+(VISANDO\s+A\s+FUTURA\s+E\s+EVENTUAL\s+)?(CONTRATAÇÃO\s+DE\s+EMPRESA\s+(ESPECIALIZADA|HABILITADA|CAPACITADA)?\s*)?(PARA|NA|NO|EM)\s+/i,
    /^REGISTRO\s+DE\s+PREÇOS\s+(PARA|NA|NO|EM|VISANDO)\s+(A\s+)?(FUTURA\s+E\s+EVENTUAL\s+)?(AQUISIÇÃO|CONTRATAÇÃO)?\s*(DE\s+EMPRESA\s+ESPECIALIZADA\s+)?(PARA|NA|NO|EM|DE)\s+/i,
    /^CONTRATAÇÃO\s+DE\s+EMPRESA\s+(ESPECIALIZADA|HABILITADA|CAPACITADA)?\s*(PARA|NA|NO|EM)\s+/i,
    /^CONTRATAÇÃO\s+DE\s+SERVIÇOS\s+(CONTINUADOS\s+)?(DE\s+)?/i,
    /^PRESTAÇÃO\s+DE\s+SERVIÇOS\s+(CONTINUADOS\s+)?(DE\s+)?/i,
    // Padrão de obras com fornecimento (Santos Dumont): joga fora o middle
    // boilerplate que termina em ", PARA"
    /^EXECUÇÃO\s+DE\s+SERVIÇOS\s+DE\s+ENGENHARIA\s*,?\s*COM\s+FORNECIMENTO\s+DE\s+MATERIAIS\s*,?\s*MÃO\s+DE\s+OBRA\s+E\s+EQUIPAMENTOS\s*,?\s*PARA\s+/i,
    /^EXECUÇÃO\s+DE\s+(SERVIÇOS|OBRAS)\s+(DE\s+(ENGENHARIA\s+)?)?/i,
    /^AQUISIÇÃO\s+(E\s+INSTALAÇÃO\s+)?DE\s+/i,
    /^FORNECIMENTO\s+(E\s+INSTALAÇÃO\s+)?DE\s+/i,
    /^LOCAÇÃO\s+DE\s+/i,
    /^IMPLANTAÇÃO\s+DE\s+/i,
    /^SUBSTITUIÇÃO\s+DE\s+/i,
    /^REGISTRO\s+DE\s+PREÇOS\s+/i
  ];

  const KEEP_ACRONYMS = new Set([
    "INFRAERO","SBRJ","TJSP","UFRGS","UFPE","TCU","IPHAN","EDR","BR","PCD","LICITANET",
    "RJ","SP","MG","BA","PE","RS","PR","CE","DF","PA","GO","ES","MT","MS","RO","AM","SC","AC","RR","AP","TO","MA","PI","RN","PB","AL","SE",
    "TI","VOIP","CFTV","LED","TETRA","PCR","HPV","UHT","CBUQ","SIG","TENS","HC","HGF","INTO","CBMERJ",
    "ANAC","ANATEL","SUS","UFABC","USP","UNB","UFRJ","DNIT","DMLU","AGETOP","ELETROBRAS","BNDES",
    "STF","STJ","TJ","CNJ","INSS","CPF","CNPJ","ME","EPP","TR","ETP","RDC","SRP","UTI","PROCONVE"
  ]);

  // Conectores que ficam em minúsculas no Title Case em português
  const SMALL_WORDS = new Set([
    "a","o","as","os","um","uma","uns","umas",
    "de","em","com","por","para","sem","sob","até","após","desde","entre","contra",
    "do","da","dos","das","no","na","nos","nas","pelo","pela","pelos","pelas",
    "num","numa","nuns","numas","ao","aos","à","às",
    "e","ou","mas","nem","que"
  ]);

  function titleCaseSmart(s) {
    if (!s) return "";
    const lower = s.toLowerCase();
    let firstWord = true;
    // Capitaliza palavras alfabéticas; siglas viram CAIXA ALTA;
    // conectores (exceto primeira palavra) ficam minúsculos.
    let out = lower.replace(/[a-zà-ÿ]+/gi, (word) => {
      const up = word.toUpperCase();
      if (KEEP_ACRONYMS.has(up)) {
        firstWord = false;
        return up;
      }
      if (!firstWord && SMALL_WORDS.has(word)) return word;
      firstWord = false;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
    // Capitaliza depois de pontuação forte
    out = out.replace(/([.?!]\s+)([a-zà-ÿ])/g, (_, p, c) => p + c.toUpperCase());
    return out;
  }

  function smartObjetoTitle(objeto, max = 80) {
    if (!objeto) return "";
    let s = objeto;
    // Aplica strip patterns iterativamente (até 4 passes)
    for (let i = 0; i < 4; i++) {
      let stripped = false;
      for (const p of OBJETO_STRIP_PATTERNS) {
        const before = s;
        s = s.replace(p, "");
        if (s !== before) { stripped = true; break; }
      }
      if (!stripped) break;
    }
    // Trim de pontuação final
    s = s.replace(/[.,;:\s]+$/, "").trim();
    // Trunca em fronteira de palavra
    if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, "") + "…";
    // Title Case com conectores em minúsculas e siglas preservadas
    return titleCaseSmart(s);
  }

  // ---------- card (espelha licitacoes-em-andamento-card/prototype.html) ----------
  function cardProperties(item) {
    const status = getStatusEdital(item.status);
    const dateState = getDateState(item.dataEnvio);
    const responsaveisVisiveis = item.responsaveis.map(personById).filter(Boolean);

    return [
      // Card do kanban = modo execução: título removido (info redundante).
      // O título continua sendo definido no card-fonte (detail panel) onde
      // tem o role de identificação editável.
      // codigoEdital, orgao, objeto, cidade = prop-static (só
      // click-to-open detail, sem editor inline — match com prototype).
      {
        key: "codigoEdital",
        tooltip: "Edital",
        classes: "prop-static prop-edital",
        content: `Edital <span class="mono">${esc(item.codigoEdital)}</span>`
      },
      {
        key: "segmentos",
        tooltip: "Segmento",
        classes: "prop",
        content: `<div class="pills">${
          item.segmentos.length
            ? item.segmentos.map(s =>
                `<span class="tag-pill card-edit-target" style="background:${corDoSegmento(s)}">${esc(s)}</span>`
              ).join("")
            : '<span class="empty-hint card-edit-target">Adicionar segmento</span>'
        }</div>`
      },
      {
        key: "orgao",
        tooltip: "Órgão",
        classes: "prop prop-orgao",
        content: item.orgao
          ? `<span class="orgao-text card-edit-target">${esc(item.orgao)}</span>`
          : '<span class="empty-hint card-edit-target">Adicionar órgão</span>'
      },
      {
        key: "objeto",
        tooltip: "Objeto",
        classes: "prop prop-objeto",
        content: item.objeto
          ? `<span class="objeto-clamp card-edit-target">${esc(item.objeto)}</span>`
          : '<span class="empty-hint card-edit-target">Adicionar objeto</span>'
      },
      {
        key: "status",
        tooltip: "Status do edital",
        classes: "prop",
        content: `<div class="status-wrap">${
          status
            ? `<span class="status-pill card-edit-target" style="background:${status.bg};color:${status.text}">${esc(status.label)}</span>`
            : '<span class="empty-hint card-edit-target">Definir status</span>'
        }</div>`
      },
      {
        key: "responsaveis",
        tooltip: "Responsável",
        classes: "prop",
        content: `<div class="people-list">${
          responsaveisVisiveis.length
            ? responsaveisVisiveis.map(p => `<span class="person-chip card-edit-target">${esc(p.nome)}</span>`).join("")
            : '<span class="empty-hint card-edit-target">Sem responsáveis</span>'
        }</div>`
      },
      {
        key: "dataEnvio",
        tooltip: "Data de envio da proposta",
        classes: `prop prop-date ${dateClasses[dateState]}`,
        content: `<span class="card-edit-target">${formatDateBR(item.dataEnvio)}</span>`
      },
      {
        key: "cidade",
        tooltip: "Cidade e Estado",
        classes: "prop prop-local",
        content: `<span class="card-edit-target">${esc(item.cidade)} <span class="local-sep">•</span> ${esc(item.estado)}</span>`
      },
      {
        key: "valor",
        tooltip: "Valor global",
        classes: "prop prop-valor",
        content: `<span class="card-edit-target">${brl(item.valorGlobal)}</span>`
      },
    ];
  }

  function renderCardHTML(item) {
    const props = cardProperties(item).map(p => `
      <div class="${p.classes} property-row" data-prop="${p.key}" data-tooltip="${esc(p.tooltip)}">
        ${p.content}
      </div>
    `).join("");

    return `
      <article class="card-root${item._selected ? " selected" : ""}" draggable="true" data-id="${item.id}">
        <div class="floating-actions">
          <button class="action-btn" title="Copiar link" aria-label="Copiar link">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11.5 4.5"/>
              <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07L12.5 19.5"/>
            </svg>
          </button>
          <button class="action-btn" data-card-discard title="Descartar" aria-label="Descartar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
            </svg>
          </button>
        </div>
        <div class="card-body">${props}</div>
      </article>
    `;
  }

  // ---------- lane ----------
  function laneHTML(etapa, items) {
    const cards = items.map(renderCardHTML).join("");
    return `
      <section class="lane" data-etapa="${etapa.key}">
        <header class="lane-header">
          <div class="lane-title">
            <span class="lane-dot" style="background:${etapa.dot}"></span>
            ${esc(etapa.label)}
          </div>
          <span class="lane-count">${items.length}</span>
        </header>
        <div class="lane-body">${cards}</div>
      </section>
    `;
  }

  // ---------- state + render ----------
  let state = LICITACOES.map(l => ({ ...l, _selected: false }));
  let currentView = "board";
  let calendarMonth = TODAY.getMonth();
  let calendarYear  = TODAY.getFullYear();

  // Guard pra distinguir click pós-drag do click "real"
  let wasDragging = false;

  function render() {
    // Fecha popover do calendar se aberto — render() é chamado após commit de
    // edição inline; sem isso o popover ficaria com dados stale.
    if (typeof hideEventHover === "function") hideEventHover();

    const board = document.getElementById("board");
    board.innerHTML = ETAPAS.map(et =>
      laneHTML(et, state.filter(i => i.etapa === et.key))
    ).join("");

    document.querySelectorAll(".view-count").forEach(el => el.textContent = String(state.length));

    bindCardEvents();
    bindLaneEvents();

    // Editores chamam render() no commit. Quando a view ativa é table/calendar,
    // a UI visível precisa refletir as mudanças — rebuilda também essas views.
    if (currentView === "table")    renderTable();
    if (currentView === "calendar") renderCalendar();
  }

  // ---------- calendar view ----------
  const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const TODAY_ISO = isoDate(TODAY);

  function renderCalendar() {
    const root = document.getElementById("calendar");

    const firstOfMonth = new Date(calendarYear, calendarMonth, 1);
    const firstDayOfWeek = firstOfMonth.getDay(); // 0=Sun
    const gridStart = new Date(calendarYear, calendarMonth, 1 - firstDayOfWeek);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }

    const byDate = {};
    state.forEach(it => {
      (byDate[it.dataEnvio] = byDate[it.dataEnvio] || []).push(it);
    });

    const rawMonth = firstOfMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const monthLabel = rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1); // "Maio de 2026"

    root.innerHTML = `
      <div class="cal-toolbar">
        <h2 class="cal-title">${esc(monthLabel)}</h2>
        <button class="cal-nav-btn" id="calPrev" aria-label="Mês anterior">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4 6 8l4 4"/></svg>
        </button>
        <button class="cal-nav-btn" id="calNext" aria-label="Próximo mês">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>
        </button>
        <button class="cal-today-btn" id="calToday">Hoje</button>
      </div>
      <div class="cal-grid">
        <div class="cal-row-head">
          ${WEEKDAYS.map(w => `<div class="cal-head-cell">${w}</div>`).join("")}
        </div>
        ${[0,1,2,3,4,5].map(r => `
          <div class="cal-row">
            ${days.slice(r*7, r*7+7).map(d => renderCalCell(d, byDate)).join("")}
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("calPrev").addEventListener("click", () => {
      if (calendarMonth === 0) { calendarMonth = 11; calendarYear--; }
      else calendarMonth--;
      renderCalendar();
    });
    document.getElementById("calNext").addEventListener("click", () => {
      if (calendarMonth === 11) { calendarMonth = 0; calendarYear++; }
      else calendarMonth++;
      renderCalendar();
    });
    document.getElementById("calToday").addEventListener("click", () => {
      calendarMonth = TODAY.getMonth();
      calendarYear  = TODAY.getFullYear();
      renderCalendar();
    });

    root.querySelectorAll(".cal-event").forEach(el => {
      const id = el.dataset.id;
      const item = state.find(i => i.id === id);
      if (item) bindEventHover(el, item);  // popover estilo Google Agenda
    });
    root.querySelectorAll(".cal-more").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const iso = btn.dataset.date;
        const cell = btn.closest(".cal-cell");
        openDayPopover(cell, iso, byDate[iso] || []);
      });
    });
    root.querySelectorAll("[data-tooltip]").forEach(bindTooltip);
  }

  const CAL_EVENTS_VISIBLE = 3; // chips de 1 linha (só o smart título); resto vai pra "+ N mais"

  // ---------- hover popover do chip (estilo Google Agenda: preview rico) ----------
  let _evtHoverEl = null;
  let _evtShowTimer = null;
  let _evtHideTimer = null;

  function hideEventHover() {
    clearTimeout(_evtShowTimer);
    if (_evtHoverEl) { _evtHoverEl.remove(); _evtHoverEl = null; }
  }

  function showEventHover(anchor, item) {
    hideEventHover();
    const pop = document.createElement("div");
    pop.className = "event-hover-card";
    pop.innerHTML = renderCardHTML(item);
    // No popover, desabilita drag e esconde floating-actions
    pop.querySelectorAll("[draggable]").forEach(el => el.removeAttribute("draggable"));
    document.body.appendChild(pop);

    // Posiciona: tenta à direita do chip, depois à esquerda, sempre dentro da viewport
    const r = anchor.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    let left = r.right + 8;
    if (left + pr.width > window.innerWidth - 8) left = r.left - pr.width - 8;
    if (left < 8) left = 8;
    let top = r.top;
    if (top + pr.height > window.innerHeight - 8) top = window.innerHeight - pr.height - 8;
    if (top < 8) top = 8;
    pop.style.left = left + "px";
    pop.style.top  = top + "px";

    // Permite hover no popover sem fechar
    pop.addEventListener("mouseenter", () => clearTimeout(_evtHideTimer));
    pop.addEventListener("mouseleave", () => {
      _evtHideTimer = setTimeout(hideEventHover, 200);
    });

    // Liga TODOS os listeners do card do board (hover, edição inline, click→modal,
    // tooltips, action-btns). Popover === board card.
    const card = pop.querySelector(".card-root");
    if (card) bindCardListeners(card);

    _evtHoverEl = pop;
  }

  function bindEventHover(chipEl, item) {
    chipEl.addEventListener("mouseenter", () => {
      clearTimeout(_evtHideTimer);
      clearTimeout(_evtShowTimer);
      _evtShowTimer = setTimeout(() => showEventHover(chipEl, item), 350);
    });
    chipEl.addEventListener("mouseleave", () => {
      clearTimeout(_evtShowTimer);
      _evtHideTimer = setTimeout(hideEventHover, 200);
    });
  }

  // Cap do nome do órgão no chip do calendar: trunca em fronteira de palavra
  // com reticência quando passa de `max` caracteres. CSS text-overflow ainda
  // age como safety net se mesmo o resultado não couber visualmente.
  const ORGAO_CHAR_CAP = 50;
  function truncateOrgao(orgao, max = ORGAO_CHAR_CAP) {
    if (!orgao || orgao.length <= max) return orgao || "";
    return orgao.slice(0, max).replace(/\s+\S*$/, "").trimEnd() + "…";
  }

  function renderEventChip(it) {
    const dateState = getDateState(it.dataEnvio);
    const dotColor = dateState === "today"  ? "#B91C1C"
                   : dateState === "urgent" ? "#D97706"
                                            : null;
    // Título do chip = "Edital XXX/YYYY · Órgão (truncado)" — convenção da equipe
    // (as pessoas se localizam pelo edital + entidade compradora).
    // Hover mostra preview rico com o card completo (handler em bindEventHover).
    const label = `Edital ${it.codigoEdital} · ${truncateOrgao(it.orgao)}`;
    return `
      <div class="cal-event" data-id="${esc(it.id)}">
        ${dotColor ? `<span class="cal-event-dot" style="background:${dotColor}"></span>` : ""}
        <span class="cal-event-title">${esc(label)}</span>
      </div>
    `;
  }

  function renderCalCell(date, byDate) {
    const iso = isoDate(date);
    const items = byDate[iso] || [];
    const inMonth = date.getMonth() === calendarMonth;
    const isToday = iso === TODAY_ISO;

    const visible = items.slice(0, CAL_EVENTS_VISIBLE);
    const overflowCount = items.length - visible.length;
    const eventsHTML = visible.map(renderEventChip).join("");
    const moreHTML = overflowCount > 0
      ? `<button class="cal-more" data-date="${iso}" type="button">+ ${overflowCount} mais</button>`
      : "";

    return `
      <div class="cal-cell${inMonth ? "" : " muted"}${isToday ? " today" : ""}" data-date="${iso}">
        <div class="cal-date">${date.getDate()}</div>
        <div class="cal-events">${eventsHTML}${moreHTML}</div>
      </div>
    `;
  }

  // ---------- day popover (Notion-style — lista completa dos eventos do dia) ----------
  let _dayPop = null;
  function closeDayPopover() {
    if (_dayPop) { _dayPop.remove(); _dayPop = null; }
    document.removeEventListener("click", onDayPopOutside, true);
  }
  function onDayPopOutside(e) {
    if (_dayPop && !_dayPop.contains(e.target) && !e.target.closest(".cal-more")) {
      closeDayPopover();
    }
  }
  function openDayPopover(anchor, iso, items) {
    closeDayPopover();
    const pop = document.createElement("div");
    pop.className = "day-popover";

    const dateObj = new Date(iso + "T00:00:00");
    const header = dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    const headerCased = header.charAt(0).toUpperCase() + header.slice(1);

    pop.innerHTML = `
      <header class="day-pop-header">
        <span>${esc(headerCased)}</span>
        <button class="day-pop-close" type="button" aria-label="Fechar">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
        </button>
      </header>
      <div class="day-pop-body">
        ${items.map(renderEventChip).join("")}
      </div>
    `;

    document.body.appendChild(pop);

    // posiciona perto da célula, dentro da viewport
    const r = anchor.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    let left = r.left;
    let top  = r.top + 4;
    if (left + pr.width > window.innerWidth - 8) left = window.innerWidth - pr.width - 8;
    if (top + pr.height > window.innerHeight - 8) top = window.innerHeight - pr.height - 8;
    if (left < 8) left = 8;
    if (top < 8)  top  = 8;
    pop.style.left = left + "px";
    pop.style.top  = top + "px";

    pop.querySelector(".day-pop-close").addEventListener("click", closeDayPopover);

    setTimeout(() => document.addEventListener("click", onDayPopOutside, true), 10);
    _dayPop = pop;
  }

  // ---------- table view ----------
  // Ordem espelha as propriedades do card (Edital, Segmentos, Órgão, Objeto,
  // Status, Responsáveis, Data, Local, Valor, Itens). Etapa é conceito
  // kanban-only (não é prop do card), fica no fim como contexto.
  const TABLE_COLS = [
    { key: "codigoEdital", label: "Edital",                     cls: "col-codigo" },
    { key: "segmentos",    label: "Segmento",                   cls: "col-segmentos" },
    { key: "orgao",        label: "Órgão",                      cls: "col-orgao" },
    { key: "objeto",       label: "Objeto",                     cls: "col-objeto" },
    { key: "status",       label: "Status do edital",           cls: "col-status" },
    { key: "responsaveis", label: "Responsável",                cls: "col-responsaveis" },
    { key: "dataEnvio",    label: "Data de envio da proposta",  cls: "col-data" },
    { key: "local",        label: "Cidade e Estado",            cls: "col-local" },
    { key: "valor",        label: "Valor global",               cls: "col-valor" },
    { key: "etapa",        label: "Etapa",                      cls: "col-etapa" }
  ];

  // Conteúdo de cada célula da tabela. Para colunas editáveis, o conteúdo
  // vai dentro de um <span class="card-edit-target"> — mesma convenção do card —
  // pra que o click delegation despache pro INLINE_EDITORS[prop] (ver renderTable).
  // codigoEdital e etapa NÃO são editáveis (etapa é conceito kanban-only).
  function tdContent(key, it) {
    switch (key) {
      case "objeto":
        // Tabela mostra o objeto inteiro (a célula quebra linha em vez de truncar,
        // ver styles.css). O title fica como fallback de acessibilidade.
        return `<span class="card-edit-target cell-objeto" title="${esc(it.objeto)}">${esc(it.objeto)}</span>`;
      case "etapa": {
        const e = ETAPAS.find(x => x.key === it.etapa);
        if (!e) return "—";
        return `<span class="etapa-pill"><span class="lane-dot" style="background:${e.dot}"></span>${esc(e.label)}</span>`;
      }
      case "codigoEdital":
        return `<span class="mono">${esc(it.codigoEdital)}</span>`;
      case "segmentos":
        return `<span class="card-edit-target"><span class="pills">${
          it.segmentos.length
            ? it.segmentos.map(s => `<span class="tag-pill" style="background:${corDoSegmento(s)}">${esc(s)}</span>`).join("")
            : '<span class="empty-hint">Adicionar segmento</span>'
        }</span></span>`;
      case "orgao":
        return it.orgao
          ? `<span class="card-edit-target cell-orgao" title="${esc(it.orgao)}">${esc(it.orgao)}</span>`
          : '<span class="card-edit-target empty-hint">Adicionar órgão</span>';
      case "status": {
        const s = getStatusEdital(it.status);
        return s
          ? `<span class="card-edit-target status-pill" style="background:${s.bg};color:${s.text}">${esc(s.label)}</span>`
          : '<span class="card-edit-target empty-hint">Definir status</span>';
      }
      case "responsaveis":
        return `<span class="card-edit-target"><span class="people-list">${
          it.responsaveis.length
            ? it.responsaveis.map(id => {
                const p = personById(id);
                return p ? `<span class="person-chip">${esc(p.nome)}</span>` : "";
              }).join("")
            : '<span class="empty-hint">Sem responsáveis</span>'
        }</span></span>`;
      case "dataEnvio": {
        const cls = dateClasses[getDateState(it.dataEnvio)];
        return `<span class="card-edit-target ${cls}">${formatDateBR(it.dataEnvio)}</span>`;
      }
      case "local":
        return `<span class="card-edit-target cell-local">${esc(it.cidade)} <span class="local-sep">•</span> ${esc(it.estado)}</span>`;
      case "valor":
        return `<span class="card-edit-target cell-valor">${brl(it.valorGlobal)}</span>`;
      default:
        return "";
    }
  }

  // Mapeia a chave da coluna da tabela pra chave do INLINE_EDITORS. Em geral é
  // 1:1; só "local" diverge (chave do editor é "cidade", porque o editor cobre
  // cidade+estado num único popover). null = coluna não-editável.
  function tableColPropKey(colKey) {
    switch (colKey) {
      case "codigoEdital": return null; // não editável
      case "etapa":        return null; // kanban-only
      case "local":        return "cidade";
      default:             return colKey;
    }
  }

  function renderTable() {
    const root = document.getElementById("tableView");

    // Preserva scroll horizontal/vertical da .table-wrap entre renders. Editores
    // chamam render() no commit (e multi-select chama por toggle via
    // rerenderCardAndReopen); sem isso a tabela "pula" pro início toda vez —
    // bug reportado pelo Brunno 2026-05-29 ("clico numa célula e a página rola").
    const prevWrap = root.querySelector(".table-wrap");
    const prevScrollLeft = prevWrap ? prevWrap.scrollLeft : 0;
    const prevScrollTop  = prevWrap ? prevWrap.scrollTop  : 0;

    const colgroup = TABLE_COLS.map(c => `<col class="${c.cls}">`).join("");
    const thead = TABLE_COLS.map(c => `<th class="${c.cls}">${esc(c.label)}</th>`).join("");
    const rows = state.map(it => `
      <tr data-id="${esc(it.id)}">
        ${TABLE_COLS.map(c => {
          const propKey = tableColPropKey(c.key);
          const propAttr = propKey ? ` data-prop="${propKey}"` : "";
          return `<td class="cell-${c.key} ${c.cls}"${propAttr}>${tdContent(c.key, it)}</td>`;
        }).join("")}
      </tr>
    `).join("");

    root.innerHTML = `
      <div class="table-wrap">
        <table class="lic-table">
          <colgroup>${colgroup}</colgroup>
          <thead><tr>${thead}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    // Restaura scroll na NOVA .table-wrap. Síncrono — antes do navegador pintar
    // o frame, evita flicker.
    const newWrap = root.querySelector(".table-wrap");
    if (newWrap) {
      newWrap.scrollLeft = prevScrollLeft;
      newWrap.scrollTop  = prevScrollTop;
    }

    // Click delegation pra edição inline.
    // Diferença vs. card do board: na tabela o handler vai no <td data-prop>
    // inteiro (não só no .card-edit-target), pra que clicar em QUALQUER lugar da
    // célula abra o editor — pedido do Brunno 2026-05-29. O .card-edit-target
    // continua sendo o ANCHOR (anchor pra popover + alvo de innerHTML pros
    // editores de input inline como valor/orgao/objeto).
    root.querySelectorAll("tr[data-id]").forEach(tr => {
      const id = tr.dataset.id;
      tr.querySelectorAll("td[data-prop]").forEach(cell => {
        cell.addEventListener("click", (e) => {
          // Ignora clicks dentro de popovers/inputs já abertos (re-entrância)
          if (e.target.closest(".popover, .inline-input")) return;
          e.stopPropagation();
          const prop = cell.dataset.prop;
          const editor = INLINE_EDITORS[prop];
          if (!editor) return;
          const anchor = cell.querySelector(".card-edit-target") || cell;
          editor(anchor, cell, id);
        });
      });
    });

    // (Click→detail removido por decisão de produto; detail panel fica acessível
    // somente via outras affordances futuras como menu 3-pontinhos.)
  }

  // ---------- view switching ----------
  function setView(view) {
    currentView = view;
    hideTooltip();
    closeDayPopover();
    hideEventHover();
    closeAllPopovers();
    document.getElementById("board").hidden     = view !== "board";
    document.getElementById("calendar").hidden  = view !== "calendar";
    document.getElementById("tableView").hidden = view !== "table";
    document.querySelectorAll(".view-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.view === view);
      t.setAttribute("aria-selected", t.dataset.view === view ? "true" : "false");
    });
    if (view === "calendar") renderCalendar();
    if (view === "table")    renderTable();
  }

  document.querySelectorAll(".view-tab").forEach(tab => {
    tab.addEventListener("click", () => setView(tab.dataset.view));
  });

  // ---------- tooltips (portal em document.body, fora do overflow da lane) ----------
  let _ttEl = null;
  let _ttTimer = null;

  function showTooltip(anchor) {
    const label = anchor.getAttribute("data-tooltip");
    if (!label) return;
    hideTooltip();
    const tip = document.createElement("div");
    tip.className = "kb-tooltip";

    // Detecta truncamento (horizontal por nowrap+ellipsis, ou vertical por line-clamp).
    // Checa o próprio anchor (caso .prop-orgao com ellipsis no row) E descendentes
    // que tipicamente clipam internamente (.objeto-clamp via -webkit-line-clamp,
    // .orgao-text, .cell-* da tabela, etc.) — porque quando o overflow:hidden está
    // no filho, o pai (row) não reflete scrollHeight/scrollWidth excedendo.
    const isClipped = el =>
      el.scrollWidth  > el.clientWidth  + 1 ||
      el.scrollHeight > el.clientHeight + 1;
    let truncatedEl = isClipped(anchor) ? anchor : null;
    if (!truncatedEl) {
      for (const el of anchor.querySelectorAll(".objeto-clamp, .orgao-text, .cell-objeto, .cell-orgao, .cell-local")) {
        if (isClipped(el)) { truncatedEl = el; break; }
      }
    }
    const value = truncatedEl ? (truncatedEl.textContent || "").replace(/\s+/g, " ").trim() : "";

    if (value && value !== label) {
      tip.classList.add("kb-tooltip-with-value");
      const labelEl = document.createElement("div");
      labelEl.className = "kb-tooltip-label";
      labelEl.textContent = label;
      const valueEl = document.createElement("div");
      valueEl.className = "kb-tooltip-value";
      valueEl.textContent = value;
      tip.appendChild(labelEl);
      tip.appendChild(valueEl);
    } else {
      tip.textContent = label;
    }

    document.body.appendChild(tip);
    // Mede e posiciona — acima por padrão, flip pra baixo se não couber
    const r = anchor.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    let top = r.top - tr.height - 4;
    if (top < 8) top = r.bottom + 4;
    let left = r.left + 8;
    // Mantém dentro da viewport horizontal
    const maxLeft = window.innerWidth - tr.width - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;
    tip.style.top = top + "px";
    tip.style.left = left + "px";
    requestAnimationFrame(() => tip.classList.add("visible"));
    _ttEl = tip;
  }

  function hideTooltip() {
    clearTimeout(_ttTimer);
    if (_ttEl) { _ttEl.remove(); _ttEl = null; }
  }

  function bindTooltip(anchor) {
    anchor.addEventListener("mouseenter", () => {
      clearTimeout(_ttTimer);
      _ttTimer = setTimeout(() => showTooltip(anchor), 250);
    });
    anchor.addEventListener("mouseleave", hideTooltip);
    // ao iniciar drag, esconde
    anchor.addEventListener("dragstart", hideTooltip);
  }

  // =====================================================================
  // Inline edit (Notion-style) — portado de licitacoes-em-andamento-card/prototype.html
  // =====================================================================

  // Lista de segmentos conhecidos = união de SEGMENTO_CORES + segmentos
  // efetivamente presentes em LICITACOES. editSegmentos permite criar novos.
  const SEGMENTOS_DISPONIVEIS = (function () {
    const set = new Set(Object.keys(SEGMENTO_CORES));
    LICITACOES.forEach(l => (l.segmentos || []).forEach(s => set.add(s)));
    return Array.from(set);
  })();
  const ESTADOS_UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

  function closeAllPopovers() {
    document.querySelectorAll(".popover").forEach(el => el.remove());
    document.querySelectorAll(".editing").forEach(el => el.classList.remove("editing"));
  }

  function showPopover(anchorEl, htmlOrNode, opts = {}) {
    closeAllPopovers();
    const row = anchorEl.closest("[data-prop]") || anchorEl;
    row.classList.add("editing");

    const pop = document.createElement("div");
    pop.className = "popover";
    if (typeof htmlOrNode === "string") pop.innerHTML = htmlOrNode;
    else pop.appendChild(htmlOrNode);

    document.body.appendChild(pop);

    // position: fixed (não usa scroll offsets) — ancorado abaixo do target
    const rect = anchorEl.getBoundingClientRect();
    pop.style.top  = (rect.bottom + 4) + "px";
    pop.style.left = rect.left + "px";
    pop.style.minWidth = (opts.minWidth ?? Math.max(rect.width, 280)) + "px";

    // Reposiciona se sair da viewport
    const popRect = pop.getBoundingClientRect();
    if (popRect.right > window.innerWidth - 8) {
      pop.style.left = Math.max(8, window.innerWidth - popRect.width - 8) + "px";
    }
    if (popRect.bottom > window.innerHeight - 8) {
      pop.style.top = Math.max(8, rect.top - popRect.height - 4) + "px";
    }

    if (opts.onMount) opts.onMount(pop);
    return pop;
  }

  // Listeners globais — click-fora e Escape fecham qualquer popover aberto
  document.addEventListener("click", (e) => {
    if (!document.querySelector(".popover")) return;
    if (e.target.closest(".popover")) return;
    if (e.target.closest(".card-edit-target")) return; // o handler do target reabre
    if (e.target.closest("[data-card-menu]")) return; // o kebab faz seu próprio toggle
    closeAllPopovers();
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.querySelector(".popover")) {
      closeAllPopovers();
    }
  });

  // Helper: re-renderiza o card (e re-bind dos events). Como o kanban
  // tem ordenação de cards por etapa, render() global é o caminho mais
  // seguro pra refletir mudanças. Não há impacto visível na lane.
  function refreshAfterEdit() {
    closeAllPopovers();
    render();
  }

  // ---- editor: status (single-select) ----
  function editStatus(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;

    const renderList = (pop) => {
      pop.querySelector(".pop-scroll").innerHTML = `
        ${STATUS_EDITAL.map(s => `
          <div class="pop-item ${s.id === item.status ? "selected" : ""}" data-id="${esc(s.id)}">
            <span class="status-pill" style="background:${s.bg};color:${s.text}">${esc(s.label)}</span>
            <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        `).join("")}
        ${item.status ? `
          <div class="pop-divider"></div>
          <div class="pop-item" data-id="">
            <svg class="pop-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span class="pop-item-label">Limpar status</span>
          </div>
        ` : ""}
      `;
    };

    showPopover(anchor, `<div class="pop-scroll" style="max-height:none"></div>`, {
      onMount: (pop) => {
        renderList(pop);
        pop.addEventListener("click", (e) => {
          const it = e.target.closest("[data-id]");
          if (!it) return;
          item.status = it.dataset.id || null;
          refreshAfterEdit();
        });
      }
    });
  }

  // ---- editor: segmentos (multi-select com search + create) ----
  function editSegmentos(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    let query = "";

    const renderList = (pop) => {
      const filtered = SEGMENTOS_DISPONIVEIS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      );
      const available = filtered.filter(s => !item.segmentos.includes(s));
      const showCreate = query && !SEGMENTOS_DISPONIVEIS.some(s => s.toLowerCase() === query.toLowerCase());

      pop.querySelector(".pop-scroll").innerHTML = `
        ${item.segmentos.length ? `
          <div class="pop-section">Selecionados</div>
          ${item.segmentos.map(s => `
            <div class="pop-item selected" data-action="toggle" data-val="${esc(s)}">
              <span class="tag-pill" style="background:${corDoSegmento(s)}">${esc(s)}</span>
              <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          `).join("")}
        ` : ""}
        ${available.length ? `
          <div class="pop-section">Disponíveis</div>
          ${available.map(s => `
            <div class="pop-item" data-action="toggle" data-val="${esc(s)}">
              <span class="tag-pill" style="background:${corDoSegmento(s)}">${esc(s)}</span>
            </div>
          `).join("")}
        ` : ""}
        ${showCreate ? `
          <div class="pop-section">Criar</div>
          <div class="pop-item" data-action="create" data-val="${esc(query)}">
            <svg class="pop-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            <span class="pop-item-label">Criar "<strong>${esc(query)}</strong>"</span>
          </div>
        ` : ""}
        ${!item.segmentos.length && !available.length && !showCreate ? `
          <div class="pop-empty">Nenhum segmento</div>
        ` : ""}
      `;
    };

    showPopover(anchor, `
      <input class="pop-search" placeholder="Buscar ou criar segmento..." />
      <div class="pop-scroll"></div>
    `, {
      onMount: (pop) => {
        const search = pop.querySelector(".pop-search");
        const reRenderInPlace = () => {
          // muta o item e re-renderiza o pop sem fechar (sem render global)
          renderList(pop);
        };
        search.focus({ preventScroll: true }); // ver editValor pra contexto
        search.addEventListener("input", (e) => {
          query = e.target.value;
          renderList(pop);
        });
        pop.addEventListener("click", (e) => {
          const it = e.target.closest("[data-action]");
          if (!it) return;
          const val = it.dataset.val;
          if (it.dataset.action === "toggle") {
            item.segmentos = item.segmentos.includes(val)
              ? item.segmentos.filter(s => s !== val)
              : [...item.segmentos, val];
          } else if (it.dataset.action === "create") {
            if (!SEGMENTOS_DISPONIVEIS.includes(val)) SEGMENTOS_DISPONIVEIS.push(val);
            item.segmentos.push(val);
            query = "";
            search.value = "";
          }
          // re-render apenas do card e re-bind, mantendo o popover
          // (fecha popover, render global, reabre popover ancorado de novo)
          rerenderCardAndReopen(itemId, "segmentos", editSegmentos, search.value);
        });
        renderList(pop);
      }
    });
  }

  // ---- editor: responsáveis (multi-select de pessoas) ----
  function editResponsaveis(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    let query = "";

    const renderList = (pop) => {
      const filtered = PESSOAS.filter(p =>
        p.nome.toLowerCase().includes(query.toLowerCase())
      );
      pop.querySelector(".pop-scroll").innerHTML = filtered.length ? filtered.map(p => {
        const isSelected = item.responsaveis.includes(p.id);
        return `
          <div class="pop-item ${isSelected ? "selected" : ""}" data-id="${p.id}">
            <span class="pop-item-label">${esc(p.nome)}</span>
            <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        `;
      }).join("") : `<div class="pop-empty">Nenhuma pessoa encontrada</div>`;
    };

    showPopover(anchor, `
      <input class="pop-search" placeholder="Buscar pessoa..." />
      <div class="pop-scroll"></div>
    `, {
      onMount: (pop) => {
        const search = pop.querySelector(".pop-search");
        search.focus({ preventScroll: true }); // ver editValor pra contexto
        search.addEventListener("input", (e) => {
          query = e.target.value;
          renderList(pop);
        });
        pop.addEventListener("click", (e) => {
          const it = e.target.closest("[data-id]");
          if (!it) return;
          const pid = parseInt(it.dataset.id, 10);
          item.responsaveis = item.responsaveis.includes(pid)
            ? item.responsaveis.filter(x => x !== pid)
            : [...item.responsaveis, pid];
          rerenderCardAndReopen(itemId, "responsaveis", editResponsaveis, search.value);
        });
        renderList(pop);
      }
    });
  }

  // ---- editor: valor (input inline substitui o conteúdo do target) ----
  function editValor(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    closeAllPopovers();
    row.classList.add("editing");
    const original = item.valorGlobal;
    // Substitui o conteúdo do .card-edit-target por um input
    anchor.innerHTML = `
      <span class="inline-value-wrap">
        <span class="inline-prefix">R$</span>
        <input class="inline-input" type="text" value="${String(original).replace(".", ",")}" />
      </span>
    `;
    const input = anchor.querySelector("input");
    // preventScroll: evita que o navegador role o .table-wrap pra "trazer pra
    // viewport" um input que já está visível (a célula foi clicada). Sem isso,
    // editar uma célula longe da origem do scroll horizontal joga a tabela
    // pra esquerda.
    input.focus({ preventScroll: true });
    input.select();

    const commit = (save) => {
      if (save) {
        const parsed = parseFloat(input.value.replace(/\./g, "").replace(",", "."));
        if (!isNaN(parsed)) item.valorGlobal = parsed;
      }
      render();
    };
    input.addEventListener("blur", () => commit(true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { e.preventDefault(); commit(false); }
    });
    // Garante que clicks no input não vazem pra row/card
    input.addEventListener("click", e => e.stopPropagation());
    input.addEventListener("mousedown", e => e.stopPropagation());
  }

  // ---- editor: data de envio (mini date picker) ----
  let _editCalMonth, _editCalYear;
  function editDataEnvio(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    const [y, m] = item.dataEnvio.split("-").map(Number);
    _editCalMonth = m - 1;
    _editCalYear  = y;

    const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const DIAS_SEMANA = ["D","S","T","Q","Q","S","S"];

    const renderCal = (pop) => {
      const firstDay = new Date(_editCalYear, _editCalMonth, 1).getDay();
      const daysInMonth = new Date(_editCalYear, _editCalMonth + 1, 0).getDate();
      const daysInPrev  = new Date(_editCalYear, _editCalMonth, 0).getDate();
      const todayIso = TODAY_ISO;
      const selected = item.dataEnvio;

      let cells = "";
      cells += DIAS_SEMANA.map(d => `<div class="mini-cal-cell head">${d}</div>`).join("");
      for (let i = firstDay - 1; i >= 0; i--) {
        cells += `<div class="mini-cal-cell muted">${daysInPrev - i}</div>`;
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${_editCalYear}-${String(_editCalMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const isToday = iso === todayIso;
        const isSelected = iso === selected;
        cells += `<div class="mini-cal-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" data-iso="${iso}">${d}</div>`;
      }
      const totalCells = firstDay + daysInMonth;
      const trailing = (7 - (totalCells % 7)) % 7;
      for (let d = 1; d <= trailing; d++) {
        cells += `<div class="mini-cal-cell muted">${d}</div>`;
      }

      pop.querySelector(".mini-cal").innerHTML = `
        <div class="mini-cal-header">
          <button class="mini-cal-nav" data-nav="-1" type="button" aria-label="Mês anterior">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4 6 8l4 4"/></svg>
          </button>
          <div class="mini-cal-month">${MESES[_editCalMonth]} ${_editCalYear}</div>
          <button class="mini-cal-nav" data-nav="1" type="button" aria-label="Próximo mês">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>
          </button>
        </div>
        <div class="mini-cal-grid">${cells}</div>
        <div class="mini-cal-footer">
          <button type="button" data-action="today">Hoje</button>
        </div>
      `;
    };

    showPopover(anchor, `<div class="mini-cal"></div>`, {
      minWidth: 240,
      onMount: (pop) => {
        renderCal(pop);
        pop.addEventListener("click", (e) => {
          const nav = e.target.closest("[data-nav]");
          if (nav) {
            _editCalMonth += parseInt(nav.dataset.nav, 10);
            if (_editCalMonth < 0)  { _editCalMonth = 11; _editCalYear--; }
            if (_editCalMonth > 11) { _editCalMonth = 0;  _editCalYear++; }
            renderCal(pop);
            return;
          }
          const cell = e.target.closest("[data-iso]");
          if (cell) {
            item.dataEnvio = cell.dataset.iso;
            refreshAfterEdit();
            return;
          }
          const action = e.target.closest("[data-action]");
          if (action?.dataset.action === "today") {
            item.dataEnvio = TODAY_ISO;
            refreshAfterEdit();
          }
        });
      }
    });
  }

  // Re-render + reabrir o popover ancorado no mesmo data-prop daquele card/row
  // (usado por editores multi-select que precisam refletir a mudança SEM fechar
  // a UI de edição). Mantém o foco e o conteúdo da busca.
  // View-aware: em board/calendar reancora no .card-root; em table no <tr>.
  function rerenderCardAndReopen(itemId, propKey, editorFn, searchVal) {
    render();
    let host = null;
    if (currentView === "table") {
      host = document.querySelector(`tr[data-id="${CSS.escape(itemId)}"]`);
    } else {
      host = document.querySelector(`.card-root[data-id="${CSS.escape(itemId)}"]`);
    }
    if (!host) return;
    const newRow = host.querySelector(`[data-prop="${propKey}"]`);
    if (!newRow) return;
    const newAnchor = newRow.querySelector(".card-edit-target") || newRow;
    editorFn(newAnchor, newRow, itemId);
    // restaura busca
    if (searchVal) {
      const newSearch = document.querySelector(".popover .pop-search");
      if (newSearch) {
        newSearch.value = searchVal;
        newSearch.focus({ preventScroll: true }); // ver editValor pra contexto
        newSearch.dispatchEvent(new Event("input"));
      }
    }
  }

  // ---- editor: orgao (input simples de uma linha) ----
  function editOrgao(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    closeAllPopovers();
    row.classList.add("editing");
    const original = item.orgao || "";
    anchor.innerHTML = `<input class="inline-input" type="text" value="${esc(original)}" />`;
    const input = anchor.querySelector("input");
    input.focus({ preventScroll: true }); // ver editValor pra contexto
    input.select();
    const commit = (save) => {
      if (save) item.orgao = input.value.trim();
      render();
    };
    input.addEventListener("blur", () => commit(true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter")  { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") { e.preventDefault(); commit(false); }
    });
    input.addEventListener("click",     e => e.stopPropagation());
    input.addEventListener("mousedown", e => e.stopPropagation());
  }

  // ---- editor: objeto (textarea multi-linha, Cmd/Ctrl+Enter ou blur pra salvar) ----
  function editObjeto(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    closeAllPopovers();
    row.classList.add("editing");
    const original = item.objeto || "";
    anchor.innerHTML = `<textarea class="inline-input inline-textarea">${esc(original)}</textarea>`;
    const ta = anchor.querySelector("textarea");
    ta.focus({ preventScroll: true }); // ver editValor pra contexto
    ta.select();
    const commit = (save) => {
      if (save) item.objeto = ta.value.trim();
      render();
    };
    ta.addEventListener("blur", () => commit(true));
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); commit(false); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        ta.blur();
      }
    });
    ta.addEventListener("click",     e => e.stopPropagation());
    ta.addEventListener("mousedown", e => e.stopPropagation());
  }

  // ---- editor: cidade e estado (popover com dois selects dependentes) ----
  function editCidade(anchor, row, itemId) {
    const item = state.find(i => i.id === itemId);
    if (!item) return;
    // Estado inicial: se item.estado vazio, default pra primeiro UF
    if (!item.estado || !CITIES_BY_UF[item.estado]) item.estado = "SP";

    const renderSelects = (pop) => {
      const ufOptions = UF_LIST.map(uf =>
        `<option value="${uf}" ${uf === item.estado ? "selected" : ""}>${uf}</option>`
      ).join("");
      const cities = CITIES_BY_UF[item.estado] || [];
      // Se cidade atual não pertence ao estado selecionado, força pra primeira
      if (!cities.includes(item.cidade)) item.cidade = cities[0] || "";
      const cidadeOptions = cities.map(c =>
        `<option value="${esc(c)}" ${c === item.cidade ? "selected" : ""}>${esc(c)}</option>`
      ).join("");

      pop.innerHTML = `
        <div class="cidade-edit-field">
          <label class="cidade-edit-label">Estado</label>
          <select class="cidade-edit-select" data-field="estado">${ufOptions}</select>
        </div>
        <div class="cidade-edit-field">
          <label class="cidade-edit-label">Cidade</label>
          <select class="cidade-edit-select" data-field="cidade">${cidadeOptions}</select>
        </div>
      `;
      pop.querySelector('[data-field="estado"]').addEventListener("change", (e) => {
        item.estado = e.target.value;
        // Estado mudou → cidade pode não existir mais no novo. renderSelects ajusta.
        const newCities = CITIES_BY_UF[item.estado] || [];
        if (!newCities.includes(item.cidade)) item.cidade = newCities[0] || "";
        renderSelects(pop);
      });
      pop.querySelector('[data-field="cidade"]').addEventListener("change", (e) => {
        item.cidade = e.target.value;
      });
    };

    const pop = showPopover(anchor, '<div class="cidade-edit-pop"></div>', {
      minWidth: 240,
      onMount: (popEl) => {
        const inner = popEl.querySelector(".cidade-edit-pop");
        renderSelects(inner);
        popEl.querySelector("select")?.focus({ preventScroll: true }); // ver editValor pra contexto
      }
    });

    // Observa remoção do popover (click-fora ou Escape via closeAllPopovers)
    // pra re-renderizar o card refletindo as mudanças escritas em item.
    const observer = new MutationObserver(() => {
      if (!document.body.contains(pop)) {
        observer.disconnect();
        render();
      }
    });
    observer.observe(document.body, { childList: true, subtree: false });
  }

  // Dispatch por chave de propriedade
  const INLINE_EDITORS = {
    status:       editStatus,
    segmentos:    editSegmentos,
    responsaveis: editResponsaveis,
    valor:        editValor,
    dataEnvio:    editDataEnvio,
    orgao:        editOrgao,
    objeto:       editObjeto,
    cidade:       editCidade,
  };

  // Liga todos os listeners de UM card (drag, click, edit, checkbox, action-btn,
  // tooltips). Helper reusado por bindCardEvents (board) e showEventHover
  // (popover do calendar) — assim o popover fica idêntico ao card do board.
  function bindCardListeners(card) {
      const id = card.dataset.id;

      card.addEventListener("dragstart", (e) => {
        if (e.target.closest("[data-card-select], .action-btn")) {
          e.preventDefault();
          return;
        }
        if (document.querySelector(".popover")) {
          e.preventDefault();
          return;
        }
        // Captura altura ANTES de adicionar .dragging (pra refletir tamanho real)
        _draggedHeight = card.getBoundingClientRect().height;
        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        wasDragging = true;
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        clearDropIndicators();
        document.querySelectorAll(".lane.drop-target").forEach(l => l.classList.remove("drop-target"));
        setTimeout(() => { wasDragging = false; }, 50);
      });

      // Click no card (fora de propriedades, botões, popovers) abre modal
      // "Em construção". Tela de detalhe ainda em design.
      card.addEventListener("click", (e) => {
        if (wasDragging) return;
        if (e.target.closest("[data-card-select], .action-btn, .card-edit-target, .popover")) return;
        showConstructionModal();
      });

      // Inline edit: click em qualquer .card-edit-target dispara o editor da row pai.
      // Sem mousedown.stopPropagation aqui — o browser distingue click (sem movimento
      // → editor) de drag (com movimento → drag-and-drop) nativamente.
      card.querySelectorAll(".card-edit-target").forEach(target => {
        target.addEventListener("click", (e) => {
          if (wasDragging) return;
          e.stopPropagation();
          const row = target.closest("[data-prop]");
          if (!row) return;
          const prop = row.dataset.prop;
          const editor = INLINE_EDITORS[prop];
          if (editor) editor(target, row, id);
        });
      });

      // Checkbox de seleção
      const checkbox = card.querySelector("[data-card-select]");
      if (checkbox) {
        checkbox.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const item = state.find(i => i.id === id);
          if (item) {
            item._selected = !item._selected;
            card.classList.toggle("selected", item._selected);
            checkbox.classList.toggle("checked", item._selected);
          }
        });
        checkbox.addEventListener("mousedown", e => e.stopPropagation());
      }

      // Floating actions — copy link (stub) + kebab menu com "Descartar"
      card.querySelectorAll(".action-btn").forEach(btn => {
        btn.addEventListener("click", e => {
          e.stopPropagation();
          e.preventDefault();

          // Kebab → abre dropdown com "Descartar" (toggle se já aberto)
          if (btn.hasAttribute("data-card-menu")) {
            if (btn.classList.contains("editing")) {
              closeAllPopovers();
              return;
            }
            showPopover(btn, `
              <div class="pop-item" data-action="descartar">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                <span>Descartar</span>
              </div>
            `, {
              minWidth: 160,
              onMount: (pop) => {
                pop.addEventListener("click", (ev) => {
                  const item = ev.target.closest(".pop-item");
                  if (!item) return;
                  if (item.dataset.action === "descartar") {
                    closeAllPopovers();
                    // TODO: implementar descarte real (remover do state, re-render lane)
                    console.log("Descartar card", id);
                  }
                });
              },
            });
          }
        });
        btn.addEventListener("mousedown", e => e.stopPropagation());
      });

      // Tooltips por property-row (renderizado em document.body)
      card.querySelectorAll("[data-tooltip]").forEach(bindTooltip);
  }

  function bindCardEvents() {
    document.querySelectorAll(".card-root").forEach(bindCardListeners);
  }

  // ---------- detail panel ----------
  function openDetail(id) {
    const item = state.find(i => i.id === id);
    if (!item) return;
    closeAllPopovers();
    hideEventHover();

    const overlay = document.getElementById("detailOverlay");
    const panel   = document.getElementById("detailPanel");
    const iframe  = document.getElementById("detailIframe");
    const crumb   = document.getElementById("detailCrumb");

    crumb.textContent = `Edital ${item.codigoEdital}`;
    overlay.hidden = false;
    panel.hidden = false;

    iframe.onload = () => hydrateIframe(iframe, item);
    // força reload mesmo se mesmo URL (cache-busting via timestamp)
    iframe.src = `card.html?id=${encodeURIComponent(id)}&t=${Date.now()}`;
  }

  function hydrateIframe(iframe, item) {
    const win = iframe.contentWindow;
    if (!win) return;

    const apply = () => {
      if (!win.__cardAPI) return;
      win.__cardAPI.setPessoas(PESSOAS.map(p => ({ id: p.id, nome: p.nome, cor: p.cor })));
      win.__cardAPI.setState({
        titulo:        item.titulo,
        codigoEdital:  item.codigoEdital,
        segmentos:     [...item.segmentos],
        orgao:         item.orgao,
        objeto:        item.objeto,
        status:        item.status,
        responsaveis:  [...item.responsaveis],
        dataEnvio:     item.dataEnvio,
        cidade:        item.cidade,
        estado:        item.estado,
        valorGlobal:   item.valorGlobal,
        demoProperties: [],
        propertyOrder: [],
        selected: false
      });
    };

    if (win.__cardAPI) apply();
    else win.addEventListener("card-api-ready", apply, { once: true });
  }

  function closeDetail() {
    const overlay = document.getElementById("detailOverlay");
    const panel   = document.getElementById("detailPanel");
    const iframe  = document.getElementById("detailIframe");
    overlay.hidden = true;
    panel.hidden = true;
    iframe.src = "about:blank";
  }

  document.getElementById("detailClose").addEventListener("click", closeDetail);
  document.getElementById("detailOverlay").addEventListener("click", closeDetail);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeDetail();
  });

  // ---------- drop placeholder (caixa do tamanho do card mostrando o espaço de destino) ----------
  let _draggedHeight = 0;
  let _placeholder = null;
  let _currentDropKey = null;  // dedup pra não mexer no DOM toda hora

  function clearDropIndicators() {
    if (_placeholder) { _placeholder.remove(); _placeholder = null; }
    _currentDropKey = null;
  }

  // Dado o cursor (clientY) na lane, retorna { card, position }:
  // card = card-root mais próximo (excluindo o que está sendo arrastado),
  // position = 'before' | 'after'. Lane vazia → { card: null, position: 'after' }.
  function findDropTarget(lane, clientY) {
    const cards = [...lane.querySelectorAll(".card-root:not(.dragging)")];
    if (cards.length === 0) return { card: null, position: "after" };
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        return { card, position: "before" };
      }
    }
    return { card: cards[cards.length - 1], position: "after" };
  }

  function positionPlaceholder(lane, target) {
    const laneBody = lane.querySelector(".lane-body");
    if (!_placeholder) {
      _placeholder = document.createElement("div");
      _placeholder.className = "drop-placeholder";
      // Em flex-column, height inline pode ser encolhido. flex: 0 0 X crava
      // exatamente a altura do card que está sendo arrastado.
      const h = _draggedHeight || 120;
      _placeholder.style.flex = `0 0 ${h}px`;
      _placeholder.style.minHeight = h + "px";
    }
    if (target.card) {
      if (target.position === "before") {
        target.card.parentNode.insertBefore(_placeholder, target.card);
      } else {
        target.card.parentNode.insertBefore(_placeholder, target.card.nextSibling);
      }
    } else {
      // Lane vazia — coloca no body
      laneBody.appendChild(_placeholder);
    }
  }

  function bindLaneEvents() {
    document.querySelectorAll(".lane").forEach(lane => {
      lane.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        lane.classList.add("drop-target");

        const target = findDropTarget(lane, e.clientY);
        // Chave única pra dedup — só re-posiciona o placeholder se mudou
        const key = `${lane.dataset.etapa}|${target.card?.dataset.id || "end"}|${target.position}`;
        if (key === _currentDropKey) return;
        _currentDropKey = key;
        positionPlaceholder(lane, target);
      });
      lane.addEventListener("dragleave", e => {
        // Só limpa se saiu da lane de verdade (não pra um filho)
        if (!lane.contains(e.relatedTarget)) {
          lane.classList.remove("drop-target");
          // NÃO remove o placeholder aqui — ele se move pra outra lane no próximo dragover
        }
      });
      lane.addEventListener("drop", e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const newEtapa = lane.dataset.etapa;
        const target = findDropTarget(lane, e.clientY);
        clearDropIndicators();
        lane.classList.remove("drop-target");
        moveItem(id, newEtapa, target.card?.dataset.id || null, target.position);
      });
    });
  }

  // Move (e reordena) item no state. targetId/position = onde inserir relativo a outro card.
  // Se targetId null, vai pro fim da etapa.
  function moveItem(id, newEtapa, targetId, position) {
    const item = state.find(i => i.id === id);
    if (!item) return;
    const fromIdx = state.indexOf(item);
    if (fromIdx < 0) return;

    // Remove da posição atual
    state.splice(fromIdx, 1);
    item.etapa = newEtapa;

    // Calcula índice de inserção
    let insertIdx;
    if (targetId) {
      const target = state.find(i => i.id === targetId);
      const targetIdx = state.indexOf(target);
      insertIdx = position === "after" ? targetIdx + 1 : targetIdx;
    } else {
      // Sem target (lane vazia ou drop além) — coloca no fim do state
      insertIdx = state.length;
    }
    state.splice(insertIdx, 0, item);
    render();
  }

  // ---------- modal "Em construção" ----------
  function showConstructionModal() {
    const modal = document.getElementById("constructionModal");
    if (!modal) return;
    modal.hidden = false;
    // foco no botão "Entendi" pra acessibilidade
    const btn = modal.querySelector(".construction-modal-btn");
    if (btn) setTimeout(() => btn.focus(), 50);
  }
  function hideConstructionModal() {
    const modal = document.getElementById("constructionModal");
    if (modal) modal.hidden = true;
  }
  // Bind close: qualquer elemento com data-close fecha o modal
  document.getElementById("constructionModal")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) hideConstructionModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.getElementById("constructionModal")?.hidden) {
      hideConstructionModal();
    }
  });

  render();
})();
