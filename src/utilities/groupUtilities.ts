import Group from "../models/Group";

export async function userIsMember(groupId, userId) {
    try {
        const group = await Group.findById(groupId).select('members').lean();

        if (!group) {
            return false;
        }
        const isMember = group.members.some(
            member => member.userId.toString() === userId.toString()
        );
        return isMember;
    } catch (error) {
        console.error('Error checking group membership:', error);
        return false;
    }
}