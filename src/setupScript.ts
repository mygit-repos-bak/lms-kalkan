import { setupDatabase, createSampleData } from './lib/setupDatabase';

async function runSetup() {
  console.log('🔧 Legal Management Platform Setup');
  console.log('=====================================');
  
  const isReady = await setupDatabase();
  
  if (!isReady) {
    console.log('');
    console.log('⚠️  Please run the database migrations first, then try again.');
    return;
  }
  
  console.log('');
  console.log('🎯 Database is ready for use!');
  console.log('');
  console.log('🔑 Login with:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
}

runSetup().catch(console.error);