import { Response } from 'express';
import ShoppingList from '../models/ShoppingList';
import { AuthRequest } from '../middleware/authMiddleware';
import {ShoppingList as IShoppingList} from '../models/models';
import ShoppingListItem from '../models/ShoppingListItem';
import Group from '../models/Group';
import mongoose from 'mongoose';
import { logActivity } from '../utilities/logActivity';
import { checkPermission, GroupAction } from '../utilities/permissions';


// Create a new list
export const createList = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, color, groupId, isPinned } = req.body;
    
    const group = await Group.findById(groupId)
      .select('members ownerId settings') 
      .lean();
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!checkPermission(group, req.user.id, GroupAction.CREATE_AND_VIEW)) {
      return res.status(404).json({ message: "You are not authorized to create a list" })
    }

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

    // Check if there is any groupId
    if (!groupId || Array.isArray(groupId)) {
      return res.status(400).json({ message: 'groupId required and must be a single value.' });
    }

    // Check if the user has the right permissions
    const group = await Group.findById(groupId)
      .select('members ownerId settings') 
      .lean();
    // Check if the group exists
    if (!group) return res.status(404).json({ message: 'Group not found' });
    //Check the role
    if (!checkPermission(group, req.user.id, GroupAction.CREATE_AND_VIEW)) {
      return res.status(404).json({ message: "You are not authorized to create a list" })
    }

    
    const groupObjectId = new mongoose.Types.ObjectId(groupId as string);
    const listsWithCounts = await ShoppingList.aggregate([
      {$match: {groupId: groupObjectId}},
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
                cond: { $eq: ['$$item.isChecked', true] }
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

    // Check if the user has the right permissions
    const group = await Group.findById(groupId)
      .select('members ownerId settings') 
      .lean();
    // Check if the group exists
    if (!group) return res.status(404).json({ message: 'Group not found' });
    //Check the role
    if (!checkPermission(group, req.user.id, GroupAction.CREATE_AND_VIEW)) {
      return res.status(404).json({ message: "You are not authorized to view this list" })
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

    // Check if the user has the right permissions
    const group = await Group.findById(list.groupId)
      .select('members ownerId settings') 
      .lean();
    // Check if the group exists
    if (!group) return res.status(404).json({ message: 'Group not found' });
    //Check the role
    if (!checkPermission(group, req.user.id, GroupAction.MODIFY_OWN_RESOURCE, list.authorId.toString())) {
      return res.status(404).json({ message: "You are not authorized to update this list" })
    }

    // Update fields
    const { name, description, icon, color } = req.body;
    if ( name !== undefined) list.name = name;
    if ( description !== undefined) list.description = description;
    if ( icon !== undefined) list.icon = icon;
    if ( color !== undefined) list.color = color;

    const updatedList = await list.save();

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
      console.error("Activity logging failed, but list was updated:", logError);
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
    // Check if the user has the right permissions
    const group = await Group.findById(list.groupId)
      .select('members ownerId settings') 
      .lean();
    // Check if the group exists
    if (!group) return res.status(404).json({ message: 'Group not found' });
    //Check the role
    if (!checkPermission(group, req.user.id, GroupAction.MODIFY_OWN_RESOURCE)) {
      return res.status(404).json({ message: "You are not authorized to delete this list" })
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
      console.error("Activity logging failed, but list was deleted:", logError);
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
