import { supabase } from './supabase';

export async function verifySupabaseSetup() {
  try {
    console.log('🔍 Checking Supabase connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      
      if (testError.message.includes('relation "users" does not exist')) {
        console.log('📋 Tables need to be created. Here are the steps:');
        console.log('');
        console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Select your project: itrzbxtzzngzesbmopyo');
        console.log('3. Go to SQL Editor');
        console.log('4. Run the migration SQL (I\'ll provide it below)');
        console.log('');
        return false;
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Check if tables exist and have data
    const tables = ['users', 'sections', 'items', 'tasks', 'tags', 'stages'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Table "${table}" error:`, error.message);
        } else {
          console.log(`✅ Table "${table}" exists with ${count} records`);
        }
      } catch (err) {
        console.log(`❌ Table "${table}" check failed:`, err);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Setup verification failed:', error);
    return false;
  }
}

export function getSetupInstructions() {
  return `
🚀 SUPABASE SETUP INSTRUCTIONS

⚠️  IMPORTANT: Run BOTH migration files in exact order!

If tables don't exist, follow these steps:

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/itrzbxtzzngzesbmopyo
2. Go to "SQL Editor" in the left sidebar
3. Click "New Query"
4. FIRST: Copy and paste the SQL from: supabase/migrations/20250828000000_fix_ambiguous_columns.sql
5. Click "Run" to execute (this creates the schema)
6. SECOND: Copy and paste the SQL from: supabase/migrations/20250828000001_seed_default_data.sql
7. Click "Run" to execute (this adds sample data)

⚠️  CRITICAL: The second migration creates both auth users AND user profiles!

⚠️  Run migrations in this exact order:
✅  1. 20250828000000_fix_ambiguous_columns.sql (schema)
✅  2. 20250828000001_seed_default_data.sql (auth users + data)

After running BOTH files, you'll have:
- Complete database schema with fixed column references
- Auth users created in Supabase Auth system
- Proper relationships and constraints
- Row Level Security (RLS) policies
- 5 sample users with different roles
- 13 sample items (legal cases, deals, real estate, others)
- 7 sample tasks with assignments
- Sample comments and activity logs
- Complete tag assignments

🔑 LOGIN CREDENTIALS:
- Email: admin@kalkan.bartonapps.com
- Password: admin123
- (All demo users have the same password: admin123)

Alternatively, you can use the Supabase CLI:
1. Install Supabase CLI: npm install -g supabase
2. Run: supabase db push

🎯 After running BOTH migrations, you'll have:
- Complete database schema
- Role-based security
- Rich sample data ready to explore
- All functionality working with Supabase
`;
}