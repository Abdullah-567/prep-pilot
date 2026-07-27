# PrepPilot — AI Study & Exam Prep Companion

### What it does, and who it's for

PrepPilot is a study planner and AI-powered practice tool for students preparing for Matric, FSc, O-Level, A-Level, or university exams in Pakistan.

**The real problem:** most students have no structured way to prepare for exams. There's no organized bank of practice questions by topic, no way to know which topics they're actually weak in until the exam itself, and no realistic day-by-day schedule between now and exam day — so revision ends up either random or entirely last-minute.

PrepPilot fixes this by letting a student:
1. List their subjects, topics, and exam dates,
2. Get an automatically generated day-by-day study plan that prioritizes whatever they're weak on or haven't touched,
3. Practice any topic with fresh, AI-generated exam-style questions, get graded instantly (including short-answer questions, not just MCQs), and
4. See exactly which topics need more work on a progress dashboard.

### Live URL

**[Add your deployed Vercel URL here after deployment]**

### Features

- **Subject & topic setup** — add unlimited subjects, each with an exam board (Matric / FSc / O-Level / A-Level / University), an exam date, and a free-form list of topics/chapters.
- **Auto-generated study plan** — a day-by-day schedule from today until each subject's exam date. Topics you've never attempted or scored under 50% on are weighted to appear more often and sooner; topics you're already strong in appear less. This scheduling logic is deterministic (not AI) — see `src/lib/studyPlan.js`.
- **AI-generated practice quizzes** — pick a subject, topic, and difficulty; the AI writes a fresh mix of multiple-choice and short-answer questions in the phrasing style of the selected exam board, every time (never a static question bank).
- **AI grading with real feedback** — MCQs are scored instantly client-side; short-answer responses are graded by the AI against a model answer and rubric it generated alongside the question, with 2-3 sentences of specific feedback (not just right/wrong).
- **AI revision summary** — after every quiz, the AI reviews what was missed and writes a short, direct "what to revise next" note.
- **Progress dashboard** — accuracy per topic across all attempts, sorted weakest-first, with a running count of quizzes taken and topics flagged weak.
- **Click-through from plan to practice** — clicking any topic in the study plan jumps straight into a quiz for it.
- **Fully working end to end** with no login required — data is saved in the browser (localStorage) per device.

### The AI feature — what it does and the instructions behind it

The AI (Groq, `llama-3.3-70b-versatile`) powers three things, each with its own system prompt, all in [`api/ai.js`](./api/ai.js):

**1. Question generation** — writes original MCQ + short-answer questions matching a chosen exam board's style, with an answer key, model answers, and grading rubrics baked into the response:

```
You are the question generator inside PrepPilot, a study app for Pakistani students
preparing for Matric, FSc, O-Level and A-Level exams. You write original practice
questions in the tone, phrasing, and difficulty style of real exam papers for the
specified exam board.

Rules:
- Match the vocabulary, phrasing conventions and mark-allocation style typical of the
  given exam board.
- Vary question wording and structure — never repeat the same sentence pattern twice
  in one set.
- For "mcq" questions: write exactly 4 options and specify the zero-based index of the
  correct option as "correctIndex".
- For "short" questions: write a concise model answer (2-4 sentences) as "modelAnswer",
  and a "rubric" array of exactly 3 short strings describing what a full-mark answer
  must contain.
- Every question must include "maxMarks" (an integer, 1 for mcq, 2-5 for short answer
  depending on complexity).
- Never copy real past-paper questions verbatim — write original questions inspired by
  that exam style.
- Output ONLY valid JSON. No markdown fences, no commentary, no extra keys beyond the
  schema below.
```

**2. Short-answer grading** — grades a student's free-text answer against the model answer/rubric with partial credit and specific feedback:

```
You are the tutor inside PrepPilot, grading a Pakistani student's short-answer response
to a practice exam question.

Rules:
- Compare the student's answer against the provided model answer and rubric.
- Score fairly out of the given maximum marks — award partial credit for partially
  correct reasoning, don't require exact wording.
- Write feedback in 2-3 sentences: specific, honest and actionable. Name exactly what's
  missing, wrong, or could be stronger. Do not just praise.
- Never invent content the student didn't write.
- Output ONLY valid JSON. No markdown fences, no commentary.
```

**3. Revision summary** — after a quiz, reviews the results and tells the student what to focus on next:

```
You are PrepPilot's revision coach. You receive the results of a quiz the student just
finished: each question's topic, whether it was correct, partially correct, or wrong,
and any tutor feedback given.

Rules:
- Identify the specific sub-concepts (not just the broad topic name) the student is
  weakest on.
- Write a "summary" of 2-3 sentences: a direct, encouraging "what to revise next" note,
  like a tutor would say out loud — not a generic report.
- If the student scored well on everything, congratulate them briefly and suggest
  moving to a harder difficulty or the next topic instead.
- Output ONLY valid JSON. No markdown fences, no commentary.
```

All three prompts request structured JSON (`response_format: json_object`) so the frontend can render the result directly — full prompts and the JSON schemas they enforce are in `api/ai.js`.

### Tools, services, and models used to build it

- **Frontend:** React 18 + Vite
- **Backend:** Vercel serverless functions (Node.js, single `/api/ai.js` endpoint)
- **AI model:** Groq — `llama-3.3-70b-versatile` (via Groq's OpenAI-compatible chat completions API)
- **Storage:** browser `localStorage` (no external database — keeps setup and deployment simple)
- **Hosting:** Vercel
- **Fonts:** Fraunces (display), Inter (body), IBM Plex Mono (data/stats) via Google Fonts
- **Design direction:** a "night study desk" theme — ink-navy background, amber highlighter accent, index-card panels for content — built to feel like a study tool, not a generic dashboard

### Screenshots

_Add at least 3 screenshots here after running the app, e.g.:_

```
![Setup screen](./screenshots/setup.png)
![Study plan](./screenshots/plan.png)
![Practice quiz with AI feedback](./screenshots/practice.png)
![Progress dashboard](./screenshots/dashboard.png)
```

### How to run the project

**1. Clone and install**
```bash
git clone <your-repo-url>
cd prep-pilot
npm install
```

**2. Add your Groq API key**

Get a free key at [console.groq.com/keys](https://console.groq.com/keys), then:
```bash
cp .env.example .env
# edit .env and paste your key:
# GROQ_API_KEY=your_actual_key_here
```

**3. Run locally**

The app has both a static frontend and a serverless `/api` function, so use the Vercel CLI for full local functionality:
```bash
npm install -g vercel
vercel dev
```
This serves the app (usually at `http://localhost:3000`) with the AI endpoint working locally.

_(Running `npm run dev` with plain Vite will load the UI but AI calls will fail, since `/api` functions only run under `vercel dev` or on Vercel itself.)_

**4. Deploy to Vercel**
```bash
vercel
```
Then in the Vercel dashboard for the project: **Settings → Environment Variables** → add `GROQ_API_KEY` with your key → redeploy. Never commit your real `.env` file — it's already in `.gitignore`.

### Project structure

```
prep-pilot/
├── api/
│   └── ai.js                # serverless function: generate / grade / summary
├── src/
│   ├── components/
│   │   ├── Nav.jsx
│   │   ├── Onboarding.jsx   # Setup tab
│   │   ├── StudyPlan.jsx    # Study Plan tab
│   │   ├── Practice.jsx     # Practice tab (the AI feature)
│   │   └── Dashboard.jsx    # Progress tab
│   ├── lib/
│   │   ├── api.js           # client wrapper for /api/ai
│   │   ├── storage.js       # localStorage persistence
│   │   └── studyPlan.js     # deterministic plan-scheduling logic
│   ├── data/examBoards.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```
