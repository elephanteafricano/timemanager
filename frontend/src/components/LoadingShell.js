import { getBackgroundImageStyle } from '../utils/backgroundImage';
import Sidebar from './Sidebar';

function LoadingShell({ user, onLogout, backgroundUrl }) {
  return (
    <div className="dashboard tm-shell">
      <div className="tm-hero" style={getBackgroundImageStyle(backgroundUrl)} aria-hidden="true" />
      {user ? <Sidebar user={user} onLogout={onLogout} /> : null}
      <div className="dashboard-content tm-panel">
        <div className="tm-card" style={{ padding: '20px' }}>Loading...</div>
      </div>
    </div>
  );
}

export default LoadingShell;
