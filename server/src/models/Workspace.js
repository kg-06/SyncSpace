import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true

    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        role: {
          type: String,
          enum: ["lead", "member"],
          default: "member"
        },
        status: {
          type: String,
          enum: ["pending", "accepted"],
          default: "pending"
        }
      }
    ],
    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Workspace", workspaceSchema);