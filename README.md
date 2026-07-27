# PrepPilot

**An AI-powered study planner and exam practice companion for students preparing for Matric, FSc, O-Level, A-Level, or university exams in Pakistan.**

![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/frontend-React%2018-61DAFB)
![Vercel](https://img.shields.io/badge/hosted%20on-Vercel-black)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Features](#features)
- [The AI Feature](#the-ai-feature)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [License](#license)

---

## Overview

Most students preparing for major exams have no structured way to study. There's no organized bank of practice questions by topic, no reliable way to know which topics they're actually weak in until the exam itself, and no realistic day-by-day schedule between now and exam day — so revision ends up either random or crammed in at the last minute.

**PrepPilot** solves this by letting a student:

1. List their subjects, topics, and exam dates.
2. Get an automatically generated day-by-day study plan that prioritizes weak or untouched topics.
3. Practice any topic with fresh, AI-generated exam-style questions — including short-answer questions, not just MCQs — and get graded instantly.
4. Track exactly which topics need more work on a progress dashboard.

## Live Demo

🔗 **[Add your deployed Vercel URL here]**

## Features

| Feature | Description |
|---|---|
| **Subject & topic setup** | Add unlimited subjects, each with an exam board (Matric / FSc / O-Level / A-Level / University), an exam date, and a free-form list of topics/chapters. |
| **Auto-generated study plan** | A deterministic (non-AI) day-by-day schedule from today until each subject's exam date. Topics never attempted or scored under 50% are weighted to appear sooner and more often. See `src/lib/studyPlan.js`. |
| **AI-generated practice quizzes** | Fresh multiple-choice and short-answer questions generated per subject, topic, and difficulty — in the phrasing style of the selected exam board, never from a static bank. |
| **AI grading with real feedback** | MCQs are scored instantly client-side. Short-answer responses are graded by the AI against a model answer and rubric, with specific, non-generic feedback. |
| **AI revision summary** | After every quiz, the AI reviews what was missed and writes a short "what to revise next" note. |
| **Progress dashboard** | Accuracy per topic across all attempts, sorted weakest-first, with quiz counts and flagged weak topics. |
| **Plan-to-practice flow** | Clicking any topic in the study plan jumps straight into a quiz for it. |
| **No login required** | Fully working end-to-end; data is saved locally per device via `localStorage`. |

## The AI Feature

PrepPilot uses **Groq** (`llama-3.3-70b-versatile`) for three distinct tasks, each with its own dedicated system prompt in [`api/ai.js`](./api/ai.js):

### 1. Question Generation
Writes original MCQ and short-answer questions matching a chosen exam board's tone and phrasing conventions, along with an answer key, model answers, and grading rubrics — all in the same response. Questions are never copied from real past papers; they're inspired by that exam style.

### 2. Short-Answer Grading
Grades a student's free-text response against the model answer and rubric generated with the question, awarding partial credit for sound reasoning and returning specific, honest feedback rather than a simple right/wrong.

### 3. Revision Summary
Reviews an entire quiz's results — topic, correctness, and prior feedback — and produces a short, direct note on which sub-concepts to revise next, or a nudge to move up in difficulty if the student did well.

All three prompts request structured JSON responses so the frontend can render results directly. Full prompt text and JSON schemas are defined in `api/ai.js`.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Vercel serverless functions (Node.js, single `/api/ai.js` endpoint)
- **AI model:** Groq — `llama-3.3-70b-versatile` (OpenAI-compatible chat completions API)
- **Storage:** Browser `localStorage` — no external database, keeping setup and deployment simple
- **Hosting:** Vercel
- **Fonts:** Fraunces (display), Inter (body), IBM Plex Mono (data/stats) via Google Fonts
- **Design direction:** A "night study desk" theme — ink-navy background, amber highlighter accent, index-card style panels

## Screenshots

> Add at least 3 screenshots after running the app:

```
![Setup screen](./screenshots/setup.png)
![Study plan](./screenshots/plan.png)
![Practice quiz with AI feedback](./screenshots/practice.png)
![Progress dashboard](./screenshots/dashboard.png)
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A free [Groq API key](https://console.groq.com/keys)
- [Vercel CLI](https://vercel.com/docs/cli) for local development

### 1. Clone and install

```bash
git clone https://github.com/Abdullah-567/prep-pilot.git
cd prep-pilot
npm install
```

### 2. Configure your environment

```bash
cp .env.example .env
```

Then edit `.env` and add your key:

```
GROQ_API_KEY=your_actual_key_here
```

### 3. Run locally

The app has both a static frontend and a serverless `/api` function, so use the Vercel CLI for full functionality:

```bash
npm install -g vercel
vercel dev
```

This serves the app (typically at `http://localhost:3000`) with the AI endpoint working locally.

> **Note:** Running `npm run dev` with plain Vite loads the UI, but AI calls will fail — `/api` functions only run under `vercel dev` or on Vercel itself.

## Deployment

```bash
vercel
```

Then, in the Vercel dashboard for the project:

**Settings → Environment Variables** → add `GROQ_API_KEY` with your key → redeploy.

> Never commit your real `.env` file — it is already excluded via `.gitignore`.

## Project Structure

```
prep-pilot/
├── api/
│   └── ai.js                # Serverless function: generate / grade / summarize
├── src/
│   ├── components/
│   │   ├── Nav.jsx
│   │   ├── Onboarding.jsx   # Setup tab
│   │   ├── StudyPlan.jsx    # Study Plan tab
│   │   ├── Practice.jsx     # Practice tab (the AI feature)
│   │   └── Dashboard.jsx    # Progress tab
│   ├── lib/
│   │   ├── api.js           # Client wrapper for /api/ai
│   │   ├── storage.js       # localStorage persistence
│   │   └── studyPlan.js     # Deterministic plan-scheduling logic
│   ├── data/examBoards.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```
