const SUBJECTS_KEY = 'preppilot_subjects';
const ATTEMPTS_KEY = 'preppilot_attempts';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSubjects() {
  return read(SUBJECTS_KEY, []);
}

export function saveSubjects(subjects) {
  write(SUBJECTS_KEY, subjects);
}

export function addSubject(subject) {
  const subjects = getSubjects();
  subjects.push(subject);
  saveSubjects(subjects);
  return subjects;
}

export function deleteSubject(subjectId) {
  const subjects = getSubjects().filter((s) => s.id !== subjectId);
  saveSubjects(subjects);
  return subjects;
}

export function addTopic(subjectId, topicName) {
  const subjects = getSubjects();
  const subject = subjects.find((s) => s.id === subjectId);
  if (subject) {
    subject.topics.push({ id: crypto.randomUUID(), name: topicName });
    saveSubjects(subjects);
  }
  return subjects;
}

export function deleteTopic(subjectId, topicId) {
  const subjects = getSubjects();
  const subject = subjects.find((s) => s.id === subjectId);
  if (subject) {
    subject.topics = subject.topics.filter((t) => t.id !== topicId);
    saveSubjects(subjects);
  }
  return subjects;
}

export function getAttempts() {
  return read(ATTEMPTS_KEY, []);
}

export function addAttempt(attempt) {
  const attempts = getAttempts();
  attempts.push(attempt);
  write(ATTEMPTS_KEY, attempts);
  return attempts;
}
