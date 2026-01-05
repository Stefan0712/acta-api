import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import Invite, { IInvite } from '../models/Invite';
import crypto from 'crypto'; // built-in module for token generation
import { GroupMember, Group as IGroup } from '../models/models';
import ShoppingListItem from '../models/ShoppingListItem';
import ShoppingList from '../models/ShoppingList';
import Poll from '../models/Poll';
import Note from '../models/Note';
import Group from '../models/Group';
import mongoose from 'mongoose';
import { hasRole } from '../utilities/permissions';

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
      isPinned,
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: new Date(),
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
    const group: IGroup | null = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Filter out the current user
    const initialCount = group.members.length;
    group.members = group.members.filter(
      (m) => m.userId.toString() !== req.user.id
    );

    if (group.members.length === initialCount) {
      return res.status(400).json({ message: 'You are not in this group' });
    }

    if (group.members.length === 0) {
      return res.status(400).json({ message: 'You cannot leave since you are the only one left. Delete the group instead' });
    }

    await group.save();
    res.status(200).json({ message: 'You have left the group' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error leaving group' });
  }
};




// Helper function to generate a URL-safe, random token
const generateSecureToken = (length: number = 20): string => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Generates a unique, shareable invite link token for a specific group.
export const generateInviteToken = async (req, res) => {
  const { groupId } = req.params;
  const currentUserId = req.user.id; 
  
  // Configuration
  const expirationHours = 48; 
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000); 
  const maxUses = 1; 
  try {
    // Make sure the user is an owner/member of the group
    const group: IGroup | null = await Group.findById(groupId);

    if (!group) {
      res.status(404).json({ message: 'Group not found.' });
      return;
    }
    const member = group.members.find((m) => m.userId.toString() === req.user.id)

    if (!member) {
      res.status(403).json({ message: 'You are not a member.' });
      return;
    }
    if (!hasRole(member, 'moderator')) {
      return res.status(403).json({ message: 'Only moderators can create invites' });
    }
    
    // Generate token and save to db
    const token = generateSecureToken();
    const newInvite: IInvite = new Invite({
      token,
      groupId,
      createdBy: currentUserId,
      expiresAt,
      maxUses,
      usesCount: 0,
    });

    await newInvite.save();
    
    // Send the token 
    res.status(201).json({ 
      message: 'Invite token successfully generated.',
      token: newInvite.token,
      expiresAt: newInvite.expiresAt,
    });

  } catch (error) {
    console.error('Error generating invite token:', error);
    res.status(500).json({ message: 'Server error during token generation.' });
  }
};

// Validates the invite token and adds the authenticated user to the group.
export const acceptInvite = async (req, res) => {
    const { token } = req.body;
    const joiningUserId = req.user.id; 

    if (!token) {
      res.status(400).json({ message: 'Invite token is required.' });
      return;
    }

    try {
      // Token validation
      const invite = await Invite.findOne({ token });

      if (!invite) {
        res.status(410).json({ message: 'Invite link is expired or invalid.' });
        return;
      }

      // Usage check
      if (invite.maxUses !== -1 && invite.usesCount >= invite.maxUses) {
          // Delete the invite since max uses have been reached
          await Invite.findByIdAndDelete(invite._id);
          res.status(410).json({ message: 'Invite link has reached its maximum usage limit.' });
          return;
      }
      const group: IGroup | null = await Group.findById(invite.groupId);
      if (!group) {
        // Delete the invite if the group no longer exists
        await Invite.findByIdAndDelete(invite._id);
        res.status(404).json({ message: 'The linked group was not found.' });
        return;
      }

      // Create the member object
      const joiningUser = await User.findById(joiningUserId);
      if (!joiningUser) {
        res.status(500).json({ message: 'Could not find joining user details.' });
        return;
      }
      // Check if the user is already a member
      const isAlreadyMember = group.members.some(
        member => member.userId.toString() === joiningUserId.toString()
      );

      if (isAlreadyMember) {
        res.status(200).json({ 
          message: 'You are already a member of this group.',
          group: group 
        });
        return;
      }

      const newMember: GroupMember = {
        userId: joiningUserId.toString(),
        username: joiningUser.username,
        role: 'member',
        joinedAt: new Date()
      };

      group.members.push(newMember);
      await group.save();

      invite.usesCount += 1;
      await invite.save();

      // Delete the invite if the usage is at its maximum
      if (invite.usesCount >= invite.maxUses) {
        await Invite.findByIdAndDelete(invite._id);
      }
      res.status(200).json({
        message: 'Successfully joined the group!',
        group: group
      });

    } catch (error) {
      console.error('Error accepting invite:', error);
      res.status(500).json({ message: 'Server error while processing invite.' });
    }
};


// Looks up invite details for a confirmation screen.
export const lookupInvite = async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string; 

  if (!token) {
    res.status(400).json({ message: 'Invite token is missing from query parameters.' });
    return;
  }
  try {
    // Find the invite
    const invite = await Invite.findOne({ token });

    if (!invite) {
      res.status(404).json({ message: 'Invite link is invalid, expired, or revoked.' });
      return;
    }

    // Find the group and inviter
    const [group, inviter] = await Promise.all([
      Group.findById(invite.groupId).select('name members'), // Only get name and members list
      User.findById(invite.createdBy).select('username') // Only need username
    ]);
    
    if (!group || !inviter) {
      // If either is missing, the link is effectively broken/stale
      res.status(404).json({ message: 'Associated group or inviter details not found.' });
      return;
    }

    // Status and Usage Checks
    const isExpired = invite.expiresAt.getTime() < Date.now();
    const usesExceeded = invite.usesCount >= invite.maxUses;
    
    if (isExpired || usesExceeded) {
      res.status(200).json({ 
        group: { name: group.name, memberCount: group.members.length },
        invitation: { isExpired: true, message: 'This invite has expired or reached maximum uses.' }
      });
      return;
    }

    res.status(200).json({
      group: {
        _id: group._id,
        name: group.name,
        memberCount: group.members.length,
      },
      invitation: {
        groupId: invite.groupId,
        createdBy: inviter.username,
        isExpired: false,
        maxUses: invite.maxUses,
        usesCount: invite.usesCount,
        token: invite.token
      },
      userIsAuthenticated: false 
    });

  } catch (error) {
    console.error('Error looking up invite:', error);
    res.status(500).json({ message: 'Server error during invite lookup.' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  try {
    const groupId = req.params.id;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const member = group.members.find(
      (m) => m.userId.toString() === req.user.id
    );

    if (!hasRole(member, 'owner')) {
      return res.status(403).json({ message: 'Only owners can delete the group' });
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

    const member = group.members.find(
      (m) => m.userId.toString() === req.user.id
    );
    
    if (!hasRole(member, 'owner')) {
      return res.status(403).json({ message: 'Only owners can edit the group' });
    }

    // Update fields
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    );

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating group' });
  }
};
