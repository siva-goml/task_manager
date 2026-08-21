import mongoose, { Document, Model } from "mongoose";

export interface TaskDocument extends Document {
    title: string;
    done: boolean;
    createdAt: Date;
}

const taskSchema = new mongoose.Schema<TaskDocument>({
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Task: Model<TaskDocument> = mongoose.model<TaskDocument>("task", taskSchema);

export default Task;