import React from 'react';
import './KeyIndicators.css';

function KeyIndicators({ chartData }) {
  const { monthlyHours, attendanceTrend, productivityScore, userHours } = chartData;

  // Calculate gauge angle (0-180 degrees)
  const gaugeAngle = (productivityScore / 100) * 180 - 90;

  return (
    <div className="key-indicators">
      <h2 className="indicators-title">KEY INDICATORS</h2>
      
      <div className="indicators-grid">
        {/* Monthly Hours Status */}
        <div className="indicator-card">
          <h3 className="indicator-label">MONTHLY HOURS STATUS</h3>
          <div className="bar-chart">
            {monthlyHours.map((data, idx) => {
              const heightPercent = (data.hours / data.maxHours) * 100;
              const colorClass = idx % 2 === 0 ? 'bar-primary' : 'bar-secondary';
              
              return (
                <div key={data.month} className="bar-group">
                  <div className="bar-container">
                    <div 
                      className={`bar ${colorClass}`}
                      style={{ height: `${Math.min(heightPercent, 100)}%` }}
                      title={`${data.hours}h`}
                    />
                  </div>
                  <div className="bar-label">{data.month}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-scale">
            <span>0</span>
            <span>125</span>
          </div>
        </div>

        {/* Attendance Forecast */}
        <div className="indicator-card">
          <h3 className="indicator-label">ATTENDANCE FORECAST</h3>
          <div className="line-chart">
            <svg viewBox="0 0 300 120" className="line-svg">
              {/* Grid lines */}
              <line x1="0" y1="30" x2="300" y2="30" stroke="#f0f0f0" strokeWidth="1"/>
              <line x1="0" y1="60" x2="300" y2="60" stroke="#f0f0f0" strokeWidth="1"/>
              <line x1="0" y1="90" x2="300" y2="90" stroke="#f0f0f0" strokeWidth="1"/>
              
              {/* Actual line */}
              <polyline
                points={attendanceTrend.map((d, i) => {
                  const x = (i / (attendanceTrend.length - 1)) * 280 + 10;
                  const y = 110 - (d.actual / 25) * 80;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#7c6fd6"
                strokeWidth="3"
              />
              
              {/* Expected line */}
              <polyline
                points={attendanceTrend.map((d, i) => {
                  const x = (i / (attendanceTrend.length - 1)) * 280 + 10;
                  const y = 110 - (d.expected / 25) * 80;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#4ecdc4"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
          <div className="chart-months">
            {attendanceTrend.map(d => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
          <div className="chart-scale">
            <span>0</span>
            <span>125</span>
          </div>
        </div>

        {/* Productivity Score */}
        <div className="indicator-card">
          <h3 className="indicator-label">PRODUCTIVITY SCORE</h3>
          <div className="gauge-chart">
            <svg viewBox="0 0 200 120" className="gauge-svg">
              {/* Background arc */}
              <path
                d="M 20,100 A 80,80 0 0,1 180,100"
                fill="none"
                stroke="#f0f0f0"
                strokeWidth="20"
                strokeLinecap="round"
              />
              
              {/* Colored arc segments */}
              <path
                d="M 20,100 A 80,80 0 0,1 60,35"
                fill="none"
                stroke="#ff9800"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M 60,35 A 80,80 0 0,1 140,35"
                fill="none"
                stroke="#cddc39"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <path
                d="M 140,35 A 80,80 0 0,1 180,100"
                fill="none"
                stroke="#4ecdc4"
                strokeWidth="20"
                strokeLinecap="round"
              />
              
              {/* Needle */}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke="#666"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${gaugeAngle} 100 100)`}
              />
              <circle cx="100" cy="100" r="5" fill="#666"/>
            </svg>
            <div className="gauge-value">{productivityScore}</div>
          </div>
          <div className="gauge-labels">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        {/* Hours by User */}
        <div className="indicator-card">
          <h3 className="indicator-label">HOURS BY USER</h3>
          <div className="horizontal-bars">
            {userHours.map((user, idx) => {
              const widthPercent = (user.hours / user.maxHours) * 100;
              const colorClass = idx % 2 === 0 ? 'hbar-primary' : 'hbar-secondary';
              
              return (
                <div key={user.id || user.name || idx} className="hbar-row">
                  <div className="hbar-label">{user.name}</div>
                  <div className="hbar-container">
                    <div 
                      className={`hbar ${colorClass}`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <div className="hbar-value">{user.hours}h</div>
                </div>
              );
            })}
          </div>
          <div className="chart-scale horizontal">
            <span>0</span>
            <span>30</span>
            <span>60</span>
            <span>90</span>
            <span>120</span>
            <span>150</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyIndicators;
