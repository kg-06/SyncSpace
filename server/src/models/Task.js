import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    column: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column"
    },
    dueDate: {
      type: Date
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);