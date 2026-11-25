const $ = (s) => document.querySelector(s);
const LABEL = {
  status: { todo: 'Chưa làm', doing: 'Đang làm', done: 'Hoàn thành' },
  priority: { high: '🎀 Cao', medium: '🌼 Vừa', low: '🍃 Nhẹ' },
};
const STATUS_ICON = { todo: '♡', doing: '☀', done: '♥' };
let view = 'today';
let editingId = null;

const todayStr = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (s) => (s ? s.split('-').reverse().join('/') : 'Không hạn');

async function api(url, opts) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error((data.errors || ['Có lỗi xảy ra']).join(', '));
  return data;
}

/* ---------- Điều hướng ---------- */
document.querySelectorAll('.tab').forEach((b) =>
  b.addEventListener('click', () => {
    view = b.dataset.view;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === b));
    render();
  })
);

function render() {
  const isStats = view === 'stats';
  $('#view-tasks').classList.toggle('hidden', isStats);
  $('#view-stats').classList.toggle('hidden', !isStats);
  if (isStats) return loadStats();
  $('#view-title').textContent = view === 'today'
    ? `Việc xinh hôm nay · ${fmtDate(todayStr())}` : 'Tất cả việc xinh';
  $('#f-date').classList.toggle('hidden', view === 'today');
  loadTasks();
}

/* ---------- Danh sách task ---------- */
async function loadTasks() {
  const p = new URLSearchParams();
  if ($('#search').value.trim()) p.set('q', $('#search').value.trim());
  if ($('#f-status').value) p.set('status', $('#f-status').value);
  if ($('#f-priority').value) p.set('priority', $('#f-priority').value);
  if ($('#f-category').value) p.set('category', $('#f-category').value);
  if (view === 'today') p.set('date', 'today');
  else if ($('#f-date').value) p.set('date', $('#f-date').value);

  let tasks;
  try {
    const [visibleTasks, todayTasks, overdueTasks] = await Promise.all([
      api('/api/tasks?' + p), api('/api/tasks?date=today'), api('/api/tasks?date=overdue'),
    ]);
    tasks = visibleTasks;
    updateMascot(tasks, overdueTasks.length);
    const finishedToday = todayTasks.length > 0 && todayTasks.every((t) => t.status === 'done');
    $('#congrats').classList.toggle('hidden', view !== 'today' || !finishedToday);
    $('#load-error').classList.add('hidden');
  } catch (err) {
    $('#load-error').textContent = `Không thể tải công việc: ${err.message}`;
    $('#load-error').classList.remove('hidden');
    return;
  }
  const today = todayStr();
  $('#empty').classList.toggle('hidden', tasks.length > 0);
  $('#task-list').innerHTML = tasks.map((t) => {
    const overdue = t.due_date && t.due_date < today && t.status !== 'done';
    return `
    <li class="task p-${t.priority} ${t.status === 'done' ? 'done' : ''} task-enter" data-id="${t.id}">
      <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} title="Đánh dấu hoàn thành">
      <div class="body">
        <div class="title">${esc(t.title)}</div>
        ${t.description ? `<div class="desc">${esc(t.description)}</div>` : ''}
        <div class="meta">
          <span class="badge">✿ ${esc(t.category)}</span>
          <span class="badge rank rank-${t.priority}">${LABEL.priority[t.priority]}</span>
          <span class="badge status ${t.status === 'doing' ? 'doing' : ''} ${t.status === 'done' ? 'complete' : ''}">${STATUS_ICON[t.status]} ${LABEL.status[t.status]}</span>
          <span class="badge ${overdue ? 'overdue' : ''}">♡ ${fmtDate(t.due_date)}${overdue ? ' · quá hạn' : ''}</span>
        </div>
      </div>
      <div class="ops"><button data-act="edit">Sửa</button> <button data-act="del">Xóa</button></div>
    </li>`;
  }).join('');
  if (view !== 'today') $('#congrats').classList.add('hidden');
}

function updateMascot(tasks, overdueCount = 0) {
  const mascot = $('#mascot');
  const done = tasks.filter((t) => t.status === 'done').length;
  mascot.classList.toggle('sad', overdueCount > 0 && overdueCount >= done);
  mascot.classList.toggle('happy', done > 0 && done >= overdueCount);
  mascot.setAttribute('aria-label', mascot.classList.contains('sad') ? 'Mèo hơi buồn vì có việc quá hạn' : 'Mèo vui cổ vũ bạn');
}

$('#task-list').addEventListener('click', async (e) => {
  const li = e.target.closest('.task');
  if (!li) return;
  const id = li.dataset.id;
  try {
    if (e.target.matches('input[type=checkbox]')) {
      await api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status: e.target.checked ? 'done' : 'todo' }) });
      if (e.target.checked) {
        showExp(li);
        burstConfetti(li);
        const todayTasks = await api('/api/tasks?date=today');
        if (todayTasks.length && todayTasks.every((task) => task.status === 'done')) $('#congrats').classList.remove('hidden');
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      loadTasks();
    } else if (e.target.dataset.act === 'del') {
      if (confirm('Mình xóa việc này nhé?')) { li.classList.add('task-exit'); await new Promise((resolve) => setTimeout(resolve, 180)); await api(`/api/tasks/${id}`, { method: 'DELETE' }); loadTasks(); loadCategories(); }
    } else if (e.target.dataset.act === 'edit') {
      const t = (await api('/api/tasks')).find((x) => x.id == id);
      openDialog(t);
    }
  } catch (err) { li.classList.remove('task-exit'); alert(err.message); }
});

function showExp(task) {
  const pop = document.createElement('span');
  pop.className = 'exp-pop';
  pop.textContent = '+1 điểm dễ thương ♥';
  task.append(pop);
  setTimeout(() => pop.remove(), 1100);
}

function burstConfetti(task) {
  const bits = ['♥', '✿', '★', '♡'];
  for (let i = 0; i < 12; i++) {
    const bit = document.createElement('span');
    bit.className = 'confetti';
    bit.textContent = bits[i % bits.length];
    bit.style.setProperty('--x', `${Math.random() * 180 - 90}px`);
    bit.style.setProperty('--r', `${Math.random() * 100 - 50}deg`);
    bit.style.left = `${25 + Math.random() * 50}%`;
    bit.style.color = ['#ff6fa5', '#c9b6ff', '#75cbaa', '#efbd55'][i % 4];
    task.append(bit);
    setTimeout(() => bit.remove(), 950);
  }
}

['search', 'f-status', 'f-priority', 'f-category', 'f-date'].forEach((id) =>
  $('#' + id).addEventListener(id === 'search' ? 'input' : 'change', loadTasks)
);

async function loadCategories() {
  const cats = await api('/api/categories');
  const cur = $('#f-category').value;
  $('#f-category').innerHTML = '<option value="">Mọi danh mục</option>' +
    cats.map((c) => `<option ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join('');
  $('#cat-list').innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join('');
}

/* ---------- Thêm / sửa ---------- */
function openDialog(task = null) {
  editingId = task ? task.id : null;
  $('#dialog-title').textContent = task ? 'Chỉnh việc xinh' : 'Thêm việc xinh';
  const f = $('#form');
  f.title.value = task?.title ?? '';
  f.description.value = task?.description ?? '';
  f.category.value = task?.category ?? 'Khác';
  f.due_date.value = task ? (task.due_date ?? '') : todayStr();
  f.priority.value = task?.priority ?? 'medium';
  f.status.value = task?.status ?? 'todo';
  $('#form-error').textContent = '';
  $('#dialog').showModal();
}
$('#btn-add').addEventListener('click', () => openDialog());
$('#btn-cancel').addEventListener('click', () => $('#dialog').close());

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const body = {
    title: f.title.value, description: f.description.value, category: f.category.value.trim() || 'Khác',
    due_date: f.due_date.value || null, priority: f.priority.value, status: f.status.value,
  };
  try {
    if (editingId) await api(`/api/tasks/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
    $('#dialog').close();
    loadCategories();
    render();
  } catch (err) { $('#form-error').textContent = err.message; }
});

/* ---------- Thống kê ---------- */
function bars(rows, labelMap = {}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return rows.map((r) => `
    <div class="bar-row"><span class="lbl">${esc(labelMap[r.label] || r.label)}</span>
      <div class="track"><div class="fill" style="width:${(r.count / max) * 100}%"></div></div>
      <span class="val">${r.count}</span></div>`).join('') || '<p class="muted">Chưa có dữ liệu</p>';
}

async function loadStats() {
  let s;
  try { s = await api('/api/stats'); }
  catch (err) {
    $('#stat-cards').innerHTML = `<p class="error-banner" role="alert">Không thể tải thống kê: ${esc(err.message)}</p>`;
    return;
  }
  $('#stat-cards').innerHTML = [
    ['Tổng số việc', s.total], ['Đã hoàn thành', s.done], ['Tỉ lệ dễ thương', s.completionRate + '%'],
    ['Quá hạn', s.overdue], ['Hôm nay', `${s.todayDone}/${s.todayTotal}`],
  ].map(([l, n]) => `<div class="card"><div class="muted">${l}</div><div class="num">${n}</div>${l === 'Tỉ lệ dễ thương' ? `<div class="hp-track" aria-label="Tỉ lệ hoàn thành ${s.completionRate}%"><div class="hp-fill" style="width:${s.completionRate}%"></div></div>` : ''}</div>`).join('');
  $('#chart-status').innerHTML = bars(s.byStatus, LABEL.status);
  $('#chart-priority').innerHTML = bars(s.byPriority, LABEL.priority);
  $('#chart-category').innerHTML = bars(s.byCategory);
  const max = Math.max(1, ...s.last7.map((d) => d.total));
  $('#chart-last7').innerHTML = s.last7.map((d) => `
    <div class="bar-row"><span class="lbl">${d.date.slice(5).split('-').reverse().join('/')}</span>
      <div class="track"><div class="fill" style="width:${(d.total / max) * 100}%;opacity:.35"></div>
        <div class="fill done" style="width:${(d.done / max) * 100}%;position:absolute;top:0;left:0"></div></div>
      <span class="val">${d.done}/${d.total}</span></div>`).join('');
}

loadCategories();
render();
