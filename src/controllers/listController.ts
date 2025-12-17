import { Response } from 'express';
import ShoppingList from '../models/ShoppingList';
import { AuthRequest } from '../middleware/authMiddleware';
import {ShoppingList as IShoppingList} from '../models/models';
import { userIsMember } from '../utilities/groupUtilities';
import ShoppingListItem from '../models/ShoppingListItem';
import Group from '../models/Group';
import mongoose from 'mongoose';
import { logActivity } from '../utilities/logActivity';


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
    try {
      await logActivity({
        groupId: newList.groupId,
        authorId: req.user.id,
        authorName: req.user.username,
        category: 'CONTENT',
        message: `${req.user.username} created the list "${newList.name}"`,
        metadata: { listId: newList._id }
      });
    } catch (logError) {
      console.error("Activity logging failed, but list was created:", logError);
    }
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
    const requestingUserId = req.user.id

    if (!groupId || Array.isArray(groupId)) {
      return res.status(400).json({ message: 'groupId required and must be a single value.' });
    }

    const group = await Group.findOne({
        _id: groupId, 
        'members.userId': requestingUserId
    });

    if (!group) {
        return res.status(403).json({ message: 'Not authorized to view lists in this group or group not found.' });
    }
    const objectGroupId = new mongoose.Types.ObjectId(groupId as string); 
    
    const pipelineFilter = { groupId: objectGroupId };
    
    const listsWithCounts = await ShoppingList.aggregate([
      {$match: pipelineFilter},
      {
        $lookup: {
          from: 'shoppinglistitems',
          localField: '_id',
          foreignField: 'listId',
          as: 'items'
        }
      },
      {
        $addFields: {
          totalItemsCounter: { $size: '$items' },
          completedItemsCounter: {
            $size: {
              $filter: {
                input: '$items',
                as: 'item',
                cond: { $eq: ['$$item.isCompleted', true] }
              }
            }
          }
        }
      },
      {
        $project: {items: 0}
      }
    ]);
    
    res.status(200).json(listsWithCounts);

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
    try {
      await logActivity({
        groupId: list.groupId,
        authorId: req.user.id,
        authorName: req.user.username,
        category: 'CONTENT',
        message: `${req.user.username} edited the list "${list.name}"`,
        metadata: { listId: list._id }
      });
    } catch (logError) {
      console.error("Activity logging failed, but list was created:", logError);
    }
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
    try {
      await logActivity({
        groupId: list.groupId,
        authorId: req.user.id,
        authorName: req.user.username,
        category: 'CONTENT',
        message: `${req.user.username} deleted the list "${list.name}"`,
        metadata: { listId: list._id }
      });
    } catch (logError) {
      console.error("Activity logging failed, but list was created:", logError);
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
