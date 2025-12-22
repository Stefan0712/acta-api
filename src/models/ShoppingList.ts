import mongoose, { Schema } from 'mongoose';
import { ShoppingList } from './models';

const ShoppingListSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      default: '' 
    },
    authorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    groupId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Group', 
      default: null 
    },
        color: { 
      type: String, 
      default: '#4D96FF'
    },
    isPinned: { 
      type: Boolean, 
      default: false 
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
    isDirty: { 
      type: Boolean, 
      default: false 
    },
    icon: {
      type: String,
      default: 'default-icon'
    }
  },
  { 
    timestamps: true 
  }
);

ShoppingListSchema.index({ userId: 1, updatedAt: 1 });
ShoppingListSchema.index({ groupId: 1 });

export default mongoose.model<ShoppingList>('ShoppingList', ShoppingListSchema);