import React from 'react';

interface ServiceFormProps {
  applicantName: string;
  setApplicantName: (val: string) => void;
  nidNumber: string;
  setNidNumber: (val: string) => void;
  serviceType: string;
  setServiceType: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  editingId: string | null;
  setEditingId: (val: string | null) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  applicantName,
  setApplicantName,
  nidNumber,
  setNidNumber,
  serviceType,
  setServiceType,
  status,
  setStatus,
  editingId,
  setEditingId,
  handleSubmit,
}) => {
  return (
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
  );
};