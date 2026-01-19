import { Request, Response } from 'express';
import Group from '../models/Group';
import List from '../models/ShoppingList';
import ListItem from '../models/ShoppingListItem';
import Note from '../models/Note';
import Poll from '../models/Poll';

export const getSyncData = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        console.log(userId)

        // Get all Groups the user is a member of
        const groups = await Group.find({ "members.userId": userId });
        
        // Extract the ids
        const groupIds = groups.map(g => g._id.toString());

        // Get Lists
        const lists = await List.find({ 
            groupId: { $in: groupIds } 
        });

        // Fetch items only for the lists we just found
        const listIds = lists.map(l => l._id.toString());
        const items = await ListItem.find({ 
            listId: { $in: listIds } 
        });

        // Fetch notes that belong to these groups
        const notes = await Note.find({groupId: { $in: groupIds }})
            .populate('authorId', 'username avatarUrl') // Populate author details
            .sort({ createdAt: -1 }) // Newest first
            .lean();
        const flattenedNotes = notes.map(note => {
            const author = note.authorId as any; 

            return {
                ...note,
                authorId: author?._id || note.authorId,
                authorUsername: author?.username || 'Unknown',
                authorAvatar: author?.avatarUrl || null
            };
        });
        // Fetch polls that belong to these groups
        const polls = await Poll.find({ 
            groupId: { $in: groupIds } 
        });

        // Send the data
        res.status(200).json({
            groups,
            lists,
            items,
            notes: flattenedNotes,
            polls,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ message: 'Failed to sync group data' });
    }
};