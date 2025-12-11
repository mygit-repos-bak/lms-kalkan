/*
  # Fixed Legal Management Platform Database Schema

  1. New Tables
    - `users` - User accounts with roles and preferences
    - `sections` - Main categories (Legal, Deals, Real Estate, Others)
    - `items` - Main entries in each section
    - `legal_meta` - Legal-specific metadata
    - `deal_meta` - Business deal metadata
    - `real_estate_meta` - Real estate metadata
    - `tasks` - Task management within items
    - `tags` - Color-coded labels
    - `stages` - Kanban board stages
    - `comments` - Comments on items/tasks
    - `activity_logs` - Audit trail
    - Junction tables for many-to-many relationships

  2. Security
    - Enable RLS on all tables
    - Policies for role-based access control
    - Audit logging for all changes

  3. Features
    - Rich metadata per section type
    - Flexible tagging and staging system
    - Complete audit trail
    - Document and link management
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'viewer')) DEFAULT 'staff',
  active boolean DEFAULT true,
  notification_prefs jsonb DEFAULT '{"email": true, "in_app": true, "mentions": true, "assignments": true}',
  force_password_change boolean DEFAULT false,
  timezone text DEFAULT 'America/New_York',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'folder',
  color text DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now()
);

-- Insert default sections
INSERT INTO sections (id, name, slug, icon, color) VALUES
  ('legal', 'Legal Fights', 'legal', 'scale', '#dc2626'),
  ('deals', 'Business Deals', 'deals', 'handshake', '#16a34a'),
  ('real-estate', 'Real Estate', 'real-estate', 'building', '#2563eb'),
  ('others', 'Others', 'others', 'more-horizontal', '#9333ea')
ON CONFLICT (id) DO NOTHING;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#6b7280',
  created_at timestamptz DEFAULT now()
);

-- Stages table
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text REFERENCES sections(id),
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert default stages
INSERT INTO stages (section_id, name, "order", is_global) VALUES
  (NULL, 'Planning', 0, true),
  (NULL, 'Work in Progress', 1, true),
  (NULL, 'Pending Review', 2, true),
  (NULL, 'Completed', 3, true)
ON CONFLICT DO NOTHING;

-- Items table (main entities)
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text NOT NULL REFERENCES sections(id),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  priority text NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  start_date timestamptz,
  due_date timestamptz,
  external_links text[] DEFAULT '{}',
  attachments text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Legal metadata
CREATE TABLE IF NOT EXISTS legal_meta (
  item_id uuid PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  department text,
  jurisdictions text[] DEFAULT '{}',
  parties jsonb DEFAULT '{"appellants": [], "appellees": [], "plaintiffs": [], "defendants": []}',
  case_numbers text[] DEFAULT '{}',
  docket_monitoring boolean DEFAULT false,
  critical_dates jsonb DEFAULT '[]',
  document_workflow jsonb DEFAULT '[]'
);

-- Deal metadata
CREATE TABLE IF NOT EXISTS deal_meta (
  item_id uuid PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  deal_name text,
  involved_parties text[] DEFAULT '{}',
  business_nature text,
  contact_details jsonb DEFAULT '{}',
  proposed_activities text
);

-- Real estate metadata
CREATE TABLE IF NOT EXISTS real_estate_meta (
  item_id uuid PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  contact_persons text[] DEFAULT '{}',
  business_nature text,
  city_approvals text[] DEFAULT '{}',
  contact_details jsonb DEFAULT '{}',
  documents jsonb DEFAULT '[]'
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  stage text NOT NULL DEFAULT 'Planning',
  priority text NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz,
  due_date timestamptz,
  estimate_hours decimal,
  actual_hours decimal,
  external_links text[] DEFAULT '{}',
  attachments text[] DEFAULT '{}',
  subtasks jsonb DEFAULT '[]',
  dependencies uuid[] DEFAULT '{}',
  archived boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type text NOT NULL CHECK (parent_type IN ('item', 'task')),
  parent_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL,
  mentions uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS item_assignees (
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_section_id ON items(section_id);
CREATE INDEX IF NOT EXISTS idx_items_created_by ON items(created_by);
CREATE INDEX IF NOT EXISTS idx_items_due_date ON items(due_date);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_tasks_item_id ON tasks(item_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_type, parent_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Sections policies (public read)
CREATE POLICY "Anyone can read sections" ON sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage sections" ON sections FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Items policies (role-based)
CREATE POLICY "Users can read items based on role" ON items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND (
      u.role IN ('admin', 'manager') OR
      (u.role = 'staff' AND (items.created_by = auth.uid() OR items.id IN (
        SELECT ia.item_id FROM item_assignees ia WHERE ia.user_id = auth.uid()
      ))) OR
      u.role = 'viewer'
    )
  )
);

CREATE POLICY "Users can create items based on role" ON items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'manager', 'staff')
  )
);

CREATE POLICY "Users can update items based on role" ON items FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() 
    AND (
      u.role IN ('admin', 'manager') OR
      (u.role = 'staff' AND (items.created_by = auth.uid() OR items.id IN (
        SELECT ia.item_id FROM item_assignees ia WHERE ia.user_id = auth.uid()
      )))
    )
  )
);

-- Tasks policies
CREATE POLICY "Users can read tasks based on item access" ON tasks FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM items i
    JOIN users u ON u.id = auth.uid()
    WHERE i.id = tasks.item_id
    AND (
      u.role IN ('admin', 'manager') OR
      (u.role = 'staff' AND (i.created_by = auth.uid() OR i.id IN (
        SELECT ia.item_id FROM item_assignees ia WHERE ia.user_id = auth.uid()
      )) OR tasks.id IN (
        SELECT ta.task_id FROM task_assignees ta WHERE ta.user_id = auth.uid()
      )) OR
      u.role = 'viewer'
    )
  )
);

CREATE POLICY "Users can manage tasks based on role" ON tasks FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM items i
    JOIN users u ON u.id = auth.uid()
    WHERE i.id = tasks.item_id
    AND (
      u.role IN ('admin', 'manager') OR
      (u.role = 'staff' AND (i.created_by = auth.uid() OR i.id IN (
        SELECT ia.item_id FROM item_assignees ia WHERE ia.user_id = auth.uid()
      )) OR tasks.id IN (
        SELECT ta.task_id FROM task_assignees ta WHERE ta.user_id = auth.uid()
      ))
    )
  )
);

-- Meta table policies (inherit from items)
CREATE POLICY "Legal meta access follows item access" ON legal_meta FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM items WHERE items.id = legal_meta.item_id
  )
);

CREATE POLICY "Deal meta access follows item access" ON deal_meta FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM items WHERE items.id = deal_meta.item_id
  )
);

CREATE POLICY "Real estate meta access follows item access" ON real_estate_meta FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM items WHERE items.id = real_estate_meta.item_id
  )
);

-- Tags and stages (public read, admin manage)
CREATE POLICY "Anyone can read tags" ON tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tags" ON tags FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

CREATE POLICY "Anyone can read stages" ON stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stages" ON stages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- Comments policies
CREATE POLICY "Users can read comments on accessible items/tasks" ON comments FOR SELECT TO authenticated USING (
  (parent_type = 'item' AND EXISTS (SELECT 1 FROM items WHERE items.id = comments.parent_id)) OR
  (parent_type = 'task' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = comments.parent_id))
);

CREATE POLICY "Users can create comments on accessible items/tasks" ON comments FOR INSERT TO authenticated WITH CHECK (
  (parent_type = 'item' AND EXISTS (SELECT 1 FROM items WHERE items.id = comments.parent_id)) OR
  (parent_type = 'task' AND EXISTS (SELECT 1 FROM tasks WHERE tasks.id = comments.parent_id))
);

-- Activity logs (read for all, system creates)
CREATE POLICY "Users can read activity logs" ON activity_logs FOR SELECT TO authenticated USING (true);

-- Junction table policies
CREATE POLICY "Junction tables follow parent access" ON item_assignees FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM items WHERE items.id = item_assignees.item_id)
);

CREATE POLICY "Junction tables follow parent access" ON item_tags FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM items WHERE items.id = item_tags.item_id)
);

CREATE POLICY "Junction tables follow parent access" ON task_assignees FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_assignees.task_id)
);

CREATE POLICY "Junction tables follow parent access" ON task_tags FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id)
);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample tags
INSERT INTO tags (name, color) VALUES
  ('Urgent', '#dc2626'),
  ('High Priority', '#ea580c'),
  ('Due Soon', '#d97706'),
  ('In Review', '#059669'),
  ('Waiting', '#0d9488'),
  ('On Hold', '#7c3aed'),
  ('Critical', '#be123c'),
  ('Documentation', '#2563eb'),
  ('Legal Research', '#7c2d12'),
  ('Client Meeting', '#166534')
ON CONFLICT (name) DO NOTHING;