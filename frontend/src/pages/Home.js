import React from 'react';
import useAuth from '../hooks/useAuth';
import useCurrentUser from '../hooks/useCurrentUser';
import useClockingStatus from '../hooks/useClockingStatus';
import { formatHMS } from '../utils/timeFormat';
import Sidebar from '../components/Sidebar';
import ClockIcon from '../assets/svgs/clock.svg';
import './Home.css';

function Home() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const {
    isClockedIn,
    elapsedTime,
    clockLoading,
    clockError,
    toggleClock,
  } = useClockingStatus(user?.id);
  const { logout } = useAuth();

  if (isUserLoading) return null;
  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard tm-shell">
      <div className="tm-hero" style={{ backgroundImage: `url(${backgroundUrl})` }} aria-hidden="true" />
      <Sidebar user={user} onLogout={logout} />
      
      <div className="dashboard-content tm-panel">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">
              {getGreeting()}, {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}!
            </h1>
            <p className="dashboard-subtitle">Here's what's happening with your time tracking today.</p>
          </div>
        </header>

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
      </div>
    </div>
  );
}

export default Home;
