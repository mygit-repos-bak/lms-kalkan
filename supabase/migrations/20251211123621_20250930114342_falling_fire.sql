-- Fix RLS policies to allow anon role to perform all operations

DO $$
BEGIN
    -- Disable RLS on all tables temporarily to manage policies
    ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.stages DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_assignees DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_tags DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_assignees DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_tags DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.legal_meta DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.deal_meta DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.real_estate_meta DISABLE ROW LEVEL SECURITY;

    -- Drop existing anon policies to avoid conflicts
    DROP POLICY IF EXISTS "Anon: Can read users" ON public.users;
    DROP POLICY IF EXISTS "Anon: Can read sections" ON public.sections;
    DROP POLICY IF EXISTS "Anon: Can read tags" ON public.tags;
    DROP POLICY IF EXISTS "Anon: Can read stages" ON public.stages;
    DROP POLICY IF EXISTS "Anon: Can read items" ON public.items;
    DROP POLICY IF EXISTS "Anon: Can read tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Anon: Can read item assignees" ON public.item_assignees;
    DROP POLICY IF EXISTS "Anon: Can read item tags" ON public.item_tags;
    DROP POLICY IF EXISTS "Anon: Can read task assignees" ON public.task_assignees;
    DROP POLICY IF EXISTS "Anon: Can read task tags" ON public.task_tags;
    DROP POLICY IF EXISTS "Anon: Can read legal meta" ON public.legal_meta;
    DROP POLICY IF EXISTS "Anon: Can read deal meta" ON public.deal_meta;
    DROP POLICY IF EXISTS "Anon: Can read real estate meta" ON public.real_estate_meta;
    DROP POLICY IF EXISTS "Anon: Can read comments" ON public.comments;
    DROP POLICY IF EXISTS "Anon: Can read activity logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.users;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.items;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.tasks;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.sections;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.tags;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.stages;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.comments;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.activity_logs;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.item_assignees;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.item_tags;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.task_assignees;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.task_tags;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.legal_meta;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.deal_meta;
    DROP POLICY IF EXISTS "Anon: Full access" ON public.real_estate_meta;

    -- Add RLS policies for 'anon' role to allow full access (since auth is disabled)
    CREATE POLICY "Anon: Full access"
    ON public.users
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.sections
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.tags
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.stages
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.items
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.tasks
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.item_assignees
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.item_tags
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.task_assignees
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.task_tags
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.legal_meta
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.deal_meta
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.real_estate_meta
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.comments
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    CREATE POLICY "Anon: Full access"
    ON public.activity_logs
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

    -- Re-enable RLS on all tables
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_assignees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.item_tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.legal_meta ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.deal_meta ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.real_estate_meta ENABLE ROW LEVEL SECURITY;

END $$;