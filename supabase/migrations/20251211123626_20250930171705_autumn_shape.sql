/*
  # Remove foreign key constraint from users table

  This migration removes the foreign key constraint between public.users and auth.users,
  allowing us to create user profiles for reference purposes without requiring authentication.

  ## Changes
  1. Drop the foreign key constraint users_id_fkey
  2. This allows public.users to function as a standalone table
  3. Users can now be added with just name, email, and role for reference purposes
*/

-- Drop the foreign key constraint linking public.users.id to auth.users.id
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;