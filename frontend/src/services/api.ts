import type {
  Application,
  ApplicationFormData,
  ApplicationStatus,
  AuditLog,
  AuthResponse,
  Group,
  Role,
  User,
} from '../types/service';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'upds_access_token';
const USER_KEY = 'upds_current_user';

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

  if (response.status === 401) {
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
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveAuthSession(data);
  return data;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  nid?: string;
  password: string;
}): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  saveAuthSession(data);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const user = await apiFetch<User>('/auth/me');
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
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
  return apiFetch<Group[]>('/groups');
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

export async function fetchAllUsers(): Promise<User[]> {
  return apiFetch<User[]>('/admin/users');
}

export async function updateUserRole(
  userId: number,
  role: Role
): Promise<User> {
  return apiFetch<User>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function toggleUserStatus(userId: number): Promise<User> {
  return apiFetch<User>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
  });
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  return apiFetch<AuditLog[]>('/admin/audit-logs');
}