import React from 'react';
import './TeamOverview.css';

function TeamOverview({ teamName, employeeStats, globalStats }) {
  if (employeeStats.length === 0) {
    return (
      <section className="data-section">
        <div className="section-header">
          <h2 className="section-title">Team Overview {teamName ? `(${teamName})` : ''}</h2>
        </div>
        <div className="empty-state">
          <p>No employees in your team</p>
        </div>
      </section>
    );
  }

  return (
    <section className="data-section">
      <div className="section-header">
        <h2 className="section-title">Team Overview {teamName ? `(${teamName})` : ''}</h2>
      </div>

      <div className="stats-overview">
        <div className="stat-card-small">
          <div className="stat-number">{globalStats.totalEmployees}</div>
          <div className="stat-text">Employees</div>
        </div>
        <div className="stat-card-small active">
          <div className="stat-number">{globalStats.currentlyClockedIn}</div>
          <div className="stat-text">Currently Online</div>
        </div>
        <div className="stat-card-small warning">
          <div className="stat-number">{globalStats.avgLateRate}%</div>
          <div className="stat-text">Average Tardiness Rate</div>
        </div>
        <div className="stat-card-small">
          <div className="stat-number">{globalStats.employeesWithIssues}</div>
          <div className="stat-text">Needs Attention</div>
        </div>
      </div>

      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Email</th>
              <th>Attendances</th>
              <th>Late Arrivals</th>
              <th>Tardiness Rate</th>
              <th>Early Departures</th>
              <th>Avg Hours</th>
              <th>Status</th>
              <th>Presence</th>
            </tr>
          </thead>
          <tbody>
            {employeeStats.map(emp => (
              <tr key={emp.id} className={emp.status}>
                <td className="employee-name">{emp.name}</td>
                <td>{emp.email}</td>
                <td className="text-center">{emp.totalShifts}</td>
                <td className="text-center">{emp.lateArrivals}</td>
                <td className="text-center">
                  <span className={`badge ${emp.status}`}>
                    {emp.lateRate}%
                  </span>
                </td>
                <td className="text-center">{emp.earlyDepartures}</td>
                <td className="text-center">{emp.avgHours}h</td>
                <td>
                  <span className={`status-badge ${emp.status}`}>
                    {emp.status === 'good' ? 'Good' : emp.status === 'attention' ? 'Caution' : 'Issue'}
                  </span>
                </td>
                <td>
                  <span className={`presence-badge ${emp.isClockedIn ? 'present' : 'absent'}`}>
                    {emp.isClockedIn ? 'Present' : 'Absent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {globalStats.employeesWithIssues > 0 && (
        <section className="alerts-section">
          <h3 className="section-title">Employees Needing Attention</h3>
          <div className="alerts-list">
            {employeeStats
              .filter(e => e.status !== 'good')
              .map(emp => (
                <div key={emp.id} className={`alert-card ${emp.status}`}>
                  <div className="alert-header">
                    <strong>{emp.name}</strong>
                    <span className="alert-badge">{emp.lateRate}% tardiness</span>
                  </div>
                  <div className="alert-details">
                    {emp.lateArrivals} late arrivals out of {emp.totalShifts} attendances
                    {emp.earlyDepartures > 0 && ` • ${emp.earlyDepartures} early departures`}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </section>
  );
}

export default TeamOverview;
