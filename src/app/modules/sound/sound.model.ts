import { model, Schema } from "mongoose";
import { ISound, soundCategories } from "./sound.interface";

const SoundSchema = new Schema<ISound>({
  title: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  link: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: soundCategories,
    required: true,
  },
});

// Mongoose Model
const Sound = model<ISound>("Sound", SoundSchema);

export default Sound;
