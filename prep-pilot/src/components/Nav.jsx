const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'plan', label: 'Study Plan' },
  { id: 'practice', label: 'Practice' },
  { id: 'dashboard', label: 'Progress' }
];

export default function Nav({ active, onChange }) {
  return (
    <div className="nav">
      <div className="brand">
        PrepPilot<span className="brand-dot">.</span>
      </div>
      <div className="nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${active === tab.id ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
