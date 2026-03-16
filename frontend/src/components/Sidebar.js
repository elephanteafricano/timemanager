import { useNavigate, useLocation } from 'react-router-dom';
import { isManagerRole } from '../utils/roles';
import './Sidebar.css';
import ClockIcon from '../assets/svgs/clock.svg';
import DataIcon from '../assets/svgs/data.svg';
import ProfileIcon from '../assets/svgs/profile.svg';
import TeamIcon from '../assets/svgs/teamsvg.svg';
import UserIcon from '../assets/svgs/user.svg';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = isManagerRole(user);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: DataIcon },
    { path: '/clocking', label: 'Clocking', icon: ClockIcon },
    ...(isManager ? [
      { path: '/teams', label: 'Teams', icon: TeamIcon },
      { path: '/users', label: 'Users', icon: UserIcon },
      { path: '/rules', label: 'Rules', icon: ProfileIcon },
    ] : []),
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">TimeManager</h2>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">
              <img src={item.icon} alt={item.label} />
            </span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <img
              className="tm-avatar-lg"
              src="/images/avatar.png"
              alt=""
            />
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        )}
        {isManager && (
          <button onClick={() => navigate('/profile')} className="sidebar-logout">
            Profile
          </button>
        )}
        <button onClick={onLogout} className="sidebar-logout">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
