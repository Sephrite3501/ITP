import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs/promises';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['application/pdf', 'pdf']
]);

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export async function validateAndSaveFiles(files, email) {
  if (!files || Object.keys(files).length === 0) {
    throw new Error('No files uploaded.');
  }

  const allowedFields = ['profilePicture', 'paymentProof', 'identityProof'];
  const savedFiles = {};
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);

  for (const field of allowedFields) {
    if (files[field]?.[0]) {
      const file = files[field][0];

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`${field} exceeds max size of 5MB`);
      }

      const fileType = await fileTypeFromBuffer(file.buffer);
      if (!fileType || !ALLOWED_TYPES.has(fileType.mime)) {
        throw new Error(`${field} must be JPG, PNG, or PDF`);
      }

      const ext = ALLOWED_TYPES.get(fileType.mime);
      const filename = `${safeEmail}_${field}_${Date.now()}.${ext}`;
      const absPath = path.resolve('uploads', filename);

      await fs.writeFile(absPath, file.buffer);
      savedFiles[field] = `/uploads/${filename}`;
    }
  }

  return savedFiles;
}
