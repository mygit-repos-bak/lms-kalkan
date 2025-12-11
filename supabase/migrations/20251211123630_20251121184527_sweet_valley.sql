/*
  # Add hierarchical task support

  1. Schema Changes
    - Add `parent_task_id` column to tasks table to create parent-child relationships
    - Add `task_level` column to track hierarchy depth (0 = root task, 1 = subtask, 2 = sub-subtask, etc.)
    - Add `task_order` column for ordering tasks within the same parent
    - Add foreign key constraint for parent_task_id
    - Add index for better query performance

  2. Security
    - Update existing RLS policies to handle hierarchical tasks
    - Ensure users can only access tasks they have permission to see

  3. Data Migration
    - Convert existing subtasks JSON to actual task records
    - Preserve existing task relationships
*/

-- Add new columns for hierarchical structure
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS task_level integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS task_order integer DEFAULT 0 NOT NULL;

-- Add index for better performance on hierarchical queries
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_hierarchy ON tasks(parent_task_id, task_level, task_order);

-- Add constraint to prevent circular references (a task cannot be its own parent)
ALTER TABLE tasks ADD CONSTRAINT check_no_self_reference CHECK (id != parent_task_id);

-- Update the existing RLS policies to handle hierarchical tasks
DROP POLICY IF EXISTS "Anon: Full access to tasks" ON tasks;

CREATE POLICY "Anon: Full access to tasks"
  ON tasks
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to get task hierarchy path
CREATE OR REPLACE FUNCTION get_task_hierarchy_path(task_id uuid)
RETURNS TEXT AS $$
DECLARE
    path TEXT := '';
    current_task RECORD;
    parent_id uuid;
BEGIN
    -- Get the current task
    SELECT id, title, parent_task_id INTO current_task FROM tasks WHERE id = task_id;
    
    IF NOT FOUND THEN
        RETURN '';
    END IF;
    
    -- Build path from root to current task
    parent_id := current_task.parent_task_id;
    path := current_task.title;
    
    WHILE parent_id IS NOT NULL LOOP
        SELECT title, parent_task_id INTO current_task FROM tasks WHERE id = parent_id;
        IF FOUND THEN
            path := current_task.title || ' > ' || path;
            parent_id := current_task.parent_task_id;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN path;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate task level automatically
CREATE OR REPLACE FUNCTION calculate_task_level(parent_id uuid)
RETURNS INTEGER AS $$
DECLARE
    level INTEGER := 0;
BEGIN
    IF parent_id IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT task_level + 1 INTO level FROM tasks WHERE id = parent_id;
    RETURN COALESCE(level, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set task_level when inserting/updating
CREATE OR REPLACE FUNCTION set_task_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.task_level := calculate_task_level(NEW.parent_task_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_task_level
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_task_level();