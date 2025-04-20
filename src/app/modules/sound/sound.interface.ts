export interface ISound {
  title: string;
  isPremium: boolean;
  link: string;
  description: string;
  category: soundCategories;
}

export const soundCategories = [
  "Funny",
  "Scary",
  "Relaxing",
  "Futuristic",
  "Celebration",
  "Action",
  "Romantic",
  "Educational",
  "Ambient",
] as const;

export type soundCategories = (typeof soundCategories)[number];
