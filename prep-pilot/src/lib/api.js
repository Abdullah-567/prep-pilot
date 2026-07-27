async function callAI(action, payload) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export function generateQuiz(payload) {
  return callAI('generate', payload);
}

export function gradeAnswer(payload) {
  return callAI('grade', payload);
}

export function getRevisionSummary(payload) {
  return callAI('summary', payload);
}
