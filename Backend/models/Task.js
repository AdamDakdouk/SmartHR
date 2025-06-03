// models/Task.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

// Add indexes
taskSchema.index({ assignedTo: 1, status: 1, isDeleted: 1 });
taskSchema.index({ createdBy: 1, isDeleted: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ isDeleted: 1 });

// Update hooks
taskSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "completed") {
      this.completedAt = new Date();
      this.progress = 100;
    } else if (this.status === "pending") {
      this.completedAt = undefined;
      this.progress = 0;
    }
  }
  next();
});

// Add query middleware to exclude deleted documents by default
taskSchema.pre(/^find/, function (next) {
  // Only add the condition if 'isDeleted' is not already specified
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

export default mongoose.model("Task", taskSchema);
