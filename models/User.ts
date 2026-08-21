import mongoose, { Document, Model } from "mongoose";

export interface UserDocument extends Document {
    username: string;
    password: string;
    createdAt: Date;
}

const userSchema = new mongoose.Schema<UserDocument>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User: Model<UserDocument> = mongoose.model<UserDocument>("User", userSchema);

export default User;