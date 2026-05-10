import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace"
    },
    type: {
      type: String,
      enum: ["INVITATION", "ACTIVITY", "SYSTEM"],
      default: "ACTIVITY"
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    link: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
