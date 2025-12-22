import { Response } from 'express';
import Note from '../models/Note';
import Group from '../models/Group';
import { AuthRequest } from '../middleware/authMiddleware';

const isMember = async (groupId: string, userId: string): Promise<boolean> => {
    const group = await Group.findOne({ 
        _id: groupId, 
        'members.userId': userId 
    });
    return !!group;
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, title, content } = req.body;

    if (!await isMember(groupId, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to post in this group' });
    }

    const newNote = await Note.create({
      groupId,
      authorId: req.user.id,
      title: title ?? "Untitled Note",
      content,
      comments: []
    });

    res.status(201).json(newNote);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating note' });
  }
};

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.query;

    if (!groupId) {
        return res.status(400).json({ message: 'Group ID required' });
    }

    // Security: Verify Group Membership
    if (!await isMember(groupId as string, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to view these notes' });
    }

    const notes = await Note.find({ groupId })
      .populate('authorId', 'username avatarUrl') // Show who wrote it
      .sort({ createdAt: -1 });

    res.status(200).json(notes);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only Author can edit
    if (note.authorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to edit this note' });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    await note.save();

    res.status(200).json(note);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating note' });
  }
};


export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.authorId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();

    res.status(200).json({ message: 'Note deleted' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
};