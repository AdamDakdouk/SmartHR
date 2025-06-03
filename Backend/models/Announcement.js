import mongoose from "mongoose";

const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    sendToAll: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
