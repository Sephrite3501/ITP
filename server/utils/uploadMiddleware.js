import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['application/pdf', 'pdf']
]);

const PASSPORT_MIN_WIDTH = 350;   // Pixels
const PASSPORT_MIN_HEIGHT = 450;  // Pixels
const PASSPORT_RATIO = 7 / 9;      
const PASSPORT_RATIO_TOLERANCE = 0.03; // +/-3%

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
    const uploadedFile = files[field][0];
    let toSaveBuffer = uploadedFile.buffer; // By default, use raw buffer

    if (uploadedFile.size > MAX_FILE_SIZE) {
      throw new Error(`${field} exceeds max size of 5MB`);
    }

    const fileType = await fileTypeFromBuffer(uploadedFile.buffer);
    if (!fileType || !ALLOWED_TYPES.has(fileType.mime)) {
      throw new Error(`${field} must be JPG, PNG, or PDF`);
    }

    // Passport photo special validation and resizing
    if (field === 'profilePicture') {
      if (!['image/jpeg', 'image/png'].includes(fileType.mime)) {
        throw new Error('Passport photo must be JPG or PNG');
      }
      const { width, height } = await sharp(uploadedFile.buffer).metadata();
      if (!width || !height) {
        throw new Error('Unable to determine passport photo size.');
      }
      const ratio = width / height;
      if (
        width < PASSPORT_MIN_WIDTH ||
        height < PASSPORT_MIN_HEIGHT ||
        Math.abs(ratio - PASSPORT_RATIO) > PASSPORT_RATIO_TOLERANCE
      ) {
        throw new Error(
          `Passport photo must be at least ${PASSPORT_MIN_WIDTH}x${PASSPORT_MIN_HEIGHT}px, ` +
          `and have a 7:9 (35mm:45mm) width:height ratio.`
        );
      }
      // Resize the image
      toSaveBuffer = await sharp(uploadedFile.buffer)
        .resize(PASSPORT_MIN_WIDTH, PASSPORT_MIN_HEIGHT, { fit: "cover" })
        .toBuffer();
    }

    const ext = ALLOWED_TYPES.get(fileType.mime);
    const filename = `${safeEmail}_${field}_${Date.now()}.${ext}`;
    const absPath = path.resolve('uploads', filename);

    await fs.writeFile(absPath, toSaveBuffer);
    savedFiles[field] = `/uploads/${filename}`;
  }
  }


  return savedFiles;
}
