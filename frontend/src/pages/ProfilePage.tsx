import { useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { changeCurrentPassword, updateCurrentUser } from '../services/api';
import type { User } from '../types/service';

interface ProfilePageProps {
  currentUser: User;
  onProfileUpdated: (user: User) => void;
  onPasswordChanged: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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
    </div>
  );
}
