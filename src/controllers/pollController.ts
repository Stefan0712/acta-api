import { Request, Response } from 'express';
import Poll from '../models/Poll';
import Group from '../models/Group';
import { AuthRequest } from '../middleware/authMiddleware';
import { notifyGroup } from 'src/utilities/notificationHelpers';

const isMember = async (groupId: string, userId: string) => {
    const group = await Group.findOne({ _id: groupId, 'members.userId': userId });
    return !!group;
};

export const createPoll = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, title, description, options, allowCustomOptions, expiresAt } = req.body;

    if (!options || options.length < 2) {
      return res.status(400).json({ message: "Poll must have at least 2 options" });
    }

    const newPoll = await Poll.create({
      groupId,
      authorId: req.user.id,
      authorUsername: req.user.username,
      title,
      description,
      options: options.map((text: string) => ({ text, votes: [] })),
      allowCustomOptions,
      expiresAt,
    });
    notifyGroup({
      groupId: groupId,
      authorId: req.user.id,
      category: 'POLL',
      message: `${req.user.name} created a new poll: "${title}"`,
      metadata: { 
        pollId: newPoll._id 
      }
    });

    res.status(201).json(newPoll);
  } catch (error) {
    res.status(500).json({ message: "Error creating poll", error });
  }
};

export const updatePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, expiresAt, allowCustomOptions, options } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this poll" });
    }

    // Update metadata fields
    if (title) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (expiresAt) poll.expiresAt = new Date(expiresAt);
    if (allowCustomOptions !== undefined) poll.allowCustomOptions = allowCustomOptions;
    if (options) poll.options = options;

    // Save the changes
    const updatedPoll = await poll.save();
    
    res.json(updatedPoll);
  } catch (error) {
    res.status(500).json({ message: "Update failed", error });
  }
};

// End poll
export const endPoll = async (req: AuthRequest, res: Response) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this poll" });
    }

    poll.isClosed = true;

    // Save the changes
    const updatedPoll = await poll.save();
    res.json(updatedPoll);
  } catch (error) {
    res.status(500).json({ message: "Failed to end poll", error });
  }
};
export const getGroupPolls = async (req: AuthRequest, res: Response) => {
  try {
    const polls = await Poll.find({ groupId: req.params.groupId }).sort({ createdAt: -1 }).lean();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: "Error fetching polls" });
  }
};

export const getPollById = async (req: AuthRequest, res: Response) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();
    if (!poll) return res.status(404).json({ message: "Poll not found" });
    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: "Error fetching poll" });
  }
};

export const votePoll = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId, optionId } = req.body;
    const userId = req.user.id;

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.isClosed || (poll.expiresAt && new Date(poll.expiresAt) < new Date())) {
      return res.status(400).json({ message: "Poll is closed" });
    }

    await Poll.updateOne(
      { _id: pollId },
      { $pull: { "options.$[].votes": userId } }
    );

    const updatedPoll = await Poll.findOneAndUpdate(
      { _id: pollId, "options._id": optionId },
      { $addToSet: { "options.$.votes": userId } },
      { new: true }
    );

    res.json(updatedPoll);
  } catch (error) {
    res.status(500).json({ message: "Voting failed" });
  }
};

export const addPollOption = async (req: AuthRequest, res: Response) => {
  try {
    const { pollId, text } = req.body;
    const poll = await Poll.findById(pollId);

    if (!poll) return res.status(404).json({ message: "Poll not found" });
    if (!poll.allowCustomOptions && poll.authorId.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    poll.options.push({ text, votes: [] });
    const savedPoll = await poll.save();
    const newOption = savedPoll.options[savedPoll.options.length - 1];
    
    res.status(201).json(newOption);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

export const deletePoll = async (req: AuthRequest, res: Response) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.authorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await poll.deleteOne();
    res.json({ message: "Poll deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};