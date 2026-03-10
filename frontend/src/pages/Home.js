import React from 'react';
import useClockingStatus from '../hooks/useClockingStatus';
import useOutletUser from '../hooks/useOutletUser';
import PageHeader from '../components/PageHeader';
import { formatHMS } from '../utils/timeFormat';
import ClockIcon from '../assets/svgs/clock.svg';
import './Home.css';

function Home() {
  const user = useOutletUser();
  const {
    isClockedIn,
    elapsedTime,
    clockLoading,
    clockError,
    toggleClock,
  } = useClockingStatus(user?.id);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <PageHeader
        title={`${getGreeting()}, ${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}!`}
        subtitle="Here's what's happening with your time tracking today."
      />

      <div className="dashboard-grid">
        {/* Clock Status Card */}
        <div className={`stat-card tm-card clock-card ${isClockedIn ? 'active' : 'inactive'}`}>
          <div className="stat-header">
            <span className="stat-icon">
              <img src={ClockIcon} alt="Clock" />
            </span>
            <span className="stat-label">Clock Status</span>
          </div>
          <div className="clock-status">
            <div className={`status-indicator ${isClockedIn ? 'in' : 'out'}`}>
              {isClockedIn ? 'Clocked In' : 'Clocked Out'}
            </div>
            {isClockedIn && (
              <div className="elapsed-time">
                {formatHMS(elapsedTime)}
              </div>
            )}
            <button
              onClick={toggleClock}
              disabled={clockLoading}
              className={`clock-toggle-btn ${isClockedIn ? 'clock-out' : 'clock-in'}`}
            >
              {clockLoading ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
            </button>
            {clockError && <div className="clock-error">{clockError}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
