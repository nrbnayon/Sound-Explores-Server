/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { ISound } from "./sound.interface";
import Sound from "./sound.model";

export const addSound = async (data: ISound) => {
  const sound = new Sound(data);
  return await sound.save();
};
export const getAllSound = async () => {
  const result = await Sound.find();
  return result;
};

export const SoundService = { addSound, getAllSound };
