import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();
const MONGO_URI = process.env.MONGO_URI;
const dbConnection = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
export default dbConnection;
