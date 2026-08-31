import { Schema, model } from 'mongoose';

const NOTE_TAGS = [
  'Work',
  'Personal',
  'Meeting',
  'Shopping',
  'Ideas',
  'Travel',
  'Finance',
  'Health',
  'Important',
  'Todo',
];

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      enum: NOTE_TAGS,
      default: 'Todo',
    },
  },
  { timestamps: true },
);

export const Note = model('Note', noteSchema, 'notes');
