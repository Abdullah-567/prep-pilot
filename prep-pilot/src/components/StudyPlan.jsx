import { useMemo } from 'react';
import { buildStudyPlan } from '../lib/studyPlan.js';

export default function StudyPlan({ subjects, attempts, onGoToPractice }) {
  const plan = useMemo(() => buildStudyPlan(subjects, attempts), [subjects, attempts]);

  const nearestExam = useMemo(() => {
    const withDates = subjects.filter((s) => s.examDate);
    if (withDates.length === 0) return null;
    return withDates.reduce((a, b) => (a.examDate < b.examDate ? a : b));
  }, [subjects]);

  function daysAway(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((target - today) / 86400000));
  }

  return (
    <div>
      <span className="eyebrow">Step 2</span>
      <h1>Your study plan</h1>
      <p className="subtext">
        Auto-built from your subjects and topics, weighted toward whatever you're weakest on or
        haven't practiced yet. Untouched and low-scoring topics show up more often, closer to today.
      </p>

      {nearestExam && (
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{daysAway(nearestExam.examDate)}</div>
            <div className="stat-label">days to {nearestExam.name}</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{subjects.length}</div>
            <div className="stat-label">subjects tracked</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{plan.length}</div>
            <div className="stat-label">study days planned</div>
          </div>
        </div>
      )}

      <div className="card">
        {plan.length === 0 && (
          <div className="empty-state">
            No plan yet — add subjects with topics and exam dates on the Setup tab first.
          </div>
        )}
        {plan.map((day) => (
          <div className="plan-day" key={day.date}>
            <div className="plan-date">{day.label}</div>
            <div className="plan-topics">
              {day.topics.map((t) => (
                <span
                  key={`${t.subjectId}-${t.topicId}`}
                  className={`plan-tag ${t.weak ? 'weak' : ''}`}
                  title={`${t.subjectName} — click to practice`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onGoToPractice(t.subjectId, t.topicId)}
                >
                  {t.subjectName}: {t.topicName}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
