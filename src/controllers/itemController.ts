import { Request, Response } from 'express';
import ShoppingListItem from '../models/ShoppingListItem';
import ShoppingList from '../models/ShoppingList';
import { AuthRequest } from '../middleware/authMiddleware';
import { userIsMember } from '../utilities/groupUtilities';
import { logActivity } from '../utilities/logActivity';
import Group from '../models/Group';
import { createNotification } from '../utilities/notificationHelpers';


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
      qty,
      unit,
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

export const updateItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find Item
    const item = await ShoppingListItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Find parent
    const parentList = await ShoppingList.findById(item.listId).select('authorId groupId name');
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
// Handles checking and unchecking items
export const toggleCheck = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find Item
    const item = await ShoppingListItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Find parent
    const parentList = await ShoppingList.findById(item.listId).select('authorId groupId name').lean();

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
      const isMember = await Group.exists({
        _id: parentList.groupId,
        'members.userId': userId
      });
      
      if (isMember) isAuthorized = true;
    }
    // Security Check (Verify ownership of the item or list)
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item.isChecked = !item.isChecked;

    await item.save();
    if(parentList.groupId){
      const actionVerb = item.isChecked ? 'checked' : 'unchecked';
      try {
        await logActivity({
          groupId: parentList.groupId,
          authorId: req.user.id,
          authorName: req.user.username,
          category: 'CONTENT',
          message: `${req.user.username} ${actionVerb} "${item.name}" in ${parentList.name}`,
          metadata: { listId: parentList._id }
        });
      } catch (logError) {
        console.error("Activity logging failed, but item was checked:", logError);
      }
    }

    res.status(200).json(item.isChecked);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating item' });
  }
};
// Handles pinning and unpinning items
export const togglePin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find Item
    const item = await ShoppingListItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Find parent
    const parentList = await ShoppingList.findById(item.listId).select('authorId groupId name').lean();

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
      const isMember = await Group.exists({
        _id: parentList.groupId,
        'members.userId': userId
      });
      
      if (isMember) isAuthorized = true;
    }
    // Security Check (Verify ownership of the item or list)
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    item.isPinned = !item.isPinned;

    await item.save();
    if(parentList.groupId){
      const actionVerb = item.isChecked ? 'pinned' : 'unpinned';
      try {
        await logActivity({
          groupId: parentList.groupId,
          authorId: req.user.id,
          authorName: req.user.username,
          category: 'CONTENT',
          message: `${req.user.username} ${actionVerb} "${item.name}" in ${parentList.name}`,
          metadata: { listId: parentList._id }
        });
      } catch (logError) {
        console.error("Activity logging failed, but item was checked:", logError);
      }
    }

    res.status(200).json(item.isPinned);

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

// Assign an item to another user
export const assignItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const userId = req.user.id;

    // Find Item & Parent
    const item = await ShoppingListItem.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const parentList = await ShoppingList.findById(item.listId)
      .select('authorId groupId name')
      .lean();

    if (!parentList) return res.status(404).json({ message: 'Parent list not found' });

    let isAuthorized = false;
    if (item.authorId.toString() === userId) isAuthorized = true;
    else if (parentList.authorId.toString() === userId) isAuthorized = true;
    else if (parentList.groupId) {
      const isMember = await Group.exists({
        _id: parentList.groupId,
        'members.userId': userId
      });
      if (isMember) isAuthorized = true;
    }

    if (!isAuthorized) return res.status(403).json({ message: 'Not authorized' });

    // Make sure that person exists and is a member of the group
    if (assignedTo && parentList.groupId) {
       const assigneeExists = await Group.exists({
         _id: parentList.groupId,
         'members.userId': assignedTo
       });
       if (!assigneeExists) {
         return res.status(400).json({ message: 'Cannot assign item to non-group member' });
       }
    }
    if ( assignedTo === userId) {
      item.claimedBy = userId;
      item.assignedTo = undefined;
    } else {
      item.assignedTo = assignedTo;
      item.claimedBy = undefined;
    }
    await item.save();

    if (parentList.groupId) {
      
      try {
        let actionMessage;
        if ( assignedTo === userId) {
          actionMessage = `${req.user.username} claimed ${item.name}`
        } else {
          actionMessage = assignedTo 
            ? `${req.user.username} assigned ${item.name} to a member`
            : `${req.user.username} unassigned "${item.name}"`;
        }
        await logActivity({
          groupId: parentList.groupId,
          authorId: req.user.id,
          authorName: req.user.username,
          category: 'CONTENT',
          message: actionMessage,
          metadata: { 
            listId: parentList._id,
            assignedTo: assignedTo, 
            action: 'ASSIGN'
          }
        });
        if( assignedTo !== userId) {
          await createNotification({
            recipientId: assignedTo,
            groupId: parentList.groupId,
            category: "ASSIGNMENT",
            message: `Item ${item.name} was assigned to you`,
            metadata: {
              listId: parentList._id,
              itemId: item._id
            }
          })
        }
      } catch (logError) {
        console.error("Activity logging failed:", logError);
      }
    }

    res.status(200).json(item._id);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error assigning item' });
  }
};

// Get all items assigned to the user
export const getAssignedItems = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const filter: any = { assignedTo: userId };
    
    if (req.query.status === 'pending') {
      filter.isChecked = false;
    }

    const tasks = await ShoppingListItem.find(filter)
      .sort({ updatedAt: -1 }) 
      .populate({
        path: 'listId',
        select: 'name groupId',
        populate: {
          path: 'groupId',
          select: 'name' 
        }
      })
      .lean();
    const cleanTasks = tasks.filter(task => task.listId !== null);

    res.status(200).json(cleanTasks);

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: 'Could not fetch assigned tasks' });
  }
};