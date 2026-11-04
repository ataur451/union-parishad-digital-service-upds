import type { Application } from '../types/service';

// Deployed: Vercel env var VITE_API_URL = Render backend URL (no trailing slash)
// Local: empty string -> same-origin (use a Vite proxy or set VITE_API_URL=http://localhost:8000)
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export type ApplicationInput = Pick<
  Application,
  'applicant_name' | 'nid_number' | 'service_type'
>;
export type ApplicationUpdate = Partial<ApplicationInput & Pick<Application, 'status'>>;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const contentType = response.headers.get('content-type') ?? '';
  const rawText = await response.text();

  if (!response.ok) {
    let message = rawText || `Request failed with status ${response.status}`;
    try {
      const body = rawText ? JSON.parse(rawText) : {};
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        // FastAPI validation errors (422)
        message = body.detail.map((d: { msg?: string }) => d.msg).join(', ');
      }
    } catch {
      // not JSON, keep raw text
    }
    throw new Error(message);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      'The API returned HTML instead of JSON. Check VITE_API_URL on Vercel and redeploy.'
    );
  }

  try {
    return (rawText ? JSON.parse(rawText) : {}) as T;
  } catch {
    throw new Error('The API response could not be parsed as JSON.');
  }
}

// Backend wraps every response as { data: ... }
export const getApplications = async (): Promise<Application[]> => {
  const json = await request<{ data?: Application[] }>('/api/applications/');
  return json.data ?? [];
};

export const createApplication = (input: ApplicationInput) =>
  request<{ data: Application }>('/api/applications/', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const updateApplication = (id: string, input: ApplicationUpdate) =>
  request<{ data: Application }>(`/api/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });

export const deleteApplication = (id: string) =>
  request<{ message: string }>(`/api/applications/${id}`, { method: 'DELETE' });