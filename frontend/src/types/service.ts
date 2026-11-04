export interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  status: string;
  created_at?: string;
}

export interface Application {
  id?: string; // Optional if omitted when creating a new application
  applicant_name: string;
  nid_number: string;
  service_type: string;
  status: string;
  created_at?: string;
}