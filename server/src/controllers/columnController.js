import Column from "../models/Column.js";
import Board from "../models/Board.js";

// CREATE COLUMN
export const createColumn = async (req, res) => {
  try {
    const { title, boardId } = req.body;

    const board = await Board.findById(boardId);

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const column = await Column.create({
      title,
      board: boardId
    });

    // add column to board
    board.columns.push(column._id);
    await board.save();

    res.status(201).json(column);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//get all columns of a board

export const getColumnsByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    const columns = await Column.find({ board: boardId })
      .populate("tasks");

    res.json(columns);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//update column
export const updateColumn = async (req, res) => {
  try {
    const { title } = req.body;

    const column = await Column.findById(req.params.columnId);

    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    column.title = title || column.title;

    await column.save();

    res.json(column);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete column
export const deleteColumn = async (req, res) => {
  try {
    const column = await Column.findById(req.params.columnId);

    if (!column) {
      return res.status(404).json({ message: "Column not found" });
    }

    // remove from board
    await Board.findByIdAndUpdate(column.board, {
      $pull: { columns: column._id }
    });

    await column.deleteOne();

    res.json({ message: "Column deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//reorder column

export const reorderColumns = async (req, res) => {
  try {
    const { boardId, columnOrder } = req.body;

    // columnOrder = [columnId1, columnId2, columnId3]

    const board = await Board.findById(boardId);

    board.columns = columnOrder;

    await board.save();

    res.json(board);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};