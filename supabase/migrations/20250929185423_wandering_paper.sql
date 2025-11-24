-- Fix Infinite Recursion in RLS Policies

DO $$
BEGIN
    -- Disable RLS temporarily to make changes
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_assignees DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_tags DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_assignees DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_tags DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.legal_meta DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.deal_meta DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.real_estate_meta DISABLE ROW LEVEL SECURITY;

    -- Drop all existing RLS policies that might cause recursion
    DROP POLICY IF EXISTS "Service Role Bypass" ON public.users;
    DROP POLICY IF EXISTS "Users: All authenticated can read" ON public.users;
    DROP POLICY IF EXISTS "Users: Admins can manage" ON public.users;
    DROP POLICY IF EXISTS "Users: Can update own profile" ON public.users;
    
    DROP POLICY IF EXISTS "Items: Users can create based on role" ON public.items;
    DROP POLICY IF EXISTS "Items: Users can read based on role" ON public.items;
    DROP POLICY IF EXISTS "Items: Users can update based on role" ON public.items;
    DROP POLICY IF EXISTS "Items: Admins can delete" ON public.items;
    
    DROP POLICY IF EXISTS "Tasks: Users can create based on role" ON public.tasks;
    DROP POLICY IF EXISTS "Tasks: Users can read based on item access" ON public.tasks;
    DROP POLICY IF EXISTS "Tasks: Users can update based on item access" ON public.tasks;
    DROP POLICY IF EXISTS "Tasks: Admins can delete" ON public.tasks;
    
    DROP POLICY IF EXISTS "Comments: Users can create on accessible parents" ON public.comments;
    DROP POLICY IF EXISTS "Comments: Users can read on accessible parents" ON public.comments;
    
    DROP POLICY IF EXISTS "Item Assignees: Follow item access" ON public.item_assignees;
    DROP POLICY IF EXISTS "Item Tags: Follow item access" ON public.item_tags;
    DROP POLICY IF EXISTS "Task Assignees: Follow task access" ON public.task_assignees;
    DROP POLICY IF EXISTS "Task Tags: Follow task access" ON public.task_tags;
    DROP POLICY IF EXISTS "Legal Meta: Follow item access" ON public.legal_meta;
    DROP POLICY IF EXISTS "Deal Meta: Follow item access" ON public.deal_meta;
    DROP POLICY IF EXISTS "Real Estate Meta: Follow item access" ON public.real_estate_meta;

    -- Drop the problematic get_user_role function
    DROP FUNCTION IF EXISTS public.get_user_role(uuid);

    -- Re-enable RLS on all tables
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_assignees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.legal_meta ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.deal_meta ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.real_estate_meta ENABLE ROW LEVEL SECURITY;

    -- Create simple, non-recursive RLS policies for public.users
    -- CRITICAL: Service role bypass to prevent auth service issues
    CREATE POLICY "Service Role Bypass"
    ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

    -- Simple policy: all authenticated users can read all user profiles
    CREATE POLICY "Users: All authenticated can read"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

    -- Simple policy: users can only update their own profile
    CREATE POLICY "Users: Can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

    -- Simple policy: only allow inserts for service role (for user creation)
    CREATE POLICY "Users: Service role can insert"
    ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

    -- Simple policy: only allow inserts for authenticated users (for self-registration)
    CREATE POLICY "Users: Authenticated can insert own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

    -- Create simple RLS policies for public.items (without role-based complexity)
    CREATE POLICY "Items: All authenticated can read"
    ON public.items
    FOR SELECT
    TO authenticated
    USING (true);

    CREATE POLICY "Items: Authenticated can create"
    ON public.items
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Items: Users can update own items"
    ON public.items
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = updated_by)
    WITH CHECK (auth.uid() = updated_by);

    CREATE POLICY "Items: Users can delete own items"
    ON public.items
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

    -- Create simple RLS policies for public.tasks
    CREATE POLICY "Tasks: All authenticated can read"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (true);

    CREATE POLICY "Tasks: Authenticated can create"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Tasks: Users can update own tasks"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = updated_by)
    WITH CHECK (auth.uid() = updated_by);

    CREATE POLICY "Tasks: Users can delete own tasks"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

    -- Create simple RLS policies for comments
    CREATE POLICY "Comments: All authenticated can read"
    ON public.comments
    FOR SELECT
    TO authenticated
    USING (true);

    CREATE POLICY "Comments: Authenticated can create"
    ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

    -- Create simple RLS policies for junction tables
    CREATE POLICY "Item Assignees: All authenticated can access"
    ON public.item_assignees
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Item Tags: All authenticated can access"
    ON public.item_tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Task Assignees: All authenticated can access"
    ON public.task_assignees
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Task Tags: All authenticated can access"
    ON public.task_tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    -- Create simple RLS policies for meta tables
    CREATE POLICY "Legal Meta: All authenticated can access"
    ON public.legal_meta
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Deal Meta: All authenticated can access"
    ON public.deal_meta
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Real Estate Meta: All authenticated can access"
    ON public.real_estate_meta
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

END $$;