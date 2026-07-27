// PrepPilot AI endpoint — single serverless function, dispatched by `action`.
// Talks to Groq's OpenAI-compatible chat completions API.
// Requires GROQ_API_KEY set as an environment variable on the host (never in code).

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

const GENERATE_SYSTEM_PROMPT = `You are the question generator inside PrepPilot, a study app for Pakistani students preparing for Matric, FSc, O-Level and A-Level exams. You write original practice questions in the tone, phrasing, and difficulty style of real exam papers for the specified exam board.

Rules:
- Match the vocabulary, phrasing conventions and mark-allocation style typical of the given exam board.
- Vary question wording and structure — never repeat the same sentence pattern twice in one set.
- For "mcq" questions: write exactly 4 options and specify the zero-based index of the correct option as "correctIndex".
- For "short" questions: write a concise model answer (2-4 sentences) as "modelAnswer", and a "rubric" array of exactly 3 short strings describing what a full-mark answer must contain.
- Every question must include "maxMarks" (an integer, 1 for mcq, 2-5 for short answer depending on complexity).
- Never copy real past-paper questions verbatim — write original questions inspired by that exam style.
- Output ONLY valid JSON. No markdown fences, no commentary, no extra keys beyond the schema below.

JSON schema to return:
{
  "questions": [
    {
      "type": "mcq" | "short",
      "question": string,
      "options": [string, string, string, string]   // only for type "mcq"
      "correctIndex": number                          // only for type "mcq"
      "modelAnswer": string                            // only for type "short"
      "rubric": [string, string, string]              // only for type "short"
      "maxMarks": number
    }
  ]
}`;

const GRADE_SYSTEM_PROMPT = `You are the tutor inside PrepPilot, grading a Pakistani student's short-answer response to a practice exam question.

Rules:
- Compare the student's answer against the provided model answer and rubric.
- Score fairly out of the given maximum marks — award partial credit for partially correct reasoning, don't require exact wording.
- Write feedback in 2-3 sentences: specific, honest and actionable. Name exactly what's missing, wrong, or could be stronger. Do not just praise.
- Never invent content the student didn't write.
- Output ONLY valid JSON. No markdown fences, no commentary.

JSON schema to return:
{
  "score": number,
  "feedback": string
}`;

const SUMMARY_SYSTEM_PROMPT = `You are PrepPilot's revision coach. You receive the results of a quiz the student just finished: each question's topic, whether it was correct, partially correct, or wrong, and any tutor feedback given.

Rules:
- Identify the specific sub-concepts (not just the broad topic name) the student is weakest on.
- Write a "summary" of 2-3 sentences: a direct, encouraging "what to revise next" note, like a tutor would say out loud — not a generic report.
- If the student scored well on everything, congratulate them briefly and suggest moving to a harder difficulty or the next topic instead.
- Output ONLY valid JSON. No markdown fences, no commentary.

JSON schema to return:
{
  "summary": string
}`;

async function callGroq(systemPrompt, userPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set on the server');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { action, payload } = req.body || {};

    if (action === 'generate') {
      const { subject, topic, examBoard, difficulty, mcqCount, shortCount } = payload;
      const userPrompt = `Exam board: ${examBoard}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Generate ${mcqCount} "mcq" questions and ${shortCount} "short" questions on this topic, following the schema exactly.`;
      const result = await callGroq(GENERATE_SYSTEM_PROMPT, userPrompt);
      res.status(200).json(result);
      return;
    }

    if (action === 'grade') {
      const { question, modelAnswer, rubric, maxMarks, studentAnswer } = payload;
      const userPrompt = `Question: ${question}
Model answer: ${modelAnswer}
Rubric: ${JSON.stringify(rubric)}
Maximum marks: ${maxMarks}
Student's answer: ${studentAnswer || '(left blank)'}
Grade this answer and return the JSON schema.`;
      const result = await callGroq(GRADE_SYSTEM_PROMPT, userPrompt);
      res.status(200).json(result);
      return;
    }

    if (action === 'summary') {
      const { results, subject, topic } = payload;
      const userPrompt = `Subject: ${subject}
Topic: ${topic}
Quiz results: ${JSON.stringify(results)}
Write the revision summary and return the JSON schema.`;
      const result = await callGroq(SUMMARY_SYSTEM_PROMPT, userPrompt);
      res.status(200).json(result);
      return;
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
