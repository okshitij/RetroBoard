import React from 'react';
import '../styles/SkeletonLoader.css';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="skeleton-text skeleton-shimmer" style={{ width: '160px', height: '32px' }} />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="skeleton-text skeleton-shimmer" style={{ width: '120px', height: '20px' }} />
            <div className="skeleton-button skeleton-shimmer" />
          </div>
        </div>
      </header>
      <main className="dashboard-main">
        <div className="skeleton-action skeleton-shimmer" style={{ width: '180px', height: '42px', borderRadius: '4px', marginBottom: '2rem' }} />
        <div className="boards-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-board-card">
              <div className="skeleton-text skeleton-shimmer" style={{ width: '70%', height: '22px', marginBottom: '0.75rem' }} />
              <div className="skeleton-text skeleton-shimmer" style={{ width: '50%', height: '16px', marginBottom: '1rem' }} />
              <div className="skeleton-text skeleton-shimmer" style={{ width: '40%', height: '14px', marginBottom: '1.25rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="skeleton-button skeleton-shimmer" style={{ flex: 1 }} />
                <div className="skeleton-button skeleton-shimmer" style={{ flex: 1 }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export const BoardSkeleton: React.FC = () => {
  return (
    <div className="board-page-layout">
      <header className="board-header">
        <div className="header-content">
          <div className="skeleton-button skeleton-shimmer" style={{ width: '170px' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div className="skeleton-text skeleton-shimmer" style={{ width: '220px', height: '28px', margin: '0 auto 0.5rem' }} />
            <div className="skeleton-text skeleton-shimmer" style={{ width: '140px', height: '16px', margin: '0 auto' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="skeleton-button skeleton-shimmer" />
            <div className="skeleton-button skeleton-shimmer" />
            <div className="skeleton-button skeleton-shimmer" />
          </div>
        </div>
      </header>
      <div className="board-container">
        <div className="board-view">
          <div className="board-columns" style={{ display: 'flex', gap: '1rem', padding: '2rem' }}>
            {[1, 2, 3].map((col) => (
              <div key={col} className="skeleton-column">
                <div className="skeleton-column-header">
                  <div className="skeleton-text skeleton-shimmer" style={{ width: '60%', height: '20px' }} />
                  <div className="skeleton-circle skeleton-shimmer" />
                </div>
                <div className="skeleton-column-body">
                  {Array.from({ length: 2 + col }, (_, i) => (
                    <div key={i} className="skeleton-note">
                      <div className="skeleton-text skeleton-shimmer" style={{ width: '90%', height: '14px', marginBottom: '0.5rem' }} />
                      <div className="skeleton-text skeleton-shimmer" style={{ width: '60%', height: '14px', marginBottom: '0.75rem' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton-text skeleton-shimmer" style={{ width: '50px', height: '12px' }} />
                        <div className="skeleton-text skeleton-shimmer" style={{ width: '30px', height: '12px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
