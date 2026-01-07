import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Group as IGroup } from '../models/models';
import ShoppingListItem from '../models/ShoppingListItem';
import ShoppingList from '../models/ShoppingList';
import Poll from '../models/Poll';
import Note from '../models/Note';
import Group from '../models/Group';
import mongoose from 'mongoose';
import { checkPermission, GroupAction, ROLE_HIERARCHY } from '../utilities/permissions';

// Create a new group
export const createGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, icon, color, isPinned } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const newGroup: IGroup = await Group.create({
      name,
      description,
      authorId: userId,
      icon,
      color,
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: new Date(),
          isPinned: true,
          notificationPreferences: {
            ASSIGNMENT: false,
            MENTION: false,
            GROUP: true,
            REMINDER: true,
            POLL: true,
          }
        }
      ]
    });

    res.status(201).json(newGroup);

  } catch (error) {
    console.error('Create Group Error:', error);
    res.status(500).json({ message: 'Server error creating group' });
  }
};

// Get all groups that the user is a member of
export const getMyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await Group.find({
      'members.userId': req.user.id
    }).lean();
    const groupIds = groups.map(group => group._id);
    const listCounts = await ShoppingList.aggregate([
      { $match: { groupId: { $in: groupIds } }},
      { $group: { _id: '$groupId', listCount: { $sum: 1 }}}
    ]);
    const noteCounts = await Note.aggregate([
        { $match: { groupId: { $in: groupIds } } },
        { $group: { _id: '$groupId', noteCount: { $sum: 1 } } }
    ]);
    const pollCounts = await Poll.aggregate([
        { $match: { groupId: { $in: groupIds } } },
        { $group: { _id: '$groupId', pollCount: { $sum: 1 } } }
    ]);
    const listsMap = new Map(listCounts.map(item => [item._id.toString(), item.listCount]));
    const notesMap = new Map(noteCounts.map(item => [item._id.toString(), item.noteCount]));
    const pollsMap = new Map(pollCounts.map(item => [item._id.toString(), item.pollCount]));

    const finalGroups = groups.map(group => {
      const id = group._id.toString();

      return {
        ...group,
        listCount: listsMap.get(id) || 0,
        noteCount: notesMap.get(id) || 0,
        pollCount: pollsMap.get(id) || 0,
        memberCount: group.members.length
      };
    });
    res.status(200).json(finalGroups);
  } catch (error) {
    console.error('Get Groups Error:', error);
    res.status(500).json({ message: 'Server error fetching groups' });
  }
};

interface IPopulatedMember {
  role: "owner" | "moderator" | "member";
  userId: {
    _id: string;
    username: string;
  } 
}

// Get a specific group
export const getGroupById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [listCount, noteCount, pollCount] = await Promise.all([
      ShoppingList.countDocuments({ groupId: id }),
      Note.countDocuments({ groupId: id }),
      Poll.countDocuments({ groupId: id })
    ]);

    const populatedGroup = await Group.findById(id).populate('members.userId', 'username').lean(); 

    if (!populatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    const isMember = (populatedGroup.members as unknown as IPopulatedMember[]).some((m) => m.userId._id.toString() === req.user.id);

    // Allow user to see the group only if it is a member
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this group' });
    }

    // Return group data with the formatted members array
    const finalGroup = {
      ...populatedGroup,
      listCount,
      noteCount,
      pollCount,
      members: (populatedGroup.members as unknown as IPopulatedMember[]).map(member => ({
        userId: member.userId._id, 
        username: member.userId.username, 
        role: member.role 
      }))
    };
    res.status(200).json(finalGroup);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Find the user trying to leave
    const memberIndex = group.members.findIndex(m => m.userId.toString() === req.user.id);
    
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'You are not in this group' });
    }

    const member = group.members[memberIndex];

    // Owner cannot leave if others exist
    if (member.role === 'owner' && group.members.length > 1) {
      return res.status(403).json({ 
        message: 'Owners cannot leave the group. You must transfer ownership to another member first, or delete the group.' 
      });
    }

    // If they are the LAST person, tell them to delete instead
    if (group.members.length === 1) {
       return res.status(400).json({ 
         message: 'You are the last member. Please delete the group instead of leaving.' 
       });
    }

    // Remove the member
    group.members.splice(memberIndex, 1);

    await group.save();
    res.status(200).json({ message: 'You have left the group' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error leaving group' });
  }
};

export const kickUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetUserId } = req.body;
    
    // Check if the user has the right permissions
    const group = await Group.findById(id);

    // Check if the group exists
    if (!group) return res.status(404).json({ message: 'Group not found' });

    //Check the role
    if (!checkPermission(group, req.user.id, GroupAction.MANAGE_MEMBERS)) {
      return res.status(404).json({ message: "You are not authorized to kick members" })
    }
    
    const targetMember = group.members.find(m => m.userId.toString() === targetUserId);
    if (!targetMember) return res.status(404).json({ message: "User not in group" });

    if (targetMember.role === 'owner') {
      return res.status(403).json({ message: "You cannot kick the group owner." });
    }

    group.members = group.members.filter(user=>user.userId.toString() !== targetUserId);

    await group.save();
    res.status(200).json({ message: 'You have kicked a user!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error leaving group' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!checkPermission(group, req.user.id, GroupAction.DELETE_GROUP)) {
      return res.status(403).json({ message: 'You do not have the right permissions to delete this group' });
    }
        
    const listsToDelete = await ShoppingList.find({ groupId: group._id.toString() }).select('_id');
    
    const listIds = listsToDelete.map(list => list._id.toString());
    
    // Permanently delete all lists associated with this group
    const listDeletionResult = await ShoppingList.deleteMany({ groupId: group._id.toString() });
        
    let itemDeletionResult = { deletedCount: 0 };
    
    if (listIds.length > 0) {
      itemDeletionResult = await ShoppingListItem.deleteMany({
        listId: { $in: listIds }
      });
    }

    await Poll.deleteMany({ groupId: group._id.toString() });
    await Note.deleteMany({ groupId: group._id.toString() });

    const groupDeletionResult = await Group.deleteOne({ _id: group._id.toString() });
    
    if (groupDeletionResult.deletedCount === 0) {
      return res.status(404).json({ message: 'Group not deleted (already missing).' });
    }

    res.status(200).json({
      message: 'Group, lists, and items permanently deleted.',
      groupDeleted: groupDeletionResult.deletedCount,
      listsDeleted: listDeletionResult.deletedCount,
      itemsDeleted: itemDeletionResult.deletedCount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting list' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!checkPermission(group, req.user.id, GroupAction.UPDATE_SETTINGS)) {
      return res.status(403).json({ message: 'You do not have the right permissions to update this group' });
    }

    const { name, icon, description } = req.body;

    if (name) group.name = name;
    if (icon) group.icon = icon;
    if (description) group.description = description;

    const updatedGroup = await group.save();
     

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating group' });
  }
};


export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const { targetUserId, newRole } = req.body;
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!checkPermission(group, req.user.id, GroupAction.MANAGE_MEMBERS)) {
      return res.status(403).json({ message: 'Not authorized to change roles' });
    }

    const validRoles = ['member', 'moderator', 'admin']; 
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
     // Get both members
    const requestor = group.members.find(m => m.userId.toString() === req.user.id);
    const target = group.members.find(m => m.userId.toString() === targetUserId);

    if (!requestor || !target) return res.status(404).json({ message: 'User not found' });

    const requestorRank = ROLE_HIERARCHY[requestor.role];
    const targetRank = ROLE_HIERARCHY[target.role];
    const newRoleRank = ROLE_HIERARCHY[newRole];

    // Check if they have the same role
    if (requestorRank <= targetRank) {
      return res.status(403).json({ message: 'You cannot manage a member with equal or higher rank.' });
    }

    // Check if the user changing the role is higher in rank
    if (requestorRank < newRoleRank) {
      return res.status(403).json({ message: 'You cannot promote a member above your own rank.' });
    }

    target.role = newRole;
    await group.save();

    res.status(200).json({ message: "Role updated", updatedMember: target });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating role' });
  }
};
