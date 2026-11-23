import type {
  Application,
  ApplicationFormData,
  ApplicationStatus,
  AuditLog,
  AuthResponse,
  Group,
  User,
} from '../types/service';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'upds_access_token';
const USER_KEY = 'upds_current_user';

interface ApiUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_banned: boolean;
  created_at?: string;
}

interface ApiAuthResponse extends Omit<AuthResponse, 'user'> {
  user: ApiUser;
}

function normalizeUser(user: ApiUser): User {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role === 'admin' ? 'admin' : 'citizen',
    is_active: !user.is_banned,
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
    return JSON.parse(raw) as User;
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
  const token = getToken();
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

  if (response.status === 401 && token && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
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
  password: string
): Promise<AuthResponse> {
  const data = await apiFetch<ApiAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const auth = { ...data, user: normalizeUser(data.user) };
  saveAuthSession(auth);
  return auth;
}

export async function registerUser(payload: {
  full_name: string;
  email: string;
  password: string;
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

interface ApiApplication extends Omit<Application, 'application_id' | 'submitted_at'> {
  created_at: string;
}

function normalizeApplication(app: ApiApplication): Application {
  return { ...app, application_id: app.id, submitted_at: app.created_at, status: app.status.toLowerCase() as ApplicationStatus };
}

interface ApiGroup extends Omit<Group, 'created_by'> { owner_id: string }
function normalizeGroup(group: ApiGroup): Group {
  return { ...group, created_by: group.owner_id };
}

// ==================== Application APIs ====================

export async function fetchApplications(params?: {
  status?: string;
  search?: string;
  group_id?: string;
}): Promise<Application[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.group_id) query.set('group_id', String(params.group_id));

  const qs = query.toString();
  const apps = await apiFetch<ApiApplication[]>(`/applications${qs ? `?${qs}` : ''}`);
  return apps.map(normalizeApplication);
}

export async function trackApplicationById(
  applicationId: string
): Promise<Application> {
  const app = await apiFetch<ApiApplication>(`/applications/track/${encodeURIComponent(applicationId.trim())}`);
  return normalizeApplication(app);
}

export async function createApplication(
  formData: ApplicationFormData
): Promise<Application> {
  const app = await apiFetch<ApiApplication>('/applications', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  return normalizeApplication(app);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  remarks?: string
): Promise<Application> {
  const app = await apiFetch<ApiApplication>(`/applications/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, remarks }),
  });
  return normalizeApplication(app);
}

export async function shareApplicationWithGroup(
  applicationId: string,
  groupId: string | null
): Promise<Application> {
  const app = await apiFetch<ApiApplication>(`/applications/${applicationId}/share`, {
    method: 'PATCH',
    body: JSON.stringify({ group_id: groupId }),
  });
  return normalizeApplication(app);
}

export async function deleteApplication(id: string): Promise<void> {
  return apiFetch<void>(`/applications/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Group & RBAC APIs ====================

export async function fetchGroups(): Promise<Group[]> {
  const groups = await apiFetch<ApiGroup[]>('/groups');
  return groups.map(normalizeGroup);
}

export async function createGroup(
  name: string,
  description?: string
): Promise<Group> {
  const group = await apiFetch<ApiGroup>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
  return normalizeGroup(group);
}

export async function addGroupMember(
  groupId: string,
  email: string,
  groupRole: 'leader' | 'member' = 'member'
): Promise<Group> {
  const group = await apiFetch<ApiGroup>(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, group_role: groupRole }),
  });
  return normalizeGroup(group);
}

export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<void> {
  return apiFetch<void>(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
}

// ==================== Admin APIs ====================

export async function fetchAllUsers(): Promise<User[]> {
  const users = await apiFetch<ApiUser[]>('/admin/users');
  return users.map(normalizeUser);
}

export async function setUserStatus(userId: number | string, active: boolean): Promise<User> {
  const user = await apiFetch<ApiUser>(`/admin/users/${userId}/${active ? 'unban' : 'ban'}`, {
    method: 'POST',
    ...(active ? {} : { body: JSON.stringify({ reason: 'Suspended by administrator' }) }),
  });
  return normalizeUser(user);
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>('/admin/audit-logs');
}