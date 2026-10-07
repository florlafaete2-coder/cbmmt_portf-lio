/**
 * PAINEL DE GESTÃO DE PORTFÓLIO CBMMT
 * Engine de Kanban Interativo, Ciclos de Sprint, Editais & KPIs
 */

(function () {
  'use strict';

  // --- STATE ---
  const STORAGE_KEY = 'CBMMT_PORTFOLIO_STATE_V2';

  let state = {
    view: 'execucao', // 'execucao', 'editais', 'sprints', 'kpis', 'tabela'
    activeSprintId: 'SPRINT-01',
    theme: localStorage.getItem('CBMMT_THEME') || 'dark',
    search: '',
    filterFonte: 'all',
    filterUnidade: 'all',
    filterPrioridade: 'all',
    projetos: [],
    editais: [],
    sprints: []
  };

  // Drag and Drop Temporary State
  let draggedCardId = null;
  let draggedCardSourceType = null; // 'projeto', 'edital', 'tarefa'

  // --- COLUMN DEFINITIONS ---
  const COLUNAS_EXECUCAO = [
    { id: 'planejamento', nome: '1. Planejamento & Termos', cor: '#3b82f6', desc: 'Plano de Trabalho, SIGAdoc e Justificativa' },
    { id: 'aquisicao', nome: '2. Aquisição & Licitação', cor: '#f59e0b', desc: 'Termo de Referência, Cotações e Edital' },
    { id: 'execucao', nome: '3. Execução & Entrega', cor: '#06b6d4', desc: 'Empenho, Contrato e Recebimento Técnico' },
    { id: 'prestacao', nome: '4. Prestação de Contas', cor: '#ec4899', desc: 'Notas Fiscais, Atestes e Relatório de Cumprimento' },
    { id: 'concluido', nome: '5. Concluído & Incorporado', cor: '#10b981', desc: 'Patrimoniado e Operando nas Unidades' }
  ];

  const COLUNAS_EDITAIS = [
    { id: 'mapeamento', nome: '1. Radar & Mapeamento', cor: '#8b5cf6', desc: 'Editais identificados e oportunidades abertas' },
    { id: 'elegibilidade', nome: '2. Elegibilidade & Critérios', cor: '#3b82f6', desc: 'Análise documental, CONSEGs e contrapartida' },
    { id: 'proposta', nome: '3. Elaboração de Proposta', cor: '#f59e0b', desc: 'Notas Conceituais, 3 orçamentos e anexos' },
    { id: 'submetido', nome: '4. Submetido / Em Julgamento', cor: '#06b6d4', desc: 'Protocolado no Ministério/Juizado/Fundo' },
    { id: 'aprovado', nome: '5. Aprovado / Captação Concluída', cor: '#10b981', desc: 'Recurso deferido -> Inicia formalização' }
  ];

  const COLUNAS_SPRINTS = [
    { id: 'sprint_backlog', nome: 'Sprint Backlog', cor: '#64748b', desc: 'Tarefas priorizadas para este ciclo' },
    { id: 'a_fazer', nome: 'A Fazer (To Do)', cor: '#3b82f6', desc: 'Prontas para início da execução' },
    { id: 'em_andamento', nome: 'Em Andamento', cor: '#f59e0b', desc: 'Em elaboração pela equipe designada' },
    { id: 'em_revisao', nome: 'Revisão Técnica / DGE', cor: '#8b5cf6', desc: 'Aguardando parecer técnico ou jurídico' },
    { id: 'concluido', nome: 'Concluído na Sprint', cor: '#10b981', desc: 'Entregue com aceite e documentado' }
  ];

  // --- INITIALIZATION ---
  function init() {
    loadState();
    applyTheme(state.theme);
    setupEventListeners();
    populateFilterSelects();
    render();
  }

  function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state.projetos = parsed.projetos || [];
        state.editais = parsed.editais || [];
        state.sprints = parsed.sprints || [];
        state.activeSprintId = parsed.activeSprintId || 'SPRINT-01';
        return;
      } catch (e) {
        console.warn('Falha ao restaurar dados salvos. Usando padrão.', e);
      }
    }

    // Default from window.PORTFOLIO_DATA
    if (window.PORTFOLIO_DATA) {
      state.projetos = JSON.parse(JSON.stringify(window.PORTFOLIO_DATA.projetos || []));
      state.editais = JSON.parse(JSON.stringify(window.PORTFOLIO_DATA.editais || []));
      state.sprints = JSON.parse(JSON.stringify(window.PORTFOLIO_DATA.sprints || []));
    }
  }

  function saveState() {
    const payload = {
      projetos: state.projetos,
      editais: state.editais,
      sprints: state.sprints,
      activeSprintId: state.activeSprintId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('CBMMT_THEME', theme);
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Theme toggle
    document.getElementById('btn-theme-toggle').addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // View tabs
    document.querySelectorAll('.tab-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.view = btn.getAttribute('data-view');
        render();
      });
    });

    // Search and Filters
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value.toLowerCase().trim();
      renderCurrentViewContent();
    });

    document.getElementById('filter-fonte').addEventListener('change', (e) => {
      state.filterFonte = e.target.value;
      renderCurrentViewContent();
    });

    document.getElementById('filter-unidade').addEventListener('change', (e) => {
      state.filterUnidade = e.target.value;
      renderCurrentViewContent();
    });

    document.getElementById('filter-prioridade').addEventListener('change', (e) => {
      state.filterPrioridade = e.target.value;
      renderCurrentViewContent();
    });

    // Modals
    document.getElementById('btn-new-item').addEventListener('click', openNewItemModal);
    document.getElementById('btn-github-guide').addEventListener('click', () => openModal('modal-github-guide'));
    document.getElementById('btn-export').addEventListener('click', () => openModal('modal-backup'));

    // Modal Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
    });

    // Export Actions
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    document.getElementById('btn-import-json').addEventListener('click', () => document.getElementById('file-import-input').click());
    document.getElementById('file-import-input').addEventListener('change', handleImportJSON);
    document.getElementById('btn-reset-data').addEventListener('click', resetToDefaultData);

    // New item form submission
    document.getElementById('form-new-item').addEventListener('submit', handleNewItemSubmit);
  }

  // --- POPULATE FILTERS ---
  function populateFilterSelects() {
    const fontesSet = new Set();
    const unidadesSet = new Set();

    state.projetos.forEach(p => {
      if (p.patrocinador) fontesSet.add(p.patrocinador);
      if (p.unidade) unidadesSet.add(p.unidade);
    });

    state.editais.forEach(e => {
      if (e.orgao) fontesSet.add(e.orgao);
      if (e.abrangencia) unidadesSet.add(e.abrangencia);
    });

    const fonteSelect = document.getElementById('filter-fonte');
    fonteSelect.innerHTML = '<option value="all">Todas as Fontes / Órgãos</option>';
    Array.from(fontesSet).sort().forEach(f => {
      fonteSelect.innerHTML += `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`;
    });

    const unidSelect = document.getElementById('filter-unidade');
    unidSelect.innerHTML = '<option value="all">Todas as Unidades / Regiões</option>';
    Array.from(unidadesSet).sort().forEach(u => {
      unidSelect.innerHTML += `<option value="${escapeHtml(u)}">${escapeHtml(u)}</option>`;
    });
  }

  // --- RENDER ROUTER ---
  function render() {
    updateTabBadges();
    updateControlsBarVisibility();
    renderCurrentViewContent();
  }

  function updateTabBadges() {
    const badgeExec = document.getElementById('badge-count-exec');
    const badgeEdit = document.getElementById('badge-count-edit');
    const badgeSprint = document.getElementById('badge-count-sprint');

    if (badgeExec) badgeExec.textContent = state.projetos.length;
    if (badgeEdit) badgeEdit.textContent = state.editais.length;
    if (badgeSprint) {
      const activeSprint = state.sprints.find(s => s.id === state.activeSprintId);
      badgeSprint.textContent = activeSprint ? activeSprint.tarefas.length : 0;
    }
  }

  function updateControlsBarVisibility() {
    const sprintBanner = document.getElementById('sprint-banner-section');
    if (state.view === 'sprints') {
      sprintBanner.style.display = 'block';
      renderSprintBanner();
    } else {
      sprintBanner.style.display = 'none';
    }
  }

  function renderCurrentViewContent() {
    const container = document.getElementById('view-content-root');
    container.innerHTML = '';

    if (state.view === 'execucao') {
      renderKanbanExecucao(container);
    } else if (state.view === 'editais') {
      renderKanbanEditais(container);
    } else if (state.view === 'sprints') {
      renderKanbanSprints(container);
    } else if (state.view === 'kpis') {
      renderKPIsView(container);
    } else if (state.view === 'tabela') {
      renderTableView(container);
    }

    updateSummaryStats();
  }

  // --- SUMMARY STATS IN HEADER ---
  function updateSummaryStats() {
    const stat1 = document.getElementById('stat-total-captado');
    const stat2 = document.getElementById('stat-total-editais');
    const stat3 = document.getElementById('stat-total-projetos');

    const totalR$ = state.projetos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    const totalEditaisR$ = state.editais.reduce((acc, e) => acc + (e.valor || 0), 0);

    if (stat1) stat1.textContent = formatCurrency(totalR$);
    if (stat2) stat2.textContent = `${state.editais.length} (${formatCurrency(totalEditaisR$)})`;
    if (stat3) stat3.textContent = `${state.projetos.length} itens`;
  }

  // ==========================================
  // VIEW 1: KANBAN PROJETOS EM EXECUÇÃO
  // ==========================================
  function renderKanbanExecucao(container) {
    const filteredProjetos = filterList(state.projetos, (item) => {
      const matchSearch = !state.search ||
        item.titulo.toLowerCase().includes(state.search) ||
        (item.patrocinador && item.patrocinador.toLowerCase().includes(state.search)) ||
        (item.unidade && item.unidade.toLowerCase().includes(state.search)) ||
        item.id.toLowerCase().includes(state.search);

      const matchFonte = state.filterFonte === 'all' || item.patrocinador === state.filterFonte;
      const matchUnidade = state.filterUnidade === 'all' || item.unidade === state.filterUnidade;
      const matchPrio = state.filterPrioridade === 'all' || item.prioridade === state.filterPrioridade;

      return matchSearch && matchFonte && matchUnidade && matchPrio;
    });

    const board = document.createElement('div');
    board.className = 'kanban-board';

    COLUNAS_EXECUCAO.forEach(col => {
      const colItems = filteredProjetos.filter(p => p.coluna === col.id);
      const totalColValor = colItems.reduce((acc, item) => acc + (item.valorTotal || 0), 0);

      const colEl = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.setAttribute('data-col-id', col.id);
      colEl.setAttribute('data-col-type', 'projeto');

      colEl.innerHTML = `
        <div class="col-header">
          <div class="col-title-row">
            <div class="col-title-group">
              <span class="col-indicator" style="background-color: ${col.cor}"></span>
              <h3 class="col-title">${escapeHtml(col.nome)}</h3>
            </div>
            <span class="col-badge">${colItems.length}</span>
          </div>
          <div class="col-sub-metrics">
            <span>${escapeHtml(col.desc)}</span>
            <span class="col-total-val">${formatCurrency(totalColValor)}</span>
          </div>
        </div>
        <div class="col-cards-container" id="col-cards-${col.id}"></div>
      `;

      const cardsContainer = colEl.querySelector('.col-cards-container');

      if (colItems.length === 0) {
        cardsContainer.innerHTML = `
          <div class="empty-col-state">
            <span>Nenhum projeto nesta fase</span>
          </div>
        `;
      } else {
        colItems.forEach(item => {
          cardsContainer.appendChild(createProjetoCard(item));
        });
      }

      setupDropZone(colEl, 'projeto');
      board.appendChild(colEl);
    });

    container.appendChild(board);
  }

  function createProjetoCard(item) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.id = `card-${item.id}`;
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-type', 'projeto');

    const prioClass = `tag-${(item.prioridade || 'media').toLowerCase()}`;

    card.innerHTML = `
      <div class="card-top">
        <span class="card-id">${escapeHtml(item.id)}</span>
        <div class="card-tags">
          <span class="tag ${prioClass}">${escapeHtml(item.prioridade || 'Média')}</span>
          <span class="tag tag-fonte">${escapeHtml(truncate(item.patrocinador || 'Fonte', 16))}</span>
        </div>
      </div>
      <h4 class="card-title" title="${escapeHtml(item.titulo)}">${escapeHtml(item.titulo)}</h4>
      <div class="card-meta-grid">
        <div class="card-meta-cell">
          <span class="meta-label">Valor Total</span>
          <span class="meta-val val-money">${formatCurrency(item.valorTotal || 0)}</span>
        </div>
        <div class="card-meta-cell">
          <span class="meta-label">Unidade Atendida</span>
          <span class="meta-val" title="${escapeHtml(item.unidade || 'CBMMT')}">${escapeHtml(truncate(item.unidade || 'CBMMT', 18))}</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-owner" title="${escapeHtml(item.gerente || 'DGE')}">
          <span>👤 ${escapeHtml(truncate(item.gerente || 'DGE', 16))}</span>
        </div>
        <div class="card-actions-quick">
          <button class="btn-card-quick" title="Ver Detalhes" onclick="window.cbmmtApp.openDetailModal('${item.id}', 'projeto')">🔍</button>
          <button class="btn-card-quick" title="Mover para Próxima Fase" onclick="window.cbmmtApp.moveNext('${item.id}', 'projeto')">➡️</button>
        </div>
      </div>
    `;

    setupDragEvents(card);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-card-quick')) {
        openDetailModal(item.id, 'projeto');
      }
    });

    return card;
  }

  // ==========================================
  // VIEW 2: KANBAN EDITAIS & OPORTUNIDADES
  // ==========================================
  function renderKanbanEditais(container) {
    const filteredEditais = filterList(state.editais, (item) => {
      const matchSearch = !state.search ||
        item.titulo.toLowerCase().includes(state.search) ||
        item.orgao.toLowerCase().includes(state.search) ||
        item.objeto.toLowerCase().includes(state.search) ||
        item.id.toLowerCase().includes(state.search);

      const matchFonte = state.filterFonte === 'all' || item.orgao === state.filterFonte;
      const matchUnidade = state.filterUnidade === 'all' || item.abrangencia === state.filterUnidade;
      const matchPrio = state.filterPrioridade === 'all' || item.prioridade === state.filterPrioridade;

      return matchSearch && matchFonte && matchUnidade && matchPrio;
    });

    const board = document.createElement('div');
    board.className = 'kanban-board';

    COLUNAS_EDITAIS.forEach(col => {
      const colItems = filteredEditais.filter(e => e.coluna === col.id);
      const totalColValor = colItems.reduce((acc, item) => acc + (item.valor || 0), 0);

      const colEl = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.setAttribute('data-col-id', col.id);
      colEl.setAttribute('data-col-type', 'edital');

      colEl.innerHTML = `
        <div class="col-header">
          <div class="col-title-row">
            <div class="col-title-group">
              <span class="col-indicator" style="background-color: ${col.cor}"></span>
              <h3 class="col-title">${escapeHtml(col.nome)}</h3>
            </div>
            <span class="col-badge">${colItems.length}</span>
          </div>
          <div class="col-sub-metrics">
            <span>${escapeHtml(col.desc)}</span>
            <span class="col-total-val">${formatCurrency(totalColValor)}</span>
          </div>
        </div>
        <div class="col-cards-container" id="col-cards-edital-${col.id}"></div>
      `;

      const cardsContainer = colEl.querySelector('.col-cards-container');

      if (colItems.length === 0) {
        cardsContainer.innerHTML = `
          <div class="empty-col-state">
            <span>Nenhuma oportunidade nesta fase</span>
          </div>
        `;
      } else {
        colItems.forEach(item => {
          cardsContainer.appendChild(createEditalCard(item));
        });
      }

      setupDropZone(colEl, 'edital');
      board.appendChild(colEl);
    });

    container.appendChild(board);
  }

  function createEditalCard(item) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.id = `card-${item.id}`;
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-type', 'edital');

    const prioClass = `tag-${(item.prioridade || 'media').toLowerCase()}`;
    const isCOP31 = item.id.includes('COP') || (item.titulo && item.titulo.includes('COP 31'));

    card.innerHTML = `
      <div class="card-top">
        <span class="card-id">${escapeHtml(item.id)}</span>
        <div class="card-tags">
          ${isCOP31 ? '<span class="tag" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981;">🌿 COP 31</span>' : ''}
          <span class="tag ${prioClass}">${escapeHtml(item.prioridade || 'Média')}</span>
        </div>
      </div>
      <h4 class="card-title" title="${escapeHtml(item.titulo)}">${escapeHtml(item.titulo)}</h4>
      <div class="card-meta-grid">
        <div class="card-meta-cell">
          <span class="meta-label">Órgão / Financiador</span>
          <span class="meta-val" title="${escapeHtml(item.orgao)}">${escapeHtml(truncate(item.orgao, 18))}</span>
        </div>
        <div class="card-meta-cell">
          <span class="meta-label">Valor Teto</span>
          <span class="meta-val val-money">${item.valor > 0 ? formatCurrency(item.valor) : escapeHtml(item.valorFormatado || 'A definir')}</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-owner" title="Prazo: ${escapeHtml(item.prazo || 'Fluxo Contínuo')}">
          <span>📅 ${escapeHtml(truncate(item.prazo || 'Fluxo Contínuo', 18))}</span>
        </div>
        <div class="card-actions-quick">
          <button class="btn-card-quick" title="Ver Detalhes" onclick="window.cbmmtApp.openDetailModal('${item.id}', 'edital')">🔍</button>
          <button class="btn-card-quick" title="Mover para Próxima Fase" onclick="window.cbmmtApp.moveNext('${item.id}', 'edital')">➡️</button>
        </div>
      </div>
    `;

    setupDragEvents(card);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-card-quick')) {
        openDetailModal(item.id, 'edital');
      }
    });

    return card;
  }

  // ==========================================
  // VIEW 3: MODELO DE SPRINTS (GESTÃO ÁGIL)
  // ==========================================
  function renderSprintBanner() {
    const activeSprint = state.sprints.find(s => s.id === state.activeSprintId) || state.sprints[0];
    if (!activeSprint) return;

    const selectSprint = document.getElementById('sprint-selector');
    if (selectSprint) {
      selectSprint.innerHTML = state.sprints.map(s => `
        <option value="${s.id}" ${s.id === activeSprint.id ? 'selected' : ''}>
          ${escapeHtml(s.codigo)}: ${escapeHtml(s.nome)}
        </option>
      `).join('');

      selectSprint.onchange = (e) => {
        state.activeSprintId = e.target.value;
        saveState();
        render();
      };
    }

    const titleEl = document.getElementById('sprint-banner-title');
    const periodEl = document.getElementById('sprint-banner-period');
    const metaEl = document.getElementById('sprint-banner-meta');
    const codeEl = document.getElementById('sprint-banner-code');

    if (titleEl) titleEl.textContent = activeSprint.nome;
    if (periodEl) periodEl.textContent = `Período: ${activeSprint.periodo}`;
    if (metaEl) metaEl.textContent = `🎯 Meta: ${activeSprint.meta}`;
    if (codeEl) codeEl.textContent = activeSprint.codigo;

    // Calculate Sprint Progress
    const totalTarefas = activeSprint.tarefas.length;
    const concluidas = activeSprint.tarefas.filter(t => t.coluna === 'concluido').length;
    const totalPontos = activeSprint.tarefas.reduce((acc, t) => acc + (t.pontos || 0), 0);
    const concluidosPontos = activeSprint.tarefas.filter(t => t.coluna === 'concluido').reduce((acc, t) => acc + (t.pontos || 0), 0);
    const perc = totalPontos > 0 ? Math.round((concluidosPontos / totalPontos) * 100) : (totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0);

    const fillEl = document.getElementById('sprint-progress-fill');
    const textEl = document.getElementById('sprint-progress-text');
    const ptsEl = document.getElementById('sprint-points-text');

    if (fillEl) fillEl.style.width = `${perc}%`;
    if (textEl) textEl.textContent = `${perc}% Concluído`;
    if (ptsEl) ptsEl.textContent = `${concluidosPontos}/${totalPontos} pts (${concluidas}/${totalTarefas} tarefas)`;
  }

  function renderKanbanSprints(container) {
    const activeSprint = state.sprints.find(s => s.id === state.activeSprintId) || state.sprints[0];
    if (!activeSprint) {
      container.innerHTML = '<div class="empty-col-state">Nenhuma sprint encontrada.</div>';
      return;
    }

    const filteredTarefas = filterList(activeSprint.tarefas, (item) => {
      const matchSearch = !state.search ||
        item.titulo.toLowerCase().includes(state.search) ||
        item.responsavel.toLowerCase().includes(state.search) ||
        item.unidade.toLowerCase().includes(state.search);

      const matchPrio = state.filterPrioridade === 'all' || item.prioridade === state.filterPrioridade;
      return matchSearch && matchPrio;
    });

    const board = document.createElement('div');
    board.className = 'kanban-board';

    COLUNAS_SPRINTS.forEach(col => {
      const colItems = filteredTarefas.filter(t => t.coluna === col.id);
      const colPontos = colItems.reduce((acc, t) => acc + (t.pontos || 0), 0);

      const colEl = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.setAttribute('data-col-id', col.id);
      colEl.setAttribute('data-col-type', 'tarefa');

      colEl.innerHTML = `
        <div class="col-header">
          <div class="col-title-row">
            <div class="col-title-group">
              <span class="col-indicator" style="background-color: ${col.cor}"></span>
              <h3 class="col-title">${escapeHtml(col.nome)}</h3>
            </div>
            <span class="col-badge">${colItems.length}</span>
          </div>
          <div class="col-sub-metrics">
            <span>${escapeHtml(col.desc)}</span>
            <span class="col-total-val" style="color: var(--cbm-cyan);">${colPontos} Story Points</span>
          </div>
        </div>
        <div class="col-cards-container" id="col-cards-sprint-${col.id}"></div>
      `;

      const cardsContainer = colEl.querySelector('.col-cards-container');

      if (colItems.length === 0) {
        cardsContainer.innerHTML = `
          <div class="empty-col-state">
            <span>Nenhuma tarefa aqui</span>
          </div>
        `;
      } else {
        colItems.forEach(item => {
          cardsContainer.appendChild(createSprintTaskCard(item));
        });
      }

      setupDropZone(colEl, 'tarefa');
      board.appendChild(colEl);
    });

    container.appendChild(board);
  }

  function createSprintTaskCard(item) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.id = `card-${item.id}`;
    card.setAttribute('data-id', item.id);
    card.setAttribute('data-type', 'tarefa');

    const prioClass = `tag-${(item.prioridade || 'media').toLowerCase()}`;

    card.innerHTML = `
      <div class="card-top">
        <span class="card-id">${escapeHtml(item.id)}</span>
        <div class="card-tags">
          <span class="tag" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4; font-weight: 800;">${item.pontos || 3} SP</span>
          <span class="tag ${prioClass}">${escapeHtml(item.prioridade || 'Média')}</span>
        </div>
      </div>
      <h4 class="card-title" title="${escapeHtml(item.titulo)}">${escapeHtml(item.titulo)}</h4>
      <div class="card-meta-grid">
        <div class="card-meta-cell">
          <span class="meta-label">Responsável</span>
          <span class="meta-val">👤 ${escapeHtml(truncate(item.responsavel || 'Equipe', 18))}</span>
        </div>
        <div class="card-meta-cell">
          <span class="meta-label">Unidade</span>
          <span class="meta-val">🏢 ${escapeHtml(truncate(item.unidade || 'CBMMT', 18))}</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-owner">
          <span>📅 Prazo: ${escapeHtml(item.prazo || 'Nesta Sprint')}</span>
        </div>
        <div class="card-actions-quick">
          <button class="btn-card-quick" title="Ver Detalhes" onclick="window.cbmmtApp.openDetailModal('${item.id}', 'tarefa')">🔍</button>
          <button class="btn-card-quick" title="Avançar Tarefa" onclick="window.cbmmtApp.moveNext('${item.id}', 'tarefa')">➡️</button>
        </div>
      </div>
    `;

    setupDragEvents(card);
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.btn-card-quick')) {
        openDetailModal(item.id, 'tarefa');
      }
    });

    return card;
  }

  // ==========================================
  // VIEW 4: DASHBOARD EXECUTIVO & KPIS
  // ==========================================
  function renderKPIsView(container) {
    const totalCaptado = state.projetos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    const totalExecutado = state.projetos.reduce((acc, p) => acc + (p.valorExecutado || 0), 0);
    const totalEditais = state.editais.reduce((acc, e) => acc + (e.valor || 0), 0);

    const wrap = document.createElement('div');
    wrap.className = 'kpis-view-container';

    wrap.innerHTML = `
      <div class="metrics-cards-grid">
        <div class="metric-card accent-green">
          <div class="metric-head">
            <span>RECURSOS CAPTADOS TOTAL</span>
            <div class="metric-icon">💰</div>
          </div>
          <div class="metric-number">${formatCurrency(totalCaptado)}</div>
          <div class="metric-sub">${state.projetos.length} projetos em portfólio</div>
        </div>

        <div class="metric-card accent-blue">
          <div class="metric-head">
            <span>EXECUTADO / LIQUIDADO</span>
            <div class="metric-icon">⚡</div>
          </div>
          <div class="metric-number">${formatCurrency(totalExecutado)}</div>
          <div class="metric-sub">${totalCaptado > 0 ? Math.round((totalExecutado / totalCaptado) * 100) : 0}% taxa de execução financeira</div>
        </div>

        <div class="metric-card accent-cyan">
          <div class="metric-head">
            <span>EDITAIS & OPORTUNIDADES</span>
            <div class="metric-icon">🎯</div>
          </div>
          <div class="metric-number">${formatCurrency(totalEditais)}</div>
          <div class="metric-sub">${state.editais.length} chamadas e editais mapeados</div>
        </div>

        <div class="metric-card accent-gold">
          <div class="metric-head">
            <span>CICLOS ÁGEIS / SPRINTS</span>
            <div class="metric-icon">🚀</div>
          </div>
          <div class="metric-number">${state.sprints.length} Sprints</div>
          <div class="metric-sub">Foco: CONSEGs, COP 31 e Prestação de Contas</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <h4>Distribuição dos Projetos por Fase do Funil</h4>
          </div>
          <div class="chart-canvas-area" id="chart-funil-projetos"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h4>Recursos por Fonte Financiadora (R$)</h4>
          </div>
          <div class="chart-canvas-area" id="chart-fontes-recursos"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h4>Funil de Editais e Chamadas Públicas</h4>
          </div>
          <div class="chart-canvas-area" id="chart-editais-status"></div>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h4>Progresso de Entrega das Sprints</h4>
          </div>
          <div class="chart-canvas-area" id="chart-sprints-progresso"></div>
        </div>
      </div>
    `;

    container.appendChild(wrap);

    // Draw SVG charts
    setTimeout(() => {
      drawFunilProjetosChart();
      drawFontesRecursosChart();
      drawEditaisStatusChart();
      drawSprintsProgressoChart();
    }, 50);
  }

  // --- SVG CHART RENDERERS ---
  function drawFunilProjetosChart() {
    const el = document.getElementById('chart-funil-projetos');
    if (!el) return;

    const data = COLUNAS_EXECUCAO.map(col => {
      const count = state.projetos.filter(p => p.coluna === col.id).length;
      return { label: col.nome.split('.')[1] || col.nome, count, cor: col.cor };
    });

    const max = Math.max(...data.map(d => d.count), 1);
    const barsHtml = data.map(d => {
      const width = Math.round((d.count / max) * 100);
      return `
        <div style="margin-bottom: 0.85rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;">
            <span style="font-weight:600; color:var(--text-primary);">${escapeHtml(d.label)}</span>
            <span style="font-weight:700; color:${d.cor};">${d.count} projetos</span>
          </div>
          <div style="height:12px; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden;">
            <div style="width:${width}%; height:100%; background:${d.cor}; border-radius:999px; transition:width 0.5s ease;"></div>
          </div>
        </div>
      `;
    }).join('');

    el.innerHTML = `<div style="width:100%; padding:0.5rem;">${barsHtml}</div>`;
  }

  function drawFontesRecursosChart() {
    const el = document.getElementById('chart-fontes-recursos');
    if (!el) return;

    // Group by patrocinador
    const fontes = {};
    state.projetos.forEach(p => {
      const f = p.patrocinador || 'Outros';
      let cleanF = f;
      if (f.includes('FNSP')) cleanF = 'FNSP (Fundo Nac. Seg. Pública)';
      else if (f.includes('estadual')) cleanF = 'Emendas Parlamentares Estaduais';
      else if (f.includes('federal individual') || f.includes('Bancada')) cleanF = 'Emendas Parlamentares Federais';
      else if (f.includes('BAPRE') || f.includes('Ministério Público')) cleanF = 'MPE (BAPRE)';
      else if (f.includes('SEMA')) cleanF = 'Termo de Cooperação SEMA';
      else cleanF = 'Outros Fundos / Judiciário';

      fontes[cleanF] = (fontes[cleanF] || 0) + (p.valorTotal || 0);
    });

    const sorted = Object.entries(fontes).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(...sorted.map(s => s[1]), 1);

    const colors = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const html = sorted.slice(0, 5).map((s, idx) => {
      const width = Math.round((s[1] / maxVal) * 100);
      const color = colors[idx % colors.length];
      return `
        <div style="margin-bottom: 0.85rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;">
            <span style="font-weight:600; color:var(--text-primary); max-width:65%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(s[0])}</span>
            <span style="font-weight:700; color:${color};">${formatCurrency(s[1])}</span>
          </div>
          <div style="height:12px; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden;">
            <div style="width:${width}%; height:100%; background:${color}; border-radius:999px; transition:width 0.5s ease;"></div>
          </div>
        </div>
      `;
    }).join('');

    el.innerHTML = `<div style="width:100%; padding:0.5rem;">${html}</div>`;
  }

  function drawEditaisStatusChart() {
    const el = document.getElementById('chart-editais-status');
    if (!el) return;

    const data = COLUNAS_EDITAIS.map(col => {
      const count = state.editais.filter(e => e.coluna === col.id).length;
      return { label: col.nome.split('.')[1] || col.nome, count, cor: col.cor };
    });

    const max = Math.max(...data.map(d => d.count), 1);
    const barsHtml = data.map(d => {
      const width = Math.round((d.count / max) * 100);
      return `
        <div style="margin-bottom: 0.85rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem;">
            <span style="font-weight:600; color:var(--text-primary);">${escapeHtml(d.label)}</span>
            <span style="font-weight:700; color:${d.cor};">${d.count} editais</span>
          </div>
          <div style="height:12px; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden;">
            <div style="width:${width}%; height:100%; background:${d.cor}; border-radius:999px; transition:width 0.5s ease;"></div>
          </div>
        </div>
      `;
    }).join('');

    el.innerHTML = `<div style="width:100%; padding:0.5rem;">${barsHtml}</div>`;
  }

  function drawSprintsProgressoChart() {
    const el = document.getElementById('chart-sprints-progresso');
    if (!el) return;

    const html = state.sprints.map(s => {
      const total = s.tarefas.length;
      const done = s.tarefas.filter(t => t.coluna === 'concluido').length;
      const perc = total > 0 ? Math.round((done / total) * 100) : 0;
      return `
        <div style="margin-bottom: 1.15rem; background:rgba(0,0,0,0.15); padding:0.75rem; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <div>
              <span style="font-size:0.8rem; font-weight:700; color:var(--text-primary);">${escapeHtml(s.codigo)}</span>
              <span style="font-size:0.725rem; color:var(--text-secondary); margin-left:0.5rem;">${escapeHtml(s.periodo)}</span>
            </div>
            <span style="font-size:0.775rem; font-weight:800; color:var(--cbm-green);">${perc}%</span>
          </div>
          <div style="font-size:0.725rem; color:var(--text-secondary); margin-bottom:0.4rem;">${escapeHtml(s.nome)}</div>
          <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
            <div style="width:${perc}%; height:100%; background:linear-gradient(90deg, #06b6d4, #10b981); border-radius:999px;"></div>
          </div>
        </div>
      `;
    }).join('');

    el.innerHTML = `<div style="width:100%; padding:0.25rem;">${html}</div>`;
  }

  // ==========================================
  // VIEW 5: TABELA MATRIZ GERAL
  // ==========================================
  function renderTableView(container) {
    const wrap = document.createElement('div');
    wrap.className = 'table-view-container';

    wrap.innerHTML = `
      <div class="table-toolbar">
        <h4 style="font-size: 1rem; font-weight: 700;">Visão Geral do Portfólio CBMMT (${state.projetos.length} itens)</h4>
        <button class="btn btn-secondary" onclick="window.cbmmtApp.exportCSV()">📥 Baixar CSV</button>
      </div>
      <div class="table-wrapper">
        <table class="portfolio-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título / Objeto</th>
              <th>Fonte / Patrocinador</th>
              <th>Unidade Atendida</th>
              <th>Valor Total</th>
              <th>Fase Atual</th>
              <th>Prioridade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${state.projetos.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.id)}</strong></td>
                <td><div style="max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(p.titulo)}">${escapeHtml(p.titulo)}</div></td>
                <td>${escapeHtml(truncate(p.patrocinador || 'CBM', 22))}</td>
                <td>${escapeHtml(truncate(p.unidade || 'Geral', 20))}</td>
                <td style="color:var(--cbm-green); font-weight:700;">${formatCurrency(p.valorTotal || 0)}</td>
                <td><span class="tag" style="background:rgba(255,255,255,0.08);">${escapeHtml(getColumnName('execucao', p.coluna))}</span></td>
                <td><span class="tag tag-${(p.prioridade || 'media').toLowerCase()}">${escapeHtml(p.prioridade || 'Média')}</span></td>
                <td>
                  <button class="btn-card-quick" title="Ver" onclick="window.cbmmtApp.openDetailModal('${p.id}', 'projeto')">🔍</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(wrap);
  }

  // ==========================================
  // DRAG AND DROP HANDLERS (HTML5 NATIVE)
  // ==========================================
  function setupDragEvents(card) {
    card.addEventListener('dragstart', (e) => {
      draggedCardId = card.getAttribute('data-id');
      draggedCardSourceType = card.getAttribute('data-type');
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', draggedCardId);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.kanban-col').forEach(col => col.classList.remove('drag-over'));
      draggedCardId = null;
      draggedCardSourceType = null;
    });
  }

  function setupDropZone(colEl, expectedType) {
    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedCardSourceType === expectedType) {
        e.dataTransfer.dropEffect = 'move';
        colEl.classList.add('drag-over');
      }
    });

    colEl.addEventListener('dragleave', (e) => {
      if (!colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('drag-over');
      }
    });

    colEl.addEventListener('drop', (e) => {
      e.preventDefault();
      colEl.classList.remove('drag-over');

      const targetColId = colEl.getAttribute('data-col-id');
      if (!draggedCardId || !targetColId) return;

      if (expectedType === 'projeto') {
        const item = state.projetos.find(p => p.id === draggedCardId);
        if (item && item.coluna !== targetColId) {
          item.coluna = targetColId;
          saveState();
          render();
          showToast(`Projeto ${item.id} movido para ${getColumnName('execucao', targetColId)}`);
        }
      } else if (expectedType === 'edital') {
        const item = state.editais.find(ed => ed.id === draggedCardId);
        if (item && item.coluna !== targetColId) {
          item.coluna = targetColId;
          saveState();
          render();
          showToast(`Edital ${item.id} movido para ${getColumnName('editais', targetColId)}`);
        }
      } else if (expectedType === 'tarefa') {
        const activeSprint = state.sprints.find(s => s.id === state.activeSprintId);
        if (activeSprint) {
          const tarefa = activeSprint.tarefas.find(t => t.id === draggedCardId);
          if (tarefa && tarefa.coluna !== targetColId) {
            tarefa.coluna = targetColId;
            saveState();
            render();
            showToast(`Tarefa ${tarefa.id} atualizada.`);
          }
        }
      }
    });
  }

  // Move to next column action button helper
  function moveNext(id, type) {
    if (type === 'projeto') {
      const item = state.projetos.find(p => p.id === id);
      if (!item) return;
      const idx = COLUNAS_EXECUCAO.findIndex(c => c.id === item.coluna);
      if (idx < COLUNAS_EXECUCAO.length - 1) {
        item.coluna = COLUNAS_EXECUCAO[idx + 1].id;
        saveState();
        render();
        showToast(`Projeto movido para ${COLUNAS_EXECUCAO[idx + 1].nome}`);
      }
    } else if (type === 'edital') {
      const item = state.editais.find(e => e.id === id);
      if (!item) return;
      const idx = COLUNAS_EDITAIS.findIndex(c => c.id === item.coluna);
      if (idx < COLUNAS_EDITAIS.length - 1) {
        item.coluna = COLUNAS_EDITAIS[idx + 1].id;
        saveState();
        render();
        showToast(`Edital movido para ${COLUNAS_EDITAIS[idx + 1].nome}`);
      }
    } else if (type === 'tarefa') {
      const activeSprint = state.sprints.find(s => s.id === state.activeSprintId);
      if (!activeSprint) return;
      const tarefa = activeSprint.tarefas.find(t => t.id === id);
      if (!tarefa) return;
      const idx = COLUNAS_SPRINTS.findIndex(c => c.id === tarefa.coluna);
      if (idx < COLUNAS_SPRINTS.length - 1) {
        tarefa.coluna = COLUNAS_SPRINTS[idx + 1].id;
        saveState();
        render();
        showToast(`Tarefa avançou para ${COLUNAS_SPRINTS[idx + 1].nome}`);
      }
    }
  }

  // ==========================================
  // DETAIL MODAL
  // ==========================================
  function openDetailModal(id, type) {
    const modal = document.getElementById('modal-detail');
    const titleEl = document.getElementById('modal-detail-title');
    const bodyEl = document.getElementById('modal-detail-body');

    let item = null;
    let html = '';

    if (type === 'projeto') {
      item = state.projetos.find(p => p.id === id);
      if (!item) return;
      titleEl.innerHTML = `📌 Projeto: ${escapeHtml(item.id)}`;
      html = `
        <div class="detail-box-desc">
          <strong style="color:var(--text-primary); font-size:1rem; display:block; margin-bottom:0.5rem;">${escapeHtml(item.titulo)}</strong>
          <p>${escapeHtml(item.observacao || 'Projeto estratégico do CBMMT cadastrado no banco de projetos e captação.')}</p>
        </div>
        <div class="detail-meta-grid">
          <div><div class="detail-item-title">Patrocinador / Fonte</div><div class="detail-item-val">${escapeHtml(item.patrocinador || 'CBM')}</div></div>
          <div><div class="detail-item-title">Valor Total</div><div class="detail-item-val" style="color:var(--cbm-green);">${formatCurrency(item.valorTotal || 0)}</div></div>
          <div><div class="detail-item-title">Unidade Atendida</div><div class="detail-item-val">${escapeHtml(item.unidade || 'CBMMT')}</div></div>
          <div><div class="detail-item-title">Gerente / Responsável</div><div class="detail-item-val">${escapeHtml(item.gerente || 'DGE')}</div></div>
          <div><div class="detail-item-title">Fase no Kanban</div><div class="detail-item-val">${escapeHtml(getColumnName('execucao', item.coluna))}</div></div>
          <div><div class="detail-item-title">SIGAdoc / Processo</div><div class="detail-item-val">${escapeHtml(item.sigadoc || 'Processo em trâmite')}</div></div>
          <div><div class="detail-item-title">Prioridade</div><div class="detail-item-val">${escapeHtml(item.prioridade || 'Média')}</div></div>
          <div><div class="detail-item-title">Ano de Captação</div><div class="detail-item-val">${escapeHtml(item.ano || '2025')}</div></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
          <button class="btn btn-secondary" onclick="window.cbmmtApp.deleteItem('${item.id}', 'projeto')">🗑️ Excluir Item</button>
        </div>
      `;
    } else if (type === 'edital') {
      item = state.editais.find(e => e.id === id);
      if (!item) return;
      titleEl.innerHTML = `🎯 Edital / Oportunidade: ${escapeHtml(item.id)}`;
      html = `
        <div class="detail-box-desc">
          <strong style="color:var(--text-primary); font-size:1rem; display:block; margin-bottom:0.5rem;">${escapeHtml(item.titulo)}</strong>
          <p><strong>Objeto:</strong> ${escapeHtml(item.objeto || 'Não informado.')}</p>
        </div>
        <div class="detail-meta-grid">
          <div><div class="detail-item-title">Órgão Fomentador</div><div class="detail-item-val">${escapeHtml(item.orgao || 'Fundo')}</div></div>
          <div><div class="detail-item-title">Valor Estimado</div><div class="detail-item-val" style="color:var(--cbm-green);">${item.valor > 0 ? formatCurrency(item.valor) : escapeHtml(item.valorFormatado || 'A definir')}</div></div>
          <div><div class="detail-item-title">Abrangência</div><div class="detail-item-val">${escapeHtml(item.abrangencia || 'Mato Grosso')}</div></div>
          <div><div class="detail-item-title">Prazo de Apresentação</div><div class="detail-item-val">${escapeHtml(item.prazo || 'Fluxo Contínuo')}</div></div>
          <div><div class="detail-item-title">Status Atual</div><div class="detail-item-val">${escapeHtml(item.status || 'Em prospecção')}</div></div>
          <div><div class="detail-item-title">Fase no Funil</div><div class="detail-item-val">${escapeHtml(getColumnName('editais', item.coluna))}</div></div>
          <div><div class="detail-item-title">Contrapartida Exigida</div><div class="detail-item-val">${escapeHtml(item.contrapartida || 'Conforme Edital')}</div></div>
          <div><div class="detail-item-title">Eixo Temático</div><div class="detail-item-val">${escapeHtml(item.eixo || 'Defesa Civil')}</div></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
          <button class="btn btn-secondary" onclick="window.cbmmtApp.deleteItem('${item.id}', 'edital')">🗑️ Excluir Item</button>
        </div>
      `;
    } else if (type === 'tarefa') {
      const activeSprint = state.sprints.find(s => s.id === state.activeSprintId);
      if (!activeSprint) return;
      item = activeSprint.tarefas.find(t => t.id === id);
      if (!item) return;
      titleEl.innerHTML = `⚡ Tarefa da Sprint: ${escapeHtml(item.id)}`;
      html = `
        <div class="detail-box-desc">
          <strong style="color:var(--text-primary); font-size:1rem; display:block; margin-bottom:0.5rem;">${escapeHtml(item.titulo)}</strong>
          <p>Pertence à <strong>${escapeHtml(activeSprint.nome)}</strong></p>
        </div>
        <div class="detail-meta-grid">
          <div><div class="detail-item-title">Responsável</div><div class="detail-item-val">${escapeHtml(item.responsavel || 'Equipe')}</div></div>
          <div><div class="detail-item-title">Unidade</div><div class="detail-item-val">${escapeHtml(item.unidade || 'CBMMT')}</div></div>
          <div><div class="detail-item-title">Story Points</div><div class="detail-item-val" style="color:var(--cbm-cyan);">${item.pontos || 3} SP</div></div>
          <div><div class="detail-item-title">Status da Sprint</div><div class="detail-item-val">${escapeHtml(getColumnName('sprints', item.coluna))}</div></div>
          <div><div class="detail-item-title">Prazo Estimado</div><div class="detail-item-val">${escapeHtml(item.prazo || 'Nesta Sprint')}</div></div>
          <div><div class="detail-item-title">Prioridade</div><div class="detail-item-val">${escapeHtml(item.prioridade || 'Média')}</div></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
          <button class="btn btn-secondary" onclick="window.cbmmtApp.deleteItem('${item.id}', 'tarefa')">🗑️ Excluir Item</button>
        </div>
      `;
    }

    bodyEl.innerHTML = html;
    openModal('modal-detail');
  }

  function deleteItem(id, type) {
    if (!confirm('Deseja realmente excluir este item?')) return;

    if (type === 'projeto') {
      state.projetos = state.projetos.filter(p => p.id !== id);
    } else if (type === 'edital') {
      state.editais = state.editais.filter(e => e.id !== id);
    } else if (type === 'tarefa') {
      const activeSprint = state.sprints.find(s => s.id === state.activeSprintId);
      if (activeSprint) {
        activeSprint.tarefas = activeSprint.tarefas.filter(t => t.id !== id);
      }
    }

    saveState();
    closeModal('modal-detail');
    render();
    showToast('Item removido com sucesso.');
  }

  // ==========================================
  // CREATE NEW ITEM MODAL
  // ==========================================
  function openNewItemModal() {
    const typeSelect = document.getElementById('new-item-type');
    typeSelect.value = state.view === 'editais' ? 'edital' : (state.view === 'sprints' ? 'tarefa' : 'projeto');
    updateFormFieldsForType(typeSelect.value);

    typeSelect.onchange = () => updateFormFieldsForType(typeSelect.value);
    openModal('modal-new-item');
  }

  function updateFormFieldsForType(type) {
    const colSelect = document.getElementById('new-item-column');
    colSelect.innerHTML = '';

    if (type === 'projeto') {
      COLUNAS_EXECUCAO.forEach(c => {
        colSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.nome)}</option>`;
      });
      document.getElementById('group-valor').style.display = 'block';
      document.getElementById('label-fonte').textContent = 'Patrocinador / Fonte:';
      document.getElementById('label-unidade').textContent = 'Unidade Atendida:';
    } else if (type === 'edital') {
      COLUNAS_EDITAIS.forEach(c => {
        colSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.nome)}</option>`;
      });
      document.getElementById('group-valor').style.display = 'block';
      document.getElementById('label-fonte').textContent = 'Órgão Fomentador:';
      document.getElementById('label-unidade').textContent = 'Área / Abrangência:';
    } else if (type === 'tarefa') {
      COLUNAS_SPRINTS.forEach(c => {
        colSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.nome)}</option>`;
      });
      document.getElementById('group-valor').style.display = 'none';
      document.getElementById('label-fonte').textContent = 'Responsável:';
      document.getElementById('label-unidade').textContent = 'Unidade:';
    }
  }

  function handleNewItemSubmit(e) {
    e.preventDefault();

    const type = document.getElementById('new-item-type').value;
    const titulo = document.getElementById('new-item-titulo').value.trim();
    const coluna = document.getElementById('new-item-column').value;
    const prioridade = document.getElementById('new-item-prioridade').value;
    const fonte = document.getElementById('new-item-fonte').value.trim() || 'CBMMT';
    const unidade = document.getElementById('new-item-unidade').value.trim() || 'Geral';
    const valorStr = document.getElementById('new-item-valor').value;
    const desc = document.getElementById('new-item-desc').value.trim();

    const valor = parseFloat(valorStr) || 0;

    if (!titulo) {
      alert('Por favor, informe o título.');
      return;
    }

    if (type === 'projeto') {
      const nextId = `PROJ-${(state.projetos.length + 1).toString().padStart(3, '0')}`;
      state.projetos.unshift({
        id: nextId,
        titulo,
        coluna,
        patrocinador: fonte,
        unidade,
        gerente: 'DGE',
        ano: '2026',
        valorTotal: valor,
        valorFormatado: formatCurrency(valor),
        valorExecutado: 0,
        prioridade,
        prazo: 'Em andamento',
        sigadoc: 'Proc. Interno',
        observacao: desc,
        eixo: 'Defesa Civil e Segurança'
      });
      showToast(`Projeto ${nextId} criado com sucesso!`);
    } else if (type === 'edital') {
      const nextId = `EDIT-${(state.editais.length + 1).toString().padStart(3, '0')}`;
      state.editais.unshift({
        id: nextId,
        titulo,
        coluna,
        orgao: fonte,
        abrangencia: unidade,
        valor,
        valorFormatado: formatCurrency(valor),
        prazo: 'Em análise',
        prioridade,
        objeto: desc || titulo,
        status: 'Cadastrado no painel',
        responsavel: 'DGE / CBMMT',
        eixo: 'Segurança e Clima',
        contrapartida: 'A definir'
      });
      showToast(`Edital ${nextId} adicionado ao radar!`);
    } else if (type === 'tarefa') {
      const activeSprint = state.sprints.find(s => s.id === state.activeSprintId) || state.sprints[0];
      const nextId = `SP-${Date.now().toString().slice(-4)}`;
      activeSprint.tarefas.push({
        id: nextId,
        titulo,
        coluna,
        responsavel: fonte,
        unidade,
        pontos: 5,
        prazo: 'Nesta Sprint',
        prioridade
      });
      showToast(`Tarefa adicionada à sprint ${activeSprint.codigo}!`);
    }

    saveState();
    closeModal('modal-new-item');
    document.getElementById('form-new-item').reset();
    populateFilterSelects();
    render();
  }

  // ==========================================
  // EXPORT / IMPORT / RESET
  // ==========================================
  function exportJSON() {
    const data = {
      meta: {
        orgao: 'Corpo de Bombeiros Militar de Mato Grosso',
        dataExportacao: new Date().toISOString()
      },
      projetos: state.projetos,
      editais: state.editais,
      sprints: state.sprints
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `cbmmt_portfolio_backup_${getDatestamp()}.json`);
    showToast('Exportação JSON concluída.');
  }

  function exportCSV() {
    let csv = 'ID;Titulo;Tipo;Fonte_Orgao;Unidade;Valor_Total;Fase_Kanban;Prioridade\n';

    state.projetos.forEach(p => {
      csv += `"${p.id}";"${cleanCSV(p.titulo)}";"Projeto Execução";"${cleanCSV(p.patrocinador)}";"${cleanCSV(p.unidade)}";"${p.valorTotal || 0}";"${getColumnName('execucao', p.coluna)}";"${p.prioridade}"\n`;
    });

    state.editais.forEach(e => {
      csv += `"${e.id}";"${cleanCSV(e.titulo)}";"Edital / Oportunidade";"${cleanCSV(e.orgao)}";"${cleanCSV(e.abrangencia)}";"${e.valor || 0}";"${getColumnName('editais', e.coluna)}";"${e.prioridade}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `cbmmt_portfolio_${getDatestamp()}.csv`);
    showToast('Exportação CSV concluída.');
  }

  function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.projetos || parsed.editais) {
          state.projetos = parsed.projetos || state.projetos;
          state.editais = parsed.editais || state.editais;
          state.sprints = parsed.sprints || state.sprints;
          saveState();
          populateFilterSelects();
          render();
          closeModal('modal-backup');
          showToast('Dados importados com sucesso!');
        } else {
          alert('Arquivo JSON inválido. Estrutura não reconhecida.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function resetToDefaultData() {
    if (!confirm('Deseja restaurar os dados originais das planilhas do CBMMT? Quaisquer alterações locais serão substituídas.')) return;

    localStorage.removeItem(STORAGE_KEY);
    loadState();
    populateFilterSelects();
    render();
    closeModal('modal-backup');
    showToast('Dados padrão restaurados com sucesso.');
  }

  // ==========================================
  // HELPERS
  // ==========================================
  function filterList(list, predicate) {
    return list.filter(predicate);
  }

  function formatCurrency(val) {
    if (typeof val !== 'number') return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return text || '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cleanCSV(str) {
    if (!str) return '';
    return str.replace(/"/g, '""').replace(/\n/g, ' ');
  }

  function getColumnName(type, colId) {
    let list = COLUNAS_EXECUCAO;
    if (type === 'editais') list = COLUNAS_EDITAIS;
    else if (type === 'sprints') list = COLUNAS_SPRINTS;

    const found = list.find(c => c.id === colId);
    return found ? found.nome : colId;
  }

  function getDatestamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add('open');
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
  }

  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>🔥</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Expose global namespace for inline onclick handlers
  window.cbmmtApp = {
    openDetailModal,
    moveNext,
    deleteItem,
    exportCSV
  };

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
