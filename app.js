/* ===== Nebula Task Board — app logic ===== */
const STORAGE_KEY = 'nebula.tasks.v1';
const COLUMNS = ['todo', 'doing', 'done'];
const PRIO_LABEL = { low: '低', medium: '中', high: '高', urgent: '紧急' };

let state = load();
let editingId = null;
let filterPriority = 'all';
let searchTerm = '';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return seed();
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function seed() {
  return [
    { id: uid(), title: '设计看板视觉规范', desc: '确定 Linear Aesthetic 配色、字体、间距与动效语言。', priority: 'high', tags: ['设计', '规范'], column: 'done', created: Date.now() - 86400000 * 3 },
    { id: uid(), title: '搭建看板基础布局', desc: '三列拖拽结构、顶栏搜索、状态栏统计。', priority: 'medium', tags: ['前端'], column: 'done', created: Date.now() - 86400000 * 2 },
    { id: uid(), title: '实现拖拽与跨列移动', desc: '使用原生 HTML5 Drag & Drop API，支持卡片在列间移动与重排。', priority: 'high', tags: ['前端', '交互'], column: 'doing', created: Date.now() - 3600000 * 5 },
    { id: uid(), title: '本地存储持久化', desc: '所有任务变更实时写入 localStorage，刷新不丢失。', priority: 'medium', tags: ['数据'], column: 'doing', created: Date.now() - 3600000 * 2 },
    { id: uid(), title: '上线演示环境', desc: '用 Python http.server 在本地启动，验证整体效果。', priority: 'urgent', tags: ['部署'], column: 'todo', created: Date.now() - 60000 },
    { id: uid(), title: '补充键盘快捷键', desc: '⌘K 聚焦搜索，Esc 关闭面板，N 新建任务。', priority: 'low', tags: ['体验'], column: 'todo', created: Date.now() - 30000 },
  ];
}
function uid() { return 't-' + Math.random().toString(36).slice(2, 8); }
function fmtTime(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return '刚刚';
  if (d < 3600000) return Math.floor(d / 60000) + ' 分钟前';
  if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前';
  return Math.floor(d / 86400000) + ' 天前';
}

/* ===== Rendering ===== */
const board = document.getElementById('board');

function render() {
  for (const col of COLUMNS) {
    const body = board.querySelector(`[data-drop="${col}"]`);
    body.innerHTML = '';
    let items = state.filter(t => t.column === col);
    if (filterPriority !== 'all') items = items.filter(t => t.priority === filterPriority);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(t => t.title.toLowerCase().includes(q) || (t.desc || '').toLowerCase().includes(q) || (t.tags || []).some(x => x.toLowerCase().includes(q)));
    }
    items.sort((a, b) => a.created - b.created);
    for (const t of items) body.appendChild(cardEl(t));
    board.querySelector(`[data-count="${col}"]`).textContent = items.length;
  }
  const total = state.length;
  const done = state.filter(t => t.column === 'done').length;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('doneCount').textContent = done;
  document.getElementById('progressPct').textContent = (total ? Math.round(done / total * 100) : 0) + '%';
}

function cardEl(t) {
  const el = document.createElement('div');
  el.className = 'card';
  el.draggable = true;
  el.dataset.id = t.id;
  const tags = (t.tags || []).map(x => `<span class="tag">${escapeHtml(x)}</span>`).join('');
  el.innerHTML = `
    <div class="card__top">
      <span class="prio prio--${t.priority}">${PRIO_LABEL[t.priority]}</span>
      <span class="card__id">${t.id}</span>
    </div>
    <div class="card__title">${escapeHtml(t.title)}</div>
    ${t.desc ? `<div class="card__desc">${escapeHtml(t.desc)}</div>` : ''}
    ${tags ? `<div class="card__tags">${tags}</div>` : ''}
    <div class="card__foot">
      <span class="created">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        ${fmtTime(t.created)}
      </span>
      <button class="card__check" title="标记完成">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      </button>
    </div>`;
  el.addEventListener('click', (e) => {
    if (e.target.closest('.card__check')) {
      t.column = 'done';
      save(); render(); toast('已标记完成');
    } else {
      openPanel(t.id);
    }
  });
  el.addEventListener('dragstart', (e) => {
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', t.id);
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  return el;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ===== Drag & Drop between columns ===== */
for (const col of COLUMNS) {
  const body = board.querySelector(`[data-drop="${col}"]`);
  const section = body.closest('.column');
  body.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    section.classList.add('drag-over');
    const after = getDragAfter(body, e.clientY);
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;
    if (after == null) body.appendChild(dragging);
    else body.insertBefore(dragging, after);
  });
  body.addEventListener('dragleave', (e) => {
    if (!section.contains(e.relatedTarget)) section.classList.remove('drag-over');
  });
  body.addEventListener('drop', (e) => {
    e.preventDefault();
    section.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    const task = state.find(t => t.id === id);
    if (!task) return;
    task.column = col;
    const order = [...body.querySelectorAll('.card')].map(el => el.dataset.id);
    reorderColumn(col, order);
    save(); render();
    toast('已移动到「' + colName(col) + '」');
  });
}
function getDragAfter(container, y) {
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  return cards.reduce((closest, c) => {
    const box = c.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: c };
    return closest;
  }, { offset: -Infinity }).element || null;
}
function reorderColumn(col, order) {
  const inCol = state.filter(t => t.column === col);
  for (const t of inCol) {
    const idx = order.indexOf(t.id);
    if (idx > -1) t.created = Date.now() - (order.length - idx) * 1000;
  }
}
function colName(c) { return { todo: '待办', doing: '进行中', done: '已完成' }[c]; }

/* ===== Panel (create / edit) ===== */
const overlay = document.getElementById('overlay');
const fTitle = document.getElementById('fTitle');
const fDesc = document.getElementById('fDesc');
const fTags = document.getElementById('fTags');
const fPriority = document.getElementById('fPriority');
const deleteBtn = document.getElementById('deleteBtn');
let panelPriority = 'medium';

function openPanel(id) {
  editingId = id || null;
  const task = id ? state.find(t => t.id === id) : null;
  document.getElementById('panelTitle').textContent = id ? '编辑任务' : '新建任务';
  fTitle.value = task ? task.title : '';
  fDesc.value = task ? (task.desc || '') : '';
  fTags.value = task ? (task.tags || []).join(', ') : '';
  panelPriority = task ? task.priority : 'medium';
  setPrioritySeg(panelPriority);
  deleteBtn.classList.toggle('hidden', !id);
  overlay.classList.remove('hidden');
  setTimeout(() => fTitle.focus(), 60);
}
function closePanel() { overlay.classList.add('hidden'); editingId = null; }
function setPrioritySeg(v) {
  fPriority.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b.dataset.v === v));
}
fPriority.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  panelPriority = b.dataset.v;
  setPrioritySeg(panelPriority);
});
document.getElementById('saveBtn').addEventListener('click', () => {
  const title = fTitle.value.trim();
  if (!title) { toast('请填写标题'); fTitle.focus(); return; }
  const tags = fTags.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 6);
  if (editingId) {
    const t = state.find(x => x.id === editingId);
    Object.assign(t, { title, desc: fDesc.value.trim(), priority: panelPriority, tags });
    toast('已保存修改');
  } else {
    state.push({ id: uid(), title, desc: fDesc.value.trim(), priority: panelPriority, tags, column: 'todo', created: Date.now() });
    toast('已创建任务');
  }
  save(); render(); closePanel();
});
deleteBtn.addEventListener('click', () => {
  if (!editingId) return;
  state = state.filter(t => t.id !== editingId);
  save(); render(); closePanel(); toast('已删除任务');
});
document.getElementById('cancelBtn').addEventListener('click', closePanel);
document.getElementById('closePanel').addEventListener('click', closePanel);
overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });

/* ===== Top bar actions ===== */
document.getElementById('addBtn').addEventListener('click', () => openPanel(null));
board.querySelectorAll('.column__add').forEach(btn => {
  btn.addEventListener('click', () => openPanel(null));
});
const filterBtn = document.getElementById('filterBtn');
const filterBar = document.getElementById('filterBar');
filterBtn.addEventListener('click', () => filterBar.classList.toggle('hidden'));
document.getElementById('priorityChips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  filterPriority = chip.dataset.p;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c === chip));
  render();
});
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', () => { searchTerm = searchInput.value.trim(); render(); });

/* ===== Keyboard shortcuts ===== */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchInput.focus(); }
  if (e.key === 'Escape') { if (!overlay.classList.contains('hidden')) closePanel(); }
  if (e.key.toLowerCase() === 'n' && !overlay.querySelector('.panel :focus') && document.activeElement !== searchInput && !e.metaKey && !e.ctrlKey) {
    if (overlay.classList.contains('hidden')) { e.preventDefault(); openPanel(null); }
  }
});

/* ===== Toast ===== */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  document.getElementById('statusText').textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

render();
toast('看板已就绪');