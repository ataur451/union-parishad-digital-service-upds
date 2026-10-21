import React, { useState, useEffect } from 'react';
import './App.css';

// Define the Application interface
interface Application {
  id: string;
  applicant_name: string;
  nid_number: string;
  service_type: string;
  status: string;
  created_at: string;
}

function App() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for Create / Update
  const [applicantName, setApplicantName] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [serviceType, setServiceType] = useState('Trade License');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState('Pending');

  // Backend API Base URL (Vite proxy or direct backend URL)
  const API_URL = '/api/applications/';

  // 1. READ LIST: Fetch all applications from backend
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      const result = await response.json();
      if (response.ok) {
        setApplications(result.data || []);
      } else {
        setError('Failed to fetch applications');
      }
    } catch (err) {
      setError('Network error while fetching applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 2. CREATE or UPDATE: Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !nidNumber) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      applicant_name: applicantName,
      nid_number: nidNumber,
      service_type: serviceType,
      status: status,
    };

    try {
      if (editingId) {
        // UPDATE Request
        const response = await fetch(`${API_URL}${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          alert('Application updated successfully!');
          setEditingId(null);
        } else {
          alert('Update failed');
        }
      } else {
        // CREATE Request
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicant_name: applicantName,
            nid_number: nidNumber,
            service_type: serviceType,
          }),
        });
        if (response.ok) {
          alert('Application submitted successfully!');
        } else {
          alert('Creation failed');
        }
      }

      // Reset form and refresh list
      setApplicantName('');
      setNidNumber('');
      setStatus('Pending');
      fetchApplications();
    } catch (err) {
      alert('An error occurred during submission');
    }
  };

  // Prepare form for editing (Update)
  const handleEdit = (app: Application) => {
    setEditingId(app.id);
    setApplicantName(app.applicant_name);
    setNidNumber(app.nid_number);
    setServiceType(app.service_type);
    setStatus(app.status);
  };

  // 3. DELETE: Remove an application
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      const response = await fetch(`${API_URL}${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Application deleted successfully');
        fetchApplications();
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      alert('Error occurred while deleting');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50' }}>Union Parishad Digital Service (UPDS)</h1>
        <p>Citizen Service Application Management Portal (MVP CRUD)</p>
      </header>

      {/* Form Section (Create / Update) */}
      <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3>{editingId ? 'Edit Application' : 'Submit New Service Application'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Applicant Name:</label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>NID Number:</label>
            <input
              type="text"
              value={nidNumber}
              onChange={(e) => setNidNumber(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Service Type:</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="Trade License">Trade License</option>
              <option value="Citizen Certificate">Citizen Certificate</option>
              <option value="Character Certificate">Character Certificate</option>
              <option value="Family Certificate">Family Certificate</option>
            </select>
          </div>
          {editingId && (
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          )}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ background: '#27ae60', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {editingId ? 'Update Application' : 'Submit Application'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setApplicantName(''); setNidNumber(''); }}
                style={{ background: '#95a5a6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* List Section (Read List) */}
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
    </div>
  );
}

export default App;