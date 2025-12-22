import { Request, Response } from 'express';
import ShoppingListItem from '../models/ShoppingListItem';
import ShoppingList from '../models/ShoppingList';
import { AuthRequest } from '../middleware/authMiddleware';
import { userIsMember } from '../utilities/groupUtilities';
import { logActivity } from '../utilities/logActivity';


// Create one item
export const createItem = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      listId, name, qty, unit, category, store, 
      priority, reminder, deadline 
    } = req.body;
    const list = await ShoppingList.findById(listId);
    
    if (!list) {
      return res.status(404).json({ message: 'List not found' });
    }
    
    if (list.authorId.toString() !== req.user.id && !list.groupId) {
      return res.status(403).json({ message: 'Not authorized to add items to this list' });
    }

    // Create the Item
    const newItem = await ShoppingListItem.create({
      listId,
      authorId: req.user.id,
      name,
      qty: qty || 1,
      unit: unit || 'pcs',
      category,
      store,
      priority: priority || 'normal',
      deadline,
      reminder: reminder || 0,
      isReminderSent: false,
      isDeleted: false
    });
    if(list.groupId){
      try {
        await logActivity({
          groupId: list.groupId,
          authorId: req.user.id,
          authorName: req.user.username,
          category: 'CONTENT',
          message: `${req.user.username} created "${newItem.name}" in ${list.name}`,
          metadata: { listId: newItem.listId }
        });
      } catch (logError) {
        console.error("Activity logging failed, but list was created:", logError);
      }
    }
    res.status(201).json(newItem);

  } catch (error) {
    console.error('Create Item Error:', error);
    res.status(500).json({ message: 'Server error creating item' });
  }
};

// Get all items from a list
export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const { listId, since } = req.query;

    if (!listId) {
      return res.status(400).json({ message: 'Please provide a listId' });
    }

    const query: any = { listId };

    if (since) {
      query.updatedAt = { $gt: new Date(since as string) };
    } else {
      query.isDeleted = false;
    }

    // Show checked items first
    const items = await ShoppingListItem.find(query).sort({ isChecked: 1 });

    res.status(200).json(items);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching items' });
  }
};

// This handles: Checking off, Renaming, Assigning, Changing Qty, r any other update
export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find Item
    const item = await ShoppingListItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Find parent
    const parentList = await ShoppingList.findById(item.listId).select('authorId groupId');
    if (!parentList) {
      // In case there is no parent list
      return res.status(404).json({ message: 'Item\'s parent list not found' });
    }
    let isAuthorized = false;

    // Is the user the author
    if (item.authorId.toString() === req.user.id) {
      isAuthorized = true;
    }
    
    // Did the user created the list containing that item
    else if (parentList.authorId.toString() === req.user.id) {
      isAuthorized = true;
    }
    
    // Is the user a group member
    else if (parentList.groupId) {
      const isMember = await userIsMember(parentList.groupId, req.user.id); 
      if (isMember) {
        isAuthorized = true;
      }
    }
    // Security Check (Verify ownership of the item or list)
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update
    const updatedItem = await ShoppingListItem.findByIdAndUpdate(
      id,
      req.body, 
      { new: true }
    );
    if(parentList.groupId){
      try {
        await logActivity({
          groupId: parentList.groupId,
          authorId: req.user.id,
          authorName: req.user.username,
          category: 'CONTENT',
          message: `${req.user.username} updated "${item.name}" in ${parentList.name}`,
          metadata: { listId: parentList._id }
        });
      } catch (logError) {
        console.error("Activity logging failed, but list was created:", logError);
      }
    }

    res.status(200).json(updatedItem);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating item' });
  }
};

export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await ShoppingListItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const parentList = await ShoppingList.findById(item.listId);
    // Security Check
    if (item.authorId.toString() !== req.user.id) {
        if (parentList && parentList.authorId.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized' });
      }
    }

    item.isDeleted = true;
    await item.save();
    if(parentList?.groupId){
      try {
        await logActivity({
          groupId: parentList.groupId,
          authorId: req.user.id,
          authorName: req.user.username,
          category: 'CONTENT',
          message: `${req.user.username} edited "${item.name}" from ${parentList.name}`,
          metadata: { listId: item._id }
        });
      } catch (logError) {
        console.error("Activity logging failed, but list was created:", logError);
      }
    }
    res.status(200).json({ message: 'Item deleted', id: item._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting item' });
  }
};