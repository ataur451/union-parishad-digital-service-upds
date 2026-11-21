export type Role = 'citizen' | 'staff' | 'admin';

export interface User {
  id: number | string;
  name: string;
  email: string;
  nid?: string | null;
  role: Role;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  group_role: 'leader' | 'member';
  user?: User;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  created_by: number;
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
  id: number;
  user_id?: number | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  details?: string | null;
  created_at: string;
}