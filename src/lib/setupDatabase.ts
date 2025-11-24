import { supabase } from './supabase';

export async function setupDatabase() {
  console.log('🚀 Setting up Legal Management Platform Database...');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && testError.message.includes('relation "users" does not exist')) {
      console.log('❌ Database tables not found. Please run the migrations first.');
      console.log('');
      console.log('📋 SETUP INSTRUCTIONS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/itrzbxtzzngzesbmopyo');
      console.log('2. Click "SQL Editor" → "New Query"');
      console.log('3. Copy and paste the contents of: supabase/migrations/20250828000000_fix_ambiguous_columns.sql');
      console.log('4. Click "Run"');
      console.log('5. Create another "New Query"');
      console.log('6. Copy and paste the contents of: supabase/migrations/20250828000002_create_admin_profile_and_seed_data.sql');
      console.log('7. Click "Run"');
      console.log('');
      return false;
    }
    
    if (testError) {
      console.error('❌ Database connection error:', testError.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    
    // Check if we have data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error checking users:', usersError.message);
      return false;
    }
    
    console.log(`✅ Found ${users?.length || 0} users in database`);
    
    if (users && users.length > 0) {
      console.log('✅ Database already has data!');
      
      // Check for items
      const { data: items } = await supabase.from('items').select('*');
      console.log(`✅ Found ${items?.length || 0} items in database`);
      
      // Check for tasks
      const { data: tasks } = await supabase.from('tasks').select('*');
      console.log(`✅ Found ${tasks?.length || 0} tasks in database`);
      
      // Check for tags
      const { data: tags } = await supabase.from('tags').select('*');
      console.log(`✅ Found ${tags?.length || 0} tags in database`);
      
      console.log('');
      console.log('🎉 Database is ready! You can now use the application.');
      return true;
    } else {
      console.log('⚠️  Database tables exist but no data found.');
      console.log('Please run the seed data migration: 20250828000002_create_admin_profile_and_seed_data.sql');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

export async function createSampleData() {
  console.log('🌱 Creating sample data...');
  
  try {
    // Get current auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      console.log('❌ No authenticated user found. Please log in first.');
      return false;
    }
    
    console.log('✅ Found authenticated user:', authUser.email);
    
    // Create user profile if it doesn't exist
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (!existingProfile) {
      console.log('📝 Creating user profile...');
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          name: 'Admin User',
          email: authUser.email || 'admin@example.com',
          role: 'admin',
          active: true,
          notification_prefs: {
            email: true,
            in_app: true,
            mentions: true,
            assignments: true
          },
          force_password_change: false,
          timezone: 'America/New_York'
        });
      
      if (profileError) {
        console.error('❌ Error creating profile:', profileError.message);
        return false;
      }
      
      console.log('✅ User profile created successfully');
    } else {
      console.log('✅ User profile already exists');
    }
    
    // Create sample legal case
    console.log('📋 Creating sample legal case...');
    
    const { data: sampleItem, error: itemError } = await supabase
      .from('items')
      .insert({
        section_id: 'legal',
        title: 'Smith vs. Johnson Contract Dispute',
        description: 'Complex commercial contract dispute involving breach of service agreement and damages claim of $2.5M. Multiple jurisdictions involved requiring extensive discovery and expert witness testimony.',
        status: 'active',
        priority: 'high',
        start_date: '2024-01-15',
        due_date: '2024-03-30',
        external_links: ['https://courtrecords.example.com/case123'],
        created_by: authUser.id,
        updated_by: authUser.id
      })
      .select()
      .single();
    
    if (itemError) {
      console.error('❌ Error creating sample item:', itemError.message);
      return false;
    }
    
    console.log('✅ Sample legal case created successfully');
    
    // Create sample task
    console.log('📋 Creating sample task...');
    
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        item_id: sampleItem.id,
        title: 'Review Contract Terms',
        description: 'Detailed analysis of contract clauses and identification of potential breach points',
        stage: 'Work in Progress',
        priority: 'high',
        status: 'active',
        start_date: '2024-01-15',
        due_date: '2024-02-15',
        estimate_hours: 20.0,
        created_by: authUser.id,
        updated_by: authUser.id
      });
    
    if (taskError) {
      console.error('❌ Error creating sample task:', taskError.message);
      return false;
    }
    
    console.log('✅ Sample task created successfully');
    console.log('');
    console.log('🎉 Sample data created! You can now explore the application.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    return false;
  }
}