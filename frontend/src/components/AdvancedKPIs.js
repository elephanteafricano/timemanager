import React, { useState } from 'react';

const clamp01 = (value) => Math.max(0, Math.min(1, value));

const formatPercent = (value) => {
  if (!Number.isFinite(value)) return '--';
  return `${Math.round(value)}%`;
};

const formatHours = (value, { signed = false } = {}) => {
  if (!Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  if (abs < 0.01) return '--';
  if (abs < 0.25) {
    if (signed && value < 0) return '- < 15 min';
    if (signed && value > 0) return '+ < 15 min';
    return '< 15 min';
  }
  const rounded = Math.round(abs * 10) / 10;
  const sign = signed ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';
  return `${sign}${rounded.toFixed(1)}h`;
};

const formatCount = (value) => {
  if (!Number.isFinite(value)) return '--';
  return Math.round(value).toString();
};

const formatTimeValue = (value) => {
  if (!value || value === 'N/A') return '--';
  return value;
};

const scoreToAccent = (score) => {
  if (!Number.isFinite(score)) {
    return { '--accent': '#7c6fd6', '--accent-soft': '#f1effd' };
  }
  const hue = Math.round(clamp01(score) * 120);
  return {
    '--accent': `hsl(${hue}, 60%, 40%)`,
    '--accent-soft': `hsla(${hue}, 70%, 92%, 0.9)`,
  };
};

const percentScore = (value, invert = false) => {
  if (!Number.isFinite(value)) return null;
  const score = clamp01(value / 100);
  return invert ? 1 - score : score;
};

const varianceScore = (value) => {
  if (!Number.isFinite(value)) return null;
  return clamp01(0.5 + (Math.atan(value) / Math.PI));
};

const overtimeScore = (value) => {
  if (!Number.isFinite(value)) return null;
  return clamp01(1 / (1 + Math.abs(value)));
};

function AdvancedKPIs({ kpis }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const totalShifts = Number(kpis.totalShifts) || 0;
  const hasLowData = totalShifts < 3;

  return (
    <section className="data-section">
      <div className="section-header kpi-header">
        <div>
          <h2 className="section-title">KPIs</h2>
          <div className="section-subtitle">Based on current time rules</div>
          {hasLowData && (
            <>
              <div className="section-helper">Not enough completed shifts yet.</div>
              <div className="section-helper">Metrics will stabilize as more data is collected.</div>
            </>
          )}
        </div>
        <button
          type="button"
          className="kpi-toggle-btn"
          onClick={() => setShowAdvanced((prev) => !prev)}
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? 'Hide advanced metrics' : 'Show advanced metrics'}
        </button>
      </div>

      <div className="kpi-section">
        <div className="kpi-section-header">
          <div className="kpi-section-title">Attendance & Punctuality</div>
          <div className="kpi-section-meta">Arrivals & departures</div>
        </div>
        <div className="kpi-grid">
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(percentScore(kpis.onTimeRate))}
            title="Percent of shifts that started within the allowed grace period."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">OT</span>
              <span className="kpi-label">On-Time Rate</span>
            </div>
            <div className="kpi-value">{formatPercent(kpis.onTimeRate)}</div>
            <div className="kpi-desc">Clock-ins within grace period</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(percentScore(kpis.latenessRate, true))}
            title="Percent of shifts that started after the grace period."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">LR</span>
              <span className="kpi-label">Lateness Rate</span>
            </div>
            <div className="kpi-value">{formatPercent(kpis.latenessRate)}</div>
            <div className="kpi-desc">After grace period</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(percentScore(kpis.earlyDepartureRate, true))}
            title="Percent of shifts that ended before the scheduled end time."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">ED</span>
              <span className="kpi-label">Early Departure</span>
            </div>
            <div className="kpi-value">{formatPercent(kpis.earlyDepartureRate)}</div>
            <div className="kpi-desc">Before scheduled end</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(null)}
            title="Average time employees clock in."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">AA</span>
              <span className="kpi-label">Avg Arrival</span>
            </div>
            <div className="kpi-value">{formatTimeValue(kpis.averageArrivalTime)}</div>
            <div className="kpi-desc">Typical first clock-in</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(null)}
            title="Average time employees clock out."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">AD</span>
              <span className="kpi-label">Avg Departure</span>
            </div>
            <div className="kpi-value">{formatTimeValue(kpis.averageDepartureTime)}</div>
            <div className="kpi-desc">Typical last clock-out</div>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <div className="kpi-section-header">
          <div className="kpi-section-title">Workload & Time</div>
          <div className="kpi-section-meta">Shift volume</div>
        </div>
        <div className="kpi-grid">
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(null)}
            title="Total number of completed shifts."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">TS</span>
              <span className="kpi-label">Total Shifts</span>
            </div>
            <div className="kpi-value">{formatCount(kpis.totalShifts)}</div>
            <div className="kpi-desc">Completed shifts</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(null)}
            title="Average duration of completed shifts."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">AS</span>
              <span className="kpi-label">Avg Shift Length</span>
            </div>
            <div className="kpi-value">{formatHours(kpis.averageShiftLength)}</div>
            <div className="kpi-desc">Per completed shift</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(null)}
            title="Total hours worked across completed shifts."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">TH</span>
              <span className="kpi-label">Total Hours</span>
            </div>
            <div className="kpi-value">{formatHours(kpis.totalWorkingHours)}</div>
            <div className="kpi-desc">Worked hours</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(null)}
            title="Average hours worked per week."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">WA</span>
              <span className="kpi-label">Weekly Average</span>
            </div>
            <div className="kpi-value">{formatHours(kpis.weeklyAverage)}</div>
            <div className="kpi-desc">Rolling period</div>
          </div>
        </div>
      </div>

      <div className="kpi-section">
        <div className="kpi-section-header">
          <div className="kpi-section-title">Compliance & Performance</div>
          <div className="kpi-section-meta">Schedule adherence</div>
        </div>
        <div className="kpi-grid">
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(percentScore(kpis.scheduleComplianceRate))}
            title="Percent of shifts that meet start, end, and minimum hours."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">SC</span>
              <span className="kpi-label">Schedule Compliance</span>
            </div>
            <div className="kpi-value">{formatPercent(kpis.scheduleComplianceRate)}</div>
            <div className="kpi-desc">Meets schedule rules</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(overtimeScore(kpis.overtimeHours))}
            title="Hours worked beyond the standard schedule."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">OVT</span>
              <span className="kpi-label">Overtime</span>
            </div>
            <div className="kpi-value">{formatHours(kpis.overtimeHours)}</div>
            <div className="kpi-desc">Beyond standard hours</div>
          </div>
          <div
            className="kpi-card tm-card"
            style={scoreToAccent(varianceScore(kpis.hoursVariance))}
            title="Difference between worked and expected hours."
          >
            <div className="kpi-card-header">
              <span className="kpi-badge">HV</span>
              <span className="kpi-label">Hours Variance</span>
            </div>
            <div className="kpi-value">{formatHours(kpis.hoursVariance, { signed: true })}</div>
            <div className="kpi-desc">Against expected hours</div>
          </div>
        </div>
      </div>

      <div className={`kpi-advanced ${showAdvanced ? 'open' : ''}`}>
        <div className="kpi-section">
          <div className="kpi-section-header">
            <div className="kpi-section-title">Advanced Metrics</div>
            <div className="kpi-section-meta">Additional insights</div>
          </div>
          <div className="kpi-grid">
            <div
              className="kpi-card tm-card"
              style={scoreToAccent(null)}
              title="Expected hours based on working days and time rules."
            >
              <div className="kpi-card-header">
                <span className="kpi-badge">EH</span>
                <span className="kpi-label">Expected Hours</span>
              </div>
              <div className="kpi-value">{formatHours(kpis.expectedHours)}</div>
              <div className="kpi-desc">Per time rules</div>
            </div>
            <div
              className="kpi-card tm-card"
              style={scoreToAccent(null)}
              title="Longest completed shift duration."
            >
              <div className="kpi-card-header">
                <span className="kpi-badge">LS</span>
                <span className="kpi-label">Longest Shift</span>
              </div>
              <div className="kpi-value">{formatHours(kpis.longestShift)}</div>
            </div>
            <div
              className="kpi-card tm-card"
              style={scoreToAccent(null)}
              title="Shortest completed shift duration."
            >
              <div className="kpi-card-header">
                <span className="kpi-badge">SS</span>
                <span className="kpi-label">Shortest Shift</span>
              </div>
              <div className="kpi-value">{formatHours(kpis.shortestShift)}</div>
            </div>
            <div
              className="kpi-card tm-card"
              style={scoreToAccent(null)}
              title="Weekday with the most recorded shifts."
            >
              <div className="kpi-card-header">
                <span className="kpi-badge">MA</span>
                <span className="kpi-label">Most Active Day</span>
              </div>
              <div className="kpi-value">{formatTimeValue(kpis.mostActiveDay)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdvancedKPIs;

