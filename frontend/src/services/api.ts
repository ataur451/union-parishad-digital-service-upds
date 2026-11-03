import type { ServiceItem } from '../types/service';

const API_BASE_URL = (import.meta as ImportMeta & { env: { VITE_API_BASE_URL?: string } }).env.VITE_API_BASE_URL || 'http://localhost:8000';

export const getServices = async (): Promise<ServiceItem[]> => {
  const res = await fetch(`${API_BASE_URL}/api/v1/services`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
};

export const createService = async (item: ServiceItem): Promise<ServiceItem> => {
  const res = await fetch(`${API_BASE_URL}/api/v1/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create service');
  return res.json();
};

export const updateService = async (id: string, item: Partial<ServiceItem>): Promise<ServiceItem> => {
  const res = await fetch(`${API_BASE_URL}/api/v1/services/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to update service');
  return res.json();
};

export const deleteService = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/v1/services/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete service');
};