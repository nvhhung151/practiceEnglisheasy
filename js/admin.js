// ===== Admin Panel =====
// Không khai báo lại QUIZ/VOCAB/STRUCTURE_* (đã có trong quiz-manager.js)

const ADMIN_PASSWORD = '123456@Hung';
// Dùng key từ quiz-manager nếu có, tránh redeclaration SyntaxError
const ADMIN_VOCAB_KEY = (typeof VOCAB_STORAGE_KEY !== 'undefined')
  ? VOCAB_STORAGE_KEY
  : 'english_easy_vocab';
const ADMIN_STRUCT_KEY = (typeof STRUCTURE_STORAGE_KEY !== 'undefined')
  ? STRUCTURE_STORAGE_KEY
  : 'english_easy_structures';

let vocabData = [];
let structureData = [];
let editingId = null;
let editingStructureId = null;

// ---------- VOCAB ----------
async function loadData() {
  if (typeof bootstrapAppData === 'function' && typeof isDataVersionCurrent === 'function' && !isDataVersionCurrent()) {
    const boot = await bootstrapAppData();
    vocabData = boot.vocab || [];
    return;
  }
  if (typeof ensureVocabLoaded === 'function') {
    vocabData = await ensureVocabLoaded();
    return;
  }
  try {
    const res = await fetch('data/vocabulary.json', { cache: 'no-store' });
    vocabData = await res.json();
    localStorage.setItem(ADMIN_VOCAB_KEY, JSON.stringify(vocabData));
  } catch (e) {
    vocabData = [];
  }
}

function saveData() {
  localStorage.setItem(ADMIN_VOCAB_KEY, JSON.stringify(vocabData));
  if (typeof saveVocab === 'function') saveVocab(vocabData);
}

// ---------- STRUCTURES ----------
async function loadStructureData() {
  if (typeof bootstrapAppData === 'function' && typeof isDataVersionCurrent === 'function' && !isDataVersionCurrent()) {
    const boot = await bootstrapAppData();
    structureData = boot.structures || [];
    return;
  }
  if (typeof ensureStructuresLoaded === 'function') {
    structureData = await ensureStructuresLoaded();
    return;
  }
  try {
    const res = await fetch('data/structures.json', { cache: 'no-store' });
    structureData = await res.json();
    localStorage.setItem(ADMIN_STRUCT_KEY, JSON.stringify(structureData));
  } catch (e) {
    structureData = [];
  }
}

function saveStructureData() {
  localStorage.setItem(ADMIN_STRUCT_KEY, JSON.stringify(structureData));
  if (typeof saveStructures === 'function') saveStructures(structureData);
}

// ---------- AUTH ----------
/** Hiện UI admin (ưu tiên dùng showAdminUI trong admin.html) */
function showAdminPanel() {
  if (typeof window.showAdminUI === 'function') {
    window.showAdminUI();
    return;
  }
  const login = document.getElementById('login-section');
  const panel = document.getElementById('admin-panel');
  if (login) login.style.setProperty('display', 'none', 'important');
  if (panel) {
    panel.classList.add('is-open');
    panel.style.setProperty('display', 'block', 'important');
  }
}

/** Nạp dữ liệu sau khi UI admin đã hiện — gọi từ HTML login */
async function enterAdminAfterLogin() {
  try {
    if (typeof bootstrapAppData === 'function') await bootstrapAppData();
    await loadData();
    await loadStructureData();
    renderTable();
  } catch (e) {
    console.error('Lỗi nạp dữ liệu admin', e);
    throw e;
  }
}
// Expose cho script login trong admin.html
window.enterAdminAfterLogin = enterAdminAfterLogin;

async function enterAdmin() {
  showAdminPanel();
  try { sessionStorage.setItem('admin_logged_in', '1'); } catch (e) {}
  await enterAdminAfterLogin();
}

// Giữ tương thích nếu chỗ khác gọi handleLogin
function handleLogin(event) {
  if (typeof window.doAdminLogin === 'function') {
    return window.doAdminLogin(event);
  }
  if (event && event.preventDefault) event.preventDefault();
  const input = document.getElementById('admin-password');
  const pw = String((input && input.value) || '').trim();
  if (pw === ADMIN_PASSWORD) {
    enterAdmin();
    return false;
  }
  alert('Sai mật khẩu!');
  return false;
}

function checkSession() {
  if (sessionStorage.getItem('admin_logged_in') === '1') {
    showAdminPanel();
    enterAdminAfterLogin().catch((e) => console.error(e));
  }
}

function logout() {
  try { sessionStorage.removeItem('admin_logged_in'); } catch (e) {}
  location.reload();
}

// ---------- VOCAB UI ----------
function renderTable() {
  const tbody = document.getElementById('vocab-tbody');
  if (!tbody) return;

  if (vocabData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;">Chưa có từ nào. Hãy thêm mới!</td></tr>`;
    return;
  }

  tbody.innerHTML = vocabData.map(v => `
    <tr>
      <td>${v.id}</td>
      <td><strong>${esc(v.word)}</strong></td>
      <td>${esc(v.phonetic || '')}</td>
      <td>${esc(v.meaning)}</td>
      <td>${esc(v.topic)}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(v.example || '')}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditModal(${v.id})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWord(${v.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Thêm từ mới';
  ['form-word', 'form-phonetic', 'form-meaning', 'form-topic', 'form-example', 'form-example-vi']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('form-course').value = 'summit1';
  document.getElementById('word-modal').classList.add('show');
}

function openEditModal(id) {
  const v = vocabData.find(item => item.id === id);
  if (!v) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Sửa từ vựng';
  document.getElementById('form-word').value = v.word;
  document.getElementById('form-phonetic').value = v.phonetic || '';
  document.getElementById('form-meaning').value = v.meaning;
  document.getElementById('form-course').value = v.course || (v.topic === 'Unit 10' ? 'careers' : 'summit1');
  document.getElementById('form-topic').value = v.topic;
  document.getElementById('form-example').value = v.example || '';
  document.getElementById('form-example-vi').value = v.example_vi || '';
  document.getElementById('word-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('word-modal').classList.remove('show');
}

function saveWord() {
  const word = document.getElementById('form-word').value.trim();
  const phonetic = document.getElementById('form-phonetic').value.trim();
  const meaning = document.getElementById('form-meaning').value.trim();
  const course = document.getElementById('form-course').value;
  const topic = document.getElementById('form-topic').value.trim();
  const example = document.getElementById('form-example').value.trim();
  const example_vi = document.getElementById('form-example-vi').value.trim();

  if (!word || !meaning || !topic) {
    alert('Vui lòng nhập đầy đủ: Từ, Nghĩa và Unit!');
    return;
  }

  if (editingId) {
    const idx = vocabData.findIndex(v => v.id === editingId);
    if (idx !== -1) {
      vocabData[idx] = { ...vocabData[idx], word, phonetic, meaning, topic, example, example_vi, course };
    }
  } else {
    const newId = vocabData.length > 0 ? Math.max(...vocabData.map(v => v.id)) + 1 : 1;
    vocabData.push({ id: newId, word, phonetic, meaning, topic, example, example_vi, course });
  }

  saveData();
  renderTable();
  closeModal();
}

function deleteWord(id) {
  if (!confirm('Bạn chắc chắn muốn xóa từ này?')) return;
  vocabData = vocabData.filter(v => v.id !== id);
  saveData();
  renderTable();
}

function exportJSON() {
  downloadJson(vocabData, 'vocabulary.json');
}

function importJSON(event) {
  importArrayFile(event, (imported, modeMerge) => {
    if (modeMerge) {
      const existingWords = new Set(vocabData.map(v => v.word.toLowerCase()));
      let maxId = vocabData.length > 0 ? Math.max(...vocabData.map(v => v.id)) : 0;
      let added = 0;
      imported.forEach(item => {
        if (item.word && !existingWords.has(String(item.word).toLowerCase())) {
          maxId++;
          vocabData.push({ ...item, id: maxId });
          added++;
        }
      });
      saveData();
      renderTable();
      alert(`Đã thêm ${added} từ mới.`);
    } else {
      vocabData = imported;
      saveData();
      renderTable();
      alert('Đã ghi đè vocabulary thành công!');
    }
  });
}

function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        alert('File CSV trống hoặc không hợp lệ.');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const newData = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
        if (obj.word && obj.meaning) {
          newData.push({
            id: i,
            word: obj.word,
            phonetic: obj.phonetic || '',
            meaning: obj.meaning,
            topic: obj.topic || 'Other',
            example: obj.example || '',
            example_vi: obj.example_vi || ''
          });
        }
      }
      if (newData.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ trong CSV.');
        return;
      }
      if (!confirm(`Import ${newData.length} từ từ CSV? Dữ liệu hiện tại sẽ bị ghi đè.`)) return;
      vocabData = newData;
      saveData();
      renderTable();
      alert('Import CSV thành công!');
    } catch (err) {
      alert('Lỗi đọc CSV: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

async function resetToDefault() {
  if (!confirm('Khôi phục vocabulary từ file data/vocabulary.json? (333 từ Unit 1–9)')) return;
  vocabData = await ensureVocabLoaded(true);
  renderTable();
  alert(`Đã khôi phục vocabulary: ${vocabData.length} từ.`);
}

// ---------- STRUCTURES UI ----------
function renderStructuresTable() {
  const tbody = document.getElementById('structures-tbody');
  if (!tbody) return;

  if (structureData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;">Chưa có cấu trúc. Hãy thêm hoặc import JSON.</td></tr>`;
    return;
  }

  const sorted = [...structureData].sort((a, b) => {
    const ua = parseInt(String(a.unit).replace(/\D/g, ''), 10) || 0;
    const ub = parseInt(String(b.unit).replace(/\D/g, ''), 10) || 0;
    if (ua !== ub) return ua - ub;
    return (a.id || 0) - (b.id || 0);
  });

  tbody.innerHTML = sorted.map(s => `
    <tr>
      <td>${s.id}</td>
      <td>${esc(s.unit)}</td>
      <td><strong>${esc(s.name)}</strong></td>
      <td style="max-width:220px;">${esc(s.pattern)}</td>
      <td style="max-width:220px;">${esc(s.meaning)}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditStructureModal(${s.id})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStructure(${s.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

function openAddStructureModal() {
  editingStructureId = null;
  document.getElementById('structure-modal-title').textContent = 'Thêm cấu trúc';
  ['form-s-unit', 'form-s-name', 'form-s-pattern', 'form-s-meaning', 'form-s-form',
    'form-s-example', 'form-s-example-vi', 'form-s-usage', 'form-s-notes']
    .forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('form-s-course').value = 'summit1';
  document.getElementById('structure-modal').classList.add('show');
}

function openEditStructureModal(id) {
  const s = structureData.find(item => item.id === id);
  if (!s) return;
  editingStructureId = id;
  document.getElementById('structure-modal-title').textContent = 'Sửa cấu trúc';
  document.getElementById('form-s-unit').value = s.unit || '';
  document.getElementById('form-s-course').value = s.course || (s.unit === 'Unit 10' ? 'careers' : 'summit1');
  document.getElementById('form-s-name').value = s.name || '';
  document.getElementById('form-s-pattern').value = s.pattern || '';
  document.getElementById('form-s-meaning').value = s.meaning || '';
  document.getElementById('form-s-form').value = s.form || '';
  document.getElementById('form-s-example').value = s.example || '';
  document.getElementById('form-s-example-vi').value = s.example_vi || '';
  document.getElementById('form-s-usage').value = s.usage || '';
  document.getElementById('form-s-notes').value = s.notes || '';
  document.getElementById('structure-modal').classList.add('show');
}

function closeStructureModal() {
  document.getElementById('structure-modal').classList.remove('show');
}

function saveStructure() {
  const unit = document.getElementById('form-s-unit').value.trim();
  const course = document.getElementById('form-s-course').value;
  const name = document.getElementById('form-s-name').value.trim();
  const pattern = document.getElementById('form-s-pattern').value.trim();
  const meaning = document.getElementById('form-s-meaning').value.trim();
  const form = document.getElementById('form-s-form').value.trim();
  const example = document.getElementById('form-s-example').value.trim();
  const example_vi = document.getElementById('form-s-example-vi').value.trim();
  const usage = document.getElementById('form-s-usage').value.trim();
  const notes = document.getElementById('form-s-notes').value.trim();

  if (!unit || !name || !pattern || !meaning) {
    alert('Nhập đủ: Unit, Tên, Pattern, Nghĩa.');
    return;
  }

  const payload = { unit, name, pattern, meaning, form, example, example_vi, usage, notes, course };

  if (editingStructureId) {
    const idx = structureData.findIndex(s => s.id === editingStructureId);
    if (idx !== -1) structureData[idx] = { ...structureData[idx], ...payload };
  } else {
    const newId = structureData.length > 0 ? Math.max(...structureData.map(s => s.id)) + 1 : 1;
    structureData.push({ id: newId, ...payload });
  }

  saveStructureData();
  renderStructuresTable();
  closeStructureModal();
}

function deleteStructure(id) {
  if (!confirm('Xóa cấu trúc này?')) return;
  structureData = structureData.filter(s => s.id !== id);
  saveStructureData();
  renderStructuresTable();
}

function exportStructuresJSON() {
  downloadJson(structureData, 'structures.json');
}

function importStructuresJSON(event) {
  importArrayFile(event, (imported, modeMerge) => {
    const normalized = imported.map((item, i) => ({
      id: item.id || i + 1,
      unit: item.unit || item.topic || 'Unit 1',
      name: item.name || item.pattern || '',
      pattern: item.pattern || '',
      meaning: item.meaning || '',
      form: item.form || '',
      example: item.example || '',
      example_vi: item.example_vi || '',
      usage: item.usage || '',
      notes: item.notes || ''
    })).filter(s => s.pattern || s.name);

    if (modeMerge) {
      let maxId = structureData.length > 0 ? Math.max(...structureData.map(s => s.id)) : 0;
      const keys = new Set(structureData.map(s => `${s.unit}|${s.pattern}|${s.name}`.toLowerCase()));
      let added = 0;
      normalized.forEach(item => {
        const k = `${item.unit}|${item.pattern}|${item.name}`.toLowerCase();
        if (!keys.has(k)) {
          maxId++;
          structureData.push({ ...item, id: maxId });
          added++;
        }
      });
      saveStructureData();
      renderStructuresTable();
      alert(`Đã thêm ${added} cấu trúc.`);
    } else {
      structureData = normalized.map((s, i) => ({ ...s, id: s.id || i + 1 }));
      saveStructureData();
      renderStructuresTable();
      alert('Đã ghi đè structures thành công! Hãy Export và commit lên GitHub để lưu vĩnh viễn.');
    }
  });
}

async function resetStructuresDefault() {
  if (!confirm('Khôi phục structures từ data/structures.json? (36 cấu trúc Summit 1)')) return;
  structureData = await ensureStructuresLoaded(true);
  renderStructuresTable();
  alert(`Đã khôi phục structures: ${structureData.length} mục.`);
}

// ---------- QUIZ ----------
function sortTopicNames(topics) {
  return [...topics].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ''), 10);
    const nb = parseInt(String(b).replace(/\D/g, ''), 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'vi');
  });
}

function loadQuizTab() {
  fillQuizTopicSelect();
  document.getElementById('admin-quiz-course')?.removeEventListener('change', onQuizCourseChange);
  document.getElementById('admin-quiz-course')?.addEventListener('change', onQuizCourseChange);
  document.getElementById('admin-quiz-type')?.removeEventListener('change', onQuizTypeChange);
  document.getElementById('admin-quiz-type')?.addEventListener('change', onQuizTypeChange);
  document.getElementById('admin-quiz-topic')?.removeEventListener('change', updateAdminMax);
  document.getElementById('admin-quiz-topic')?.addEventListener('change', updateAdminMax);
  document.getElementById('admin-quiz-timer')?.removeEventListener('change', toggleAdminCustomTimer);
  document.getElementById('admin-quiz-timer')?.addEventListener('change', toggleAdminCustomTimer);
  toggleAdminCustomTimer();
  updateAdminMax();
  renderQuizList();
}

function onQuizTypeChange() {
  fillQuizTopicSelect();
  updateAdminMax();
}

function onQuizCourseChange() {
  fillQuizTopicSelect();
  updateAdminMax();
}

function getAdminItemCourse(item) {
  if (item.course) return item.course;
  return (item.topic === 'Unit 10' || item.unit === 'Unit 10') ? 'careers' : 'summit1';
}

function getSelectedQuizCourse() {
  return document.getElementById('admin-quiz-course')?.value || 'summit1';
}

function fillQuizTopicSelect() {
  const type = document.getElementById('admin-quiz-type')?.value || 'vocab';
  const course = getSelectedQuizCourse();
  const select = document.getElementById('admin-quiz-topic');
  if (!select) return;

  if (type === 'structure') {
    const courseStructures = structureData.filter(s => getAdminItemCourse(s) === course);
    const units = sortTopicNames([...new Set(courseStructures.map(s => s.unit))]);
    select.innerHTML = `<option value="">-- Tất cả cấu trúc (${courseStructures.length}) --</option>` +
      units.map(u => {
        const count = courseStructures.filter(s => s.unit === u).length;
        return `<option value="${esc(u)}">${esc(u)} (${count} cấu trúc)</option>`;
      }).join('');
  } else {
    const courseVocab = vocabData.filter(v => getAdminItemCourse(v) === course);
    const topics = sortTopicNames([...new Set(courseVocab.map(v => v.topic))]);
    select.innerHTML = `<option value="">-- Tất cả từ vựng (${courseVocab.length}) --</option>` +
      topics.map(t => {
        const count = courseVocab.filter(v => v.topic === t).length;
        return `<option value="${esc(t)}">${esc(t)} (${count} từ)</option>`;
      }).join('');
  }
}

function toggleAdminCustomTimer() {
  const val = document.getElementById('admin-quiz-timer')?.value;
  const wrap = document.getElementById('admin-custom-timer-wrap');
  if (wrap) wrap.style.display = val === 'custom' ? 'block' : 'none';
}

function updateAdminMax() {
  const type = document.getElementById('admin-quiz-type')?.value || 'vocab';
  const course = getSelectedQuizCourse();
  const topic = document.getElementById('admin-quiz-topic')?.value || '';
  let pool;
  if (type === 'structure') {
    pool = structureData.filter(s => getAdminItemCourse(s) === course && (!topic || s.unit === topic));
  } else {
    pool = vocabData.filter(v => getAdminItemCourse(v) === course && (!topic || v.topic === topic));
  }
  const max = pool.length;
  const input = document.getElementById('admin-quiz-count');
  const info = document.getElementById('admin-max-info');
  if (input) {
    input.max = max || 1;
    input.min = 1;
    let cur = parseInt(input.value, 10);
    if (isNaN(cur) || cur < 1) cur = Math.min(20, max || 1);
    if (cur > max) cur = max || 1;
    input.value = cur;
  }
  if (info) {
    const kind = type === 'structure' ? 'cấu trúc' : 'từ';
    const unitLabel = topic || 'Tất cả';
    info.innerHTML = max > 0
      ? `<strong>${esc(unitLabel)}</strong> có <strong>${max}</strong> ${kind}. ` +
        `Chọn số câu muốn làm (1–${max}). Ví dụ chọn <strong>20</strong> thì mỗi lần random 20/${max}.`
      : 'Chưa có dữ liệu cho lựa chọn này.';
  }
  renderCountPresets(max);
}

function renderCountPresets(max) {
  const wrap = document.getElementById('admin-count-presets');
  if (!wrap) return;
  if (!max || max < 1) {
    wrap.innerHTML = '';
    return;
  }

  const presets = [5, 10, 15, 20, 30, 40, 50].filter(n => n < max);
  const buttons = presets.map(n =>
    `<button type="button" class="btn btn-outline btn-sm count-preset-btn" data-count="${n}">${n} câu</button>`
  );
  buttons.push(
    `<button type="button" class="btn btn-outline btn-sm count-preset-btn" data-count="${max}">Tất cả (${max})</button>`
  );

  wrap.innerHTML = buttons.join('');
  wrap.querySelectorAll('.count-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.getAttribute('data-count'), 10);
      const input = document.getElementById('admin-quiz-count');
      if (input) input.value = n;
      wrap.querySelectorAll('.count-preset-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-outline');
    });
  });
}

function getAdminTimerSeconds() {
  const timerVal = document.getElementById('admin-quiz-timer')?.value || '0';
  if (timerVal === 'custom') {
    const mins = parseInt(document.getElementById('admin-quiz-timer-custom')?.value || '5', 10);
    return Math.min(120, Math.max(1, isNaN(mins) ? 5 : mins)) * 60;
  }
  return parseInt(timerVal, 10) || 0;
}

function handleCreateQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  const type = document.getElementById('admin-quiz-type').value || 'vocab';
  const course = getSelectedQuizCourse();
  const topic = document.getElementById('admin-quiz-topic').value;
  let count = parseInt(document.getElementById('admin-quiz-count').value, 10);
  const timerSeconds = getAdminTimerSeconds();

  // Tính max theo unit hiện tại
  let pool;
  if (type === 'structure') {
    pool = structureData.filter(s => getAdminItemCourse(s) === course && (!topic || s.unit === topic));
  } else {
    pool = vocabData.filter(v => getAdminItemCourse(v) === course && (!topic || v.topic === topic));
  }
  const max = pool.length;
  if (!max) {
    alert('Unit này chưa có dữ liệu để tạo bài.');
    return;
  }
  if (isNaN(count) || count < 1) {
    alert('Nhập số câu hợp lệ (ví dụ 20).');
    return;
  }
  if (count > max) {
    alert(`Unit chỉ có ${max} mục. Số câu đã được chỉnh xuống ${max}.`);
    count = max;
    const input = document.getElementById('admin-quiz-count');
    if (input) input.value = max;
  }

  // Đồng bộ storage trước khi createQuiz đọc
  saveData();
  saveStructureData();

  const autoTitle = title ||
    `${topic || 'Tất cả'} — ${type === 'structure' ? 'Cấu trúc' : 'Từ vựng'} ${count} câu`;

  if (createQuiz(autoTitle, topic, count, timerSeconds, type, course)) {
    alert(
      'Đã tạo bài tập!\n' +
      `• ${autoTitle}\n` +
      `• ${count}/${max} câu (mỗi lần làm sẽ random ${count} câu)\n` +
      `• Thời gian: ${formatTimerLabel(timerSeconds)}`
    );
    document.getElementById('quiz-title').value = '';
    renderQuizList();
  }
}

function renderQuizList() {
  const list = document.getElementById('quiz-list-admin');
  if (!list) return;

  const quizzes = loadQuizzes().slice().reverse();
  if (quizzes.length === 0) {
    list.innerHTML = `<p style="color:#64748b; padding:20px; background:white; border-radius:12px;">Chưa có bài tập. Tạo mới hoặc Import quizzes.json.</p>`;
    return;
  }

  list.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên</th>
          <th>Loại</th>
          <th>Unit</th>
          <th>Số câu</th>
          <th>Thời gian</th>
          <th>Ngày tạo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${quizzes.map(q => `
          <tr>
            <td><strong>${esc(q.title)}</strong></td>
            <td>${esc(quizTypeLabel(q.type === 'structure' ? 'structure' : 'vocab'))}</td>
            <td>${esc(q.topic || 'Tất cả')}</td>
            <td>${q.count}</td>
            <td>${esc(formatTimerLabel(q.timerSeconds ?? 0))}</td>
            <td>${esc(q.createdAt || '')}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="handleDeleteQuiz(${q.id})">Xóa</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function handleDeleteQuiz(id) {
  if (!confirm('Xóa bài tập này?')) return;
  deleteQuiz(id);
  renderQuizList();
}

function exportQuizzesJSON() {
  downloadJson(loadQuizzes(), 'quizzes.json');
}

function importQuizzesJSON(event) {
  importArrayFile(event, (imported, modeMerge) => {
    const normalized = imported.map((q, i) => ({
      id: q.id || Date.now() + i,
      title: q.title || `Bài ${i + 1}`,
      type: q.type === 'structure' ? 'structure' : 'vocab',
      topic: q.topic || '',
      count: Math.max(1, parseInt(q.count, 10) || 10),
      timerSeconds: Math.max(0, parseInt(q.timerSeconds, 10) || 0),
      createdAt: q.createdAt || new Date().toLocaleString('vi-VN')
    }));

    if (modeMerge) {
      const current = loadQuizzes();
      const ids = new Set(current.map(q => q.id));
      let added = 0;
      normalized.forEach(q => {
        if (!ids.has(q.id)) {
          current.push(q);
          added++;
        }
      });
      saveQuizzes(current);
      renderQuizList();
      alert(`Đã thêm ${added} bài quiz.`);
    } else {
      saveQuizzes(normalized);
      renderQuizList();
      alert('Đã ghi đè quizzes! Export và commit data/quizzes.json để lưu vĩnh viễn.');
    }
  });
}

async function resetQuizzesDefault() {
  if (!confirm('Khôi phục quizzes từ data/quizzes.json?')) return;
  await ensureQuizzesLoaded(true);
  renderQuizList();
  alert(`Đã khôi phục quizzes: ${loadQuizzes().length} bài.`);
}

/** Nạp lại cả 3 file data từ repo (xóa cache local) */
async function resyncAllFromFiles() {
  if (!confirm('Đồng bộ lại TẤT CẢ từ file data/ trên project (vocab + structures + quizzes)? Cache trình duyệt sẽ bị ghi đè.')) return;
  localStorage.removeItem(DATA_VERSION_KEY);
  localStorage.removeItem(VOCAB_STORAGE_KEY);
  localStorage.removeItem(STRUCTURE_STORAGE_KEY);
  localStorage.removeItem(QUIZ_STORAGE_KEY);
  const boot = await bootstrapAppData();
  vocabData = boot.vocab || [];
  structureData = boot.structures || [];
  renderTable();
  renderStructuresTable();
  renderQuizList();
  alert(
    `Đã đồng bộ:\n` +
    `• Từ vựng: ${vocabData.length}\n` +
    `• Cấu trúc: ${structureData.length}\n` +
    `• Quiz: ${(boot.quizzes || []).length}`
  );
}

// ---------- TABS ----------
function switchTab(tab) {
  document.querySelectorAll('.admin-tabs button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const map = { vocab: 0, structures: 1, quiz: 2 };
  const buttons = document.querySelectorAll('.admin-tabs button');
  const idx = map[tab] ?? 0;
  if (buttons[idx]) buttons[idx].classList.add('active');

  if (tab === 'vocab') {
    document.getElementById('tab-vocab').classList.add('active');
    renderTable();
  } else if (tab === 'structures') {
    document.getElementById('tab-structures').classList.add('active');
    loadStructureData().then(renderStructuresTable);
  } else {
    document.getElementById('tab-quiz').classList.add('active');
    Promise.all([loadData(), loadStructureData(), ensureQuizzesLoaded?.() || Promise.resolve()])
      .then(() => loadQuizTab());
  }
}

// ---------- helpers ----------
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * modeMerge: true = merge (OK), false = overwrite (Cancel)
 */
function importArrayFile(event, onData) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert('File JSON phải là một mảng [...].');
        return;
      }
      const modeMerge = confirm(
        `Import ${imported.length} mục.\n\nOK = Thêm vào (merge)\nCancel = Ghi đè toàn bộ`
      );
      // Confirm returns false on Cancel — for overwrite we need second confirm
      if (!modeMerge) {
        if (!confirm(`Ghi đè toàn bộ bằng ${imported.length} mục từ file?`)) return;
        onData(imported, false);
      } else {
        onData(imported, true);
      }
    } catch (err) {
      alert('Lỗi JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  // Session restore + data load (UI login đã xử lý trong admin.html)
  checkSession();

  // Enter trong ô password
  const input = document.getElementById('admin-password');
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (typeof window.doAdminLogin === 'function') window.doAdminLogin(e);
    }
  });
});
