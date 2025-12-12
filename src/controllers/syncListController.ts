import { ShoppingList as IShoppingList } from '../models/models';
import ShoppingList from '../models/ShoppingList';

export const syncListsController = async (req, res) => {
    const userId = req.user.id; 
    const clientLists: IShoppingList[] = req.body.lists || [];
    const updatedCanonicalLists: IShoppingList[] = [];

    if (!clientLists.length) {
        return res.status(200).json( updatedCanonicalLists );
    }
    try {
        for (const clientList of clientLists) {
            const { _id, clientId, groupId, ...creationFields } = clientList;
        
            // Check for existing Record via client id
            let canonicalList = await ShoppingList.findOne({ clientId: clientId });
            if (canonicalList) {                
                // Update basic fields in case of offline edits, but keep the original ID.
                Object.assign(canonicalList, creationFields);
                canonicalList.isDirty = false;
                await canonicalList.save();
            } else {                
                canonicalList = new ShoppingList({
                    ...creationFields,
                    groupId: groupId,
                    clientId: clientId,
                    authorId: userId,
                    isDirty: false,
                });
                await canonicalList.save();
            }
            
            // Send the clean, canonical list object back to the client for cache update
            updatedCanonicalLists.push(canonicalList.toObject());
        }
        return res.status(200).json(updatedCanonicalLists);
    } catch (error) {
        console.error('Error during list synchronization:', error);
        return res.status(500).json({ message: 'Server error during sync process' });
    }
};