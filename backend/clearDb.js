import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const clearDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      process.exit(1);
    }

    await mongoose.connect(mongoUri);

    // Fetch all active collections live from the MongoDB database
    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      await collection.deleteMany({});
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

clearDatabase();
