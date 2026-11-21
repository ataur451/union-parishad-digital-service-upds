import React, { useEffect, useState } from 'react';
import {
  fetchAllUsers,
  fetchAuditLogs,
  toggleUserStatus,
  updateUserRole,
} from '../services/api';
import type { AuditLog, Role, User } from '../types/service';
interface AdminPageProps {
  currentUser: User;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, logsData] = await Promise.all([
        fetchAllUsers(),
        fetchAuditLogs(),
      ]);
      setUsers(usersData);
      setLogs(logsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: number | string, newRole: Role) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await updateUserRole(userId, newRole);
      setSuccessMsg(`User #${userId} role updated to ${newRole.toUpperCase()}.`);
      await loadAdminData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role.');
    }
  };

  const handleToggleStatus = async (userId: number | string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await toggleUserStatus(userId);
      setSuccessMsg(
        `User #${userId} is now ${updated.is_active ? 'ACTIVE' : 'SUSPENDED'}.`
      );
      await loadAdminData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="alert-error">
        Access Denied: Only Administrators can view this dashboard.
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h2>👑 Admin Management & Audit Logs</h2>
        <p>
          Manage system users, assign RBAC roles, and monitor security audit trails.
        </p>
      </div>

      <div className="auth-tabs" style={{ maxWidth: '420px', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`auth-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          type="button"
          className={`auth-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Audit Logs ({logs.length})
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}

      {loading ? (
        <div className="loading-box">Loading admin panel...</div>
      ) : activeTab === 'users' ? (
        <div className="card-box table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name & Email</th>
                <th>NID</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td>
                    <strong>{u.name}</strong>
                    <div className="muted-text">{u.email}</div>
                  </td>
                  <td>{u.nid || '—'}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={u.id === currentUser.id}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value as Role)
                      }
                    >
                      <option value="citizen">Citizen</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.is_active !== false ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {u.is_active !== false ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    {u.id !== currentUser.id ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleToggleStatus(u.id)}
                      >
                        {u.is_active !== false ? 'Suspend' : 'Activate'}
                      </button>
                    ) : (
                      <span className="muted-text">(You)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-box table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User ID</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.created_at).toLocaleString()}</td>
                  <td>{log.user_id ? `#${log.user_id}` : 'System'}</td>
                  <td>
                    <span className="badge badge-info">{log.action}</span>
                  </td>
                  <td>
                    {log.target_type} {log.target_id ? `#${log.target_id}` : ''}
                  </td>
                  <td>{log.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};