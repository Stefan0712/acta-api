
// Hierarchy 
export const ROLE_HIERARCHY = {
  owner: 4,   
  admin: 3,   
  moderator: 2,
  member: 1  
};

// Actions
export enum GroupAction {
  DELETE_GROUP = 'DELETE_GROUP',       // Owner only (The "Kill Switch")
  UPDATE_SETTINGS = 'UPDATE_SETTINGS', // Owner + Admin (Name, Icon, Description)
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',   // Owner + Admin (Kick, Ban, Invite)
  MODERATE_CONTENT = 'MODERATE_CONTENT', // Owner + Admin + Mod (Delete items/polls)
  MODIFY_OWN_RESOURCE = 'MODIFY_OWN_RESOURCE', 
  CREATE_AND_VIEW = 'CREATE_AND_VIEW',
}

export const checkPermission = (
  group: any,
  userId: string,
  action: GroupAction,
  resourceAuthorId?: string
): boolean => {
  const member = group.members.find((m: any) => m.userId.toString() === userId.toString());
  if (!member) return false;

  const userRole = member.role;
  const userRank = ROLE_HIERARCHY[userRole] || 0;

  // Owners can do ANYTHING
  if (userRole === 'owner') return true;

  switch (action) {
    case GroupAction.DELETE_GROUP:
      return false; // Only owners

    case GroupAction.UPDATE_SETTINGS:
      // Admins and above
      return userRank >= ROLE_HIERARCHY.admin;

    case GroupAction.MANAGE_MEMBERS:
      // Admins and above
      // If you want Mods to kick, change to ROLE_HIERARCHY.moderator
      return userRank >= ROLE_HIERARCHY.admin;

    case GroupAction.MODERATE_CONTENT:
      // Mods and above
      return userRank >= ROLE_HIERARCHY.moderator;

    case GroupAction.MODIFY_OWN_RESOURCE:
      // Mods and above OR the author
      if (userRank >= ROLE_HIERARCHY.moderator) return true;
      if (!resourceAuthorId) return false;
      return resourceAuthorId.toString() === userId.toString();

    case GroupAction.CREATE_AND_VIEW:
      return true;

    default:
      return false;
  }
};