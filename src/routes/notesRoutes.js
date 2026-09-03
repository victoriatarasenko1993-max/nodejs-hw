import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} from '../controllers/notesController.js';
import {
  createNoteSchema,
  updateNoteSchema,
  noteIdSchema,
  getAllNotesSchema,
} from '../validations/notesValidation.js';
import { celebrate } from 'celebrate';
import { Segments } from 'celebrate';

const router = Router();

router.get('/notes', celebrate({ query: getAllNotesSchema }), getAllNotes);
router.get('/notes/:noteId', celebrate({ params: noteIdSchema }), getNoteById);
router.post('/notes', celebrate({ body: createNoteSchema }), createNote);
router.delete(
  '/notes/:noteId',
  celebrate({ params: noteIdSchema }),
  deleteNote,
);
router.patch(
  '/notes/:noteId',
  celebrate({
    body: updateNoteSchema[Segments.BODY],
    params: updateNoteSchema[Segments.PARAMS],
  }),
  updateNote,
);

export default router;
