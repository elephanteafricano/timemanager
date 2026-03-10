import React, { useState } from 'react';
import useOutletUser from '../hooks/useOutletUser';
import PageHeader from '../components/PageHeader';
import '../styles/ui.css';
import './Home.css';
import './Dashboard.css';

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_LABELS = ['0h', '4h', '8h', '12h', '16h', '20h', '24h'];
const PLACEHOLDER_EMPLOYEES = ['Alice Martin', 'Noah Dupont', 'Emma Leroy', 'Lucas Bernard', 'Mia Petit'];

function getUserLabel(user) {
  if (!user) return 'Current user';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.username || 'Current user';
}

function Dashboard() {
  const user = useOutletUser();

  const userLabel = getUserLabel(user);
  const kpiOptions = user?.role === 'manager' ? ['All employees', ...PLACEHOLDER_EMPLOYEES] : [userLabel];
  const scheduleOptions = user?.role === 'manager' ? PLACEHOLDER_EMPLOYEES : [userLabel];

  const [selectedKpiScope, setSelectedKpiScope] = useState('');
  const [selectedPlanningScope, setSelectedPlanningScope] = useState('');
  const [selectedDay, setSelectedDay] = useState(DAY_OPTIONS[0]);

  const currentKpiScope = selectedKpiScope || kpiOptions[0];
  const currentPlanningScope = selectedPlanningScope || scheduleOptions[0] || 'Select employee';

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Track KPI and planning overview." />

      <section className="dash-filters">
        <label className="dash-filter-group" htmlFor="kpi-scope-select">
          <span className="dash-filter-label">Show KPIs for</span>
          <select
            id="kpi-scope-select"
            className="tm-input"
            value={currentKpiScope}
            onChange={(event) => setSelectedKpiScope(event.target.value)}
          >
            {kpiOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="dash-filter-group" htmlFor="planning-scope-select">
          <span className="dash-filter-label">Show schedule for</span>
          <select
            id="planning-scope-select"
            className="tm-input"
            value={currentPlanningScope}
            onChange={(event) => setSelectedPlanningScope(event.target.value)}
          >
            {scheduleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="dash-layout">
        <div className="dash-left-column">
          <article className="tm-card dash-card">
            <h2 className="dash-card-title">Punctuality</h2>
            <div className="dash-metric-row">
              <span>On-time arrivals</span>
              <span className="tm-placeholder">--</span>
            </div>
            <div className="dash-metric-row">
              <span>Late arrivals</span>
              <span className="tm-placeholder">--</span>
            </div>
            <p className="dash-empty-text">No time records for this week.</p>
          </article>

          <article className="tm-card dash-card">
            <h2 className="dash-card-title">Completion rate</h2>
            <div className="dash-metric-row">
              <span>Complete shifts</span>
              <span className="tm-placeholder">--</span>
            </div>
            <div className="dash-metric-row">
              <span>Incomplete shifts</span>
              <span className="tm-placeholder">--</span>
            </div>
            <p className="dash-empty-text">No time records for this week.</p>
          </article>

          <article className="tm-card dash-card">
            <h2 className="dash-card-title">Employee presence</h2>
            <div className="dash-chart-placeholder">
              <span className="tm-placeholder">Chart placeholder</span>
            </div>
            <div className="dash-legend">
              <span className="dash-legend-chip">High</span>
              <span className="dash-legend-chip">Medium</span>
              <span className="dash-legend-chip">Low</span>
            </div>
          </article>
        </div>

        <aside className="tm-card dash-card dash-schedule-card">
          <h2 className="dash-card-title">Schedule</h2>

          <div className="dash-day-list">
            {DAY_OPTIONS.map((day) => (
              <button
                key={day}
                type="button"
                className={`dash-day-pill ${selectedDay === day ? 'is-active' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="dash-schedule-grid">
            <div className="dash-time-axis">
              {TIME_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="dash-schedule-placeholder">
              <span>Schedule coming soon.</span>
            </div>
          </div>

          <div className="dash-legend">
            <span className="dash-legend-chip">Approved</span>
            <span className="dash-legend-chip">Modified</span>
            <span className="dash-legend-chip">Pending</span>
          </div>
        </aside>
      </section>
    </>
  );
}

export default Dashboard;
