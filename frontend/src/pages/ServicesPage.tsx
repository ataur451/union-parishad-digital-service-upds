import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { Application } from '../types/service';
import { ServiceList } from '../components/ServiceList';
import { ServiceForm } from '../components/ServiceFrom';
import {
  fetchApplications,
  fetchApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from '../services/api';

export function ServicesPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [serviceType, setServiceType] = useState('Trade License');
  const [status, setStatus] = useState('Pending');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. READ LIST on page load
  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApplications();
      setApplications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // 2. CREATE or 4. UPDATE
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingId) {
        const updated = await updateApplication(editingId, {
          applicant_name: applicantName,
          nid_number: nidNumber,
          service_type: serviceType,
          status,
        });
        setApplications((prev) =>
          prev.map((app) => (app.id === editingId ? updated : app))
        );
        if (selectedApplication?.id === editingId) {
          setSelectedApplication(updated);
        }
      } else {
        const created = await createApplication({
          applicant_name: applicantName,
          nid_number: nidNumber,
          service_type: serviceType,
          status: 'Pending',
        });
        setApplications((prev) => [created, ...prev]);
      }

      setApplicantName('');
      setNidNumber('');
      setServiceType('Trade License');
      setStatus('Pending');
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    }
  };

  // 3. READ SINGLE
  const handleView = async (id: string) => {
    setError(null);
    try {
      const singleApp = await fetchApplicationById(id);
      setSelectedApplication(singleApp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application details');
    }
  };

  const handleEdit = (app: Application) => {
    setApplicantName(app.applicant_name);
    setNidNumber(app.nid_number);
    setServiceType(app.service_type);
    setStatus(app.status);
    setEditingId(app.id);
  };

  // 5. DELETE
  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((app) => app.id !== id));
      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    }
  };

  return (
    <section id="services">
      <h2>Available Services</h2>
      <p>Explore the digital services offered by your Union Parishad.</p>

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

      {selectedApplication && (
        <div
          style={{
            background: '#eef6fc',
            border: '1px solid #3498db',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Application Details (Single View)</h4>
            <button
              onClick={() => setSelectedApplication(null)}
              style={{ background: '#7f8c8d', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          <p style={{ margin: '8px 0 4px' }}><strong>ID:</strong> {selectedApplication.id}</p>
          <p style={{ margin: '4px 0' }}><strong>Applicant Name:</strong> {selectedApplication.applicant_name}</p>
          <p style={{ margin: '4px 0' }}><strong>NID Number:</strong> {selectedApplication.nid_number}</p>
          <p style={{ margin: '4px 0' }}><strong>Service Type:</strong> {selectedApplication.service_type}</p>
          <p style={{ margin: '4px 0' }}><strong>Status:</strong> {selectedApplication.status}</p>
        </div>
      )}

      <ServiceList
        applications={applications}
        loading={loading}
        error={error}
        handleView={handleView}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </section>
  );
}