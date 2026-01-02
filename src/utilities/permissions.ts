import { Types } from 'mongoose';
import { GroupMember as IMember } from '../models/models';

export type Role = 'owner' | 'moderator' | 'member';

const ROLE_RANKS: Record<Role, number> = {
  owner: 3,
  moderator: 2,
  member: 1,
};

const getRank = (role: string) => ROLE_RANKS[role as Role] || 0;

// Check if the role is high enough
export const hasRole = (member: IMember | undefined, minRequiredRole: Role): boolean => {
  if (!member) return false;
  return getRank(member.role) >= getRank(minRequiredRole);
};


export const canManageTarget = (actor: IMember, target: IMember): boolean => {
  return getRank(actor.role) > getRank(target.role);
};

// Is this my content OR am I a moderator?/owner?
export const canModifyResource = (
  member: IMember,
  resourceAuthorId: string | Types.ObjectId
): boolean => {
  // Ownership
  if (member.userId.toString() === resourceAuthorId.toString()) return true;

  // Moderation
  return getRank(member.role) >= getRank('moderator');
};