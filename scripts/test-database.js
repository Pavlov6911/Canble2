const dbManager = require('../config/database');
const { serviceFactory } = require('../services/ServiceFactory');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');
  console.log(`Database Type: ${process.env.DATABASE_TYPE || 'mongodb'}`);
  
  // dbManager is already an instance
  
  try {
    // Test connection
    console.log('\n📡 Connecting to database...');
    await dbManager.connect();
    console.log('✅ Database connection successful!');
    
    // Test service factory
    console.log('\n🏭 Testing Service Factory...');
    const userService = serviceFactory.getUserService();
    const groupService = serviceFactory.getGroupService();
    const messageService = serviceFactory.getMessageService();
    const serverService = serviceFactory.getServerService();
    
    console.log(`✅ User Service: ${userService ? 'Available' : 'Not Available'}`);
    console.log(`✅ Group Service: ${groupService ? 'Available' : 'Not Available'}`);
    console.log(`✅ Message Service: ${messageService ? 'Available' : 'Not Available'}`);
    console.log(`✅ Server Service: ${serverService ? 'Available' : 'Not Available'}`);
    
    // Test database type detection
    console.log('\n🔧 Service Factory Info:');
    console.log(`Database Type: ${serviceFactory.getDatabaseType()}`);
    console.log(`Is Supabase: ${serviceFactory.isSupabase()}`);
    console.log(`Is MongoDB: ${serviceFactory.isMongoDB()}`);
    
    // Test migration info
    console.log('\n📊 Migration Info:');
    const migrationInfo = serviceFactory.getMigrationInfo();
    console.log(`Current Database: ${migrationInfo.currentDatabase}`);
    console.log(`Can Migrate: ${migrationInfo.canMigrate}`);
    console.log(`Supabase Configured: ${migrationInfo.supabaseConfigured}`);
    console.log(`MongoDB Configured: ${migrationInfo.mongoConfigured}`);
    
    if (serviceFactory.isSupabase()) {
      console.log('\n🧪 Testing Supabase Connection...');
      try {
        const { supabase } = require('../config/database');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`⚠️  Supabase test query failed: ${error.message}`);
        } else {
          console.log('✅ Supabase connection test successful!');
        }
      } catch (err) {
        console.log(`❌ Supabase test failed: ${err.message}`);
      }
    } else {
      console.log('\n🧪 Testing MongoDB Connection...');
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState === 1) {
          console.log('✅ MongoDB connection test successful!');
        } else {
          console.log('⚠️  MongoDB connection not ready');
        }
      } catch (err) {
        console.log(`❌ MongoDB test failed: ${err.message}`);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    
    if (serviceFactory.isSupabase()) {
      console.error('- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
      console.error('- Verify Supabase project is active');
      console.error('- Check network connectivity');
    } else {
      console.error('- Check MONGODB_URI in .env');
      console.error('- Verify MongoDB is running');
      console.error('- Check network connectivity');
    }
  } finally {
    // Close connections
    if (serviceFactory.isMongoDB()) {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('\n🔌 MongoDB connection closed');
      }
    }
    
    console.log('\n👋 Test completed');
    process.exit(0);
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
}

module.exports = { testDatabaseConnection };