import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Union Parishad Digital Service</h1>
        <nav>
          <a href="/">Home</a>
          <a href="#services">Services</a>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="app-footer">
        <p>© 2026 Union Parishad Digital Service</p>
      </footer>
    </div>
  );
}
