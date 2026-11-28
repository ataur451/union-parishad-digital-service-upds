import { useEffect, useState } from 'react';
import { Crown, Shield, Users } from 'lucide-react';
import {
  addGroupMember,
  createGroup,
  fetchGroups,
  removeGroupMember,
  updateGroupMemberPermissions,
  type GroupMemberPermissions,
} from '../services/api';
import type { Group, GroupMember, User } from '../types/service';

interface GroupsPageProps {
  currentUser: User;
}

const defaultPermissions: GroupMemberPermissions = {
  can_create: true,
  can_edit: false,
  can_assign: false,
};

const permissionOptions: Array<{
  key: keyof GroupMemberPermissions;
  label: string;
}> = [
  { key: 'can_create', label: 'Create applications' },
  { key: 'can_edit', label: 'Edit applications' },
  { key: 'can_assign', label: 'Assign applications' },
];

function getGroupRoleLabel(role: GroupMember['group_role']): string {
  return role === 'owner' ? 'Owner' : role === 'leader' ? 'Leader' : 'Member';
}

export const GroupsPage: React.FC<GroupsPageProps> = ({ currentUser }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [memberEmails, setMemberEmails] = useState<Record<string, string>>({});
  const [memberRoles, setMemberRoles] = useState<
    Record<string, 'leader' | 'member'>
  >({});
  const [memberPermissions, setMemberPermissions] = useState<
    Record<string, GroupMemberPermissions>
  >({});
  const [savingMember, setSavingMember] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchGroups()
      .then((loadedGroups) => {
        if (active) setGroups(loadedGroups);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load groups.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCreateGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!groupName.trim()) return;

    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const group = await createGroup(
        groupName.trim(),
        groupDesc.trim() || undefined
      );
      setGroups((currentGroups) => [...currentGroups, group]);
      setGroupName('');
      setGroupDesc('');
      setSuccessMsg('Group created successfully.');
    } catch (createError: unknown) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create group.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async (
    event: React.FormEvent<HTMLFormElement>,
    groupId: string
  ) => {
    event.preventDefault();
    const email = (memberEmails[groupId] || '').trim();
    if (!email) return;

    setSavingMember(groupId);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedGroup = await addGroupMember(
        groupId,
        email,
        memberRoles[groupId] || 'member',
        memberPermissions[groupId] || defaultPermissions
      );
      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      );
      setMemberEmails((current) => ({ ...current, [groupId]: '' }));
      setMemberRoles((current) => ({ ...current, [groupId]: 'member' }));
      setMemberPermissions((current) => ({
        ...current,
        [groupId]: defaultPermissions,
      }));
      setSuccessMsg(`Member ${email} added to the group.`);
    } catch (addError: unknown) {
      setError(
        addError instanceof Error ? addError.message : 'Failed to add member.'
      );
    } finally {
      setSavingMember(null);
    }
  };

  const handlePermissionChange = async (
    groupId: string,
    member: GroupMember,
    permission: keyof GroupMemberPermissions,
    value: boolean
  ) => {
    const memberKey = `${groupId}:${member.user_id}`;
    setSavingMember(memberKey);
    setError(null);
    setSuccessMsg(null);
    try {
      const updatedGroup = await updateGroupMemberPermissions(groupId, member.user_id, {
        [permission]: value,
      });
      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      );
      setSuccessMsg('Member permissions updated.');
    } catch (updateError: unknown) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : 'Failed to update member permissions.'
      );
    } finally {
      setSavingMember(null);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    setSavingMember(`${groupId}:${userId}`);
    setError(null);
    setSuccessMsg(null);
    try {
      await removeGroupMember(groupId, userId);
      setGroups((currentGroups) =>
        currentGroups.map((group) =>
          group.id === groupId
            ? {
                ...group,
                members: group.members?.filter(
                  (member) => member.user_id !== userId
                ),
              }
            : group
        )
      );
      setSuccessMsg('Member removed from the group.');
    } catch (removeError: unknown) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : 'Failed to remove member.'
      );
    } finally {
      setSavingMember(null);
    }
  };

  const isGroupOwner = (group: Group) =>
    group.owner_id === String(currentUser.id);

  return (
    <div className="page-section groups-page">
      <header className="groups-heading">
        <div className="groups-heading-icon" aria-hidden="true">
          <Users size={24} />
        </div>
        <div>
          <h2>Groups &amp; permissions</h2>
          <p>
            Organize shared work and manage what each group member can do.
          </p>
        </div>
      </header>

      {error && <div className="alert-error" role="alert">{error}</div>}
      {successMsg && <div className="alert-success" role="status">{successMsg}</div>}

      <section className="card-box create-group-card">
        <div className="group-section-heading">
          <div className="group-section-icon" aria-hidden="true">
            <Users size={18} />
          </div>
          <div>
            <h3>Create a group</h3>
            <p>Start a family, ward, or business group.</p>
          </div>
        </div>
        <form onSubmit={handleCreateGroup} className="inline-form-grid">
          <input
            type="text"
            aria-label="Group name"
            placeholder="Group name"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
          <input
            type="text"
            aria-label="Group description"
            placeholder="Description (optional)"
            value={groupDesc}
            onChange={(event) => setGroupDesc(event.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create group'}
          </button>
        </form>
      </section>

      {loading ? (
        <div className="loading-box">Loading your groups...</div>
      ) : groups.length === 0 ? (
        <div className="empty-box">
          You are not part of any group yet. Create one above to get started.
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => {
            const canManage = isGroupOwner(group);
            const members = group.members || [];
            return (
              <section key={group.id} className="card-box group-card">
                <header className="group-card-header">
                  <div>
                    <h3>{group.name}</h3>
                    {group.description && (
                      <p className="muted-text">{group.description}</p>
                    )}
                  </div>
                  <span className="badge badge-info">
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                </header>

                <div className="members-list">
                  <h4>Members &amp; permissions</h4>
                  {members.length > 0 ? (
                    <ul>
                      {members.map((member) => {
                        const memberKey = `${group.id}:${member.user_id}`;
                        const isSaving = savingMember === memberKey;
                        const isOwner = member.group_role === 'owner';
                        return (
                          <li key={member.id} className="member-item">
                            <div className="member-main">
                              <div className="member-identity">
                                <span
                                  className={`member-avatar ${
                                    isOwner ? 'member-avatar-owner' : ''
                                  }`}
                                  aria-hidden="true"
                                >
                                  {isOwner ? (
                                    <Crown size={16} />
                                  ) : (
                                    <Users size={16} />
                                  )}
                                </span>
                                <div className="member-name">
                                  <strong>
                                    {member.user?.full_name ||
                                      'Member information unavailable'}
                                  </strong>
                                  {member.user?.email && (
                                    <span>{member.user.email}</span>
                                  )}
                                </div>
                              </div>
                              <div className="member-role-actions">
                                <span
                                  className={`group-role-badge group-role-${member.group_role}`}
                                >
                                  {getGroupRoleLabel(member.group_role)}
                                </span>
                                {canManage && !isOwner && (
                                  <button
                                    type="button"
                                    className="btn-danger-sm"
                                    onClick={() =>
                                      handleRemoveMember(group.id, member.user_id)
                                    }
                                    disabled={isSaving}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="member-permissions">
                              <span className="permissions-label">
                                <Shield size={14} aria-hidden="true" />
                                Permissions
                              </span>
                              <div className="permission-list">
                                {permissionOptions.map(({ key, label }) => (
                                  <label
                                    key={key}
                                    className={`permission-option ${
                                      member[key] ? 'permission-enabled' : ''
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={member[key]}
                                      disabled={!canManage || isOwner || isSaving}
                                      onChange={(event) =>
                                        handlePermissionChange(
                                          group.id,
                                          member,
                                          key,
                                          event.target.checked
                                        )
                                      }
                                    />
                                    {label}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="muted-text">No members listed.</p>
                  )}
                </div>

                {canManage && (
                  <form
                    className="add-member-form"
                    onSubmit={(event) => handleAddMember(event, group.id)}
                  >
                    <h4>Add a member</h4>
                    <div className="add-member-fields">
                      <input
                        type="email"
                        aria-label={`Email to add to ${group.name}`}
                        placeholder="Member email address"
                        value={memberEmails[group.id] || ''}
                        onChange={(event) =>
                          setMemberEmails((current) => ({
                            ...current,
                            [group.id]: event.target.value,
                          }))
                        }
                        required
                      />
                      <select
                        aria-label={`Role for new ${group.name} member`}
                        value={memberRoles[group.id] || 'member'}
                        onChange={(event) =>
                          setMemberRoles((current) => ({
                            ...current,
                            [group.id]: event.target.value as 'leader' | 'member',
                          }))
                        }
                      >
                        <option value="member">Member</option>
                        <option value="leader">Leader</option>
                      </select>
                      <button
                        type="submit"
                        className="btn-secondary"
                        disabled={savingMember === group.id}
                      >
                        {savingMember === group.id ? 'Adding...' : 'Add member'}
                      </button>
                    </div>
                    <div className="new-member-permissions">
                      <span>Grant permissions</span>
                      {permissionOptions.map(({ key, label }) => (
                        <label key={key}>
                          <input
                            type="checkbox"
                            checked={
                              (memberPermissions[group.id] || defaultPermissions)[key]
                            }
                            onChange={(event) =>
                              setMemberPermissions((current) => ({
                                ...current,
                                [group.id]: {
                                  ...(current[group.id] || defaultPermissions),
                                  [key]: event.target.checked,
                                },
                              }))
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </form>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
