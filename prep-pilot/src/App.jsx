import { useState } from 'react';
import Nav from './components/Nav.jsx';
import Onboarding from './components/Onboarding.jsx';
import StudyPlan from './components/StudyPlan.jsx';
import Practice from './components/Practice.jsx';
import Dashboard from './components/Dashboard.jsx';
import {
  getSubjects,
  saveSubjects,
  addSubject as storeAddSubject,
  deleteSubject as storeDeleteSubject,
  addTopic as storeAddTopic,
  deleteTopic as storeDeleteTopic,
  getAttempts,
  addAttempt as storeAddAttempt
} from './lib/storage.js';

export default function App() {
  const [tab, setTab] = useState('setup');
  const [subjects, setSubjects] = useState(getSubjects());
  const [attempts, setAttempts] = useState(getAttempts());
  const [presetTarget, setPresetTarget] = useState(null);

  function handleAddSubject(subject) {
    setSubjects(storeAddSubject(subject));
  }

  function handleDeleteSubject(id) {
    setSubjects(storeDeleteSubject(id));
  }

  function handleAddTopic(subjectId, topicName) {
    setSubjects(storeAddTopic(subjectId, topicName));
  }

  function handleDeleteTopic(subjectId, topicId) {
    setSubjects(storeDeleteTopic(subjectId, topicId));
  }

  function handleAttemptComplete(attempt) {
    setAttempts(storeAddAttempt(attempt));
  }

  function goToPractice(subjectId, topicId) {
    setPresetTarget({ subjectId, topicId });
    setTab('practice');
  }

  return (
    <div className="app-shell">
      <Nav active={tab} onChange={setTab} />

      {tab === 'setup' && (
        <Onboarding
          subjects={subjects}
          onAddSubject={handleAddSubject}
          onDeleteSubject={handleDeleteSubject}
          onAddTopic={handleAddTopic}
          onDeleteTopic={handleDeleteTopic}
        />
      )}

      {tab === 'plan' && (
        <StudyPlan subjects={subjects} attempts={attempts} onGoToPractice={goToPractice} />
      )}

      {tab === 'practice' && (
        <Practice
          subjects={subjects}
          presetTarget={presetTarget}
          onClearPreset={() => setPresetTarget(null)}
          onAttemptComplete={handleAttemptComplete}
        />
      )}

      {tab === 'dashboard' && <Dashboard subjects={subjects} attempts={attempts} />}
    </div>
  );
}
