import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs/promises';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Set multer storage (in-memory)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

/**
 * Save and validate uploaded files securely
 * @param {*} files - multer files
 * @param {*} email - user identifier
 * @returns { paymentProof, identityProof } public paths
 */
export async function validateAndSaveFiles(files, email) {
  if (!files || Object.keys(files).length === 0) {
    throw new Error('No files uploaded.');
  }

  const allowedFields = ['profilePicture', 'paymentProof', 'identityProof'];
  const savedFiles = {};

  for (const field of allowedFields) {
    if (files[field]?.[0]) {
      const file = files[field][0];

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`${field} exceeds max size of 5MB`);
      }

      const fileType = await fileTypeFromBuffer(file.buffer);
      if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
        throw new Error(`${field} must be JPG, PNG, or PDF`);
      }

      const filename = `${email.replace(/[^a-z0-9]/gi, '_')}_${field}_${Date.now()}.${fileType.ext}`;
      const absPath = path.resolve('uploads', filename); // absolute path to save the file
      await fs.writeFile(absPath, file.buffer);

      savedFiles[field] = `/uploads/${filename}`; // public-facing path
    }
  }

  return savedFiles;
}
