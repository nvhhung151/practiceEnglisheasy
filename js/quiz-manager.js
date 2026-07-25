// ===== Data + Quiz Manager (dùng chung Admin + User) =====

const QUIZ_STORAGE_KEY = 'english_easy_quizzes';
const VOCAB_STORAGE_KEY = 'english_easy_vocab';
const STRUCTURE_STORAGE_KEY = 'english_easy_structures';
/** Tăng version khi ship data mới trên GitHub → trình duyệt tự nạp lại file JSON */
const DATA_VERSION = '2026-07-25-v3-speak-quizcount';
const DATA_VERSION_KEY = 'english_easy_data_version';

function isDataVersionCurrent() {
  return localStorage.getItem(DATA_VERSION_KEY) === DATA_VERSION;
}

function markDataVersionCurrent() {
  localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
}

function parseStorageArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function fetchJsonArray(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${url} không phải mảng JSON`);
  return data;
}

/**
 * Nạp mảng từ localStorage hoặc file data/*.json
 * - Version mới / local rỗng / local lỗi → lấy từ file (vĩnh viễn trên GitHub)
 * - forceFile = true → luôn lấy file
 */
async function loadJsonDataset(storageKey, fileUrl, { forceFile = false } = {}) {
  const versionOk = isDataVersionCurrent();

  if (!forceFile && versionOk) {
    const local = parseStorageArray(storageKey);
    if (local && local.length > 0) return local;
  }

  try {
    const data = await fetchJsonArray(fileUrl);
    localStorage.setItem(storageKey, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error(`Không load được ${fileUrl}`, e);
    // fallback local dù rỗng
    const local = parseStorageArray(storageKey);
    return local || [];
  }
}

/** Gọi 1 lần khi mở app: đồng bộ version + 3 file data nếu cần */
async function bootstrapAppData() {
  if (!isDataVersionCurrent()) {
    // Xóa cache cũ (có thể là [] hoặc data lỗi) rồi nạp lại từ file
    localStorage.removeItem(VOCAB_STORAGE_KEY);
    localStorage.removeItem(STRUCTURE_STORAGE_KEY);
    localStorage.removeItem(QUIZ_STORAGE_KEY);
  }

  const [vocab, structures, quizzes] = await Promise.all([
    loadJsonDataset(VOCAB_STORAGE_KEY, 'data/vocabulary.json'),
    loadJsonDataset(STRUCTURE_STORAGE_KEY, 'data/structures.json'),
    loadJsonDataset(QUIZ_STORAGE_KEY, 'data/quizzes.json')
  ]);

  markDataVersionCurrent();
  return { vocab, structures, quizzes };
}

// ---------- Vocab ----------
async function ensureVocabLoaded(forceFile = false) {
  return loadJsonDataset(VOCAB_STORAGE_KEY, 'data/vocabulary.json', { forceFile });
}

function loadVocab() {
  return parseStorageArray(VOCAB_STORAGE_KEY) || [];
}

function saveVocab(list) {
  localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(list));
}

// ---------- Structures ----------
async function ensureStructuresLoaded(forceFile = false) {
  return loadJsonDataset(STRUCTURE_STORAGE_KEY, 'data/structures.json', { forceFile });
}

function loadStructuresSync() {
  return parseStorageArray(STRUCTURE_STORAGE_KEY) || [];
}

function loadStructures() {
  return loadStructuresSync();
}

function saveStructures(list) {
  localStorage.setItem(STRUCTURE_STORAGE_KEY, JSON.stringify(list));
}

// ---------- Quizzes ----------
function loadQuizzesSync() {
  return parseStorageArray(QUIZ_STORAGE_KEY) || [];
}

function loadQuizzes() {
  return loadQuizzesSync();
}

function saveQuizzes(list) {
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(list));
}

async function ensureQuizzesLoaded(forceFile = false) {
  return loadJsonDataset(QUIZ_STORAGE_KEY, 'data/quizzes.json', { forceFile });
}

/**
 * Tạo bài quiz (Admin)
 * @param {'vocab'|'structure'} type
 */
function createQuiz(title, topic, count, timerSeconds = 0, type = 'vocab') {
  const quizzes = loadQuizzesSync();
  type = type === 'structure' ? 'structure' : 'vocab';

  let pool;
  if (type === 'structure') {
    const structures = loadStructuresSync();
    pool = topic ? structures.filter(s => s.unit === topic) : structures;
  } else {
    const vocab = loadVocab();
    pool = topic ? vocab.filter(v => v.topic === topic) : vocab;
  }

  const minNeed = type === 'structure' ? 2 : 4;
  if (pool.length < minNeed) {
    alert(
      type === 'structure'
        ? 'Unit này cần ít nhất 2 cấu trúc để tạo bài quiz.'
        : 'Unit/chủ đề này cần ít nhất 4 từ để tạo bài quiz.'
    );
    return false;
  }

  count = Math.min(count, pool.length);
  count = Math.max(1, count);
  timerSeconds = Math.max(0, parseInt(timerSeconds, 10) || 0);

  const typeLabel = type === 'structure' ? 'Cấu trúc' : 'Từ vựng';
  const newQuiz = {
    id: Date.now(),
    title: title || `${topic || 'Tất cả'} - ${typeLabel} - ${count} câu`,
    type,
    topic: topic || '',
    count,
    timerSeconds,
    createdAt: new Date().toLocaleString('vi-VN')
  };

  quizzes.push(newQuiz);
  saveQuizzes(quizzes);
  return true;
}

function deleteQuiz(id) {
  saveQuizzes(loadQuizzesSync().filter(q => q.id !== id));
}

function getQuizById(id) {
  return loadQuizzesSync().find(q => q.id === Number(id) || q.id === id);
}

function formatTimerLabel(seconds) {
  const s = parseInt(seconds, 10) || 0;
  if (s <= 0) return 'Không giới hạn';
  if (s < 60) return `${s} giây`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (r === 0) return `${m} phút`;
  return `${m} phút ${r} giây`;
}

function quizTypeLabel(type) {
  return type === 'structure' ? 'Cấu trúc câu' : 'Từ vựng';
}
