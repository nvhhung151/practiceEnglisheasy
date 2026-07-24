// ===== Quiz Manager (dùng chung cho Admin + User) =====

const QUIZ_STORAGE_KEY = 'english_easy_quizzes';
const VOCAB_STORAGE_KEY = 'english_easy_vocab';

function loadQuizzes() {
  try {
    return JSON.parse(localStorage.getItem(QUIZ_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveQuizzes(list) {
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(list));
}

function loadVocab() {
  try {
    return JSON.parse(localStorage.getItem(VOCAB_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// Tạo bài quiz mới (Admin dùng)
function createQuiz(title, topic, count) {
  const quizzes = loadQuizzes();
  const vocab = loadVocab();
  const pool = topic ? vocab.filter(v => v.topic === topic) : vocab;

  if (pool.length < 4) {
    alert('Chủ đề này cần ít nhất 4 từ để tạo bài.');
    return false;
  }

  count = Math.min(count, pool.length);
  count = Math.max(1, count);

  const newQuiz = {
    id: Date.now(),
    title: title || `${topic || 'Tất cả'} - ${count} câu`,
    topic: topic || '',
    count: count,
    createdAt: new Date().toLocaleString('vi-VN')
  };

  quizzes.push(newQuiz);
  saveQuizzes(quizzes);
  return true;
}

function deleteQuiz(id) {
  let quizzes = loadQuizzes();
  quizzes = quizzes.filter(q => q.id !== id);
  saveQuizzes(quizzes);
}

function getQuizById(id) {
  return loadQuizzes().find(q => q.id === id);
}
