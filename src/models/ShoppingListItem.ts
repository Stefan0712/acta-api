import mongoose, { Schema, Document } from 'mongoose';

export interface IShoppingListItem extends Document {
  listId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  
  qty: number;
  unit: string;
  isChecked: boolean;
  
  productId?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  claimedBy?: mongoose.Types.ObjectId;
  
  category?: {
    _id: string;
    name: string;
    color: string;
  };
  store?: {
    _id: string;
    name: string;
    color?: string;
  };
  
  tags: string[];
  priority: 'low' | 'normal' | 'high';
  isPinned: boolean;
  isDeleted: boolean;
  
  deadline?: Date;
  reminder: number;
  isReminderSent: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingListItemSchema: Schema = new Schema(
  {
    listId: { type: Schema.Types.ObjectId, ref: 'ShoppingList', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    
    qty: { type: Number},
    unit: { type: String},
    isChecked: { type: Boolean, default: false },
    
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    claimedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    category: {
      _id: { type: String }, 
      name: { type: String },
      color: { type: String }
    },
    store: {
      _id: { type: String },
      name: { type: String },
      color: { type: String }
    },
    
    tags: [{ type: String }],
    priority: { 
      type: String, 
      enum: ['low', 'normal', 'high'], 
      default: 'normal' 
    },
    
    isPinned: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    
    deadline: { type: Date, default: null },
    reminder: { type: Number, default: 0 },
    isReminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ShoppingListItemSchema.index({ listId: 1 });
ShoppingListItemSchema.index({ assignedTo: 1 });
ShoppingListItemSchema.index({ deadline: 1 });

export default mongoose.model<IShoppingListItem>('ShoppingListItem', ShoppingListItemSchema);