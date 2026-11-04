import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Application } from '../types/service';
import { ServiceList } from '../components/ServiceList';
import { ServiceForm } from '../components/ServiceFrom';

export function ServicesPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const [applicantName, setApplicantName] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [serviceType, setServiceType] = useState('Trade License');
  const [status, setStatus] = useState('Pending');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (editingId) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === editingId
            ? {
                ...app,
                applicant_name: applicantName,
                nid_number: nidNumber,
                service_type: serviceType,
                status,
              }
            : app
        )
      );
    } else {
      const newApplication: Application = {
        id: Date.now().toString(),
        applicant_name: applicantName,
        nid_number: nidNumber,
        service_type: serviceType,
        status: 'Pending',
      };

      setApplications((prev) => [...prev, newApplication]);
    }

    setApplicantName('');
    setNidNumber('');
    setServiceType('Trade License');
    setStatus('Pending');
    setEditingId(null);
  };

  const handleEdit = (app: Application) => {
    setApplicantName(app.applicant_name);
    setNidNumber(app.nid_number);
    setServiceType(app.service_type);
    setStatus(app.status);
    setEditingId(app.id);
  };

  const handleDelete = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
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

      <ServiceList
        applications={applications}
        loading={loading}
        error={error}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </section>
  );
}
