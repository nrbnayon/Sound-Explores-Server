import path from "path";

export const getRelativePath = (filePath: string): string => {
  if (!filePath) {
    throw new Error("Path not found.");
  }

  const uploadDir = path.join(process.cwd(), "uploads"); // Root of the uploads folder
  const relativePath = path.relative(uploadDir, filePath); // Get the relative path from 'uploads'

  // Replace backslashes with forward slashes for uniformity and add a leading "/"
  return "/" + relativePath.replace(/\\/g, "/");
};
