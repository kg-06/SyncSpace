import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailOtpHash: {
      type: String
    },
    emailOtpExpires: {
      type: Date
    },
    avatar: {
      type: String
    },
    workspaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);