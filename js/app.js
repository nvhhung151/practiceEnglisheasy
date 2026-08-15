// ===== English Easy - Core App =====

const STORAGE_KEY = 'english_easy_vocab'; // alias key (quiz-manager dùng VOCAB_STORAGE_KEY)

/** Nạp từ vựng: file data/vocabulary.json (333 từ Unit 1–9) + cache localStorage */
let currentCourseId = 'summit1';
let currentCourse = null;
let availableCourses = [];

function getItemCourse(item) {
  if (item.course) return item.course;
  return (item.topic === 'Unit 10' || item.unit === 'Unit 10') ? 'careers' : 'summit1';
}

async function loadCourses() {
  try {
    const res = await fetch('data/courses.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Cannot load courses.json', e);
    return [];
  }
}

async function resolveCurrentCourse() {
  const courses = await loadCourses();
  availableCourses = courses;
  const requestedId = new URLSearchParams(window.location.search).get('course') || 'summit1';
  currentCourse = courses.find(course => course.id === requestedId) || courses[0] || { id: 'summit1', name: 'Summit 1' };
  currentCourseId = currentCourse.id;
  document.querySelectorAll('a[href="vocabulary.html"]').forEach(link => { link.href = courseUrl('vocabulary.html'); });
  document.querySelectorAll('a[href="structures.html"]').forEach(link => { link.href = courseUrl('structures.html'); });
  document.querySelectorAll('a[href="quiz.html"]').forEach(link => { link.href = courseUrl('quiz.html'); });
  return currentCourse;
}

function renderCourseSwitcher() {
  const container = document.getElementById('course-switcher');
  if (!container || availableCourses.length === 0) return;
  const page = window.location.pathname.split('/').pop() || 'vocabulary.html';
  container.innerHTML = `
    <div class="course-switcher-label">Đang học: <strong>${escapeHtml(currentCourse.name)}</strong></div>
    <div class="course-switcher-actions">
      ${availableCourses.map(course => `
        <a href="${page}?course=${encodeURIComponent(course.id)}"
           class="btn btn-sm ${course.id === currentCourseId ? 'btn-primary' : 'btn-outline'}">
          ${escapeHtml(course.name)}
        </a>
      `).join('')}
    </div>
  `;
}

function courseUrl(page) {
  return `${page}?course=${encodeURIComponent(currentCourseId)}`;
}

async function loadVocabulary() {
  if (typeof bootstrapAppData === 'function' && !isDataVersionCurrent()) {
    const { vocab } = await bootstrapAppData();
    return vocab;
  }
  if (typeof ensureVocabLoaded === 'function') {
    return ensureVocabLoaded();
  }
  try {
    const res = await fetch('data/vocabulary.json', { cache: 'no-store' });
    const data = await res.json();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error('Không load được vocabulary.json', e);
    return [];
  }
}

function saveVocabulary(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (typeof saveVocab === 'function') saveVocab(data);
}

/** Nạp cấu trúc câu: data/structures.json (36 mẫu Summit 1) */
async function loadStructuresData() {
  if (typeof bootstrapAppData === 'function' && !isDataVersionCurrent()) {
    const { structures } = await bootstrapAppData();
    return structures;
  }
  if (typeof ensureStructuresLoaded === 'function') {
    return ensureStructuresLoaded();
  }
  try {
    const res = await fetch('data/structures.json', { cache: 'no-store' });
    const data = await res.json();
    localStorage.setItem('english_easy_structures', JSON.stringify(data));
    return data;
  } catch (e) {
    console.error('Không load được structures.json', e);
    return [];
  }
}

// Phát âm: dùng js/speak.js (window.speak). Fallback tối giản nếu file speak chưa load.
if (typeof window.speak !== 'function') {
  window.speak = function (text, event) {
    if (event) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (e) {}
    }
    var raw = String(text == null ? '' : text).trim();
    if (!raw || !window.speechSynthesis) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(raw);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };
}

function getTopics(vocab) {
  const topics = [...new Set(vocab.map(v => v.topic))];
  return sortUnits(topics);
}

function getStructureUnits(list) {
  return sortUnits([...new Set(list.map(s => s.unit))]);
}

function sortUnits(units) {
  return [...units].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ''), 10);
    const nb = parseInt(String(b).replace(/\D/g, ''), 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b), 'vi');
  });
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape cho attribute HTML (data-speak="...") */
function escapeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getVocabularyExample(v) {
  if (v.example) {
    return { sentence: v.example, translation: v.example_vi || '' };
  }
  const word = String(v.word || '').trim();
  const meaning = String(v.meaning || '').trim();
  const examples = {
    'etiquette': ['Good etiquette helps people feel comfortable at dinner.', 'Phép lịch sự tốt giúp mọi người cảm thấy thoải mái trong bữa tối.'],
    'promptly': ['Please reply promptly to the customer\'s email.', 'Vui lòng trả lời email của khách hàng một cách nhanh chóng.'],
    'slacks': ['He wore slacks and a shirt to the interview.', 'Anh ấy mặc quần tây và áo sơ mi đến buổi phỏng vấn.'],
    'to refrain': ['Please refrain from using your phone during the meeting.', 'Vui lòng hạn chế sử dụng điện thoại trong cuộc họp.'],
    'dietary': ['The restaurant can meet your dietary needs.', 'Nhà hàng có thể đáp ứng nhu cầu ăn uống của bạn.'],
    'a requirement': ['The requirements for this job are very high.', 'Các yêu cầu cho công việc này rất cao.'],
    'cultural literacy': ['Cultural literacy helps us understand people from other countries.', 'Hiểu biết văn hóa giúp chúng ta hiểu người từ các quốc gia khác.'],
    'a table manner': ['Good table manners are important at a formal dinner.', 'Nguyên tắc bàn ăn tốt rất quan trọng trong bữa tối trang trọng.'],
    'punctuality': ['Punctuality is important when you meet a client.', 'Sự đúng giờ rất quan trọng khi bạn gặp khách hàng.'],
    'impolite': ['It is impolite to interrupt someone who is speaking.', 'Cắt lời người đang nói là bất lịch sự.'],
    'offensive': ['That joke may be offensive to some people.', 'Câu đùa đó có thể gây phản cảm với một số người.'],
    'customary': ['It is customary to bring a gift to a wedding.', 'Theo phong tục, người ta mang quà đến đám cưới.'],
    'a taboo': ['In some cultures, this topic is a taboo.', 'Trong một số nền văn hóa, chủ đề này là điều cấm kỵ.'],
    'conservative': ['Her parents have conservative ideas about dating.', 'Bố mẹ cô ấy có quan điểm bảo thủ về việc hẹn hò.'],
    'a workforce': ['The company needs a skilled workforce.', 'Công ty cần một lực lượng lao động có kỹ năng.'],
    'respectful': ['Students should be respectful to their teachers.', 'Học sinh nên kính trọng giáo viên của mình.'],
    'dating': ['They have been dating for six months.', 'Họ đã hẹn hò được sáu tháng.'],
    'a curfew': ['My parents set a curfew of ten o\'clock.', 'Bố mẹ tôi đặt giờ giới nghiêm là mười giờ.'],
    'a double standard': ['It is unfair to use a double standard for men and women.', 'Dùng tiêu chuẩn kép cho nam và nữ là không công bằng.'],
    'strict = serious': ['Our teacher is strict about homework deadlines.', 'Giáo viên của chúng tôi nghiêm khắc về hạn nộp bài tập.'],
    'to address': ['Please address the manager as Mr. Long.', 'Vui lòng gọi người quản lý là ông Long.'],
    'grounded': ['He was grounded after coming home late.', 'Cậu ấy bị cấm ra ngoài sau khi về nhà muộn.'],
    'to allow': ['The school does not allow students to smoke.', 'Trường không cho phép học sinh hút thuốc.'],
    'a custom': ['Removing shoes before entering a house is a local custom.', 'Cởi giày trước khi vào nhà là một tập quán địa phương.'],
    'old-fashioned': ['Some people think this rule is old-fashioned.', 'Một số người nghĩ quy tắc này đã lỗi thời.']
  };
  if (examples[word]) {
    return { sentence: examples[word][0], translation: examples[word][1] };
  }
  if (word.startsWith('to ')) {
    return {
      sentence: `I need ${word} before the deadline.`,
      translation: `Tôi cần ${meaning} trước hạn chót.`
    };
  }
  return {
    sentence: `We discussed ${word} in class today.`,
    translation: `Hôm nay chúng tôi thảo luận về ${meaning} trong lớp.`
  };
}

/** Nút nghe an toàn — KHÔNG dùng onclick + JSON.stringify (gãy HTML/JS) */
function speakButton(text, label, extraClass) {
  const t = String(text ?? '').trim();
  if (!t) return '';
  const cls = extraClass ? `btn btn-speak ${extraClass}` : 'btn btn-speak';
  const lab = label || '🔊 Nghe';
  return `<button type="button" class="${cls}" data-speak="${escapeAttr(t)}">${lab}</button>`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== HOME PAGE =====
async function legacyInitHome() {
  const vocab = await loadVocabulary();
  const topics = getTopics(vocab);
  const grid = document.getElementById('topics-grid');
  if (grid) {
    grid.innerHTML = topics.map(topic => {
      const count = vocab.filter(v => v.topic === topic).length;
      return `
        <a href="vocabulary.html?topic=${encodeURIComponent(topic)}" class="topic-card">
          <h3>${escapeHtml(topic)}</h3>
          <span>${count} từ</span>
        </a>
      `;
    }).join('');
    grid.innerHTML += `
      <a href="vocabulary.html" class="topic-card">
        <h3>Tất cả</h3>
        <span>${vocab.length} từ</span>
      </a>
    `;
  }

  const structures = await loadStructuresData();
  const sGrid = document.getElementById('structures-home-grid');
  if (sGrid) {
    const units = getStructureUnits(structures);
    if (units.length === 0) {
      sGrid.innerHTML = `<p style="color:#64748b;grid-column:1/-1;">Chưa có cấu trúc. Admin hãy import JSON.</p>`;
    } else {
      sGrid.innerHTML = units.map(unit => {
        const count = structures.filter(s => s.unit === unit).length;
        return `
          <a href="structures.html?unit=${encodeURIComponent(unit)}" class="topic-card">
            <h3>${escapeHtml(unit)}</h3>
            <span>${count} cấu trúc</span>
          </a>
        `;
      }).join('');
      sGrid.innerHTML += `
        <a href="structures.html" class="topic-card">
          <h3>Tất cả</h3>
          <span>${structures.length} cấu trúc</span>
        </a>
      `;
    }
  }
}

async function initHome() {
  const courses = await loadCourses();
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = courses.map(course => `
    <a href="course.html?course=${encodeURIComponent(course.id)}" class="topic-card course-card">
      <span class="course-card-kicker">Giáo trình</span>
      <h3>${escapeHtml(course.name)}</h3>
      <span>${escapeHtml(course.description || '')}</span>
      <span class="course-card-link">Khám phá lộ trình</span>
    </a>
  `).join('');
}

async function initCourseHome() {
  const course = await resolveCurrentCourse();
  const [vocab, structures, quizzes] = await Promise.all([
    loadVocabulary(), loadStructuresData(), typeof ensureQuizzesLoaded === 'function' ? ensureQuizzesLoaded() : Promise.resolve([])
  ]);
  const courseVocab = vocab.filter(item => getItemCourse(item) === course.id);
  const courseStructures = structures.filter(item => getItemCourse(item) === course.id);
  const courseQuizzes = quizzes.filter(item => getItemCourse(item) === course.id);

  document.getElementById('course-name').textContent = course.name;
  document.getElementById('course-description').textContent = course.description || '';
  document.getElementById('nav-vocabulary').href = courseUrl('vocabulary.html');
  document.getElementById('nav-structures').href = courseUrl('structures.html');
  document.getElementById('nav-quiz').href = courseUrl('quiz.html');

  const unitTitles = {
    topnotch3: {
      'Unit 1': 'Make Small Talk',
      'Unit 2': 'Health Matters',
      'Unit 3': 'Getting Things Done',
      'Unit 4': 'Reading for Pleasure',
      'Unit 5': 'Natural Disasters',
      'Unit 6': 'Life Plans',
      'Unit 7': 'Holidays and Traditions'
    }
  };
  const units = sortUnits([...new Set([
    ...courseVocab.map(item => item.topic),
    ...courseStructures.map(item => item.unit)
  ])]);
  const title = document.getElementById('course-progress-title');
  if (title) title.textContent = course.id === 'summit1'
    ? 'Học theo Unit - Summit 1'
    : 'Lộ trình học theo Unit';

  document.getElementById('course-learning-grid').innerHTML = units.map(unit => {
    const vocabCount = courseVocab.filter(item => item.topic === unit).length;
    const structureCount = courseStructures.filter(item => item.unit === unit).length;
    const quizCount = courseQuizzes.filter(item => item.topic === unit).length;
    const unitLabel = unitTitles[course.id]?.[unit] || unit;
    return `
      <article class="topic-card course-unit-card">
        <h3>${escapeHtml(unit)}</h3>
        ${unitLabel !== unit ? `<p class="course-unit-topic">${escapeHtml(unitLabel)}</p>` : ''}
        <span>${vocabCount} từ vựng · ${structureCount} grammar · ${quizCount} quiz</span>
        <div class="course-unit-actions">
          <a class="btn btn-outline btn-sm" href="${courseUrl('vocabulary.html')}&topic=${encodeURIComponent(unit)}">Từ vựng</a>
          <a class="btn btn-outline btn-sm" href="${courseUrl('structures.html')}&unit=${encodeURIComponent(unit)}">Grammar</a>
          <a class="btn btn-primary btn-sm" href="${courseUrl('quiz.html')}&topic=${encodeURIComponent(unit)}">Quiz</a>
        </div>
      </article>
    `;
  }).join('');
}

// ===== VOCABULARY PAGE =====
let currentVocab = [];
let filteredVocab = [];
let flashIndex = 0;

async function initVocabulary() {
  await resolveCurrentCourse();
  renderCourseSwitcher();
  currentVocab = (await loadVocabulary()).filter(item => getItemCourse(item) === currentCourseId);
  const heading = document.querySelector('.page-header h1');
  if (heading) heading.textContent = `Từ vựng — ${currentCourse.name}`;
  const urlParams = new URLSearchParams(window.location.search);
  const topic = urlParams.get('topic');

  const topicSelect = document.getElementById('filter-topic');
  if (topicSelect) {
    const topics = getTopics(currentVocab);
    topicSelect.innerHTML = `<option value="">Tất cả chủ đề</option>` +
      topics.map(t => `<option value="${escapeHtml(t)}" ${t === topic ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
  }

  filterWords();
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
    ${(() => {
      const example = getVocabularyExample(v);
      return `
    <div class="word-card">
      <div class="word-info">
        <h3>${escapeHtml(v.word)}</h3>
        <div class="phonetic">${escapeHtml(v.phonetic || '')}</div>
        <div class="meaning">${escapeHtml(v.meaning)}</div>
        <div class="example">"${escapeHtml(example.sentence)}"<br><small>${escapeHtml(example.translation)}</small></div>
      </div>
      <div class="word-actions">
        ${speakButton(v.word, '🔊 Nghe')}
        <span style="font-size:0.85rem;color:#94a3b8;">${escapeHtml(v.topic)}</span>
      </div>
    </div>`;
    })()}
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
  if (!card) return;
  if (filteredVocab.length === 0) {
    card.innerHTML = `<div class="flashcard-face flashcard-front"><h2>Không có từ</h2></div>`;
    return;
  }

  const v = filteredVocab[flashIndex];
  const example = getVocabularyExample(v);
  card.classList.remove('flipped');
  card.innerHTML = `
    <div class="flashcard-face flashcard-front">
      <h2>${escapeHtml(v.word)}</h2>
      <div class="phonetic">${escapeHtml(v.phonetic || '')}</div>
      <div style="margin-top:16px;">${speakButton(v.word, '🔊 Nghe phát âm')}</div>
    </div>
    <div class="flashcard-face flashcard-back">
      <div class="meaning">${escapeHtml(v.meaning)}</div>
      <div class="example">"${escapeHtml(example.sentence)}"</div>
      <div style="margin-top:6px;font-size:0.95rem;color:#64748b;">${escapeHtml(example.translation)}</div>
    </div>
  `;

  if (counter) counter.textContent = `${flashIndex + 1} / ${filteredVocab.length}`;
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

// ===== STRUCTURES PAGE =====
let allStructures = [];
let filteredStructures = [];
let structFlashIndex = 0;

async function initStructures() {
  await resolveCurrentCourse();
  renderCourseSwitcher();
  allStructures = (await loadStructuresData()).filter(item => getItemCourse(item) === currentCourseId);
  const heading = document.querySelector('.page-header h1');
  if (heading) heading.textContent = `Cấu trúc câu — ${currentCourse.name}`;
  const urlParams = new URLSearchParams(window.location.search);
  const unit = urlParams.get('unit');

  const unitSelect = document.getElementById('filter-struct-unit');
  if (unitSelect) {
    const units = getStructureUnits(allStructures);
    unitSelect.innerHTML = `<option value="">Tất cả unit</option>` +
      units.map(u => `<option value="${escapeHtml(u)}" ${u === unit ? 'selected' : ''}>${escapeHtml(u)}</option>`).join('');
  }

  filterStructures();
  document.getElementById('filter-struct-unit')?.addEventListener('change', filterStructures);
  document.getElementById('search-struct')?.addEventListener('input', filterStructures);
  document.getElementById('btn-struct-list')?.addEventListener('click', showStructListMode);
  document.getElementById('btn-struct-flash')?.addEventListener('click', showStructFlashMode);
}

function filterStructures() {
  const unit = document.getElementById('filter-struct-unit')?.value || '';
  const search = (document.getElementById('search-struct')?.value || '').toLowerCase().trim();

  filteredStructures = allStructures.filter(s => {
    const matchUnit = !unit || s.unit === unit;
    const blob = [s.name, s.pattern, s.meaning, s.form, s.example, s.usage, s.notes]
      .map(x => String(x || '').toLowerCase()).join(' ');
    const matchSearch = !search || blob.includes(search);
    return matchUnit && matchSearch;
  });

  // Sort by unit then id
  filteredStructures.sort((a, b) => {
    const u = sortUnits([a.unit, b.unit]);
    if (a.unit !== b.unit) return u[0] === a.unit ? -1 : 1;
    return (a.id || 0) - (b.id || 0);
  });

  renderStructureList();
  if (document.getElementById('struct-flash-section')?.style.display !== 'none') {
    structFlashIndex = 0;
    renderStructFlashcard();
  }
}

function renderStructureList() {
  const list = document.getElementById('structure-list');
  if (!list) return;

  if (filteredStructures.length === 0) {
    list.innerHTML = `<p style="text-align:center;padding:40px;color:#64748b;">Chưa có cấu trúc nào. Admin hãy import file JSON.</p>`;
    return;
  }

  list.innerHTML = filteredStructures.map(s => `
    <article class="structure-card">
      <div class="structure-card-top">
        <span class="structure-unit-badge">${escapeHtml(s.unit)}</span>
        <h3>${escapeHtml(s.name || s.pattern)}</h3>
      </div>
      <div class="structure-pattern">${escapeHtml(s.pattern || '')}</div>
      ${s.form ? `<div class="structure-form"><strong>Dạng:</strong> ${escapeHtml(s.form)}</div>` : ''}
      <div class="structure-meaning">${escapeHtml(s.meaning || '')}</div>
      ${s.example ? `
        <div class="structure-example">
          ${s.example ? speakButton(s.example, '🔊', 'btn-sm') : ''}
          <div>
            <div>"${escapeHtml(s.example)}"</div>
            ${s.example_vi ? `<small>${escapeHtml(s.example_vi)}</small>` : ''}
          </div>
        </div>
      ` : ''}
      ${s.usage ? `<div class="structure-usage"><strong>Cách dùng:</strong> ${escapeHtml(s.usage)}</div>` : ''}
      ${s.notes ? `<div class="structure-notes">${escapeHtml(s.notes)}</div>` : ''}
      <div style="margin-top:12px;">
        ${speakButton(s.example || s.pattern || s.name, '🔊 Nghe', 'btn-sm')}
      </div>
    </article>
  `).join('');
}

function showStructListMode() {
  document.getElementById('struct-list-section').style.display = 'block';
  document.getElementById('struct-flash-section').style.display = 'none';
  document.getElementById('btn-struct-list')?.classList.add('btn-primary');
  document.getElementById('btn-struct-list')?.classList.remove('btn-outline');
  document.getElementById('btn-struct-flash')?.classList.add('btn-outline');
  document.getElementById('btn-struct-flash')?.classList.remove('btn-primary');
}

function showStructFlashMode() {
  document.getElementById('struct-list-section').style.display = 'none';
  document.getElementById('struct-flash-section').style.display = 'block';
  document.getElementById('btn-struct-flash')?.classList.add('btn-primary');
  document.getElementById('btn-struct-flash')?.classList.remove('btn-outline');
  document.getElementById('btn-struct-list')?.classList.add('btn-outline');
  document.getElementById('btn-struct-list')?.classList.remove('btn-primary');
  structFlashIndex = 0;
  renderStructFlashcard();
}

function renderStructFlashcard() {
  const card = document.getElementById('struct-flashcard');
  const counter = document.getElementById('struct-flash-counter');
  if (!card) return;

  if (filteredStructures.length === 0) {
    card.innerHTML = `<div class="flashcard-face flashcard-front"><h2>Không có cấu trúc</h2></div>`;
    return;
  }

  const s = filteredStructures[structFlashIndex];
  card.classList.remove('flipped');
  card.innerHTML = `
    <div class="flashcard-face flashcard-front">
      <div class="structure-unit-badge" style="margin-bottom:10px;">${escapeHtml(s.unit)}</div>
      <h2 style="font-size:1.5rem;">${escapeHtml(s.name || '')}</h2>
      <div class="phonetic" style="margin-top:10px;font-size:1.05rem;">${escapeHtml(s.pattern || '')}</div>
      ${speakButton(s.example || s.pattern || s.name, '🔊 Nghe')}
    </div>
    <div class="flashcard-face flashcard-back">
      <div class="meaning" style="font-size:1.25rem;">${escapeHtml(s.meaning || '')}</div>
      ${s.form ? `<div style="margin-top:10px;color:#475569;">${escapeHtml(s.form)}</div>` : ''}
      ${s.example ? `<div class="example" style="margin-top:12px;">"${escapeHtml(s.example)}"</div>` : ''}
      ${s.example_vi ? `<div style="margin-top:6px;font-size:0.95rem;color:#64748b;">${escapeHtml(s.example_vi)}</div>` : ''}
    </div>
  `;

  if (counter) counter.textContent = `${structFlashIndex + 1} / ${filteredStructures.length}`;
}

function flipStructCard() {
  document.getElementById('struct-flashcard')?.classList.toggle('flipped');
}

function nextStructCard() {
  if (filteredStructures.length === 0) return;
  structFlashIndex = (structFlashIndex + 1) % filteredStructures.length;
  renderStructFlashcard();
}

function prevStructCard() {
  if (filteredStructures.length === 0) return;
  structFlashIndex = (structFlashIndex - 1 + filteredStructures.length) % filteredStructures.length;
  renderStructFlashcard();
}

// ===== QUIZ PAGE =====
let allVocabForQuiz = [];
let allStructuresForQuiz = [];
let currentQuizMeta = null;
let quizData = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let quizAnswers = [];
let currentOptions = [];
let timerSeconds = 0;
let timerInterval = null;
let timerEnabled = false;
let quizFinished = false;

async function prepareQuizVocab() {
  await resolveCurrentCourse();
  renderCourseSwitcher();
  allVocabForQuiz = (await loadVocabulary()).filter(item => getItemCourse(item) === currentCourseId);
  allStructuresForQuiz = (await loadStructuresData()).filter(item => getItemCourse(item) === currentCourseId);
  const heading = document.querySelector('.page-header h1');
  if (heading) heading.textContent = `Luyện tập — ${currentCourse.name}`;
  window._allVocab = allVocabForQuiz;
  if (typeof ensureQuizzesLoaded === 'function') {
    await ensureQuizzesLoaded();
  }
  renderUserQuizList();
}

function hideQuizSections() {
  ['quiz-list-user', 'quiz-box', 'quiz-result-section'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function renderUserQuizList() {
  hideQuizSections();
  stopQuizTimer();
  quizFinished = false;
  currentQuizMeta = null;

  const section = document.getElementById('quiz-list-user');
  const container = document.getElementById('quiz-list-container');
  if (section) section.style.display = 'block';
  if (!container) return;

  const selectedTopic = new URLSearchParams(window.location.search).get('topic') || '';
  const quizzes = (typeof loadQuizzes === 'function' ? loadQuizzes() : [])
    .filter(item => getItemCourse(item) === currentCourseId)
    .filter(item => !selectedTopic || item.topic === selectedTopic);

  if (quizzes.length === 0) {
    container.innerHTML = `
      <div class="quiz-empty">
        <p style="font-size:1.15rem; margin-bottom:8px;">Chưa có bài tập nào.</p>
        <p>Admin tạo bài trong <a href="admin.html">Admin</a> hoặc import file <code>data/quizzes.json</code> rồi commit GitHub.</p>
      </div>
    `;
    return;
  }

  const byTopic = {};
  quizzes.forEach(q => {
    const key = q.topic || 'Tất cả';
    if (!byTopic[key]) byTopic[key] = [];
    byTopic[key].push(q);
  });

  const topics = sortUnits(Object.keys(byTopic));

  container.innerHTML = topics.map(topic => {
    const items = byTopic[topic].slice().sort((a, b) => b.id - a.id);
    return `
      <div class="quiz-unit-group">
        <h2 class="quiz-unit-group-title">${escapeHtml(topic)}</h2>
        <div class="quiz-user-list">
          ${items.map(q => {
            const type = q.type === 'structure' ? 'structure' : 'vocab';
            const typeLabel = typeof quizTypeLabel === 'function' ? quizTypeLabel(type) : type;
            const timerLabel = typeof formatTimerLabel === 'function' ? formatTimerLabel(q.timerSeconds ?? 0) : '';
            return `
              <div class="quiz-user-card">
                <div class="quiz-user-card-info">
                  <h3>${escapeHtml(q.title)}
                    <span class="quiz-type-badge ${type}">${escapeHtml(typeLabel)}</span>
                  </h3>
                  <p>
                    <span>${q.count} câu</span>
                    <span class="dot">·</span>
                    <span>⏱ ${escapeHtml(timerLabel)}</span>
                    <span class="dot">·</span>
                    <span class="muted">${escapeHtml(q.createdAt || '')}</span>
                  </p>
                </div>
                <button type="button" class="btn btn-primary" onclick="startUserQuiz(${q.id})">Làm bài</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function startUserQuiz(quizId) {
  const quiz = getQuizById(quizId);
  if (!quiz) {
    alert('Không tìm thấy bài tập.');
    return;
  }

  currentQuizMeta = quiz;
  const type = quiz.type === 'structure' ? 'structure' : 'vocab';
  const topic = quiz.topic || '';

  let pool;
  if (type === 'structure') {
    pool = topic
      ? allStructuresForQuiz.filter(s => s.unit === topic)
      : allStructuresForQuiz;
    if (pool.length < 2) {
      alert('Unit này không đủ cấu trúc để làm bài (cần ít nhất 2).');
      return;
    }
  } else {
    pool = topic
      ? allVocabForQuiz.filter(v => v.topic === topic)
      : allVocabForQuiz;
    if (pool.length < 4) {
      alert('Unit này không đủ từ để làm bài (cần ít nhất 4 từ).');
      return;
    }
  }

  const count = Math.min(Math.max(1, quiz.count || 10), pool.length);
  const seconds = Math.max(0, parseInt(quiz.timerSeconds, 10) || 0);

  // Chuẩn hoá item quiz: prompt + meaning
  quizData = shuffle([...pool]).slice(0, count).map(item => {
    if (type === 'structure') {
      return {
        id: item.id,
        prompt: item.pattern || item.name,
        name: item.name || '',
        meaning: item.meaning,
        example: item.example || '',
        topic: item.unit,
        kind: 'structure'
      };
    }
    return {
      id: item.id,
      prompt: item.word,
      name: item.word,
      meaning: item.meaning,
      example: item.example || '',
      topic: item.topic,
      kind: 'vocab'
    };
  });

  quizIndex = 0;
  quizScore = 0;
  quizAnswers = [];
  quizFinished = false;
  timerSeconds = seconds;
  timerEnabled = seconds > 0;

  hideQuizSections();
  const box = document.getElementById('quiz-box');
  if (box) box.style.display = 'block';

  stopQuizTimer();
  if (timerEnabled) startQuizTimer();
  showQuestion();
}

function startQuizTimer() {
  stopQuizTimer();
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      stopQuizTimer();
      finishQuiz(true);
    }
  }, 1000);
}

function stopQuizTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(totalSec) {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const el = document.getElementById('quiz-timer-display');
  if (!el) return;
  el.textContent = formatTime(timerSeconds);
  el.classList.toggle('timer-warning', timerSeconds <= 30 && timerSeconds > 0);
  el.classList.toggle('timer-danger', timerSeconds <= 10 && timerSeconds > 0);
}

function buildOptions(question) {
  const options = [question.meaning];
  const isStruct = question.kind === 'structure' || currentQuizMeta?.type === 'structure';
  const poolAll = isStruct ? allStructuresForQuiz : allVocabForQuiz;
  const topicKey = isStruct ? 'unit' : 'topic';
  const topic = currentQuizMeta?.topic || question.topic || '';

  const same = poolAll.filter(v => v[topicKey] === topic && v.id !== question.id);
  const others = poolAll.filter(v => v.id !== question.id && v[topicKey] !== topic);
  const pool = shuffle([...same, ...others]);

  for (const o of pool) {
    if (options.length >= 4) break;
    if (o.meaning && !options.includes(o.meaning)) options.push(o.meaning);
  }
  while (options.length < Math.min(4, poolAll.length) && poolAll.length > 0) {
    const extra = poolAll[Math.floor(Math.random() * poolAll.length)].meaning;
    if (extra && !options.includes(extra)) options.push(extra);
    else break;
  }
  return shuffle(options);
}

function showQuestion() {
  if (quizFinished) return;
  quizAnswered = false;
  const q = quizData[quizIndex];
  const box = document.getElementById('quiz-box');
  if (!box || !q) return;

  currentOptions = buildOptions(q);
  const pointPerQuestion = 10 / quizData.length;
  const currentPoints = (quizScore * pointPerQuestion).toFixed(1);
  const title = currentQuizMeta?.title || 'Quiz';
  const isStruct = q.kind === 'structure';

  box.innerHTML = `
    <div class="quiz-topbar">
      <div class="quiz-progress">
        <span>${escapeHtml(title)}</span>
        · Câu ${quizIndex + 1} / ${quizData.length}
        · Điểm: ${currentPoints}/10
      </div>
      ${timerEnabled ? `
        <div class="quiz-timer" id="quiz-timer-display" aria-live="polite">
          ${formatTime(timerSeconds)}
        </div>
      ` : ''}
    </div>
    <div class="quiz-question">
      ${isStruct
        ? `Cấu trúc <strong class="quiz-word">${escapeHtml(q.prompt)}</strong>${q.name && q.name !== q.prompt ? `<span class="quiz-sub">(${escapeHtml(q.name)})</span>` : ''} nghĩa / dùng để?
           ${q.example ? speakButton(q.example, '🔊', 'btn-sm') : ''}`
        : `Từ <strong class="quiz-word">${escapeHtml(q.prompt)}</strong> có nghĩa là gì?
           ${speakButton(q.prompt, '🔊', 'btn-sm')}`
      }
    </div>
    <div class="quiz-options" id="quiz-options">
      ${currentOptions.map((opt, i) => `
        <button type="button" class="quiz-option" data-index="${i}" onclick="checkAnswer(${i})">
          ${escapeHtml(opt)}
        </button>
      `).join('')}
    </div>
  `;

  if (timerEnabled) updateTimerDisplay();
}

function checkAnswer(optionIndex) {
  if (quizAnswered || quizFinished) return;
  quizAnswered = true;

  const q = quizData[quizIndex];
  const selected = currentOptions[optionIndex];
  const correct = q.meaning;
  const isCorrect = selected === correct;

  if (isCorrect) quizScore++;

  quizAnswers.push({
    word: q.prompt,
    name: q.name || '',
    meaning: correct,
    selected,
    isCorrect,
    skipped: false,
    kind: q.kind
  });

  document.querySelectorAll('.quiz-option').forEach((btn, i) => {
    btn.style.pointerEvents = 'none';
    if (currentOptions[i] === correct) btn.classList.add('correct');
    if (i === optionIndex && !isCorrect) btn.classList.add('wrong');
  });

  setTimeout(() => {
    if (quizFinished) return;
    const box = document.getElementById('quiz-box');
    if (!box) return;
    const nextWrap = document.createElement('div');
    nextWrap.className = 'quiz-next-wrap';
    if (quizIndex < quizData.length - 1) {
      nextWrap.innerHTML = `<button type="button" class="btn btn-primary" onclick="nextQuestion()">Câu tiếp theo →</button>`;
    } else {
      nextWrap.innerHTML = `<button type="button" class="btn btn-success" onclick="finishQuiz(false)">Xem kết quả</button>`;
    }
    box.appendChild(nextWrap);
  }, 500);
}

function nextQuestion() {
  if (quizFinished) return;
  quizIndex++;
  showQuestion();
}

function finishQuiz(timedOut) {
  if (quizFinished) return;
  quizFinished = true;
  stopQuizTimer();

  while (quizAnswers.length < quizData.length) {
    const q = quizData[quizAnswers.length];
    quizAnswers.push({
      word: q.prompt,
      name: q.name || '',
      meaning: q.meaning,
      selected: null,
      isCorrect: false,
      skipped: true,
      kind: q.kind
    });
  }

  showResult(timedOut);
}

function showResult(timedOut) {
  hideQuizSections();
  const section = document.getElementById('quiz-result-section');
  if (!section) return;
  section.style.display = 'block';

  const total = quizData.length;
  const pointPerQuestion = total ? 10 / total : 0;
  const finalScore = parseFloat((quizScore * pointPerQuestion).toFixed(1));
  const isPass = finalScore >= 8;
  const color = isPass ? '#16a34a' : '#dc2626';
  const message = isPass
    ? '🎉 Chúc mừng! Bạn đã Pass bài này!'
    : 'Hãy xem lại các câu sai bên dưới và ôn tiếp nhé!';

  const wrongCount = quizAnswers.filter(a => !a.isCorrect).length;
  const topic = currentQuizMeta?.topic || '';
  const title = currentQuizMeta?.title || topic || 'Bài tập';
  const quizId = currentQuizMeta?.id;
  const isStruct = currentQuizMeta?.type === 'structure';
  const reviewLink = topic
    ? (isStruct
      ? `${courseUrl('structures.html')}&unit=${encodeURIComponent(topic)}`
      : `${courseUrl('vocabulary.html')}&topic=${encodeURIComponent(topic)}`)
    : courseUrl(isStruct ? 'structures.html' : 'vocabulary.html');
  const reviewLabel = isStruct ? 'Ôn cấu trúc unit này' : 'Ôn từ unit này';

  section.innerHTML = `
    <div class="quiz-result-card">
      <div class="quiz-result">
        <h2>Kết quả — ${escapeHtml(title)}</h2>
        ${timedOut ? '<p class="quiz-timeout-note">⏰ Hết giờ! Bài đã được nộp tự động.</p>' : ''}
        <p class="quiz-score-line">Đúng: <strong>${quizScore}</strong> · Sai / chưa làm: <strong>${wrongCount}</strong> · Tổng: <strong>${total}</strong></p>
        <p class="quiz-score-big" style="color:${color};">${finalScore} / 10 điểm</p>
        <p class="quiz-pass-line" style="color:${color};">${isPass ? 'PASS' : 'FAIL'} — ${message}</p>
        <p class="quiz-score-hint">(Thang điểm 10 · Từ 8 điểm trở lên = Pass)</p>
        <div class="quiz-result-actions">
          ${quizId != null ? `<button type="button" class="btn btn-primary" onclick="startUserQuiz(${quizId})">Làm lại bài này</button>` : ''}
          <button type="button" class="btn btn-outline" onclick="renderUserQuizList()">Chọn bài khác</button>
          <a href="${reviewLink}" class="btn btn-outline">${reviewLabel}</a>
        </div>
      </div>
      <div class="quiz-review">
        <h3>Chi tiết từng câu — học lại phần sai</h3>
        <div class="quiz-review-list">
          ${quizAnswers.map((a, i) => `
            <div class="quiz-review-item ${a.isCorrect ? 'is-correct' : 'is-wrong'}">
              <div class="quiz-review-head">
                <span class="quiz-review-num">Câu ${i + 1}</span>
                <span class="quiz-review-badge">${a.isCorrect ? '✓ Đúng' : (a.skipped ? '○ Chưa làm' : '✗ Sai')}</span>
              </div>
              <div class="quiz-review-word">
                <strong>${escapeHtml(a.word)}</strong>
                ${speakButton(a.word, '🔊', 'btn-sm')}
              </div>
              <div class="quiz-review-row">
                <span class="label">Đáp án đúng:</span>
                <span class="value correct-text">${escapeHtml(a.meaning)}</span>
              </div>
              <div class="quiz-review-row">
                <span class="label">Bạn chọn:</span>
                <span class="value ${a.isCorrect ? 'correct-text' : 'wrong-text'}">
                  ${a.selected != null ? escapeHtml(a.selected) : '<em>Không trả lời</em>'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Khởi tạo theo trang — luôn bootstrap data (vocab + structures + quizzes) trước
document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (typeof bootstrapAppData === 'function') {
      await bootstrapAppData();
    }
  } catch (e) {
    console.error('bootstrapAppData failed', e);
  }

  const path = window.location.pathname;
  if (path.includes('index.html') || path.endsWith('/') || path.endsWith('practiceEnglisheasy')) {
    initHome();
  } else if (path.includes('course.html')) {
    initCourseHome();
  } else if (path.includes('vocabulary.html')) {
    initVocabulary();
  } else if (path.includes('structures.html')) {
    initStructures();
  } else if (path.includes('quiz.html')) {
    prepareQuizVocab();
  }
});
