import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const getResourceType = (file) => {
  if (file.mimetype.startsWith("image/")) return "image";
  if (file.mimetype === "application/pdf") return "raw";
  throw new Error("Unsupported file type");
};

export const uploadToCloudinary = (file, folder = "products") => {
  return new Promise((resolve, reject) => {
    const resourceType = getResourceType(file);
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const updateCloudinary = (file, publicId, folder = "products") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, folder, resource_type: "auto", overwrite: true },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};
