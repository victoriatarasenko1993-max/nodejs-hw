import createHttpError from 'http-errors';
import { Note } from '../models/note.js';
import mongoose from 'mongoose'; 

export const getAllNotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = Math.max(1, parseInt(req.query.perPage, 10) || 10);
    const { tag, search } = req.query;

    const filter = {
      userId: req.user._id,
    };

    if (tag) {
      filter.tag = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * perPage;

    const [notes, totalNotes] = await Promise.all([
      Note.find(filter).skip(skip).limit(perPage),
      Note.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalNotes / perPage);

    res.status(200).json({
      page,
      perPage,
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw createHttpError(404, 'Note not found');
    }

    const note = await Note.findOne({ _id: noteId, userId: req.user._id });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({
      ...req.body,
      userId: req.user._id,
    });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw createHttpError(404, 'Note not found');
    }

    const note = await Note.findOneAndDelete({
      _id: noteId,
      userId: req.user._id,
    });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw createHttpError(404, 'Note not found');
    }

    const updateData = { ...req.body };
    delete updateData.userId;

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId: req.user._id },
      updateData,
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};
