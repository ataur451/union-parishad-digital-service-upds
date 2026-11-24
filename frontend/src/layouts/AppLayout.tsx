import React from 'react';
import { Landmark, LayoutGrid, Users, ShieldCheck, LogOut, LogIn } from 'lucide-react';
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
          <button type="button" className="brand-area" onClick={() => onNavigate('services')} aria-label="Go to services home">
            <span className="brand-logo"><Landmark aria-hidden="true" size={25} /></span>
            <div>
              <h1 className="brand-title">Union Parishad Digital Service</h1>
              <span className="brand-subtitle">
                E-Governance & Citizen Service Portal (UPDS)
              </span>
            </div>
          </button>

          <nav className="nav-links" aria-label="Main navigation">
            <button
              type="button"
              className={`nav-btn ${activePage === 'services' ? 'active' : ''}`}
              onClick={() => onNavigate('services')}
            >
              <LayoutGrid size={17} aria-hidden="true" /> Services
            </button>

            {currentUser && (
              <button
                type="button"
                className={`nav-btn ${activePage === 'groups' ? 'active' : ''}`}
                onClick={() => onNavigate('groups')}
              >
                <Users size={17} aria-hidden="true" /> Groups
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                type="button"
                className={`nav-btn ${activePage === 'admin' ? 'active' : ''}`}
                onClick={() => onNavigate('admin')}
              >
                <ShieldCheck size={17} aria-hidden="true" /> Admin
              </button>
            )}
          </nav>

          <div className="user-area">
            {currentUser ? (
              <div className="user-pill">
                <div className="user-meta">
                  <strong>{currentUser.full_name}</strong>
                  <span className={`role-tag role-${currentUser.role}`}>
                    {currentUser.role.toUpperCase()}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-logout"
                  onClick={onLogout}
                >
                  <LogOut size={15} aria-hidden="true" /> Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => onNavigate('login')}
              >
                <LogIn size={16} aria-hidden="true" /> Sign in
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