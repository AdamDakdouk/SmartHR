// models/Request.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const requestSchema = new Schema(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    type: {
      type: String,
      enum: ["leave", "vacation", "salary", "equipment", "other"],
      required: true,
    },
    // Common fields
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    // For leave and vacation requests
    startDate: { type: Date },
    endDate: { type: Date },
    reason: { type: String },

    // For vacation requests
    destination: { type: String },
    vacationType: {
      type: String,
      enum: ["annual", "unpaid"],
    },

    // For leave requests
    leaveType: {
      type: String,
      enum: ["sick", "personal", "emergency"],
    },

    // For salary requests
    currentSalary: { type: Number },
    requestedSalary: { type: Number },
    achievements: { type: String },
    justification: { type: String },

    // For additional information
    notes: { type: String },

    // For tracking review
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Employee" },
    reviewedAt: { type: Date },
    comments: { type: String },

    // For urgent flagging
    urgent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);
