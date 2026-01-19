import { Response } from 'express';
import Note from '../models/Note';
import Group from '../models/Group';
import { AuthRequest } from '../middleware/authMiddleware';
import NoteComment from '../models/NoteComment';

const isMember = async (groupId: string, userId: string): Promise<boolean> => {
    const group = await Group.findOne({ 
        _id: groupId, 
        'members.userId': userId 
    });
    return !!group;
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, title, content, isPinned, authorUsername, _id} = req.body;

    if (!await isMember(groupId, req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to post in this group' });
    }

    const newNote = await Note.create({
      _id,
      groupId,
      authorId: req.user.id,
      title: title || "Untitled Note",
      content,
      isPinned: isPinned ?? false
    });

    res.status(201).json({...newNote.toObject(), authorUsername});

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
      .sort({ createdAt: -1 })
      .lean();
    
      const flattenedNotes = notes.map(note => {
      const author = note.authorId as any; 
      
      return {
        ...note,
        authorId: author?._id || note.authorId,
        authorUsername: author?.username || 'Unknown'
      };
    });

    res.status(200).json(flattenedNotes);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};
export const getNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Note ID required' });
    }
    const note = await Note.findById(id).populate('authorId', 'username avatarUrl').lean();

    // Verify Group Membership
    if (note && !await isMember(note.groupId as string, req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view these notes' });
    }
    const tempAuthor = note?.authorId as any;
    res.status(200).json({...note, authorId: tempAuthor?._id, authorUsername: tempAuthor?.username});

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching notes' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isDeleted, isPinned } = req.body;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only Author can edit
    if (note.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this note' });
    }

    note.title = title || note.title;
    note.content = content || note.content;
    note.isDeleted = isDeleted || false;
    note.isPinned = isPinned || false;
    await note.save();

    res.status(200).json(note);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating note' });
  }
};

// Delete a note and all its comments
export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (note.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();

    await NoteComment.deleteMany({ noteId: id });

    res.status(200).json({ message: 'Note deleted' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
};


// COMMENTS //

// Add a comment
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { noteId } = req.params;
    const { content, username } = req.body;
    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      { $inc: { commentCount: 1 } },
      { new: true }
    )
    if (!updatedNote) {
      return res.status(404).json({ message: 'Note not found to update count' });
    }

    const newComment = await NoteComment.create({content, authorId: req.user.id, username, noteId});

    if(newComment) {
      
      res.status(200).json(newComment);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding note comment' , error});
  }
};

// Gett all comments from a note
export const getNoteComments = async (req, res) => {
  try {
    const { noteId } = req.params; // note id
    const comments = await NoteComment.find({ noteId }).sort({ createdAt: 1 });
    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

// Delete a comment 

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    // Find the comment
    const comment = await NoteComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the author
    if (comment.authorId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized"});

    const noteId = comment.noteId;

    // Delete the comment
    await NoteComment.findByIdAndDelete(commentId);

    // Decrement the count on the Note
    await Note.findByIdAndUpdate(noteId, { $inc: { commentCount: -1 } });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};