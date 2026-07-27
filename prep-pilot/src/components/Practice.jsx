import { useEffect, useState } from 'react';
import { DIFFICULTIES } from '../data/examBoards.js';
import { generateQuiz, gradeAnswer, getRevisionSummary } from '../lib/api.js';

const STAGE = {
  SETUP: 'setup',
  LOADING: 'loading',
  QUIZ: 'quiz',
  SUMMARY: 'summary'
};

export default function Practice({ subjects, presetTarget, onClearPreset, onAttemptComplete }) {
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [mcqCount, setMcqCount] = useState(3);
  const [shortCount, setShortCount] = useState(2);

  const [stage, setStage] = useState(STAGE.SETUP);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState([]); // per-question outcome
  const [selectedOption, setSelectedOption] = useState(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [grading, setGrading] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (presetTarget) {
      setSubjectId(presetTarget.subjectId);
      setTopicId(presetTarget.topicId);
    }
  }, [presetTarget]);

  const subject = subjects.find((s) => s.id === subjectId);
  const topic = subject?.topics.find((t) => t.id === topicId);

  async function startQuiz(e) {
    e.preventDefault();
    if (!subject || !topic) {
      setError('Pick a subject and topic first.');
      return;
    }
    setError('');
    setStage(STAGE.LOADING);
    try {
      const data = await generateQuiz({
        subject: subject.name,
        topic: topic.name,
        examBoard: subject.examBoard,
        difficulty,
        mcqCount: Number(mcqCount),
        shortCount: Number(shortCount)
      });
      if (!data.questions || data.questions.length === 0) {
        throw new Error('The AI returned no questions — try again.');
      }
      setQuestions(data.questions);
      setResults([]);
      setCurrent(0);
      resetQuestionState();
      setStage(STAGE.QUIZ);
    } catch (err) {
      setError(err.message);
      setStage(STAGE.SETUP);
    }
  }

  function resetQuestionState() {
    setSelectedOption(null);
    setShortAnswer('');
    setAnswered(false);
    setCurrentFeedback(null);
  }

  function handleMcqSelect(idx) {
    if (answered) return;
    const q = questions[current];
    const correct = idx === q.correctIndex;
    setSelectedOption(idx);
    setAnswered(true);
    setCurrentFeedback({
      score: correct ? q.maxMarks : 0,
      feedback: correct
        ? 'Correct.'
        : `Not quite — the correct answer was: ${q.options[q.correctIndex]}`
    });
    setResults((prev) => [
      ...prev,
      {
        question: q.question,
        type: 'mcq',
        correct,
        score: correct ? q.maxMarks : 0,
        maxMarks: q.maxMarks
      }
    ]);
  }

  async function handleShortSubmit() {
    if (answered) return;
    const q = questions[current];
    setGrading(true);
    setError('');
    try {
      const result = await gradeAnswer({
        question: q.question,
        modelAnswer: q.modelAnswer,
        rubric: q.rubric,
        maxMarks: q.maxMarks,
        studentAnswer: shortAnswer
      });
      setCurrentFeedback(result);
      setAnswered(true);
      setResults((prev) => [
        ...prev,
        {
          question: q.question,
          type: 'short',
          score: result.score,
          maxMarks: q.maxMarks,
          feedback: result.feedback
        }
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setGrading(false);
    }
  }

  async function goNext() {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      resetQuestionState();
    } else {
      await finishQuiz();
    }
  }

  async function finishQuiz() {
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    const maxScore = results.reduce((s, r) => s + r.maxMarks, 0);
    const attempt = {
      id: crypto.randomUUID(),
      subjectId,
      subjectName: subject.name,
      topicId,
      topicName: topic.name,
      date: new Date().toISOString(),
      questions: results,
      totalScore,
      maxScore
    };
    onAttemptComplete(attempt);
    setStage(STAGE.SUMMARY);
    setSummaryLoading(true);
    try {
      const data = await getRevisionSummary({
        subject: subject.name,
        topic: topic.name,
        results
      });
      setSummary(data.summary);
    } catch (err) {
      setSummary('Could not generate a summary right now, but your attempt was saved.');
    } finally {
      setSummaryLoading(false);
    }
  }

  function restart() {
    setStage(STAGE.SETUP);
    setQuestions([]);
    setResults([]);
    setSummary('');
    onClearPreset?.();
  }

  if (stage === STAGE.LOADING) {
    return (
      <div className="card empty-state">
        <span className="spinner" /> Generating practice questions for {topic?.name}…
      </div>
    );
  }

  if (stage === STAGE.QUIZ) {
    const q = questions[current];
    return (
      <div>
        <span className="eyebrow">Step 3</span>
        <h1>{subject.name} · {topic.name}</h1>
        <div className="quiz-progress">Question {current + 1} of {questions.length} · {q.maxMarks} mark{q.maxMarks > 1 ? 's' : ''}</div>

        {error && <div className="error-box">{error}</div>}

        <div className="card">
          <h3>{q.question}</h3>

          {q.type === 'mcq' && (
            <div style={{ marginTop: 14 }}>
              {q.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (answered) {
                  if (idx === q.correctIndex) cls += ' correct';
                  else if (idx === selectedOption) cls += ' incorrect';
                } else if (idx === selectedOption) {
                  cls += ' selected';
                }
                return (
                  <button key={idx} className={cls} onClick={() => handleMcqSelect(idx)} disabled={answered}>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'short' && (
            <div className="field" style={{ marginTop: 14 }}>
              <label>Your answer</label>
              <textarea
                value={shortAnswer}
                onChange={(e) => setShortAnswer(e.target.value)}
                disabled={answered}
                placeholder="Write your answer here…"
              />
              {!answered && (
                <button className="btn btn-card" style={{ marginTop: 10 }} onClick={handleShortSubmit} disabled={grading}>
                  {grading ? 'Grading…' : 'Submit answer'}
                </button>
              )}
            </div>
          )}

          {answered && currentFeedback && (
            <div className={`feedback-box ${currentFeedback.score < q.maxMarks ? 'wrong' : ''}`}>
              <span className="score-pill">{currentFeedback.score}/{q.maxMarks}</span>
              <p style={{ margin: '8px 0 0' }}>{currentFeedback.feedback}</p>
            </div>
          )}

          {answered && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={goNext}>
              {current + 1 < questions.length ? 'Next question' : 'Finish quiz'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === STAGE.SUMMARY) {
    const totalScore = results.reduce((s, r) => s + r.score, 0);
    const maxScore = results.reduce((s, r) => s + r.maxMarks, 0);
    return (
      <div>
        <span className="eyebrow">Quiz complete</span>
        <h1>{subject.name} · {topic.name}</h1>
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{totalScore}/{maxScore}</div>
            <div className="stat-label">score</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%</div>
            <div className="stat-label">accuracy</div>
          </div>
        </div>
        <div className="card">
          <h3>What to revise next</h3>
          {summaryLoading ? (
            <p><span className="spinner" /> Thinking it over…</p>
          ) : (
            <p>{summary}</p>
          )}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={restart}>
          Practice another topic
        </button>
      </div>
    );
  }

  return (
    <div>
      <span className="eyebrow">Step 3</span>
      <h1>Practice a topic</h1>
      <p className="subtext">
        Pick a subject and topic. PrepPilot's AI writes fresh exam-style questions, grades your
        short answers, and tells you exactly what to revise next.
      </p>

      {error && <div className="error-box">{error}</div>}

      {subjects.length === 0 ? (
        <div className="card card-dashed empty-state">
          Add a subject and topic on the Setup tab first.
        </div>
      ) : (
        <form className="card" onSubmit={startQuiz}>
          <div className="row">
            <div className="field">
              <label>Subject</label>
              <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId(''); }}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Topic</label>
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!subject}>
                <option value="">Select topic</option>
                {subject?.topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label>MCQ questions</label>
              <input type="number" min="0" max="8" value={mcqCount} onChange={(e) => setMcqCount(e.target.value)} />
            </div>
            <div className="field">
              <label>Short-answer questions</label>
              <input type="number" min="0" max="5" value={shortCount} onChange={(e) => setShortCount(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Generate quiz</button>
        </form>
      )}
    </div>
  );
}
