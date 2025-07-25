import { appConfig } from './dist/config.js';
import { DatabaseService } from './dist/database.js';

async function testConnection() {
  const dbService = new DatabaseService();

  try {
    console.log('🔗 Testing Oracle database connection...');
    console.log(`Connecting to: ${appConfig.database.connectString}`);
    console.log(`User: ${appConfig.database.user}`);
    
    // Initialize database connection
    await dbService.initialize(appConfig.database);
    console.log('✅ Database connection successful!');
    
    // Test a simple query to verify everything works
    console.log('🔍 Testing basic query...');
    // We'll just test the connection, not query any specific table yet
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ORA-12154')) {
        console.log('\n💡 TNS Error - Check your connection string');
      } else if (error.message.includes('ORA-01017')) {
        console.log('\n💡 Authentication Error - Check username/password');
      } else if (error.message.includes('DPI-1047') || error.message.includes('DLL')) {
        console.log('\n💡 Oracle Instant Client Error - Check if PATH is set correctly');
        console.log('   Restart your terminal/VS Code and try again');
      }
    }
    
    process.exit(1);
  } finally {
    // Clean up database connection
    await dbService.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the connection test
testConnection().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
