import mongoose from "mongoose";

const { Schema } = mongoose;

const issueSchema = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Employee" },
    resolution: { type: String },
    category: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Issue", issueSchema);
