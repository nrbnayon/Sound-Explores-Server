import User from "../users/user/user.model";
import { ISound } from "./sound.interface";
import Sound from "./sound.model";

export const addSound = async (data: ISound): Promise<ISound> => {
  const sound = new Sound(data);
  return await sound.save();
};

export const getAllSound = async (
  userId: string,
  searchTerm?: string,
  category?: string,
  page?: number,
  limit?: number
): Promise<{
  data: ISound[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const userdata = await User.findById(userId);

  const query: {
    isPremium?: boolean;
    title?: { $regex: string; $options: string };
    category?: string;
  } = {};

  // Free users only see non-premium sounds
  if (userdata?.isSubscribed === false) {
    query.isPremium = false;
  }

  // Add search filter if provided
  if (searchTerm) {
    query.title = { $regex: searchTerm, $options: "i" };
  }

  // Add category filter if provided
  if (category) {
    query.category = category;
  }

  // Set up pagination
  const pageNumber = page || 1;
  const limitNumber = limit || 20;
  const skip = (pageNumber - 1) * limitNumber;

  // Get total count for pagination info
  const total = await Sound.countDocuments(query);

  // Execute query with pagination
  const result = await Sound.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNumber);

  // Return with pagination metadata
  return {
    data: result,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

export const deleteSound = async (soundId: string): Promise<ISound> => {
  const result = await Sound.findByIdAndDelete(soundId);
  if (!result) {
    throw new Error("Sound not found");
  }
  return result;
};

export const deleteMultipleSounds = async (soundIds: string[]): Promise<{ acknowledged: boolean; deletedCount: number }> => {
  const result = await Sound.deleteMany({ _id: { $in: soundIds } });
  return result;
};

export const SoundService = {
  addSound,
  getAllSound,
  deleteSound,
  deleteMultipleSounds,
};
