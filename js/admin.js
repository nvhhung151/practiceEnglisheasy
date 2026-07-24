// ===== Admin Panel =====

const ADMIN_PASSWORD = '123456@Hung';
const STORAGE_KEY = 'english_easy_vocab';

let vocabData = [];
let editingId = null;

// Load data
async function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      vocabData = JSON.parse(saved);
      return;
    } catch (e) {}
  }
  try {
    const res = await fetch('data/vocabulary.json');
    vocabData = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabData));
  } catch (e) {
    vocabData = [];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabData));
}

// Login
function handleLogin() {
  const pw = document.getElementById('admin-password').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    sessionStorage.setItem('admin_logged_in', '1');
    renderTable();
  } else {
    alert('Sai mật khẩu!');
  }
}

// Check session
function checkSession() {
  if (sessionStorage.getItem('admin_logged_in') === '1') {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadData().then(renderTable);
  }
}

function logout() {
  sessionStorage.removeItem('admin_logged_in');
  location.reload();
}

// Render table
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
      <td><strong>${v.word}</strong></td>
      <td>${v.phonetic || ''}</td>
      <td>${v.meaning}</td>
      <td>${v.topic}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.example || ''}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditModal(${v.id})">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWord(${v.id})">Xóa</button>
      </td>
    </tr>
  `).join('');
}

// Modal Add/Edit
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Thêm từ mới';
  document.getElementById('form-word').value = '';
  document.getElementById('form-phonetic').value = '';
  document.getElementById('form-meaning').value = '';
  document.getElementById('form-topic').value = '';
  document.getElementById('form-example').value = '';
  document.getElementById('form-example-vi').value = '';
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
  const topic = document.getElementById('form-topic').value.trim();
  const example = document.getElementById('form-example').value.trim();
  const example_vi = document.getElementById('form-example-vi').value.trim();

  if (!word || !meaning || !topic) {
    alert('Vui lòng nhập đầy đủ: Từ, Nghĩa và Chủ đề!');
    return;
  }

  if (editingId) {
    // Update
    const idx = vocabData.findIndex(v => v.id === editingId);
    if (idx !== -1) {
      vocabData[idx] = {
        ...vocabData[idx],
        word, phonetic, meaning, topic, example, example_vi
      };
    }
  } else {
    // Add new
    const newId = vocabData.length > 0 ? Math.max(...vocabData.map(v => v.id)) + 1 : 1;
    vocabData.push({
      id: newId,
      word, phonetic, meaning, topic, example, example_vi
    });
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

// Export JSON
function exportJSON() {
  const dataStr = JSON.stringify(vocabData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vocabulary.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import JSON
function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        alert('File JSON không đúng định dạng (phải là mảng).');
        return;
      }

      const choice = confirm(
        `Bạn muốn làm gì với ${imported.length} từ mới?\n\n` +
        `OK = Thêm vào (giữ từ cũ, không ghi đè)\n` +
        `Cancel = Ghi đè toàn bộ dữ liệu hiện tại`
      );

      if (choice) {
        // Merge: thêm từ mới, bỏ qua từ đã tồn tại (theo word)
        const existingWords = new Set(vocabData.map(v => v.word.toLowerCase()));
        let maxId = vocabData.length > 0 ? Math.max(...vocabData.map(v => v.id)) : 0;
        let added = 0;

        imported.forEach(item => {
          if (!existingWords.has(item.word.toLowerCase())) {
            maxId++;
            vocabData.push({
              ...item,
              id: maxId
            });
            added++;
          }
        });

        saveData();
        renderTable();
        alert(`Đã thêm ${added} từ mới. (Các từ trùng đã được bỏ qua)`);
      } else {
        // Ghi đè
        if (!confirm(`Bạn chắc chắn muốn GHI ĐÈ toàn bộ ${vocabData.length} từ hiện tại?`)) return;
        vocabData = imported;
        saveData();
        renderTable();
        alert('Đã ghi đè thành công!');
      }
    } catch (err) {
      alert('Lỗi đọc file JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Import CSV (đơn giản)
function importCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        alert('File CSV trống hoặc không hợp lệ.');
        return;
      }

      // Giả sử header: word,phonetic,meaning,topic,example,example_vi
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const newData = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h] = cols[idx] || '';
        });
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

// Reset về file gốc
async function resetToDefault() {
  if (!confirm('Bạn muốn khôi phục dữ liệu mặc định? Mọi thay đổi sẽ mất.')) return;
  localStorage.removeItem(STORAGE_KEY);
  await loadData();
  renderTable();
  alert('Đã khôi phục dữ liệu mặc định.');
}

// ===== TAB SWITCH =====
function switchTab(tab) {
  document.querySelectorAll('.admin-tabs button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  if (tab === 'vocab') {
    document.querySelector('.admin-tabs button:nth-child(1)').classList.add('active');
    document.getElementById('tab-vocab').classList.add('active');
  } else {
    document.querySelector('.admin-tabs button:nth-child(2)').classList.add('active');
    document.getElementById('tab-quiz').classList.add('active');
    loadQuizTab();
  }
}

// ===== QUIZ MANAGEMENT =====
function loadQuizTab() {
  // Fill topic select
  const topics = [...new Set(vocabData.map(v => v.topic))].sort();
  const select = document.getElementById('admin-quiz-topic');
  if (select) {
    select.innerHTML = `<option value="">-- Tất cả từ vựng (${vocabData.length} từ) --</option>` +
      topics.map(t => {
        const count = vocabData.filter(v => v.topic === t).length;
        return `<option value="${t}">${t} (${count} từ)</option>`;
      }).join('');
  }

  select?.addEventListener('change', updateAdminMax);
  updateAdminMax();
  renderQuizList();
}

function updateAdminMax() {
  const topic = document.getElementById('admin-quiz-topic')?.value || '';
  const pool = topic ? vocabData.filter(v => v.topic === topic) : vocabData;
  const max = pool.length;
  const input = document.getElementById('admin-quiz-count');
  const info = document.getElementById('admin-max-info');
  if (input) {
    input.max = max;
    if (parseInt(input.value) > max) input.value = max;
  }
  if (info) info.textContent = max > 0 ? `Tối đa ${max} câu` : 'Chưa có từ';
}

function handleCreateQuiz() {
  const title = document.getElementById('quiz-title').value.trim();
  const topic = document.getElementById('admin-quiz-topic').value;
  const count = parseInt(document.getElementById('admin-quiz-count').value) || 10;

  if (createQuiz(title, topic, count)) {
    alert('Đã tạo bài tập thành công!');
    document.getElementById('quiz-title').value = '';
    renderQuizList();
  }
}

function renderQuizList() {
  const list = document.getElementById('quiz-list-admin');
  if (!list) return;

  const quizzes = loadQuizzes();
  if (quizzes.length === 0) {
    list.innerHTML = `<p style="color:#64748b; padding:20px; background:white; border-radius:12px;">Chưa có bài tập nào. Hãy tạo bài tập ở trên.</p>`;
    return;
  }

  list.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Tên bài tập</th>
          <th>Chủ đề</th>
          <th>Số câu</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${quizzes.map(q => `
          <tr>
            <td><strong>${q.title}</strong></td>
            <td>${q.topic || 'Tất cả'}</td>
            <td>${q.count}</td>
            <td>${q.createdAt}</td>
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
  if (!confirm('Bạn chắc chắn muốn xóa bài tập này?')) return;
  deleteQuiz(id);
  renderQuizList();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  document.getElementById('btn-login')?.addEventListener('click', handleLogin);
  document.getElementById('admin-password')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
});
