import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
    token: string;
    groupId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    expiresAt: Date;
    maxUses: number;
    usesCount: number;
}

const InviteSchema = new Schema<IInvite>({
    token: { 
        type: String, 
        required: true, 
        unique: true,
        index: true, 
    },
    groupId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Group', 
        required: true 
    },
    createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    expiresAt: { 
        type: Date, 
        required: true, 
        expires: 0 
    }, 
    maxUses: { 
        type: Number, 
        default: 1 
    },
    usesCount: { 
        type: Number, 
        default: 0 
    },
}, { timestamps: true });

const Invite = mongoose.model<IInvite>('Invite', InviteSchema);
export default Invite;