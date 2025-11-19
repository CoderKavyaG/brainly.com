import mongoose, { model, Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URL || "mongodb://localhost:27017/brainly";

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
  text: String,
  tags: [{ type: String }],
  type: String,
  createdAt: { type: Date, default: Date.now },
  pin: { type: Boolean, default: false },
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

export const ContentModel = model("Content", ContentSchema);

const LinkSchema = new Schema({
  hash: String,
  userId: {type: mongoose.Types.ObjectId, ref: "User", required: true , unique:true},
});

export const LinkModel = model("Links", LinkSchema);