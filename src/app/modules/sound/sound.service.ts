/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import User from "../users/user/user.model";
import { ISound } from "./sound.interface";
import Sound from "./sound.model";

export const addSound = async (data: ISound) => {
  const sound = new Sound(data);
  return await sound.save();
};
export const getAllSound = async (userId: string) => {
  const userdata = await User.findById(userId);

  const query: { isPremium?: boolean } = {};

  if (userdata?.isSubscribed === false) {
    query.isPremium = false;
  }

  const result = await Sound.find(query);
  return result;
};

export const SoundService = { addSound, getAllSound };
