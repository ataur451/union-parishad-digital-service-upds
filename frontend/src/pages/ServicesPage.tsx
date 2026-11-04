import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ServiceForm } from '../components/ServiceForm';
import { ServiceList } from '../components/ServiceList';
import type { Application } from '../types/service';
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from '../services/api';

const defaultServiceType = 'Trade License';
const defaultStatus = 'Pending';

export function ServicesPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState<string>('');
  const [nidNumber, setNidNumber] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>(defaultServiceType);
  const [status, setStatus] = useState<string>(defaultStatus);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      setApplications(await getApplications());
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

    if (!applicantName.trim() || !nidNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await updateApplication(editingId, {
          applicant_name: applicantName.trim(),
          nid_number: nidNumber.trim(),
          service_type: serviceType,
          status,
        });
      } else {
        await createApplication({
          applicant_name: applicantName.trim(),
          nid_number: nidNumber.trim(),
          service_type: serviceType,
        });
      }
      resetForm();
      await loadApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred during submission');
    }
  };

  const handleEdit = (app: Application) => {
    setEditingId(app.id ?? null);
    setApplicantName(app.applicant_name);
    setNidNumber(app.nid_number);
    setServiceType(app.service_type);
    setStatus(app.status);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      await deleteApplication(id);
      if (editingId === id) resetForm();
      await loadApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete application');
    }
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