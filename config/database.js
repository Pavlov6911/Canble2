const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class DatabaseManager {
  constructor() {
    this.dbType = process.env.DATABASE_TYPE || 'mongodb';
    this.supabase = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.dbType === 'supabase') {
        await this.connectSupabase();
      } else {
        await this.connectMongoDB();
      }
      this.isConnected = true;
      console.log(`${this.dbType.toUpperCase()} connected successfully`);
    } catch (error) {
      console.error(`Database connection error:`, error.message);
      throw error;
    }
  }

  async connectMongoDB() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/canble';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  async connectSupabase() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase URL and Service Role Key are required');
    }

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test connection
    const { data, error } = await this.supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
  }

  getClient() {
    if (this.dbType === 'supabase') {
      return this.supabase;
    }
    return mongoose;
  }

  getType() {
    return this.dbType;
  }

  isSupabase() {
    return this.dbType === 'supabase';
  }

  isMongoDB() {
    return this.dbType === 'mongodb';
  }

  async disconnect() {
    if (this.dbType === 'mongodb' && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    this.isConnected = false;
    console.log('Database disconnected');
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;