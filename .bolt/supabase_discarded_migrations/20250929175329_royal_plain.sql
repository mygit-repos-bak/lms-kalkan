-- Add Super Admin User Script
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
    admin_super_uuid UUID := '00000000-0000-4000-8000-000000000000'; -- Unique UUID for the new super admin
    admin_super_email TEXT := 'admin_super@example.com';
    admin_super_password TEXT := 'admin1234';
BEGIN
    -- Check if the user already exists in auth.users to prevent errors
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_super_email) THEN
        -- Create auth.users entry for the new super admin
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, instance_id, aud, role, created_at, updated_at)
        VALUES
            (admin_super_uuid, admin_super_email, crypt(admin_super_password, gen_salt('bf')), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(), now());
        
        RAISE NOTICE 'Created auth.users entry for %', admin_super_email;
    ELSE
        RAISE NOTICE 'Auth user % already exists', admin_super_email;
    END IF;

    -- Check if the user already exists in public.users to prevent errors
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = admin_super_uuid) THEN
        -- Create public.users profile for the new super admin
        INSERT INTO public.users (id, name, email, role, active, notification_prefs, force_password_change, timezone, created_at, updated_at)
        VALUES
            (admin_super_uuid, 'Super Admin', admin_super_email, 'admin', true, '{"email": true, "in_app": true, "mentions": true, "assignments": true}'::jsonb, false, 'America/New_York', now(), now());
        
        RAISE NOTICE 'Created public.users profile for %', admin_super_email;
    ELSE
        RAISE NOTICE 'Public user profile % already exists', admin_super_email;
    END IF;

    -- Ensure the get_user_role function exists and is properly configured
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
        -- Create the SECURITY DEFINER function to safely get user role
        CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
        RETURNS TEXT
        LANGUAGE plpgsql
        SECURITY DEFINER -- This is crucial to bypass RLS when checking the role
        SET search_path = public, pg_temp
        AS $func$
          DECLARE
            user_role TEXT;
          BEGIN
            SELECT role INTO user_role FROM public.users WHERE id = user_id;
            RETURN user_role;
          END;
        $func$;

        -- Grant execute on the function to authenticated users
        GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
        
        RAISE NOTICE 'Created get_user_role function';
    ELSE
        RAISE NOTICE 'get_user_role function already exists';
    END IF;

    RAISE NOTICE 'Super admin setup complete. You can now log in with: % / %', admin_super_email, admin_super_password;
END $$;