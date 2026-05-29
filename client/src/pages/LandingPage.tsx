import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

interface MockNote {
  id: string;
  text: string;
  columnId: number;
  author: string;
  votes: number;
  rotationClass: string;
  isNew?: boolean;
}

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [timerSeconds, setTimerSeconds] = useState(299); // 4:59
  const [mockNotes, setMockNotes] = useState<MockNote[]>([
    {
      id: 'note-1',
      text: 'Successfully launched the v2.0 dashboard upgrade on schedule!',
      columnId: 1,
      author: 'Marcus K.',
      votes: 5,
      rotationClass: 'lp-rot-1',
    },
    {
      id: 'note-2',
      text: 'Refining unit tests resulted in 95% statement coverage.',
      columnId: 1,
      author: 'Sarah L.',
      votes: 8,
      rotationClass: 'lp-rot-2',
    },
    {
      id: 'note-3',
      text: 'Figma mockups were slightly delayed, pushing backend setup ahead.',
      columnId: 2,
      author: 'Jordan P.',
      votes: 3,
      rotationClass: 'lp-rot-3',
    },
    {
      id: 'note-4',
      text: 'Improve asset caching rules to speed up page loads on cold startup.',
      columnId: 3,
      author: 'Alex T.',
      votes: 6,
      rotationClass: 'lp-rot-4',
    },
  ]);

  // Handle simulated timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 0) return 299; // reset to 4:59
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Upvote simulated note
  const handleUpvote = (id: string) => {
    setMockNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, votes: note.votes + 1 } : note
      )
    );
  };

  // Simulate adding a note dynamically
  const addSimulatedNote = (columnId: number) => {
    const sampleTexts = [
      'Team cohesion during the sprint crunch was outstanding! 🌟',
      'Daily standups felt slightly rushed on busier days.',
      'Schedule a deep-dive architecture alignment for next Tuesday.',
      'Our live socket syncing is exceptionally responsive! 🚀',
      'Documentation updates are still pending review.',
      'Refactor the legacy CSS rules into neat modular styling.',
    ];
    const authors = ['Sofia D.', 'Marcus K.', 'Liam O.', 'Sarah L.', 'Jordan P.'];
    const text = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const id = `simulated-note-${Date.now()}`;
    const rotations = ['lp-rot-1', 'lp-rot-2', 'lp-rot-3', 'lp-rot-4'];
    const rotationClass = rotations[Math.floor(Math.random() * rotations.length)];

    const newNote: MockNote = {
      id,
      text,
      columnId,
      author,
      votes: 1,
      rotationClass,
      isNew: true,
    };

    setMockNotes((prev) => [...prev, newNote]);

    // Clear the isNew border highlight after a couple of seconds
    setTimeout(() => {
      setMockNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, isNew: false } : note))
      );
    }, 2000);
  };

  return (
    <div className="landing-page">
      {/* Dynamic Header */}
      <header className="lp-header">
        <Link to="/" className="lp-logo-container">
          <div className="lp-logo-icon">R</div>
          <span className="lp-logo-text">RetroBoard</span>
        </Link>
        <nav className="lp-nav">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#workflow" className="lp-nav-link">How it Works</a>
          {user ? (
            <Link to="/dashboard" className="lp-nav-link">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="lp-nav-link">Sign In</Link>
            </>
          )}
        </nav>
        <div className="lp-auth-buttons">
          {user ? (
            <Link to="/dashboard" className="lp-btn lp-btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn lp-btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="lp-btn lp-btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-badge animate-fade-in">
          Real-time collaborative retro tool
        </div>
        <h1 className="lp-title animate-fade-in animate-delay-1">
          Collaborate. Reflect. <span>Improve.</span>
        </h1>
        <p className="lp-subtitle animate-fade-in animate-delay-2">
          An intuitive, real-time retrospective board for modern agile teams. 
          Gather feedback, group action items, and align with your team instantly.
        </p>
        
        <div className="lp-cta-group animate-fade-in animate-delay-2">
          {user ? (
            <Link to="/dashboard" className="lp-btn lp-btn-primary">
              Access Your Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="lp-btn lp-btn-primary">
                Get Started for Free
              </Link>
              <a href="#features" className="lp-btn lp-btn-secondary">
                Explore Features
              </a>
            </>
          )}
        </div>

        {/* Interactive Mockup Board */}
        <div className="lp-mockup-wrapper animate-fade-in animate-delay-3" id="mockup-board">
          <div className="lp-mockup-header">
            <div className="lp-mockup-title-sec">
              <h3 className="lp-mockup-board-name">Agile Team Retrospective</h3>
              <span className="lp-mockup-board-sprint">Sprint 24 Review</span>
            </div>
            
            <div className="lp-mockup-controls">
              <div className="lp-mockup-timer" title="Timeboxing timer active">
                ⏱️ <span>{formatTimer(timerSeconds)}</span>
              </div>
              <div className="lp-mockup-presence" title="Active collaborators online">
                <div className="lp-presence-avatar" style={{ background: '#ec4899' }}>AM</div>
                <div className="lp-presence-avatar" style={{ background: '#3b82f6' }}>JD</div>
                <div className="lp-presence-avatar active-avatar" style={{ background: '#10b981' }}>SL</div>
                <div className="lp-presence-avatar" style={{ background: '#8b5cf6' }}>TK</div>
              </div>
            </div>
          </div>

          <div className="lp-mockup-grid">
            {/* Column 1: Went Well */}
            <div className="lp-mockup-col">
              <div className="lp-mockup-col-header lp-mockup-col-accent-1">
                <span className="lp-mockup-col-title">What Went Well</span>
                <button 
                  className="lp-mockup-btn-add" 
                  onClick={() => addSimulatedNote(1)}
                  title="Simulate adding note"
                >
                  +
                </button>
              </div>
              {mockNotes
                .filter((n) => n.columnId === 1)
                .map((note) => (
                  <div 
                    key={note.id} 
                    className={`lp-mockup-card ${note.rotationClass} ${note.isNew ? 'new-note-added' : ''}`}
                  >
                    <p className="lp-mockup-card-text">{note.text}</p>
                    <div className="lp-mockup-card-footer">
                      <span className="lp-mockup-card-author">👤 {note.author}</span>
                      <span 
                        className="lp-mockup-card-upvotes"
                        onClick={() => handleUpvote(note.id)}
                        title="Click to upvote"
                      >
                        👍 {note.votes}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Column 2: Didn't Go Well */}
            <div className="lp-mockup-col">
              <div className="lp-mockup-col-header lp-mockup-col-accent-2">
                <span className="lp-mockup-col-title">What Didn't Go Well</span>
                <button 
                  className="lp-mockup-btn-add" 
                  onClick={() => addSimulatedNote(2)}
                  title="Simulate adding note"
                >
                  +
                </button>
              </div>
              {mockNotes
                .filter((n) => n.columnId === 2)
                .map((note) => (
                  <div 
                    key={note.id} 
                    className={`lp-mockup-card ${note.rotationClass} ${note.isNew ? 'new-note-added' : ''}`}
                  >
                    <p className="lp-mockup-card-text">{note.text}</p>
                    <div className="lp-mockup-card-footer">
                      <span className="lp-mockup-card-author">👤 {note.author}</span>
                      <span 
                        className="lp-mockup-card-upvotes"
                        onClick={() => handleUpvote(note.id)}
                        title="Click to upvote"
                      >
                        👍 {note.votes}
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Column 3: Action Items */}
            <div className="lp-mockup-col">
              <div className="lp-mockup-col-header lp-mockup-col-accent-3">
                <span className="lp-mockup-col-title">Action Items</span>
                <button 
                  className="lp-mockup-btn-add" 
                  onClick={() => addSimulatedNote(3)}
                  title="Simulate adding note"
                >
                  +
                </button>
              </div>
              {mockNotes
                .filter((n) => n.columnId === 3)
                .map((note) => (
                  <div 
                    key={note.id} 
                    className={`lp-mockup-card ${note.rotationClass} ${note.isNew ? 'new-note-added' : ''}`}
                  >
                    <p className="lp-mockup-card-text">{note.text}</p>
                    <div className="lp-mockup-card-footer">
                      <span className="lp-mockup-card-author">👤 {note.author}</span>
                      <span 
                        className="lp-mockup-card-upvotes"
                        onClick={() => handleUpvote(note.id)}
                        title="Click to upvote"
                      >
                        👍 {note.votes}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="lp-interactive-trigger">
            <span className="lp-interactive-label">💡 Interactive board mockup:</span>
            <button className="lp-btn lp-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => addSimulatedNote(Math.ceil(Math.random() * 3))}>
              ➕ Randomly Add Card
            </button>
          </div>
        </div>
      </section>

      {/* Tech Badges Section */}
      <section className="lp-tech-section">
        <h4 className="lp-tech-title">Built with Modern High-Performance Tech</h4>
        <div className="lp-tech-badges">
          <span className="lp-tech-badge">⚛️ React 19</span>
          <span className="lp-tech-badge">🛡️ TypeScript</span>
          <span className="lp-tech-badge">⚡ Socket.io</span>
          <span className="lp-tech-badge">🟢 Node.js</span>
          <span className="lp-tech-badge">🍃 MongoDB</span>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="lp-section" id="features">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Everything you need for perfect retros</h2>
          <p className="lp-section-subtitle">
            Say goodbye to clunky spreadsheet retro logs. Embrace a collaborative canvas built specifically for agile velocity.
          </p>
        </div>

        <div className="lp-grid">
          {/* Card 1 */}
          <div className="lp-card">
            <div className="lp-card-icon">⚡</div>
            <h3 className="lp-card-title">Real-Time Syncing</h3>
            <p className="lp-card-desc">
              Powered by web sockets. Sticky notes move, update, and sort instantly across all team devices without lag.
            </p>
          </div>

          {/* Card 2 */}
          <div className="lp-card">
            <div className="lp-card-icon">⏱️</div>
            <h3 className="lp-card-title">Built-In Timeboxing</h3>
            <p className="lp-card-desc">
              Keep discussions on track. Run time-boxed sessions with a synchronous timer visible to all collaborators.
            </p>
          </div>

          {/* Card 3 */}
          <div className="lp-card">
            <div className="lp-card-icon">🗳️</div>
            <h3 className="lp-card-title">Anonymous Upvoting</h3>
            <p className="lp-card-desc">
              Empower every voice. Team members can vote on critical items to ensure the most important topics rise to the top.
            </p>
          </div>

          {/* Card 4 */}
          <div className="lp-card">
            <div className="lp-card-icon">📄</div>
            <h3 className="lp-card-title">Instant PDF Reports</h3>
            <p className="lp-card-desc">
              Document your outcomes. Export completed boards directly to high-quality PDF files for simple sharing.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Steps Section */}
      <section className="lp-section" id="workflow">
        <div className="lp-section-header">
          <h2 className="lp-section-title">How it works</h2>
          <p className="lp-section-subtitle">
            Collaborate on sprint retrospectives in four simple steps.
          </p>
        </div>

        <div className="lp-steps-container">
          <div className="lp-step">
            <div className="lp-step-num">1</div>
            <div className="lp-step-info">
              <h3 className="lp-step-title">Create a new board</h3>
              <p className="lp-step-desc">Name your retrospective, choose column layouts, and set up your sprint workspace in seconds.</p>
            </div>
          </div>

          <div className="lp-step">
            <div className="lp-step-num">2</div>
            <div className="lp-step-info">
              <h3 className="lp-step-title">Invite your agile team</h3>
              <p className="lp-step-desc">Share the secure board link with teammates. They can jump in instantly as registered users or guests.</p>
            </div>
          </div>

          <div className="lp-step">
            <div className="lp-step-num">3</div>
            <div className="lp-step-info">
              <h3 className="lp-step-title">Brainstorm & Upvote</h3>
              <p className="lp-step-desc">Add virtual sticky notes for feedback, organize items, and vote to surface key discussion items.</p>
            </div>
          </div>

          <div className="lp-step">
            <div className="lp-step-num">4</div>
            <div className="lp-step-info">
              <h3 className="lp-step-title">Track Action Items</h3>
              <p className="lp-step-desc">Create clear accountability with action items, assign tasks, and download PDF logs for storage.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="lp-footer">
        <div className="lp-footer-content">
          <div className="lp-footer-brand">
            <Link to="/" className="lp-logo-container" style={{ padding: 0 }}>
              <div className="lp-logo-icon">R</div>
              <span className="lp-logo-text" style={{ fontSize: '1.25rem' }}>RetroBoard</span>
            </Link>
            <p className="lp-footer-desc">
              Agile retrospectives made fast, collaborative, and simple. Shift your team feedback loops into warp drive.
            </p>
          </div>

          <div className="lp-footer-column">
            <h5 className="lp-footer-heading">Product</h5>
            <ul className="lp-footer-links">
              <li><a href="#features" className="lp-footer-link">Features</a></li>
              <li><a href="#workflow" className="lp-footer-link">How it Works</a></li>
              <li><a href="#mockup-board" className="lp-footer-link">Live Mockup</a></li>
            </ul>
          </div>

          <div className="lp-footer-column">
            <h5 className="lp-footer-heading">Account</h5>
            <ul className="lp-footer-links">
              {user ? (
                <li><Link to="/dashboard" className="lp-footer-link">Dashboard</Link></li>
              ) : (
                <>
                  <li><Link to="/login" className="lp-footer-link">Sign In</Link></li>
                  <li><Link to="/register" className="lp-footer-link">Register</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} RetroBoard. All rights reserved.</p>
          <p>Made with ❤️ for Agile Teams</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
