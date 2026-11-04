import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ServiceForm } from '../components/ServiceForm';
import { ServiceList } from '../components/ServiceList';

type Application = {
  id: string;
  applicant_name: string;
  nid_number: string;
  service_type: any;
  status: any;
};
type ServiceType = Application['service_type'];
type ApplicationStatus = Application['status'];

const getApplications = async (): Promise<Application[]> => {
  const response = await fetch('/api/applications/');
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!response.ok) {
    try {
      const errorBody = rawText ? JSON.parse(rawText) : {};
      throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
    } catch {
      throw new Error(rawText || `Request failed with status ${response.status}`);
    }
  }

  if (!contentType.includes('application/json')) {
    throw new Error('The API returned HTML instead of JSON. Please check the Vercel backend routing and deployed environment variables.');
  }

  try {
    return rawText ? JSON.parse(rawText) : [];
  } catch {
    throw new Error('The API response could not be parsed as JSON.');
  }
};

const defaultServiceType = 'Trade License' as ServiceType;
const defaultStatus = 'Pending' as ApplicationStatus;

export function ServicesPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState<string>('');
  const [nidNumber, setNidNumber] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>(defaultServiceType);
  const [status, setStatus] = useState<ApplicationStatus>(defaultStatus);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const resetForm = () => {
    setApplicantName('');
    setNidNumber('');
    setServiceType(defaultServiceType);
    setStatus(defaultStatus);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent<Element>) => {
    e.preventDefault();

    if (!applicantName || !nidNumber) {
      alert('Please fill in all required fields');
      return;
    }


    try {
      if (editingId) {
        alert('Application updates are not available');
        return;
      } else {
        alert('Application submissions are not available');
        return;
      }

      resetForm();
      loadApplications();
    } catch {
      alert('An error occurred during submission');
    }
  };

  const handleEdit = (app: Application) => {
    setEditingId(app.id);
    setApplicantName(app.applicant_name);
    setNidNumber(app.nid_number);
    setServiceType(app.service_type);
    setStatus(app.status);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    alert('Application deletion is not available');
  };

  return (
    <div>
      <ServiceForm
        applicantName={applicantName}
        setApplicantName={setApplicantName}
        nidNumber={nidNumber}
        setNidNumber={setNidNumber}
        serviceType={serviceType}
        setServiceType={setServiceType}
        status={status}
        setStatus={setStatus}
        editingId={editingId}
        setEditingId={setEditingId}
        handleSubmit={handleSubmit}
      />

      <ServiceList
        applications={applications}
        loading={loading}
        error={error}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </div>
  );
}