import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary.
 * @param {string} localFilePath - Path of the local file.
 * @returns {Promise<object|null>} - Cloudinary response object or null if failed.
 */
export const uploadOnCloudinary = (localFilePath) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        fs.unlinkSync(localFilePath); // clean up temp file
        if (error) return reject(error);
        resolve(result);
      }
    );
    fs.createReadStream(localFilePath).pipe(stream);
  });
};

/**
 * Delete a file from Cloudinary using public_id.
 * @param {string} public_id - Cloudinary public_id.
 * @returns {Promise<object|null>} - Cloudinary delete response or null.
 */
export const deleteOnCloudinary = async (public_id) => {
  if (!public_id) return null;

  try {
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: "raw",
    });
    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};
