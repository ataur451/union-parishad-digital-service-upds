import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import './App.css';
import { AppLayout, type ActivePage } from './layouts/AppLayout';
import { AdminDashboard } from './pages/AdminPage';
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

function pageFromPath(pathname: string): ActivePage {
  if (pathname === '/admin') return 'admin';
  if (pathname === '/groups') return 'groups';
  if (pathname === '/login') return 'login';
  return 'services';
}

function pathForPage(page: ActivePage): string {
  return page === 'services' ? '/dashboard' : `/${page}`;
}

interface RouteGuardProps {
  currentUser: User;
  children: ReactNode;
}

function ProtectedRoute({ currentUser, children }: RouteGuardProps) {
  return currentUser ? children : null;
}

function AdminRoute({ currentUser, children }: RouteGuardProps) {
  return currentUser?.role === 'admin' ? children : null;
}

export function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => getToken());
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    getToken() ? getSavedUser() : null
  );
  const [activePage, setActivePage] = useState<ActivePage>(() =>
    pageFromPath(window.location.pathname)
  );
  const [authLoading, setAuthLoading] = useState(() => Boolean(accessToken));

  const navigate = useCallback((page: ActivePage, replace = false) => {
    const path = pathForPage(page);
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState(null, '', path);
      else window.history.pushState(null, '', path);
    }
    setActivePage(page);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearAuthSession();
      return;
    }

    fetchCurrentUser()
      .then((user) => {
        if (getToken() !== token) return;
        setAccessToken(token);
        setCurrentUser((current) =>
          current &&
          current.id === user.id &&
          current.email === user.email &&
          current.full_name === user.full_name &&
          current.role === user.role &&
          current.is_banned === user.is_banned
            ? current
            : user
        );
      })
      .catch(() => {
        if (getToken() !== token) return;
        clearAuthSession();
        setAccessToken(null);
        setCurrentUser(null);
        window.history.replaceState(null, '', '/login');
        setActivePage('login');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthSession();
      setAccessToken(null);
      setCurrentUser(null);
      window.history.replaceState(null, '', '/login');
      setActivePage('login');
    };

    window.addEventListener('upds:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('upds:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const handlePopState = () => setActivePage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (
      (activePage === 'groups' || activePage === 'admin') &&
      (!currentUser || !accessToken)
    ) {
      navigate('login', true);
    } else if (activePage === 'admin' && currentUser?.role !== 'admin') {
      navigate('services', true);
    }
  }, [accessToken, activePage, authLoading, currentUser, navigate]);

  const handleLogout = () => {
    clearAuthSession();
    setAccessToken(null);
    setCurrentUser(null);
    navigate('services');
  };

  return (
    <AppLayout
      currentUser={currentUser}
      activePage={activePage}
      onNavigate={navigate}
      onLogout={handleLogout}
    >
      {activePage === 'login' && (
        <LoginPage
          onLoginSuccess={(user) => {
            const token = getToken();
            if (!token) {
              throw new Error('Login succeeded without an access token.');
            }
            setAccessToken(token);
            setCurrentUser(user);
            navigate('services');
          }}
          onCancel={() => navigate('services')}
        />
      )}

      {activePage === 'services' && (
        <ServicesPage
          currentUser={authLoading || !accessToken ? null : currentUser}
          onRequireLogin={() => navigate('login')}
        />
      )}

      {authLoading && (activePage === 'groups' || activePage === 'admin') && (
        <div className="loading-box">Checking session...</div>
      )}

      {!authLoading && activePage === 'groups' && currentUser && accessToken && (
        <ProtectedRoute currentUser={currentUser}>
          <GroupsPage currentUser={currentUser} />
        </ProtectedRoute>
      )}

      {!authLoading && activePage === 'admin' && currentUser && accessToken && (
        <ProtectedRoute currentUser={currentUser}>
          <AdminRoute currentUser={currentUser}>
            <AdminDashboard currentUser={currentUser} />
          </AdminRoute>
        </ProtectedRoute>
      )}
    </AppLayout>
  );
}

export default App;
