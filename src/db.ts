import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGOOSE_URI;
if (!uri) {
  throw new Error("MONGOOSE_URI is not defined in environment variables.");
}

const mongoUri: string = uri;

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

connectDB();

const UserSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

export const UserModel = model("User", UserSchema);

const ContentSchema = new Schema({
  title: String,
  link: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

export const ContentModel = model("Content", ContentSchema);