import React, { useEffect, useState } from 'react';
import {
  addGroupMember,
  createGroup,
  fetchGroups,
  removeGroupMember,
} from '../services/api';
import type { Group, User } from '../types/service';
interface GroupsPageProps {
  currentUser: User;
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create group form
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Add member form state per group
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});
  const [memberRoles, setMemberRoles] = useState<
    Record<string, 'member' | 'leader'>
  >({});

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createGroup(groupName.trim(), groupDesc.trim() || undefined);
      setGroupName('');
      setGroupDesc('');
      setSuccessMsg('Group created successfully!');
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (groupId: string) => {
    const email = (memberEmails[groupId] || '').trim();
    const role = memberRoles[groupId] || 'member';
    if (!email) return;

    setError(null);
    setSuccessMsg(null);
    try {
      await addGroupMember(groupId, email, role);
      setMemberEmails((prev) => ({ ...prev, [groupId]: '' }));
      setSuccessMsg(`Member (${email}) added to group!`);
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await removeGroupMember(groupId, userId);
      setSuccessMsg('Member removed from group.');
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove member.');
    }
  };

  const canManageGroup = (group: Group) => {
    if (currentUser.role === 'admin') return true;
    if (group.created_by === currentUser.id) return true;
    return false;
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <h2>Groups & Collaborative Sharing (RBAC)</h2>
        <p>
          Create family, ward, or business groups to share and track applications
          together securely.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}

      {/* Create New Group Card */}
      <div className="card-box" style={{ marginBottom: '1.5rem' }}>
        <h3>+ Create New Group</h3>
        <form onSubmit={handleCreateGroup} className="inline-form-grid">
          <input
            type="text"
            placeholder="Group Name (e.g., Ward-4 Family Group)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description (Optional)"
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>

      {/* Group List */}
      {loading ? (
        <div className="loading-box">Loading your groups...</div>
      ) : groups.length === 0 ? (
        <div className="empty-box">
          You are not part of any group yet. Create one above to start sharing!
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => {
            const isManager = canManageGroup(group);
            return (
              <div key={group.id} className="card-box group-card">
                <div className="group-card-header">
                  <div>
                    <h3>{group.name}</h3>
                    {group.description && (
                      <p className="muted-text">{group.description}</p>
                    )}
                  </div>
                  <span className="badge badge-info">
                    Group #{group.id}
                  </span>
                </div>

                <div className="members-list">
                  <h4>Members ({group.members?.length || 0})</h4>
                  {group.members && group.members.length > 0 ? (
                    <ul>
                      {group.members.map((m) => (
                        <li key={m.id} className="member-item">
                          <div>
                            <strong>
                              {m.user?.name || `User #${m.user_id}`}
                            </strong>{' '}
                            <span className="muted-text">
                              ({m.user?.email || ''})
                            </span>
                          </div>
                          <div className="member-actions">
                            <span
                              className={`badge ${
                                m.group_role === 'leader'
                                  ? 'badge-warning'
                                  : 'badge-secondary'
                              }`}
                            >
                              {m.group_role.toUpperCase()}
                            </span>
                            {isManager && m.user_id !== currentUser.id && (
                              <button
                                type="button"
                                className="btn-danger-sm"
                                onClick={() =>
                                  handleRemoveMember(group.id, m.user_id)
                                }
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted-text">No members listed.</p>
                  )}
                </div>

                {isManager && (
                  <div className="add-member-box">
                    <input
                      type="email"
                      placeholder="User email to invite..."
                      value={memberEmails[group.id] || ''}
                      onChange={(e) =>
                        setMemberEmails((prev) => ({
                          ...prev,
                          [group.id]: e.target.value,
                        }))
                      }
                    />
                    <select
                      value={memberRoles[group.id] || 'member'}
                      onChange={(e) =>
                        setMemberRoles((prev) => ({
                          ...prev,
                          [group.id]: e.target.value as 'member' | 'leader',
                        }))
                      }
                    >
                      <option value="member">Member</option>
                      <option value="leader">Leader</option>
                    </select>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleAddMember(group.id)}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};