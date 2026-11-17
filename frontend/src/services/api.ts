import type { Application } from '../types/service';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApplicationPayload {
  applicant_name: string;
  nid_number: string;
  service_type: string;
  status: string;
}

// 1. READ LIST (GET /api/applications/)
export async function fetchApplications(): Promise<Application[]> {
  const response = await fetch(`${API_BASE_URL}/applications/`);
  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }
  return response.json();
}

// 2. READ SINGLE (GET /api/applications/{id})
export async function fetchApplicationById(id: string): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch application details');
  }
  return response.json();
}

// 3. CREATE (POST /api/applications/)
export async function createApplication(data: ApplicationPayload): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create application');
  }
  return response.json();
}

// 4. UPDATE (PUT /api/applications/{id})
export async function updateApplication(id: string, data: ApplicationPayload): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update application');
  }
  return response.json();
}

// 5. DELETE (DELETE /api/applications/{id})
export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete application');
  }
}