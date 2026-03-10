import React from 'react';

function PageHeader({ title, subtitle, rightActions }) {
  return (
    <header className="dashboard-header">
      <div>
        <h1 className="dashboard-greeting">{title}</h1>
        <p className="dashboard-subtitle">{subtitle}</p>
      </div>
      {rightActions || null}
    </header>
  );
}

export default PageHeader;
