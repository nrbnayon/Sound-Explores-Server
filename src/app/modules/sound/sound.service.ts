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
  limit?: number,
  showAllSounds?: boolean 
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

  if (!showAllSounds && userdata?.isSubscribed === false) {
    query.isPremium = false;
  }

  if (searchTerm) {
    query.title = { $regex: searchTerm, $options: "i" };
  }

  if (category) {
    query.category = category;
  }

  const pageNumber = page || 1;
  const limitNumber = limit || 1000;
  const skip = (pageNumber - 1) * limitNumber;

  const total = await Sound.countDocuments(query);

  // UPDATED: Sort by isPremium (false first, then true) and then by createdAt
  const result = await Sound.find(query)
    .sort({ isPremium: 1, createdAt: -1 }) // isPremium: 1 puts false before true
    .skip(skip)
    .limit(limitNumber);

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
