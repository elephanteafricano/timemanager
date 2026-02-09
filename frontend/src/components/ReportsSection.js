import React from 'react';

function ReportsSection({ reports }) {
  return (
    <section className="data-section">
      <h2 className="section-title">Your Reports</h2>
      <div className="reports-summary">
        <div className="summary-card">
          <div className="summary-icon">HRS</div>
          <div className="summary-content">
            <div className="summary-label">Total Hours</div>
            <div className="summary-value">{reports.totalHours || 0}h</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">DAY</div>
          <div className="summary-content">
            <div className="summary-label">Work Days</div>
            <div className="summary-value">{reports.workDays || 0}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">AVG</div>
          <div className="summary-content">
            <div className="summary-label">Avg Daily Hours</div>
            <div className="summary-value">{reports.averageDailyHours || 0}h</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReportsSection;
