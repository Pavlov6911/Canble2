const SupabaseUserService = require('./SupabaseUserService');
const SupabaseGroupService = require('./SupabaseGroupService');
const SupabaseMessageService = require('./SupabaseMessageService');
const SupabaseServerService = require('./SupabaseServerService');

// MongoDB models (existing)
const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Server = require('../models/Server');

class ServiceFactory {
  constructor() {
    this.databaseType = process.env.DATABASE_TYPE || 'mongodb';
    this.services = {};
    this.initializeServices();
  }

  initializeServices() {
    if (this.databaseType === 'supabase') {
      this.services = {
        user: new SupabaseUserService(),
        group: new SupabaseGroupService(),
        message: new SupabaseMessageService(),
        server: new SupabaseServerService()
      };
    } else {
      // MongoDB services (using existing models)
      this.services = {
        user: this.createMongoService(User),
        group: this.createMongoService(Group),
        message: this.createMongoService(Message),
        server: this.createMongoService(Server)
      };
    }
  }

  // Create a wrapper for MongoDB models to match service interface
  createMongoService(Model) {
    return {
      model: Model,
      
      // Common CRUD operations
      async create(data) {
        const document = new Model(data);
        return await document.save();
      },

      async findById(id) {
        return await Model.findById(id);
      },

      async findOne(query) {
        return await Model.findOne(query);
      },

      async find(query = {}, options = {}) {
        let mongoQuery = Model.find(query);
        
        if (options.populate) {
          mongoQuery = mongoQuery.populate(options.populate);
        }
        
        if (options.sort) {
          mongoQuery = mongoQuery.sort(options.sort);
        }
        
        if (options.limit) {
          mongoQuery = mongoQuery.limit(options.limit);
        }
        
        if (options.skip) {
          mongoQuery = mongoQuery.skip(options.skip);
        }
        
        return await mongoQuery;
      },

      async updateById(id, updateData) {
        return await Model.findByIdAndUpdate(id, updateData, { new: true });
      },

      async updateOne(query, updateData) {
        return await Model.findOneAndUpdate(query, updateData, { new: true });
      },

      async deleteById(id) {
        return await Model.findByIdAndDelete(id);
      },

      async deleteOne(query) {
        return await Model.findOneAndDelete(query);
      },

      async count(query = {}) {
        return await Model.countDocuments(query);
      },

      // Direct model access for complex operations
      getModel() {
        return Model;
      }
    };
  }

  // Get service by type
  getUserService() {
    return this.services.user;
  }

  getGroupService() {
    return this.services.group;
  }

  getMessageService() {
    return this.services.message;
  }

  getServerService() {
    return this.services.server;
  }

  // Get all services
  getAllServices() {
    return this.services;
  }

  // Check database type
  isSupabase() {
    return this.databaseType === 'supabase';
  }

  isMongoDB() {
    return this.databaseType === 'mongodb';
  }

  getDatabaseType() {
    return this.databaseType;
  }

  // Helper method to get the appropriate service method
  async executeServiceMethod(serviceType, methodName, ...args) {
    const service = this.services[serviceType];
    if (!service) {
      throw new Error(`Service '${serviceType}' not found`);
    }

    if (typeof service[methodName] !== 'function') {
      throw new Error(`Method '${methodName}' not found in service '${serviceType}'`);
    }

    return await service[methodName](...args);
  }

  // Migration helper - check if we can migrate
  canMigrate() {
    return this.databaseType === 'mongodb' && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  // Get migration status
  getMigrationInfo() {
    return {
      currentDatabase: this.databaseType,
      canMigrate: this.canMigrate(),
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      mongoConfigured: !!process.env.MONGODB_URI
    };
  }
}

// Create singleton instance
const serviceFactory = new ServiceFactory();

module.exports = {
  ServiceFactory,
  serviceFactory
};