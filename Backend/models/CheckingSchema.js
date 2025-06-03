import mongoose from "mongoose";
const { Schema } = mongoose;

const checkInSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      required: true,
      index: true,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    duration: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

checkInSchema.pre("save", function (next) {
  if (this.checkOutTime && this.checkInTime) {
    // Calculate duration in minutes
    this.duration = Math.round(
      (this.checkOutTime - this.checkInTime) / (1000 * 60)
    );
  }
  next();
});

checkInSchema.index({ employee: 1, checkInTime: -1 });
checkInSchema.index({ checkInTime: -1 });

export default mongoose.model("CheckIn", checkInSchema);
