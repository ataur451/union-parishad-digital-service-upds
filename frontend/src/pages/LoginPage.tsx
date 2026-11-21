import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';
import type { User } from '../types/service';
interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onCancel,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nid, setNid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(email.trim(), password);
        onLoginSuccess(res.user);
      } else {
        if (!name.trim()) {
          throw new Error('Full name is required.');
        }
        const res = await registerUser({
          full_name: name.trim(),
          email: email.trim(),
          password,
        });
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-badge">Union Parishad Digital Service</div>
          <h2>{mode === 'login' ? 'Sign In to Your Account' : 'Create Citizen Account'}</h2>
          <p>
            {mode === 'login'
              ? 'Log in to manage your applications and group sharing'
              : 'Register to apply for digital certificates and services'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>NID Number (Optional)</label>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="10 or 17 digit NID number"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@upds.gov.bd"
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Login'
              : 'Create Account'}
          </button>
        </form>

        <div className="demo-accounts-box">
          <div className="demo-title">Quick Demo Accounts (1-Click Fill):</div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn-demo"
              onClick={() => fillDemoAccount('admin@upds.gov.bd', 'admin123')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => fillDemoAccount('staff@upds.gov.bd', 'staff123')}
            >
              🗂️ Staff
            </button>
            <button
              type="button"
              className="btn-demo"
              onClick={() => fillDemoAccount('citizen@upds.gov.bd', 'citizen123')}
            >
              👤 Citizen
            </button>
          </div>
        </div>

        {onCancel && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button type="button" className="btn-link" onClick={onCancel}>
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};