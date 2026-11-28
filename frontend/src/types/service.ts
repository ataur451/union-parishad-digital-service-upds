export type Role = 'user' | 'admin';

export interface User {
  id: number | string;
  full_name: string;
  name: string;
  email: string;
  nid?: string | null;
  role: Role;
  is_banned: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface UserSession {
  id: string;
  user_agent?: string | null;
  created_at: string;
  expires_at: string;
}

export interface AdminStats {
  total_users: number;
  total_applications: number;
  pending_applications: number;
  active_sessions: number;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_role: 'owner' | 'leader' | 'member';
  can_create: boolean;
  can_edit: boolean;
  can_assign: boolean;
  joined_at: string;
  user?: Pick<User, 'id' | 'full_name' | 'email'>;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string;
  created_at: string;
  members?: GroupMember[];
}

export type ServiceType =
  | 'birth-certificate'
  | 'death-certificate'
  | 'trade-license'
  | 'character-certificate'
  | 'citizen-certificate'
  | 'inheritance-certificate';

export type ApplicationStatus =
  | 'pending'
  | 'under-review'
  | 'approved'
  | 'rejected';

export interface Application {
  id: number;
  application_id: string;
  service_type: ServiceType;
  applicant_name: string;
  nid_number: string;
  phone: string;
  email?: string | null;
  father_name: string;
  mother_name: string;
  address: string;
  ward_number: string;
  additional_info?: string | null;
  status: ApplicationStatus;
  submitted_at: string;
  updated_at?: string | null;
  remarks?: string | null;
  owner_id?: number | null;
  group_id?: number | null;
}

export interface ApplicationFormData {
  service_type: ServiceType;
  applicant_name: string;
  nid_number: string;
  phone: string;
  email?: string;
  father_name: string;
  mother_name: string;
  address: string;
  ward_number: string;
  additional_info?: string;
  group_id?: number | null;
}

export interface ServiceInfo {
  id: ServiceType;
  title: string;
  titleBn: string;
  description: string;
  fee: string;
  processingTime: string;
  requiredDocuments: string[];
  icon: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  details?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  created_at: string;
}