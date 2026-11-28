import type {
  Application,
  ApplicationFormData,
  ApplicationStatus,
  AdminStats,
  AuditLog,
  AuthResponse,
  Group,
  Role,
  User,
} from '../types/service';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'upds_access_token';
const USER_KEY = 'upds_current_user';
const pendingGroupRequests = new Map<string, Promise<Group[]>>();

interface ApiUser {
  id: string;
  full_name?: string;
  name?: string;
  email: string;
  role: string;
  is_banned?: boolean;
  is_active?: boolean;
  created_at?: string;
}

interface ApiAuthResponse extends Omit<AuthResponse, 'user'> {
  user: ApiUser;
}

function normalizeUser(user: ApiUser): User {
  const fullName = user.full_name ?? user.name ?? '';
  const isBanned = user.is_banned ?? user.is_active === false;
  return {
    id: user.id,
    full_name: fullName,
    name: fullName,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'user',
    is_banned: isBanned,
    is_active: !isBanned,
    created_at: user.created_at,
  };
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getSavedUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw) as Partial<User>;
    if (!saved.id || !saved.email || !saved.role) return null;
    return normalizeUser({
      id: String(saved.id),
      full_name: saved.full_name,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      is_banned: saved.is_banned,
      is_active: saved.is_active,
      created_at: saved.created_at,
    });
  } catch {
    return null;
  }
}

export function saveAuthSession(auth: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, auth.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (
    response.status === 401 &&
    token &&
    localStorage.getItem(TOKEN_KEY) === token
  ) {
    clearAuthSession();
    window.dispatchEvent(new Event('upds:unauthorized'));
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      if (typeof errData.detail === 'string') {
        errorMessage = errData.detail;
      } else if (Array.isArray(errData.detail)) {
        errorMessage = errData.detail.map((d: any) => d.msg).join(', ');
      }
    } catch {
      // fallback to default message
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ==================== Auth APIs ====================

export async function loginUser(
  email: string,
  password: string,
  role?: Role
): Promise<AuthResponse> {
  const data = await apiFetch<ApiAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  const auth = { ...data, user: normalizeUser(data.user) };
  saveAuthSession(auth);
  return auth;
}

export async function registerUser(payload: {
  full_name: string;
  email: string;
  password: string;
  role?: Role;
  nid_number?: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<ApiAuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const auth = { ...data, user: normalizeUser(data.user) };
  saveAuthSession(auth);
  return auth;
}

export async function fetchCurrentUser(): Promise<User> {
  const user = await apiFetch<ApiUser>('/auth/me');
  const normalizedUser = normalizeUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

export async function updateCurrentUser(payload: {
  full_name: string;
  email: string;
}): Promise<User> {
  const user = await apiFetch<ApiUser>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const normalizedUser = normalizeUser(user);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  return normalizedUser;
}

export async function changeCurrentPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiFetch<{ message: string }>('/auth/me/password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

// ==================== Application APIs ====================

export async function fetchApplications(params?: {
  status?: string;
  search?: string;
  group_id?: number;
}): Promise<Application[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.group_id) query.set('group_id', String(params.group_id));

  const qs = query.toString();
  return apiFetch<Application[]>(`/applications${qs ? `?${qs}` : ''}`);
}

export async function trackApplicationById(
  applicationId: string
): Promise<Application> {
  return apiFetch<Application>(
    `/applications/track/${encodeURIComponent(applicationId.trim())}`
  );
}

export async function createApplication(
  formData: ApplicationFormData
): Promise<Application> {
  return apiFetch<Application>('/applications', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export async function updateApplicationStatus(
  id: number,
  status: ApplicationStatus,
  remarks?: string
): Promise<Application> {
  return apiFetch<Application>(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, remarks }),
  });
}

export async function shareApplicationWithGroup(
  applicationId: number,
  groupId: number | null
): Promise<Application> {
  return apiFetch<Application>(`/applications/${applicationId}/share`, {
    method: 'PATCH',
    body: JSON.stringify({ group_id: groupId }),
  });
}

export async function deleteApplication(id: number): Promise<void> {
  return apiFetch<void>(`/applications/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Group & RBAC APIs ====================

export async function fetchGroups(): Promise<Group[]> {
  const token = getToken();
  if (!token) return Promise.reject(new Error('Authentication required.'));

  const pendingRequest = pendingGroupRequests.get(token);
  if (pendingRequest) return pendingRequest;

  const request = apiFetch<Group[]>('/groups');
  pendingGroupRequests.set(token, request);
  return request.finally(() => {
    if (pendingGroupRequests.get(token) === request) {
      pendingGroupRequests.delete(token);
    }
  });
}

export async function createGroup(
  name: string,
  description?: string
): Promise<Group> {
  return apiFetch<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

export async function addGroupMember(
  groupId: number,
  email: string,
  groupRole: 'leader' | 'member' = 'member'
): Promise<Group> {
  return apiFetch<Group>(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, group_role: groupRole }),
  });
}

export async function removeGroupMember(
  groupId: number,
  userId: number
): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
}

// ==================== Admin APIs ====================

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>('/admin/stats');
}

export async function fetchAllUsers(): Promise<User[]> {
  const users = await apiFetch<ApiUser[]>('/admin/users');
  return users.map(normalizeUser);
}

export async function updateUserRole(
  userId: number | string,
  role: Role
): Promise<User> {
  const user = await apiFetch<ApiUser>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return normalizeUser(user);
}

export async function toggleUserStatus(userId: number | string): Promise<User> {
  const user = await apiFetch<ApiUser>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
  });
  return normalizeUser(user);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>('/admin/audit-logs');
}