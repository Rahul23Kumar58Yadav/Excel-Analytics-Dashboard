const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });
    
    return conn;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Check for specific error types
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Authentication issue: Check your username/password in the connection string');
    } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.error('🔒 SSL/TLS issue: Try updating your connection string or Node.js version');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('🌐 Network issue: Check your internet connection or MongoDB Atlas status');
    }
    
    if (retries > 0) {
      console.log(`🔄 Retrying connection in 5 seconds... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('❌ Max retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = connectDB;



