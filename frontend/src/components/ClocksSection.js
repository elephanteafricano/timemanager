import React from 'react';
import ClockIcon from '../assets/svgs/clock.svg';

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function ClocksSection({ clocks }) {
  return (
    <section className="data-section">
      <h2 className="section-title">Clock Entries ({clocks.length})</h2>
      {clocks.length === 0 ? (
        <div className="empty-state">
          <p>No clock entries found</p>
        </div>
      ) : (
        <div className="data-grid">
          {clocks.map(clock => {
            const clockIn = toValidDate(clock.clock_in);
            const clockOut = toValidDate(clock.clock_out);
            const hasClockIn = !!clockIn;
            const isOpen = hasClockIn && !clockOut;
            const statusLabel = isOpen ? 'In progress' : hasClockIn ? 'Completed' : 'Unknown';
            const timeLabel = !hasClockIn
              ? '—'
              : isOpen
                ? 'In progress'
                : `${clockIn.toLocaleString()} → ${clockOut.toLocaleString()}`;

            return (
              <div key={clock.id} className="data-card">
                <div className="card-header">
                  <div className="clock-icon"><img src={ClockIcon} alt="Clock" /></div>
                  <span className={`status-badge ${isOpen ? 'active' : 'completed'}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="card-body">
                  <p className="card-detail">User: {clock.user?.username || `User #${clock.user_id}`}</p>
                  <p className="card-detail">Time: {timeLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ClocksSection;
