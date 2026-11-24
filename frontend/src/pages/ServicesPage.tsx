import React, { useEffect, useState } from 'react';
import { Baby, FileText, Store, ShieldCheck, Landmark, Users, LayoutGrid, PenLine, Search, FolderOpen, ArrowRight } from 'lucide-react';
import {
  createApplication,
  deleteApplication,
  fetchApplications,
  fetchGroups,
  shareApplicationWithGroup,
  trackApplicationById,
  updateApplicationStatus,
} from '../services/api';
import type {
  Application,
  ApplicationFormData,
  ApplicationStatus,
  Group,
  ServiceInfo,
  ServiceType,
  User,
} from '../types/service';

interface ServicesPageProps {
  currentUser: User | null;
  onRequireLogin: () => void;
}

const SERVICES_CATALOG: ServiceInfo[] = [
  {
    id: 'birth-certificate',
    title: 'Birth Certificate',
    titleBn: 'জন্ম নিবন্ধন সনদ',
    description: 'Official digital birth registration certificate issued by Union Parishad.',
    fee: '50 BDT',
    processingTime: '3-5 Working Days',
    requiredDocuments: ['Hospital Birth Record / EPI Card', 'Parents NID Copy'],
  },
  {
    id: 'death-certificate',
    title: 'Death Certificate',
    titleBn: 'মৃত্যু নিবন্ধন সনদ',
    description: 'Official death registration certificate for legal and inheritance purposes.',
    fee: '50 BDT',
    processingTime: '3 Working Days',
    requiredDocuments: ['Doctor/Hospital Certificate', 'Applicant NID Copy'],
  },
  {
    id: 'trade-license',
    title: 'Trade License',
    titleBn: 'ট্রেড লাইসেন্স',
    description: 'Business operating license within Union Parishad jurisdiction.',
    fee: '500 BDT',
    processingTime: '5-7 Working Days',
    requiredDocuments: ['Applicant NID', 'Shop Rent Deed / Ownership Paper', 'Holding Tax Receipt'],
  },
  {
    id: 'character-certificate',
    title: 'Character Certificate',
    titleBn: 'চারিত্রিক সনদপত্র',
    description: 'Certificate verifying good moral character for jobs and official needs.',
    fee: '20 BDT',
    processingTime: '1-2 Working Days',
    requiredDocuments: ['NID / Birth Certificate Copy', 'Ward Member Recommendation'],
  },
  {
    id: 'citizen-certificate',
    title: 'Citizenship Certificate',
    titleBn: 'নাগরিকত্ব সনদপত্র',
    description: 'Permanent residency and citizenship verification certificate.',
    fee: '20 BDT',
    processingTime: '1-2 Working Days',
    requiredDocuments: ['NID Copy', 'Holding Tax / Utility Bill Copy'],
  },
  {
    id: 'inheritance-certificate',
    title: 'Inheritance (Warish) Certificate',
    titleBn: 'ওয়ারিশ সনদপত্র',
    description: 'Legal heir certificate listing all successors of a deceased resident.',
    fee: '100 BDT',
    processingTime: '5-7 Working Days',
    requiredDocuments: ['Death Certificate', 'NID of All Heirs', 'Ward Member Verification'],
  },
];

const SERVICE_ICONS = {
  'birth-certificate': Baby,
  'death-certificate': FileText,
  'trade-license': Store,
  'character-certificate': ShieldCheck,
  'citizen-certificate': Landmark,
  'inheritance-certificate': Users,
} satisfies Record<ServiceType, React.ElementType>;

export const ServicesPage: React.FC<ServicesPageProps> = ({
  currentUser,
  onRequireLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'apply' | 'track' | 'manage'>('catalog');
  const [selectedService, setSelectedService] = useState<ServiceType>('birth-certificate');

  // Application Form State
  const [formData, setFormData] = useState<ApplicationFormData>({
    service_type: 'birth-certificate',
    applicant_name: currentUser?.name || '',
    nid_number: currentUser?.nid || '',
    phone: '',
    email: currentUser?.email || '',
    father_name: '',
    mother_name: '',
    address: '',
    ward_number: '1',
    additional_info: '',
    group_id: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<Application | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Public Tracking State
  const [trackId, setTrackId] = useState('');
  const [trackedApp, setTrackedApp] = useState<Application | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Logged-in Applications & Groups State
  const [applications, setApplications] = useState<Application[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        applicant_name: prev.applicant_name || currentUser.name,
        nid_number: prev.nid_number || currentUser.nid || '',
        email: prev.email || currentUser.email,
      }));
      loadUserGroups();
    }
  }, [currentUser]);

  const loadUserGroups = async () => {
    if (!currentUser) return;
    try {
      const g = await fetchGroups();
      setGroups(g);
    } catch {
      // ignore group load errors silently
    }
  };

  const loadApplications = async () => {
    if (!currentUser) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await fetchApplications({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        group_id: groupFilter === 'all' ? undefined : groupFilter,
      });
      setApplications(data);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to fetch applications.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage' && currentUser) {
      loadApplications();
    }
  }, [activeTab, statusFilter, groupFilter, currentUser]);

  const handleSelectServiceToApply = (serviceId: ServiceType) => {
    setSelectedService(serviceId);
    setFormData((prev) => ({ ...prev, service_type: serviceId }));
    setSubmitSuccess(null);
    setFormError(null);
    setActiveTab('apply');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setSubmitSuccess(null);
    try {
      const created = await createApplication(formData);
      setSubmitSuccess(created);
      setFormData((prev) => ({
        ...prev,
        phone: '',
        father_name: '',
        mother_name: '',
        address: '',
        additional_info: '',
      }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    setTrackedApp(null);
    try {
      const result = await trackApplicationById(trackId);
      setTrackedApp(result);
    } catch (err: unknown) {
      setTrackError(err instanceof Error ? err.message : 'Application not found.');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(id, newStatus);
      await loadApplications();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handleShareChange = async (appId: string, groupVal: string) => {
    const groupId = groupVal || null;
    try {
      await shareApplicationWithGroup(appId, groupId);
      await loadApplications();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update group sharing.');
    }
  };

  const handleDeleteApp = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await deleteApplication(id);
      await loadApplications();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete application.');
    }
  };

  const isStaffOrAdmin = currentUser?.role === 'admin';

  return (
    <div className="services-wrapper">
      <div className="page-intro">
        <div><span className="eyebrow">UNION PARISHAD DIGITAL SERVICE</span><h2>Services for your community</h2><p>Apply for certificates, follow your requests, and access local services in one place.</p></div>
        <span className="intro-mark"><Landmark size={32} strokeWidth={1.5} aria-hidden="true" /></span>
      </div>
      {/* Sub-navigation Tabs */}
      <div className="sub-nav-tabs">
        <button
          type="button"
          className={`sub-tab ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <LayoutGrid size={17} aria-hidden="true" /> All Services
        </button>
        <button
          type="button"
          className={`sub-tab ${activeTab === 'apply' ? 'active' : ''}`}
          onClick={() => setActiveTab('apply')}
        >
          <PenLine size={17} aria-hidden="true" /> Apply Online
        </button>
        <button
          type="button"
          className={`sub-tab ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          <Search size={17} aria-hidden="true" /> Track Application
        </button>
        <button
          type="button"
          className={`sub-tab ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => {
            if (!currentUser) {
              onRequireLogin();
            } else {
              setActiveTab('manage');
            }
          }}
        >
          <FolderOpen size={17} aria-hidden="true" /> {isStaffOrAdmin ? 'Manage All Applications' : 'My & Shared Applications'}
        </button>
      </div>

      {/* TAB 1: SERVICES CATALOG */}
      {activeTab === 'catalog' && (
        <div className="services-grid">
          {SERVICES_CATALOG.map((srv) => {
            const Icon = SERVICE_ICONS[srv.id];
            return (
            <div key={srv.id} className="service-card">
              <div className="service-icon"><Icon size={24} strokeWidth={1.8} aria-hidden="true" /></div>
              <h3>{srv.title}</h3>
              <div className="service-bn">{srv.titleBn}</div>
              <p>{srv.description}</p>
              <div className="service-meta">
                <span>Fee: <strong>{srv.fee}</strong></span>
                <span>Time: <strong>{srv.processingTime}</strong></span>
              </div>
              <div className="service-docs">
                <strong>Required Documents:</strong>
                <ul>
                  {srv.requiredDocuments.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="btn-primary btn-block"
                onClick={() => handleSelectServiceToApply(srv.id)}
              >
                Apply for service <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          ); })}
        </div>
      )}

      {/* TAB 2: APPLY ONLINE */}
      {activeTab === 'apply' && (
        <div className="card-box form-container">
          <h2>Online Service Application Form</h2>
          {!currentUser && (
            <div className="alert-warning">
              You must be logged in to submit an application.{' '}
              <button type="button" className="btn-link" onClick={onRequireLogin}>
                Click here to Login / Register
              </button>
            </div>
          )}

          {formError && <div className="alert-error">{formError}</div>}

          {submitSuccess && (
            <div className="alert-success">
              <strong>Application Submitted Successfully!</strong>
              <div>
                Your Tracking ID is: <code>{submitSuccess.application_id}</code>
              </div>
              <p>Save this ID to track your application status anytime.</p>
            </div>
          )}

          <form onSubmit={handleApplySubmit} className="application-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Select Service Type *</label>
                <select
                  value={formData.service_type}
                  onChange={(e) => {
                    const val = e.target.value as ServiceType;
                    setSelectedService(val);
                    setFormData({ ...formData, service_type: val });
                  }}
                >
                  {SERVICES_CATALOG.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.titleBn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Share with Group (Optional)</label>
                <select
                  value={formData.group_id ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      group_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">Private (Only Me & Staff)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      Share with: {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Applicant Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.applicant_name}
                  onChange={(e) =>
                    setFormData({ ...formData, applicant_name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>NID / Birth Reg Number *</label>
                <input
                  type="text"
                  required
                  value={formData.nid_number}
                  onChange={(e) =>
                    setFormData({ ...formData, nid_number: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Ward Number *</label>
                <select
                  value={formData.ward_number}
                  onChange={(e) =>
                    setFormData({ ...formData, ward_number: e.target.value })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((w) => (
                    <option key={w} value={String(w)}>
                      Ward No. {w}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Father's Name *</label>
                <input
                  type="text"
                  required
                  value={formData.father_name}
                  onChange={(e) =>
                    setFormData({ ...formData, father_name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Mother's Name *</label>
                <input
                  type="text"
                  required
                  value={formData.mother_name}
                  onChange={(e) =>
                    setFormData({ ...formData, mother_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Village / Full Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={formData.additional_info || ''}
                onChange={(e) =>
                  setFormData({ ...formData, additional_info: e.target.value })
                }
                placeholder={`Details for ${selectedService}...`}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !currentUser}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: TRACK APPLICATION */}
      {activeTab === 'track' && (
        <div className="card-box form-container">
          <h2>Track Application Status</h2>
          <p className="muted-text">
            Sign in and enter your application ID to view its status.
          </p>
          <form onSubmit={handleTrackSearch} className="inline-form-grid">
            <input
              type="text"
              placeholder="Enter Application ID..."
              value={trackId}
              onChange={(e) => setTrackId(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary" disabled={trackLoading}>
              {trackLoading ? 'Searching...' : 'Track Now'}
            </button>
          </form>

          {trackError && <div className="alert-error" style={{ marginTop: '1rem' }}>{trackError}</div>}

          {trackedApp && (
            <div className="track-result-card">
              <div className="track-header">
                <h3>ID: {trackedApp.application_id}</h3>
                <span className={`status-pill status-${trackedApp.status}`}>
                  {trackedApp.status.toUpperCase()}
                </span>
              </div>
              <p><strong>Applicant:</strong> {trackedApp.applicant_name}</p>
              <p><strong>Service:</strong> {trackedApp.service_type}</p>
              <p><strong>Ward:</strong> Ward {trackedApp.ward_number}</p>
              <p><strong>Submitted:</strong> {new Date(trackedApp.submitted_at).toLocaleString()}</p>
              {trackedApp.remarks && (
                <p><strong>Official Remarks:</strong> {trackedApp.remarks}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MANAGE / MY & SHARED APPLICATIONS */}
      {activeTab === 'manage' && currentUser && (
        <div className="card-box">
          <div className="manage-header">
            <h2>
              {isStaffOrAdmin
                ? 'All Citizen Applications (Staff/Admin View)'
                : 'My Personal & Group-Shared Applications'}
            </h2>
            <div className="filter-bar">
              <input
                type="text"
                placeholder="Search ID, Name, or NID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={loadApplications}>
                Search
              </button>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under-review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              {groups.length > 0 && (
                <select
                  value={groupFilter}
                  onChange={(e) =>
                    setGroupFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="all">All Scope (Personal + Groups)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      Group: {g.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {listError && <div className="alert-error">{listError}</div>}

          {listLoading ? (
            <div className="loading-box">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-box">No applications found matching your filter.</div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tracking ID</th>
                    <th>Service & Applicant</th>
                    <th>Ward / Phone</th>
                    <th>Sharing Scope</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const isOwner = app.owner_id === currentUser.id;
                    return (
                      <tr key={app.id}>
                        <td>
                          <strong>{app.application_id}</strong>
                          <div className="muted-text">
                            {new Date(app.submitted_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <strong>{app.applicant_name}</strong>
                          <div className="muted-text">{app.service_type}</div>
                        </td>
                        <td>
                          Ward {app.ward_number}
                          <div className="muted-text">{app.phone}</div>
                        </td>
                        <td>
                          {isOwner || isStaffOrAdmin ? (
                            <select
                              value={app.group_id ?? ''}
                              onChange={(e) =>
                                handleShareChange(app.id, e.target.value)
                              }
                            >
                              <option value="">Private</option>
                              {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="badge badge-info">
                              Shared via Group #{app.group_id}
                            </span>
                          )}
                        </td>
                        <td>
                          {isStaffOrAdmin ? (
                            <select
                              value={app.status}
                              onChange={(e) =>
                                handleStatusUpdate(
                                  app.id,
                                  e.target.value as ApplicationStatus
                                )
                              }
                            >
                              <option value="pending">Pending</option>
                              <option value="under-review">Under Review</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          ) : (
                            <span className={`status-pill status-${app.status}`}>
                              {app.status}
                            </span>
                          )}
                        </td>
                        <td>
                          {(isOwner || currentUser.role === 'admin') && (
                            <button
                              type="button"
                              className="btn-danger-sm"
                              onClick={() => handleDeleteApp(app.id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};