export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  active: boolean;
  notification_prefs: {
    email?: boolean;
    in_app?: boolean;
    mentions?: boolean;
    assignments?: boolean;
  };
  force_password_change: boolean;
  timezone: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Section {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Item {
  id: string;
  section_id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  start_date: string | null;
  due_date: string | null;
  external_links: string[];
  attachments: string[];
  custom_fields: Record<string, any>;
  assignee_ids?: string[];
  tag_ids?: string[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  assignees?: User[];
  tags?: Tag[];
  legal_meta?: LegalMeta;
  deal_meta?: DealMeta;
  real_estate_meta?: RealEstateMeta;
}

export interface LegalMeta {
  item_id: string;
  department: string | null;
  jurisdictions: string[];
  parties: {
    appellants: string[];
    appellees: string[];
    plaintiffs: string[];
    defendants: string[];
  };
  case_numbers: string[];
  docket_monitoring: boolean;
  critical_dates: Array<{
    name: string;
    date: string;
    type: string;
  }>;
  document_workflow: Array<{
    document: string;
    status: string;
    due_date?: string;
  }>;
}

export interface DealMeta {
  item_id: string;
  deal_name: string | null;
  involved_parties: string[];
  business_nature: string | null;
  contact_details: Record<string, any>;
  proposed_activities: string | null;
}

export interface RealEstateMeta {
  item_id: string;
  contact_persons: string[];
  business_nature: string | null;
  city_approvals: string[];
  contact_details: Record<string, any>;
  documents: Array<{
    name: string;
    type: string;
    url?: string;
    path?: string;
  }>;
}

export interface Task {
  id: string;
  item_id: string;
  parent_task_id: string | null;
  task_level: number;
  task_order: number;
  title: string;
  description: string | null;
  stage: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: string;
  start_date: string | null;
  due_date: string | null;
  estimate_hours: number | null;
  actual_hours: number | null;
  external_links: string[];
  attachments: string[];
  dependencies: string[];
  archived: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  assignees?: User[];
  tags?: Tag[];
  item?: Item;
  children?: Task[];
  parent?: Task;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Stage {
  id: string;
  section_id: string | null;
  name: string;
  order: number;
  is_global: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  parent_type: 'item' | 'task';
  parent_id: string;
  author_id: string | null;
  body: string;
  mentions: string[];
  created_at: string | null;
  updated_at: string | null;
  author?: User;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  metadata: Record<string, any>;
  created_at: string | null;
  actor?: User;
}

export interface SystemConfig {
  legalDepartments: string[];
  dealBusinessNatures: string[];
  realEstateBusinessNatures: string[];
  cityApprovals: string[];
}