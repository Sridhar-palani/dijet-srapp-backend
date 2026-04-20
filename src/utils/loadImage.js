import fs from "fs";
import path from "path";

/**
 * Reads an image file and returns a Base64 string with correct MIME type.
 * @param {string} filePath - Path to the image file (e.g. "public/Images/logo.png")
 * @returns {string} Base64 data URI (e.g. "data:image/png;base64,...")
 */
export default function loadBase64Image(filePath) {
  const absPath = path.resolve(filePath);
  const fileExt = path.extname(filePath).toLowerCase();

  // detect MIME type
  let mimeType = "image/png"; // default
  if (fileExt === ".jpg" || fileExt === ".jpeg") mimeType = "image/jpeg";
  else if (fileExt === ".svg") mimeType = "image/svg+xml";
  else if (fileExt === ".webp") mimeType = "image/webp";

  const base64Data = fs.readFileSync(absPath, "base64");
  return `data:${mimeType};base64,${base64Data}`;
}
