import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import clocksService from '../services/clocks.service';
import tokenService from '../services/tokenService';
import Sidebar from '../components/Sidebar';
import ClockIcon from '../assets/svgs/clock.svg';
import UserIcon from '../assets/svgs/user.svg';
import EmailIcon from '../assets/svgs/email.svg';
import TeamIcon from '../assets/svgs/teamsvg.svg';
import DataIcon from '../assets/svgs/data.svg';
import './Home.css';

function Home() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const [user, setUser] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [clockInTime, setClockInTime] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = tokenService.getUser();
    if (userData) {
      setUser(userData);
    
      // Fetch current clock status
      const fetchClockStatus = async () => {
      try {
        const response = await clocksService.getUserClocks(userData.id);
        // Handle both response.data (if wrapped) or direct array response
        const clocks = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
        
        if (!Array.isArray(clocks) || clocks.length === 0) {
          setIsClockedIn(false);
          setClockInTime(null);
          setElapsedTime(0);
          return;
        }
        
        // Find the most recent clock entry without a clock_out time
        const activeClock = clocks.reduce((latest, clock) => {
          if (!clock || clock.clock_out) return latest;
          const clockInDate = new Date(clock.clock_in);
          if (Number.isNaN(clockInDate.getTime())) return latest;
          if (!latest) return clock;
          const latestIn = new Date(latest.clock_in);
          return clockInDate > latestIn ? clock : latest;
        }, null);
        
        if (activeClock && activeClock.clock_in) {
          const clockInDate = new Date(activeClock.clock_in);
          if (!Number.isNaN(clockInDate.getTime())) {
            setIsClockedIn(true);
            setClockInTime(clockInDate);
            // Calculate initial elapsed time
            const now = new Date();
            const elapsed = Math.floor((now - clockInDate) / 1000);
            setElapsedTime(elapsed > 0 ? elapsed : 0);
          } else {
            setIsClockedIn(false);
            setClockInTime(null);
            setElapsedTime(0);
          }
        } else {
          setIsClockedIn(false);
          setClockInTime(null);
          setElapsedTime(0);
        }
      } catch (err) {
        // Default to clocked out if fetch fails
        setIsClockedIn(false);
        setClockInTime(null);
        setElapsedTime(0);
      }
    };
    
      fetchClockStatus();
    }
  }, [navigate]);

  // Timer effect for elapsed time
  useEffect(() => {
    if (!isClockedIn || !clockInTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - clockInTime) / 1000);
      setElapsedTime(Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockToggle = async () => {
    if (!user || !user.id) {
      setClockError('User ID required');
      return;
    }

    setClockLoading(true);
    setClockError(null);

    try {
      const response = await clocksService.toggleClock({ user_id: user.id });
      const clockRecord = response?.data || response;
      if (clockRecord) {
        const clockInValue = clockRecord.clock_in;
        const clockOutValue = clockRecord.clock_out;
        const hasOpenClock = !!clockInValue && !clockOutValue;
        setIsClockedIn(hasOpenClock);

        if (hasOpenClock) {
          const clockInDate = new Date(clockInValue);
          if (!Number.isNaN(clockInDate.getTime())) {
            setClockInTime(clockInDate);
            const now = new Date();
            const elapsed = Math.floor((now - clockInDate) / 1000);
            setElapsedTime(Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0);
          } else {
            setClockInTime(null);
            setElapsedTime(0);
          }
        } else {
          setClockInTime(null);
          setElapsedTime(0);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to toggle clock';
      setClockError(message);
    } finally {
      setClockLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '--:--:--';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
          <button onClick={() => navigate('/data')} className="btn-primary tm-btn-primary">
            View Data
          </button>
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
                  {clockInTime ? formatTime(elapsedTime) : '--:--:--'}
                </div>
              )}
              <button
                onClick={handleClockToggle}
                disabled={clockLoading}
                className={`clock-toggle-btn ${isClockedIn ? 'clock-out' : 'clock-in'}`}
              >
                {clockLoading ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
              </button>
              {clockError && <div className="clock-error">{clockError}</div>}
            </div>
          </div>

          <div className="stat-card tm-card">
            <div className="stat-header">
              <span className="stat-icon">
                <img src={UserIcon} alt="User" />
              </span>
              <span className="stat-label">Role</span>
            </div>
            <div className="stat-value">{user.role}</div>
            <div className="stat-footer">
              <span className="stat-tag">Active Account</span>
            </div>
          </div>

          <div className="stat-card tm-card">
            <div className="stat-header">
              <span className="stat-icon">
                <img src={EmailIcon} alt="Email" />
              </span>
              <span className="stat-label">Email</span>
            </div>
            <div className="stat-value-small">{user.email}</div>
          </div>

          <div className="stat-card tm-card">
            <div className="stat-header">
              <span className="stat-icon">
                <img src={TeamIcon} alt="Team" />
              </span>
              <span className="stat-label">Team</span>
            </div>
            <div className="stat-value">{user.team_id || 'No Team'}</div>
            <div className="stat-footer">
              <span className="stat-tag">{user.team_id ? 'Team Member' : 'Individual'}</span>
            </div>
          </div>

          <div className="stat-card tm-card highlight">
            <div className="stat-header">
              <span className="stat-icon">
                <img src={DataIcon} alt="Actions" />
              </span>
              <span className="stat-label">Quick Actions</span>
            </div>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => navigate('/data')}>
                View Reports
              </button>
              <button className="action-btn" onClick={() => navigate('/data')}>
                View Clocks
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;
