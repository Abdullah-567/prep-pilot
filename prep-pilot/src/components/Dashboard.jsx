import { useMemo } from 'react';

export default function Dashboard({ subjects, attempts }) {
  const topicStats = useMemo(() => {
    const stats = [];
    subjects.forEach((subject) => {
      subject.topics.forEach((topic) => {
        const relevant = attempts.filter(
          (a) => a.subjectId === subject.id && a.topicId === topic.id
        );
        if (relevant.length === 0) return;
        const total = relevant.reduce((s, a) => s + a.totalScore, 0);
        const max = relevant.reduce((s, a) => s + a.maxScore, 0);
        const accuracy = max > 0 ? total / max : 0;
        stats.push({
          key: `${subject.id}-${topic.id}`,
          subjectName: subject.name,
          topicName: topic.name,
          accuracy,
          attempts: relevant.length
        });
      });
    });
    return stats.sort((a, b) => a.accuracy - b.accuracy);
  }, [subjects, attempts]);

  const overall = useMemo(() => {
    if (attempts.length === 0) return null;
    const total = attempts.reduce((s, a) => s + a.totalScore, 0);
    const max = attempts.reduce((s, a) => s + a.maxScore, 0);
    return {
      accuracy: max > 0 ? Math.round((total / max) * 100) : 0,
      quizzes: attempts.length,
      weakCount: topicStats.filter((t) => t.accuracy < 0.5).length
    };
  }, [attempts, topicStats]);

  return (
    <div>
      <span className="eyebrow">Step 4</span>
      <h1>Your progress</h1>
      <p className="subtext">
        Accuracy per topic across every quiz you've taken. Anything below 50% is flagged as
        weak — those get priority in your study plan.
      </p>

      {overall && (
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-value">{overall.accuracy}%</div>
            <div className="stat-label">overall accuracy</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{overall.quizzes}</div>
            <div className="stat-label">quizzes taken</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{overall.weakCount}</div>
            <div className="stat-label">weak topics</div>
          </div>
        </div>
      )}

      <div className="card">
        {topicStats.length === 0 && (
          <div className="empty-state">No quizzes taken yet — head to Practice to get started.</div>
        )}
        {topicStats.map((t) => (
          <div className="bar-row" key={t.key}>
            <div className="bar-label">
              <span>{t.subjectName} · {t.topicName}</span>
              <span className="subject-meta">{Math.round(t.accuracy * 100)}% · {t.attempts} attempt{t.attempts > 1 ? 's' : ''}</span>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill ${t.accuracy < 0.5 ? 'weak' : ''}`}
                style={{ width: `${Math.max(4, Math.round(t.accuracy * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
