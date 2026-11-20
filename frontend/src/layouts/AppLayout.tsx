import React from 'react';
import type { User } from '../types/service';
export type ActivePage = 'services' | 'groups' | 'admin' | 'login';

interface AppLayoutProps {
  currentUser: User | null;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  activePage,
  onNavigate,
  onLogout,
  children,
}) => {
  return (
    <div className="app-shell">
      <header className="top-navbar">
        <div className="navbar-inner">
          <div
            className="brand-area"
            onClick={() => onNavigate('services')}
            style={{ cursor: 'pointer' }}
          >
            <span className="brand-logo">🏛️</span>
            <div>
              <h1 className="brand-title">Union Parishad Digital Service</h1>
              <span className="brand-subtitle">
                E-Governance & Citizen Service Portal (UPDS)
              </span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              type="button"
              className={`nav-btn ${activePage === 'services' ? 'active' : ''}`}
              onClick={() => onNavigate('services')}
            >
              Services & Applications
            </button>

            {currentUser && (
              <button
                type="button"
                className={`nav-btn ${activePage === 'groups' ? 'active' : ''}`}
                onClick={() => onNavigate('groups')}
              >
                Groups & Sharing
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                type="button"
                className={`nav-btn ${activePage === 'admin' ? 'active' : ''}`}
                onClick={() => onNavigate('admin')}
              >
                Admin Panel
              </button>
            )}
          </nav>

          <div className="user-area">
            {currentUser ? (
              <div className="user-pill">
                <div className="user-meta">
                  <strong>{currentUser.name}</strong>
                  <span className={`role-tag role-${currentUser.role}`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-logout"
                  onClick={onLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => onNavigate('login')}
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content">{children}</main>

      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Union Parishad Digital Service (UPDS) —
          Multi-User E-Governance Platform
        </p>
      </footer>
    </div>
  );
};