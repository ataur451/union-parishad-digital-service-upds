import React, { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f6f7' }}>
      <header style={{ background: '#2c3e50', color: 'white', padding: '15px 20px', textAlign: 'center' }}>
        <h2>Union Parishad Digital Service (UPDS) Portal</h2>
      </header>

      <main style={{ flex: 1, padding: '20px', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </main>

      <footer style={{ background: '#34495e', color: 'white', textAlign: 'center', padding: '10px' }}>
        <p>&copy; 2026 Union Parishad Digital Service. All rights reserved.</p>
      </footer>
    </div>
  );
};