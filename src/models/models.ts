import { Document, Types } from "mongoose";

export interface ShoppingList extends Document {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt?: Date;
    color: string;
    isPinned: boolean;
    isDeleted: boolean;
    groupId?: string;
    isDirty: boolean;
    authorId: string;
    clientId?: string;
    icon: string;
}

export interface Product {
    _id: string;
    name: string;
    createdAt: Date;
    description?: string;
    defaultQty: number; 
    unit: string;
    categoryId: string;
    authorId: string;
    storeIds?: string[];
    tags?: string[];
    isDeleted: boolean;
    isDirty: boolean;
}

export interface ShoppingListItem {
    _id: string;
    createdAt: Date;
    updatedAt?: Date;
    name: string;
    isChecked: boolean;
    qty: number;
    unit: string;
    productId?: string; // Link to an existing product from user's colection
    listId: string; // Parent list
    description: string;
    isPinned: boolean; // Pinned items are shown at the top of the list
    category?: {
        _id: string; // Link to a category used locally
        name: string; // Hard-copy of local category name
        color: string; // Hard-copy of local category color
    };
    store?: {
        _id: string;
        name: string;
        color?: string;
    };
    tags?: string[];
    isDeleted: boolean;
    priority: "low" | "normal" | "high";
    authorId: string;
    assignedTo?: string | null;
    claimedBy?: string | null;
    deadline?: string | null;
    reminder: number;
    isReminderSent: boolean;
    isDirty: boolean;
}

export interface PurchasedItem {
    _id: string;
    authorId: string;
    productId?: string; // Link to an existing product but optinoal in case the product gets deleted
    name: string; 
    unit: string;
    qty: number;
    totalPrice: number;
    storeId: string;
    purchasedAt: Date;
    isDiscounted?: boolean;
    isDirty: boolean;
}

export interface Category {
    _id: string;
    name: string;
    color: string;
}

export interface Store {
    _id: string;
    name: string;
    color?: string;
}

export interface User {
    _id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
    isDirty: boolean;
}

export type GroupRole = 'owner' | 'moderator' | 'member' | 'guest';

export interface GroupMember {
    userId: string;
    username: string;
    role: GroupRole;
    joinedAt: Date;
}

export interface Group extends Document {
    name: string;
    description?: string;
    authorId: string;
    members: GroupMember[];
    isDirty: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NoteComment {
    _id: string;
    authorId: string;
    username: string;
    content: string;
    createdAt: string;
    isDirty: boolean;
}

export interface Note {
    _id: string;
    groupdId: string;
    authorId: string;
    title: string;
    content: string;
    createdAt: Date;
    comments: NoteComment[];
    isDirty: boolean;
}

export interface Vote {
    userId: string;
    answer: string;
}
export interface Poll {
    _id: string;
    groupId: string;
    authorId: string;
    question: string;
    createdAt: Date;
    options: {
        _id: string;
        text: string;
        votes: Vote[];
    };
    isDirty: boolean;
}

export type NotificationCategory = 
  | 'ASSIGNMENT'
  | 'MENTION'
  | 'GROUP'
  | 'REMINDER';

export interface Notification {
    _id: string;
    recipientId: string; // The user that will see this
    authorId?: string; // It is optional because most of the times the "system" will send them, not a user
    groupId?: string; // Used only if the notification is from/to a group
    category: NotificationCategory;
    message: string; // The content of the notification
    isRead: boolean; // Keep track if it was read or not
    createdAt: Date; 
    // Metadata is used for helping user navigate when it clicks/taps the notification
    metadata?: {
        listId?: string;
        itemId?: string;
        noteId?: string;
        pollId?: string;
    };
}

export type ActivityCategory = 
  | 'GROUP'       // Joins, leaves, settings
  | 'CONTENT'     // Items, notes, polls, lists
  | 'INTERACTION'; // Assignments, claims

export interface ActivityLogData {
    _id: string;
    groupId: string;
    createdAt: Date;
    category: ActivityCategory; // Just for basic filtering if needed
    activityId?: string;
    message: string;            // The text to display
    authorId: string;
    authorName: string; // Denormalized name

    // Metadata for clicking (optional)
    metadata?: {
        listId?: Types.ObjectId;
        itemId?: Types.ObjectId;
        noteId?: Types.ObjectId;
        pollId?: Types.ObjectId;
    };
    isDirty: boolean;
}

export interface InviteLookupResponse {
    group: {
        _id: string;
        name: string;
        memberCount: number;
    };
    invitation: {
        groupId: string;
        createdBy: string;
        isExpired: boolean;
        maxUses: number;
        usesCount: number;
    };
    userIsAuthenticated: boolean;
}