import React, { useEffect, useState } from 'react';
import {
  fetchAdminStats,
  fetchAllUsers,
  fetchAuditLogs,
  toggleUserStatus,
  updateUserRole,
} from '../services/api';
import type { AdminStats, AuditLog, Role, User } from '../types/service';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, userData, auditData] = await Promise.all([
        fetchAdminStats(),
        fetchAllUsers(),
        fetchAuditLogs(),
      ]);
      setStats(statsData);
      setUsers(userData);
      setLogs(auditData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const changeRole = async (target: User) => {
    const role: Role = target.role === 'admin' ? 'user' : 'admin';
    setBusyUserId(String(target.id));
    setError(null);
    setSuccess(null);
    try {
      await updateUserRole(target.id, role);
      setSuccess(`${target.full_name}'s role changed to ${role}.`);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change user role.');
    } finally {
      setBusyUserId(null);
    }
  };

  const toggleBan = async (target: User) => {
    setBusyUserId(String(target.id));
    setError(null);
    setSuccess(null);
    try {
      await toggleUserStatus(target.id);
      setSuccess(`${target.full_name} is now ${target.is_banned ? 'active' : 'banned'}.`);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update user status.');
    } finally {
      setBusyUserId(null);
    }
  };

  if (currentUser.role !== 'admin') return null;

  return (
    <div className="page-section">
      <div className="section-header">
        <h2>Admin Panel</h2>
        <p>System overview, user access, and recent security events.</p>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}
      {loading && <div className="loading-box">Loading admin dashboard...</div>}

      {stats && (
        <section aria-label="System statistics">
          <div className="services-grid">
            <div className="card-box">
              <p className="muted-text">Total Users</p>
              <h3>{stats.total_users}</h3>
            </div>
            <div className="card-box">
              <p className="muted-text">Total Applications</p>
              <h3>{stats.total_applications}</h3>
            </div>
            <div className="card-box">
              <p className="muted-text">Pending Applications</p>
              <h3>{stats.pending_applications}</h3>
            </div>
            <div className="card-box">
              <p className="muted-text">Active Sessions</p>
              <h3>{stats.active_sessions}</h3>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="section-header">
          <h2>User Management</h2>
        </div>
        <div className="card-box table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((target) => {
                const isSelf = target.id === currentUser.id;
                const isBusy = busyUserId === String(target.id);
                return (
                  <tr key={target.id}>
                    <td>{target.full_name}</td>
                    <td>{target.email}</td>
                    <td>{target.role}</td>
                    <td>
                      <span className={`badge ${target.is_banned ? 'badge-danger' : 'badge-success'}`}>
                        {target.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={isSelf || isBusy}
                        onClick={() => void changeRole(target)}
                      >
                        Make {target.role === 'admin' ? 'user' : 'admin'}
                      </button>{' '}
                      <button
                        type="button"
                        className="btn-danger-sm"
                        disabled={isSelf || isBusy || (target.role === 'admin' && !target.is_banned)}
                        onClick={() => void toggleBan(target)}
                      >
                        {target.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>Recent Audit Logs</h2>
        </div>
        <div className="card-box table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.user_email || 'Unknown'}</td>
                  <td><span className="badge badge-info">{log.action}</span></td>
                  <td>{log.details || '—'}</td>
                  <td>{log.ip_address || '—'}</td>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={5}>No audit events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
