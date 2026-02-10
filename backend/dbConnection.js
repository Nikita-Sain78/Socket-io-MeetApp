import mongoose from "mongoose";
const MONGO_URI = "mongodb://127.0.0.1:27017/meetapp";
const dbConnection = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
export default dbConnection;
