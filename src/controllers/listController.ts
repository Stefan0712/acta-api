import { Response } from 'express';
import ShoppingList from '../models/ShoppingList';
import { AuthRequest } from '../middleware/authMiddleware';
import {ShoppingList as IShoppingList} from '../models/models';
import { userIsMember } from '../utilities/groupUtilities';
import ShoppingListItem from '../models/ShoppingListItem';


// Create a new list
export const createList = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, groupId, isPinned } = req.body;
    
    const newList: IShoppingList = await ShoppingList.create({
      authorId: req.user.id,
      name,
      description,
      color,
      groupId: groupId || null,
      isPinned: isPinned || false,
      isDeleted: false
    });

    res.status(201).json(newList);

  } catch (error) {
    console.error('Create List Error:', error);
    res.status(500).json({ message: 'Server error creating list' });
  }
};

// Get all list from a group
export const getLists = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.query;
    // Build the query
    const query: any = { groupId };

    const lists = await ShoppingList.find(query);
    res.status(200).json(lists);

  } catch (error) {
    console.error('Get Lists Error:', error);
    res.status(500).json({ message: 'Server error fetching lists' });
  }
};

// Get one list by id
export const getListById = async (req: AuthRequest, res: Response) => {
  try {
    const list = await ShoppingList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }
    
    const groupId = list.groupId; 
    const isMember = await userIsMember(groupId, req.user.id); 
    if (list.authorId.toString() !== req.user.id && !isMember) {
      return res.status(403).json({ message: 'Not authorized to view this list' });
    }

    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a list
export const updateList = async (req: AuthRequest, res: Response) => {
  try {
    const list = await ShoppingList.findById(req.params.id);

    if (!list) return res.status(404).json({ message: 'List not found' });

    // Security Check
    const isMember = await userIsMember(list.groupId, req.user.id); 
    if (list.authorId.toString() !== req.user.id || !isMember) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    const updatedList = await ShoppingList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    );

    res.status(200).json(updatedList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating list' });
  }
};

// Delete one list
export const deleteList = async (req: AuthRequest, res: Response) => {
  try {
    const list = await ShoppingList.findById(req.params.id);

    if (!list) return res.status(404).json({ message: 'List not found' });
    let isAuthorized;
    if (list.authorId.toString() === req.user.id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const itemDeletionResult = await ShoppingListItem.deleteMany({ 
      listId: list._id 
    });
    
    const listDeletionResult = await ShoppingList.deleteOne({ 
      _id: list._id 
    });

    if (listDeletionResult.deletedCount === 0) {
      return res.status(404).json({ message: 'List not found or already deleted.' });
    }

    res.status(200).json({ 
      message: 'List and all associated items permanently deleted.',
      listsDeleted: listDeletionResult.deletedCount,
      itemsDeleted: itemDeletionResult.deletedCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting list' });
  }
};
