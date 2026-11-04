import type { Application } from '../types/service';

interface ServiceListProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  handleEdit: (app: Application) => void;
  handleDelete: (id: string) => void;
}

export function ServiceList({
  applications,
  loading,
  error,
  handleEdit,
  handleDelete,
}: ServiceListProps) {
  return (
    <section>
      <h3>Submitted Applications List</h3>

      {loading && <p>Loading applications...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && applications.length === 0 && (
        <p>No applications found.</p>
      )}

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
                <td style={{ padding: '10px' }}>{app.status}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleEdit(app)}>Edit</button>
                  {' '}
                  <button onClick={() => handleDelete(app.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
