import { useState } from 'react';
import { EXAM_BOARDS } from '../data/examBoards.js';

export default function Onboarding({ subjects, onAddSubject, onDeleteSubject, onAddTopic, onDeleteTopic }) {
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examBoard, setExamBoard] = useState(EXAM_BOARDS[0]);
  const [topicDrafts, setTopicDrafts] = useState({});

  function handleAddSubject(e) {
    e.preventDefault();
    if (!name.trim() || !examDate) return;
    onAddSubject({
      id: crypto.randomUUID(),
      name: name.trim(),
      examBoard,
      examDate,
      topics: []
    });
    setName('');
    setExamDate('');
  }

  function handleAddTopic(subjectId) {
    const draft = (topicDrafts[subjectId] || '').trim();
    if (!draft) return;
    onAddTopic(subjectId, draft);
    setTopicDrafts((prev) => ({ ...prev, [subjectId]: '' }));
  }

  return (
    <div>
      <span className="eyebrow">Step 1</span>
      <h1>Set up your subjects</h1>
      <p className="subtext">
        Add each subject you're preparing for, its exam board, and exam date. Then break it into
        topics — this feeds both your study plan and what PrepPilot quizzes you on.
      </p>

      <div className="card">
        <h3>Add a subject</h3>
        <form onSubmit={handleAddSubject}>
          <div className="row">
            <div className="field">
              <label>Subject name</label>
              <input
                type="text"
                placeholder="e.g. Chemistry"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Exam board</label>
              <select value={examBoard} onChange={(e) => setExamBoard(e.target.value)}>
                {EXAM_BOARDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Exam date</label>
              <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add subject</button>
        </form>
      </div>

      {subjects.length === 0 && (
        <div className="card card-dashed empty-state">
          No subjects yet. Add your first one above to get started.
        </div>
      )}

      {subjects.map((subject) => (
        <div key={subject.id} className="card">
          <div className="subject-item" style={{ borderBottom: 'none', paddingTop: 0 }}>
            <div>
              <div className="subject-name">{subject.name}</div>
              <div className="subject-meta">{subject.examBoard} · exam {subject.examDate}</div>
            </div>
            <button className="btn btn-danger" onClick={() => onDeleteSubject(subject.id)}>
              Remove
            </button>
          </div>

          <div style={{ margin: '10px 0' }}>
            {subject.topics.map((topic) => (
              <span className="topic-chip" key={topic.id}>
                {topic.name}
                <button onClick={() => onDeleteTopic(subject.id, topic.id)} title="Remove topic">✕</button>
              </span>
            ))}
            {subject.topics.length === 0 && (
              <span className="subject-meta">No topics added yet.</span>
            )}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="e.g. Chemical Bonding"
                value={topicDrafts[subject.id] || ''}
                onChange={(e) =>
                  setTopicDrafts((prev) => ({ ...prev, [subject.id]: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(subject.id)}
              />
            </div>
            <button className="btn btn-card" onClick={() => handleAddTopic(subject.id)}>
              Add topic
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
