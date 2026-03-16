import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board"
    },
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Column", columnSchema);