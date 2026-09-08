import { Router } from 'express';
import { celebrate } from 'celebrate';

import {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} from '../controllers/notesController.js';
import {
  getAllNotesSchema,
  noteIdSchema,
  createNoteSchema,
  updateNoteSchema,
} from '../validations/notesValidation.js';
import { authenticate } from '../middleware/authenticate.js';

const notesRoutes = Router();

notesRoutes.use('/notes', authenticate);

notesRoutes.get('/notes', celebrate(getAllNotesSchema), getAllNotes);
notesRoutes.get('/notes/:noteId', celebrate(noteIdSchema), getNoteById);
notesRoutes.post('/notes', celebrate(createNoteSchema), createNote);
notesRoutes.patch('/notes/:noteId', celebrate(updateNoteSchema), updateNote);
notesRoutes.delete('/notes/:noteId', celebrate(noteIdSchema), deleteNote);

export default notesRoutes;
