// models/Notification.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "TASK_STATUS_UPDATE",
        "TASK_UPDATE",
        "TASK_DELETED",
        "TASK_RESTORED",
        "ANNOUNCEMENT",
        "ISSUE_REPORTED",
        "ISSUE_STATUS_UPDATE",
        "LEAVE_REQUEST_SUBMITTED",
        "LEAVE_REQUEST_STATUS_UPDATE",
        "VACATION_REQUEST_SUBMITTED",
        "VACATION_REQUEST_STATUS_UPDATE",
        "SALARY_REQUEST_SUBMITTED",
        "SALARY_REQUEST_STATUS_UPDATE",
        "EQUIPMENT_REQUEST_SUBMITTED",
        "EQUIPMENT_REQUEST_STATUS_UPDATE",
        "OTHER_REQUEST_SUBMITTED",
        "OTHER_REQUEST_STATUS_UPDATE",
        "SYSTEM",
        "CHECK_IN_SUCCESS",
        "CHECK_OUT_SUCCESS",
        "CHECK_IN_REMINDER",
      ],
      required: true,
      default: "SYSTEM",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days from creation
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: "relatedModel",
    },
    relatedModel: {
      type: String,
      enum: [
        "Task",
        "Announcement",
        "Issue",
        "Request",
        "CheckIn",
        "Request",
      ],
    },
  },
  { timestamps: true }
);

notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);
