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
  const response = await fetch('/api/applications');
  if (!response.ok) throw new Error('Failed to fetch applications');
  return response.json();
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
    } catch {
      setError('Failed to fetch applications');
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