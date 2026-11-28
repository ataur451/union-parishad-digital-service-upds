import { useEffect, useState } from 'react';
import { KeyRound, Laptop, Monitor, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import {
  changeCurrentPassword,
  fetchCurrentSessions,
  revokeCurrentSession,
  updateCurrentUser,
} from '../services/api';
import type { User, UserSession } from '../types/service';

interface ProfilePageProps {
  currentUser: User;
  onProfileUpdated: (user: User) => void;
  onPasswordChanged: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getDeviceLabel(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown browser or device';
  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('OPR/')
      ? 'Opera'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Chrome/')
          ? 'Chrome'
          : userAgent.includes('Safari/')
            ? 'Safari'
            : 'Browser';
  const platform = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Android')
      ? 'Android'
      : /iPhone|iPad|iPod/.test(userAgent)
        ? 'iOS'
        : userAgent.includes('Macintosh')
          ? 'macOS'
          : userAgent.includes('Linux')
            ? 'Linux'
            : 'device';
  return `${browser} on ${platform}`;
}

function formatSessionDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

export function ProfilePage({
  currentUser,
  onProfileUpdated,
  onPasswordChanged,
}: ProfilePageProps) {
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [email, setEmail] = useState(currentUser.email);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [sessionsSuccess, setSessionsSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentSessions()
      .then((items) => {
        if (active) setSessions(items);
      })
      .catch((error: unknown) => {
        if (active) setSessionsError(getErrorMessage(error, 'Unable to load active sessions.'));
      })
      .finally(() => {
        if (active) setSessionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setSavingProfile(true);
    try {
      const user = await updateCurrentUser({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      onProfileUpdated(user);
      setFullName(user.full_name);
      setEmail(user.email);
      setProfileSuccess('Your profile has been updated.');
    } catch (error: unknown) {
      setProfileError(getErrorMessage(error, 'Unable to update your profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      await changeCurrentPassword(currentPassword, newPassword);
      onPasswordChanged();
    } catch (error: unknown) {
      setPasswordError(getErrorMessage(error, 'Unable to change your password.'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRevokeSession = async (session: UserSession) => {
    setSessionsError(null);
    setSessionsSuccess(null);
    setRevokingSessionId(session.id);
    try {
      await revokeCurrentSession(session.id);
      setSessions((activeSessions) =>
        activeSessions.filter((activeSession) => activeSession.id !== session.id)
      );
      setSessionsSuccess('The selected session has been revoked.');
    } catch (error: unknown) {
      setSessionsError(getErrorMessage(error, 'Unable to revoke this session.'));
    } finally {
      setRevokingSessionId(null);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-heading">
        <div className="profile-avatar" aria-hidden="true">
          <UserRound size={27} />
        </div>
        <div>
          <p className="profile-eyebrow">Account settings</p>
          <h2>My Profile</h2>
          <p>Manage your personal information and sign-in security.</p>
        </div>
      </header>

      <div className="profile-grid">
        <section className="card-box profile-card">
          <div className="profile-card-heading">
            <div className="profile-section-icon" aria-hidden="true">
              <UserRound size={19} />
            </div>
            <div>
              <h3>Personal information</h3>
              <p>Update the details associated with your account.</p>
            </div>
          </div>

          {profileError && <div className="alert-error" role="alert">{profileError}</div>}
          {profileSuccess && <div className="alert-success" role="status">{profileSuccess}</div>}

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profile-email">Email address</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="profile-account-meta">
              <span>Account type</span>
              <span className={`role-tag role-${currentUser.role}`}>
                {currentUser.role.toUpperCase()}
              </span>
            </div>
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </section>

        <section className="card-box profile-card">
          <div className="profile-card-heading">
            <div className="profile-section-icon" aria-hidden="true">
              <KeyRound size={19} />
            </div>
            <div>
              <h3>Change password</h3>
              <p>Verify your current password before choosing a new one.</p>
            </div>
          </div>

          {passwordError && <div className="alert-error" role="alert">{passwordError}</div>}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
              <small>Use at least 8 characters.</small>
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={changingPassword}>
              {changingPassword ? 'Changing password...' : 'Change password'}
            </button>
            <p className="profile-security-note">
              You’ll be asked to sign in again after your password is changed.
            </p>
          </form>
        </section>
      </div>

      <section className="card-box profile-card sessions-card">
        <div className="profile-card-heading">
          <div className="profile-section-icon" aria-hidden="true">
            <ShieldCheck size={19} />
          </div>
          <div>
            <h3>Active sessions</h3>
            <p>Review browsers and devices signed in to your account.</p>
          </div>
        </div>

        {sessionsError && <div className="alert-error" role="alert">{sessionsError}</div>}
        {sessionsSuccess && <div className="alert-success" role="status">{sessionsSuccess}</div>}
        {sessionsLoading ? (
          <p className="session-empty">Loading active sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="session-empty">No active sessions found.</p>
        ) : (
          <ul className="session-list">
            {sessions.map((session) => {
              const isMobile = /Android|iPhone|iPad|iPod/i.test(session.user_agent ?? '');
              const DeviceIcon = isMobile ? Smartphone : session.user_agent ? Laptop : Monitor;
              return (
                <li className="session-item" key={session.id}>
                  <div className="session-device-icon" aria-hidden="true">
                    <DeviceIcon size={20} />
                  </div>
                  <div className="session-details">
                    <strong>{getDeviceLabel(session.user_agent)}</strong>
                    <span>Signed in {formatSessionDate(session.created_at)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-revoke-session"
                    onClick={() => handleRevokeSession(session)}
                    disabled={revokingSessionId !== null}
                    aria-label={`Revoke session: ${getDeviceLabel(session.user_agent)}`}
                  >
                    {revokingSessionId === session.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
