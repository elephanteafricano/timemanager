import React from 'react';

function InlineState({ loading, loadingText, error, children }) {
  if (typeof error === 'string' && error.trim() !== '') {
    return <div className="error">{error}</div>;
  }

  if (loading) {
    return <div className="loading">{loadingText || 'Loading...'}</div>;
  }

  return children;
}

export default InlineState;
