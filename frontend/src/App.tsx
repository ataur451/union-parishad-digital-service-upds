import { useEffect, useState } from 'react';
import './App.css';
import { AppLayout, type ActivePage } from './layouts/AppLayout';
import { AdminPage } from './pages/AdminPage';
import { GroupsPage } from './pages/GroupsPage';
import { LoginPage } from './pages/LoginPage';
import { ServicesPage } from './pages/ServicesPage';
import {
  clearAuthSession,
  fetchCurrentUser,
  getSavedUser,
  getToken,
} from './services/api';
import type { User } from './types/service';
export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getSavedUser()
  );
  const [activePage, setActivePage] = useState<ActivePage>('services');

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchCurrentUser()
        .then((freshUser) => setCurrentUser(freshUser))
        .catch(() => {
          clearAuthSession();
          setCurrentUser(null);
        });
    }

    const handleUnauthorized = () => {
      setCurrentUser(null);
      setActivePage('login');
    };

    window.addEventListener('upds:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('upds:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActivePage('services');
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setActivePage('services');
  };

  return (
    <AppLayout
      currentUser={currentUser}
      activePage={activePage}
      onNavigate={setActivePage}
      onLogout={handleLogout}
    >
      {activePage === 'login' && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setActivePage('services')}
        />
      )}

      {activePage === 'services' && (
        <ServicesPage
          currentUser={currentUser}
          onRequireLogin={() => setActivePage('login')}
        />
      )}

      {activePage === 'groups' && currentUser && (
        <GroupsPage currentUser={currentUser} />
      )}

      {activePage === 'admin' && currentUser && (
        <AdminPage currentUser={currentUser} />
      )}
    </AppLayout>
  );
}

export default App;