// Builds a day-by-day study plan across all subjects/topics up to each subject's exam date.
// Weighting: topics with lower accuracy (or never attempted) get scheduled more often.

function topicAccuracy(attempts, subjectId, topicId) {
  const relevant = attempts.filter((a) => a.subjectId === subjectId && a.topicId === topicId);
  if (relevant.length === 0) return null; // never attempted
  const total = relevant.reduce((sum, a) => sum + a.totalScore, 0);
  const max = relevant.reduce((sum, a) => sum + a.maxScore, 0);
  return max > 0 ? total / max : null;
}

function weightForAccuracy(accuracy) {
  if (accuracy === null) return 3; // untouched topics: high priority
  if (accuracy < 0.5) return 3; // weak
  if (accuracy < 0.75) return 2; // okay
  return 1; // strong
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((target - today) / 86400000));
}

const MAX_TOPICS_PER_DAY = 4;

export function buildStudyPlan(subjects, attempts) {
  const items = [];
  subjects.forEach((subject) => {
    if (!subject.examDate || subject.topics.length === 0) return;
    const daysRemaining = daysUntil(subject.examDate);
    subject.topics.forEach((topic) => {
      const acc = topicAccuracy(attempts, subject.id, topic.id);
      items.push({
        subjectId: subject.id,
        subjectName: subject.name,
        topicId: topic.id,
        topicName: topic.name,
        daysRemaining,
        weight: weightForAccuracy(acc),
        weak: acc !== null && acc < 0.5
      });
    });
  });

  if (items.length === 0) return [];

  const horizon = Math.min(21, Math.max(...items.map((i) => i.daysRemaining)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: horizon }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      topics: []
    };
  });

  // Build a repeating queue: each item appears `weight` times, items interleaved
  // (not grouped) so a single topic doesn't dominate consecutive slots.
  const rounds = Math.max(...items.map((i) => i.weight));
  const queue = [];
  for (let r = 0; r < rounds; r++) {
    items.forEach((item) => {
      if (item.weight > r) queue.push(item);
    });
  }

  // Walk the days in order, repeatedly cycling through, filling each day up to
  // MAX_TOPICS_PER_DAY with the next eligible (not-yet-placed-today, exam not passed) item.
  let qi = 0;
  let dayCursor = 0;
  let safety = 0;
  const totalSlots = days.length * MAX_TOPICS_PER_DAY;

  while (qi < queue.length && safety < totalSlots * 3) {
    safety++;
    const day = days[dayCursor % days.length];
    const dayOffset = dayCursor % days.length;
    const item = queue[qi];

    const eligible = item.daysRemaining > dayOffset && day.topics.length < MAX_TOPICS_PER_DAY;
    const duplicate = day.topics.some(
      (t) => t.subjectId === item.subjectId && t.topicId === item.topicId
    );

    if (eligible && !duplicate) {
      day.topics.push(item);
      qi++;
    }
    dayCursor++;
  }

  return days.filter((d) => d.topics.length > 0);
}
