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
      // codigoEdital, orgao, objeto, cidade, itensMatch = prop-static (só
      // click-to-open detail, sem editor inline — match com prototype).
      {
        key: "codigoEdital",
        tooltip: "Número do edital",
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
        tooltip: "Nome do Órgão",
        classes: "prop-static prop-orgao",
        content: esc(item.orgao) || '<span class="empty-hint">Vazio</span>'
      },
      {
        key: "objeto",
        tooltip: "Objeto da licitação",
        classes: "prop-static prop-objeto",
        content: item.objeto
          ? `<span class="objeto-clamp">${esc(item.objeto)}</span>`
          : '<span class="empty-hint">Vazio</span>'
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
        tooltip: "Cidade / Estado",
        classes: "prop-static prop-local",
        content: `${esc(item.cidade)} <span class="local-sep">•</span> ${esc(item.estado)}`
      },
      {
        key: "valor",
        tooltip: "Valor global",
        classes: "prop prop-valor",
        content: `<span class="card-edit-target">${brl(item.valorGlobal)}</span>`
      },
      {
        key: "itensMatch",
        tooltip: "Itens com correspondência",
        classes: "prop-static prop-itens",
        content: `${item.itensMatch} ${item.itensMatch === 1 ? "item" : "itens"} com correspondência`
      }
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
          <button class="action-btn" data-card-menu title="Mais opções" aria-label="Mais opções">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
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
    const board = document.getElementById("board");
    board.innerHTML = ETAPAS.map(et =>
      laneHTML(et, state.filter(i => i.etapa === et.key))
    ).join("");

    document.querySelectorAll(".view-count").forEach(el => el.textContent = String(state.length));

    bindCardEvents();
    bindLaneEvents();
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
      el.addEventListener("click", () => openDetail(el.dataset.id));
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

  function renderEventChip(it) {
    const dateState = getDateState(it.dataEnvio);
    const dotColor = dateState === "today"  ? "#B91C1C"
                   : dateState === "urgent" ? "#D97706"
                                            : null;
    // Calendar = modo planejamento: só o smart título (derivado do objeto).
    // O código do edital fica acessível ao clicar no chip (abre detail panel).
    const subject = smartObjetoTitle(it.objeto, 60);
    return `
      <div class="cal-event" data-id="${esc(it.id)}" data-tooltip="${esc(subject)}">
        ${dotColor ? `<span class="cal-event-dot" style="background:${dotColor}"></span>` : ""}
        <span class="cal-event-title">${esc(subject)}</span>
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

    pop.querySelectorAll(".cal-event").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        closeDayPopover();
        openDetail(id);
      });
    });
    pop.querySelector(".day-pop-close").addEventListener("click", closeDayPopover);

    setTimeout(() => document.addEventListener("click", onDayPopOutside, true), 10);
    _dayPop = pop;
  }

  // ---------- table view ----------
  const TABLE_COLS = [
    { key: "objeto",       label: "Objeto",         cls: "col-objeto" },
    { key: "etapa",        label: "Etapa",          cls: "col-etapa" },
    { key: "codigoEdital", label: "Edital",         cls: "col-codigo" },
    { key: "segmentos",    label: "Segmentos",      cls: "col-segmentos" },
    { key: "orgao",        label: "Órgão",          cls: "col-orgao" },
    { key: "status",       label: "Status",         cls: "col-status" },
    { key: "responsaveis", label: "Responsáveis",   cls: "col-responsaveis" },
    { key: "dataEnvio",    label: "Data de envio",  cls: "col-data" },
    { key: "local",        label: "Local",          cls: "col-local" },
    { key: "valor",        label: "Valor global",   cls: "col-valor" },
    { key: "itens",        label: "Itens",          cls: "col-itens" }
  ];

  function tdContent(key, it) {
    switch (key) {
      case "objeto":
        return `<span class="cell-objeto" title="${esc(it.objeto)}">${esc(smartObjetoTitle(it.objeto, 90))}</span>`;
      case "etapa": {
        const e = ETAPAS.find(x => x.key === it.etapa);
        if (!e) return "—";
        return `<span class="etapa-pill"><span class="lane-dot" style="background:${e.dot}"></span>${esc(e.label)}</span>`;
      }
      case "codigoEdital":
        return `<span class="mono">${esc(it.codigoEdital)}</span>`;
      case "segmentos":
        return `<div class="pills">${
          it.segmentos.map(s => `<span class="tag-pill" style="background:${corDoSegmento(s)}">${esc(s)}</span>`).join("")
        }</div>`;
      case "orgao":
        return `<span class="cell-orgao" title="${esc(it.orgao)}">${esc(it.orgao)}</span>`;
      case "status": {
        const s = getStatusEdital(it.status);
        if (!s) return "—";
        return `<span class="status-pill" style="background:${s.bg};color:${s.text}">${esc(s.label)}</span>`;
      }
      case "responsaveis":
        return `<div class="people-list">${
          it.responsaveis.map(id => {
            const p = personById(id);
            return p ? `<span class="person-chip">${esc(p.nome)}</span>` : "";
          }).join("")
        }</div>`;
      case "dataEnvio": {
        const cls = dateClasses[getDateState(it.dataEnvio)];
        return `<span class="${cls}">${formatDateBR(it.dataEnvio)}</span>`;
      }
      case "local":
        return `<span class="cell-local">${esc(it.cidade)} <span class="local-sep">•</span> ${esc(it.estado)}</span>`;
      case "valor":
        return `<span class="cell-valor">${brl(it.valorGlobal)}</span>`;
      case "itens":
        return `<span class="cell-itens">${it.itensMatch} ${it.itensMatch === 1 ? "item" : "itens"}</span>`;
      default:
        return "";
    }
  }

  function renderTable() {
    const root = document.getElementById("tableView");
    const colgroup = TABLE_COLS.map(c => `<col class="${c.cls}">`).join("");
    const thead = TABLE_COLS.map(c => `<th class="${c.cls}">${esc(c.label)}</th>`).join("");
    const rows = state.map(it => `
      <tr data-id="${esc(it.id)}">
        ${TABLE_COLS.map(c => `<td class="cell-${c.key} ${c.cls}">${tdContent(c.key, it)}</td>`).join("")}
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

    root.querySelectorAll("tbody tr").forEach(tr => {
      tr.addEventListener("click", () => openDetail(tr.dataset.id));
    });
  }

  // ---------- view switching ----------
  function setView(view) {
    currentView = view;
    hideTooltip();
    closeDayPopover();
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
    const text = anchor.getAttribute("data-tooltip");
    if (!text) return;
    hideTooltip();
    const tip = document.createElement("div");
    tip.className = "kb-tooltip";
    tip.textContent = text;
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
        search.focus();
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
        search.focus();
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
    input.focus();
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

  // Re-render + reabrir o popover ancorado no mesmo data-prop daquele card
  // (usado por editores multi-select que precisam refletir a mudança no card
  // SEM fechar a UI de edição). Mantém o foco e o conteúdo da busca.
  function rerenderCardAndReopen(itemId, propKey, editorFn, searchVal) {
    render();
    const card = document.querySelector(`.card-root[data-id="${CSS.escape(itemId)}"]`);
    if (!card) return;
    const newRow = card.querySelector(`[data-prop="${propKey}"]`);
    if (!newRow) return;
    const newAnchor = newRow.querySelector(".card-edit-target") || newRow;
    editorFn(newAnchor, newRow, itemId);
    // restaura busca
    if (searchVal) {
      const newSearch = document.querySelector(".popover .pop-search");
      if (newSearch) {
        newSearch.value = searchVal;
        newSearch.focus();
        newSearch.dispatchEvent(new Event("input"));
      }
    }
  }

  // Dispatch por chave de propriedade
  const INLINE_EDITORS = {
    status:       editStatus,
    segmentos:    editSegmentos,
    responsaveis: editResponsaveis,
    valor:        editValor,
    dataEnvio:    editDataEnvio,
  };

  function bindCardEvents() {
    document.querySelectorAll(".card-root").forEach(card => {
      const id = card.dataset.id;

      card.addEventListener("dragstart", (e) => {
        if (e.target.closest("[data-card-select], .action-btn, .card-edit-target")) {
          e.preventDefault();
          return;
        }
        // Não arrasta enquanto algum editor inline está aberto
        if (document.querySelector(".popover")) {
          e.preventDefault();
          return;
        }
        card.classList.add("dragging");
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        wasDragging = true;
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document.querySelectorAll(".lane.drop-target").forEach(l => l.classList.remove("drop-target"));
        // dragend dispara depois do drop; setTimeout impede que o click pós-drop dispare openDetail
        setTimeout(() => { wasDragging = false; }, 50);
      });

      // Click no card → abre o detail panel (exceto sobre checkbox/ações/editor inline)
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-card-select], .action-btn, .floating-actions")) return;
        // Padrão Notion: se clicou no .card-edit-target dentro da row, deixa
        // o handler de edição inline lidar (não abre detail).
        if (e.target.closest(".card-edit-target")) return;
        // Se um popover está aberto e clicou no popover, ignora também.
        if (e.target.closest(".popover")) return;
        // Ignora se acabou de soltar um drag
        if (wasDragging) return;
        openDetail(id);
      });

      // Inline edit: cada .card-edit-target dispara o editor da row pai (data-prop).
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
        // Não inicia drag a partir do target de edição
        target.addEventListener("mousedown", e => e.stopPropagation());
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
    });
  }

  // ---------- detail panel ----------
  function openDetail(id) {
    const item = state.find(i => i.id === id);
    if (!item) return;
    closeAllPopovers();

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
        itensMatch:    item.itensMatch,
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

  function bindLaneEvents() {
    document.querySelectorAll(".lane").forEach(lane => {
      lane.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        lane.classList.add("drop-target");
      });
      lane.addEventListener("dragleave", e => {
        if (e.target === lane) lane.classList.remove("drop-target");
      });
      lane.addEventListener("drop", e => {
        e.preventDefault();
        lane.classList.remove("drop-target");
        const id = e.dataTransfer.getData("text/plain");
        const newEtapa = lane.dataset.etapa;
        moveItem(id, newEtapa);
      });
    });
  }

  function moveItem(id, newEtapa) {
    const item = state.find(i => i.id === id);
    if (!item || item.etapa === newEtapa) return;
    item.etapa = newEtapa;
    render();
  }

  render();
})();
