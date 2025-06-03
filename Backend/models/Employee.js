import mongoose from "mongoose";
const { Schema } = mongoose;

const employeeSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    job: { type: String, default: "" },
    role: { type: String, enum: ["employee", "hr"], default: "employee" },
    status: {
      type: String,
      enum: ["checkedIn", "checkedOut", "onLeave"],
      default: "checkedOut",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Current real-time location when checked in
    checkInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    // Default/base work location
    defaultCheckInLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      setAt: { type: Date },
    },
    profilePicture: { type: String },
    requests: [
      // Changed from "leaveRequests" to "requests"
      {
        type: Schema.Types.ObjectId,
        ref: "Request",
      },
    ],
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    issuesReported: [
      {
        type: Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],
    otp: { type: Number },
    otpGeneratedAt: { type: Date },
    isVerified: { type: Boolean, default: false },
    refreshToken: {
      type: String,
      default: null,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-find middleware to filter out inactive employees by default
employeeSchema.pre("find", function () {
  // If active filter is not explicitly set in the query, filter by active: true
  if (!this._conditions.hasOwnProperty("active")) {
    this._conditions.active = true;
  }
});

// Pre-findOne middleware to filter out inactive employees by default
employeeSchema.pre("findOne", function () {
  if (!this._conditions.hasOwnProperty("active")) {
    this._conditions.active = true;
  }
});

// Add index for frequently queried fields
employeeSchema.index({ role: 1, active: 1 });
employeeSchema.index({ status: 1, active: 1 });

export default mongoose.model("Employee", employeeSchema);
