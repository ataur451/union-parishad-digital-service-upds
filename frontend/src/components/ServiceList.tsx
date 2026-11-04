import React from 'react';
import type { Application } from '../types/service';

interface ServiceListProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  handleEdit: (app: Application) => void;
  handleDelete: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  applications,
  loading,
  error,
  handleEdit,
  handleDelete,
}) => {
  return (
    <section>
      <h3>Submitted Applications List</h3>
      {loading && <p>Loading applications...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && applications.length === 0 && <p>No applications found.</p>}

      {applications.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>NID</th>
              <th style={{ padding: '10px' }}>Service Type</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{app.applicant_name}</td>
                <td style={{ padding: '10px' }}>{app.nid_number}</td>
                <td style={{ padding: '10px' }}>{app.service_type}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    color: 'white',
                    background: app.status === 'Approved' ? '#27ae60' : app.status === 'Rejected' ? '#c0392b' : '#f39c12'
                  }}>
                    {app.status}
                  </span>
                </td>
                <td style={{ padding: '10px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(app)}
                    style={{ background: '#2980b9', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(app.id)}
                    style={{ background: '#c0392b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};