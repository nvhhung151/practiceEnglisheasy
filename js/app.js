// ===== English Easy - Core App =====

const STORAGE_KEY = 'english_easy_vocab';

// Load vocabulary: ưu tiên localStorage (sau khi admin sửa), nếu không có thì fetch file JSON
async function loadVocabulary() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Lỗi parse localStorage', e);
    }
  }

  try {
    const res = await fetch('data/vocabulary.json');
    const data = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error('Không load được file JSON', e);
    return [];
  }
}

function saveVocabulary(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Phát âm bằng Web Speech API
function speak(text) {
  if (!window.speechSynthesis) {
    alert('Trình duyệt của bạn không hỗ trợ phát âm.');
    return;
  }
  // Dừng nếu đang nói
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // chậm một chút cho người học yếu
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// Lấy danh sách topic duy nhất
function getTopics(vocab) {
  const topics = [...new Set(vocab.map(v => v.topic))];
  return topics.sort();
}

// ===== HOME PAGE =====
async function initHome() {
  const vocab = await loadVocabulary();
  const topics = getTopics(vocab);
  const grid = document.getElementById('topics-grid');
  if (!grid) return;

  grid.innerHTML = topics.map(topic => {
    const count = vocab.filter(v => v.topic === topic).length;
    return `
      <a href="vocabulary.html?topic=${encodeURIComponent(topic)}" class="topic-card">
        <h3>${topic}</h3>
        <span>${count} từ</span>
      </a>
    `;
  }).join('');

  // Thẻ "Tất cả"
  grid.innerHTML += `
    <a href="vocabulary.html" class="topic-card">
      <h3>Tất cả</h3>
      <span>${vocab.length} từ</span>
    </a>
  `;
}

// ===== VOCABULARY PAGE =====
let currentVocab = [];
let filteredVocab = [];
let flashIndex = 0;

async function initVocabulary() {
  currentVocab = await loadVocabulary();
  const urlParams = new URLSearchParams(window.location.search);
  const topic = urlParams.get('topic');

  // Fill filter
  const topicSelect = document.getElementById('filter-topic');
  if (topicSelect) {
    const topics = getTopics(currentVocab);
    topicSelect.innerHTML = `<option value="">Tất cả chủ đề</option>` +
      topics.map(t => `<option value="${t}" ${t === topic ? 'selected' : ''}>${t}</option>`).join('');
  }

  // Apply initial filter
  filterWords();

  // Event listeners
  document.getElementById('filter-topic')?.addEventListener('change', filterWords);
  document.getElementById('search-input')?.addEventListener('input', filterWords);
  document.getElementById('btn-list-mode')?.addEventListener('click', showListMode);
  document.getElementById('btn-flash-mode')?.addEventListener('click', showFlashMode);
}

function filterWords() {
  const topic = document.getElementById('filter-topic')?.value || '';
  const search = (document.getElementById('search-input')?.value || '').toLowerCase().trim();

  filteredVocab = currentVocab.filter(v => {
    const matchTopic = !topic || v.topic === topic;
    const matchSearch = !search ||
      v.word.toLowerCase().includes(search) ||
      v.meaning.toLowerCase().includes(search);
    return matchTopic && matchSearch;
  });

  renderWordList();
  // Reset flash nếu đang ở chế độ flash
  if (document.getElementById('flashcard-section')?.style.display !== 'none') {
    flashIndex = 0;
    renderFlashcard();
  }
}

function renderWordList() {
  const list = document.getElementById('word-list');
  if (!list) return;

  if (filteredVocab.length === 0) {
    list.innerHTML = `<p style="text-align:center;padding:40px;color:#64748b;">Không tìm thấy từ nào.</p>`;
    return;
  }

  list.innerHTML = filteredVocab.map(v => `
    <div class="word-card">
      <div class="word-info">
        <h3>${v.word}</h3>
        <div class="phonetic">${v.phonetic || ''}</div>
        <div class="meaning">${v.meaning}</div>
        ${v.example ? `<div class="example">"${v.example}" <br><small>${v.example_vi || ''}</small></div>` : ''}
      </div>
      <div class="word-actions">
        <button class="btn btn-speak" onclick="speak('${v.word.replace(/'/g, "\\'")}')">🔊 Nghe</button>
        <span style="font-size:0.85rem;color:#94a3b8;">${v.topic}</span>
      </div>
    </div>
  `).join('');
}

function showListMode() {
  document.getElementById('list-section').style.display = 'block';
  document.getElementById('flashcard-section').style.display = 'none';
  document.getElementById('btn-list-mode').classList.add('btn-primary');
  document.getElementById('btn-list-mode').classList.remove('btn-outline');
  document.getElementById('btn-flash-mode').classList.add('btn-outline');
  document.getElementById('btn-flash-mode').classList.remove('btn-primary');
}

function showFlashMode() {
  document.getElementById('list-section').style.display = 'none';
  document.getElementById('flashcard-section').style.display = 'block';
  document.getElementById('btn-flash-mode').classList.add('btn-primary');
  document.getElementById('btn-flash-mode').classList.remove('btn-outline');
  document.getElementById('btn-list-mode').classList.add('btn-outline');
  document.getElementById('btn-list-mode').classList.remove('btn-primary');
  flashIndex = 0;
  renderFlashcard();
}

function renderFlashcard() {
  const card = document.getElementById('flashcard');
  const counter = document.getElementById('flash-counter');
  if (!card || filteredVocab.length === 0) {
    card.innerHTML = `<div class="flashcard-face flashcard-front"><h2>Không có từ</h2></div>`;
    return;
  }

  const v = filteredVocab[flashIndex];
  card.classList.remove('flipped');
  card.innerHTML = `
    <div class="flashcard-face flashcard-front">
      <h2>${v.word}</h2>
      <div class="phonetic">${v.phonetic || ''}</div>
      <button class="btn btn-speak" style="margin-top:16px;" onclick="event.stopPropagation(); speak('${v.word.replace(/'/g, "\\'")}')">🔊 Nghe phát âm</button>
    </div>
    <div class="flashcard-face flashcard-back">
      <div class="meaning">${v.meaning}</div>
      ${v.example ? `<div class="example">"${v.example}"</div><div style="margin-top:6px;font-size:0.95rem;color:#64748b;">${v.example_vi || ''}</div>` : ''}
    </div>
  `;

  if (counter) {
    counter.textContent = `${flashIndex + 1} / ${filteredVocab.length}`;
  }
}

function flipCard() {
  document.getElementById('flashcard')?.classList.toggle('flipped');
}

function nextCard() {
  if (filteredVocab.length === 0) return;
  flashIndex = (flashIndex + 1) % filteredVocab.length;
  renderFlashcard();
}

function prevCard() {
  if (filteredVocab.length === 0) return;
  flashIndex = (flashIndex - 1 + filteredVocab.length) % filteredVocab.length;
  renderFlashcard();
}

// ===== QUIZ PAGE (Người dùng chỉ làm bài Admin tạo) =====
let quizData = [];
let quizIndex = 0;
let quizScore = 0;          // số câu đúng
let quizAnswered = false;
let allVocabForQuiz = [];
let currentQuizMeta = null; // thông tin bài đang làm

async function prepareQuizVocab() {
  allVocabForQuiz = await loadVocabulary();
  window._allVocab = allVocabForQuiz;
  renderUserQuizList();
}

function renderUserQuizList() {
  const container = document.getElementById('quiz-list-user');
  if (!container) return;

  const quizzes = loadQuizzes();

  if (quizzes.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:50px 20px; background:white; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,0.05);">
        <p style="font-size:1.2rem; color:#64748b; margin-bottom:12px;">Chưa có bài tập nào.</p>
        <p style="color:#94a3b8;">Admin hãy vào trang Admin → tab "Quản lý bài tập" để tạo bài tập trước.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="display:grid; gap:14px;">
      ${quizzes.map(q => `
        <div style="background:white; border-radius:14px; padding:20px 24px; box-shadow:0 2px 12px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h3 style="color:#0369a1; margin-bottom:4px;">${q.title}</h3>
            <p style="color:#64748b; font-size:0.95rem;">
              Chủ đề: <strong>${q.topic || 'Tất cả'}</strong> • ${q.count} câu • Tạo ngày: ${q.createdAt}
            </p>
          </div>
          <button class="btn btn-primary" onclick="startUserQuiz(${q.id})">Làm bài</button>
        </div>
      `).join('')}
    </div>
  `;
}

function startUserQuiz(quizId) {
  const quiz = getQuizById(quizId);
  if (!quiz) {
    alert('Không tìm thấy bài tập.');
    return;
  }

  currentQuizMeta = quiz;

  let pool = quiz.topic
    ? allVocabForQuiz.filter(v => v.topic === quiz.topic)
    : allVocabForQuiz;

  if (pool.length < 4) {
    alert('Chủ đề này không đủ từ để làm bài (cần ít nhất 4 từ).');
    return;
  }

  const count = Math.min(quiz.count, pool.length);
  quizData = [...pool].sort(() => Math.random() - 0.5).slice(0, count);
  quizIndex = 0;
  quizScore = 0;

  document.getElementById('quiz-list-user').style.display = 'none';
  document.getElementById('quiz-box').style.display = 'block';
  showQuestion();
}

function showQuestion() {
  quizAnswered = false;
  const q = quizData[quizIndex];
  const box = document.getElementById('quiz-box');

  let options = [q.meaning];
  const others = allVocabForQuiz.filter(v => v.id !== q.id).sort(() => Math.random() - 0.5);
  for (let o of others) {
    if (options.length >= 4) break;
    if (!options.includes(o.meaning)) options.push(o.meaning);
  }
  while (options.length < 4 && options.length < allVocabForQuiz.length) {
    const extra = allVocabForQuiz[Math.floor(Math.random() * allVocabForQuiz.length)].meaning;
    if (!options.includes(extra)) options.push(extra);
  }
  options = options.sort(() => Math.random() - 0.5);

  const pointPerQuestion = 10 / quizData.length;
  const currentPoints = (quizScore * pointPerQuestion).toFixed(1);

  box.innerHTML = `
    <div class="quiz-progress">
      Câu ${quizIndex + 1} / ${quizData.length} • Điểm hiện tại: ${currentPoints}/10
    </div>
    <div class="quiz-question">
      Từ <strong style="color:#0ea5e9;">${q.word}</strong> có nghĩa là gì?
      <button class="btn btn-speak btn-sm" style="margin-left:10px;" onclick="speak('${q.word.replace(/'/g, "\\'")}')">🔊</button>
    </div>
    <div class="quiz-options" id="quiz-options">
      ${options.map(opt => `
        <button class="quiz-option" onclick="checkAnswer(this, '${opt.replace(/'/g, "\\'")}', '${q.meaning.replace(/'/g, "\\'")}')">${opt}</button>
      `).join('')}
    </div>
  `;
}

function checkAnswer(btn, selected, correct) {
  if (quizAnswered) return;
  quizAnswered = true;

  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    opt.style.pointerEvents = 'none';
    if (opt.textContent === correct) {
      opt.classList.add('correct');
    }
  });

  if (selected === correct) {
    quizScore++;
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
  }

  setTimeout(() => {
    const box = document.getElementById('quiz-box');
    const nextBtn = document.createElement('div');
    nextBtn.style.marginTop = '20px';
    nextBtn.style.textAlign = 'center';
    if (quizIndex < quizData.length - 1) {
      nextBtn.innerHTML = `<button class="btn btn-primary" onclick="nextQuestion()">Câu tiếp theo →</button>`;
    } else {
      nextBtn.innerHTML = `<button class="btn btn-success" onclick="showResult()">Xem kết quả</button>`;
    }
    box.appendChild(nextBtn);
  }, 600);
}

function nextQuestion() {
  quizIndex++;
  showQuestion();
}

function showResult() {
  const box = document.getElementById('quiz-box');
  const totalQuestions = quizData.length;
  const pointPerQuestion = 10 / totalQuestions;
  const finalScore = parseFloat((quizScore * pointPerQuestion).toFixed(1));
  const isPass = finalScore >= 8;

  let message = '';
  let color = '';
  if (isPass) {
    message = '🎉 Chúc mừng! Bạn đã Pass bài này!';
    color = '#16a34a';
  } else {
    message = '😢 Bạn chưa đạt. Hãy ôn lại và thử lại nhé!';
    color = '#dc2626';
  }

  box.innerHTML = `
    <div class="quiz-result">
      <h2>Kết quả bài tập</h2>
      <p style="font-size:1.1rem; color:#64748b; margin-bottom:8px;">${currentQuizMeta?.title || ''}</p>
      
      <p style="font-size:1.3rem; margin:12px 0;">
        Số câu đúng: <strong>${quizScore}/${totalQuestions}</strong>
      </p>
      
      <p style="font-size:2rem; font-weight:700; color:${color}; margin:16px 0;">
        ${finalScore} / 10 điểm
      </p>
      
      <p style="font-size:1.3rem; font-weight:600; color:${color}; margin-bottom:24px;">
        ${isPass ? 'PASS' : 'FAIL'} — ${message}
      </p>
      
      <p style="color:#94a3b8; font-size:0.95rem; margin-bottom:20px;">
        (Thang điểm 10 • Dưới 8 điểm = Fail)
      </p>
      
      <button class="btn btn-primary" onclick="location.reload()">Làm bài khác</button>
      <a href="index.html" class="btn btn-outline" style="margin-left:10px;">Về trang chủ</a>
    </div>
  `;
}

// Khởi tạo theo trang
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.includes('index.html') || path.endsWith('/')) {
    initHome();
  } else if (path.includes('vocabulary.html')) {
    initVocabulary();
  } else if (path.includes('quiz.html')) {
    prepareQuizVocab();
  }
});
