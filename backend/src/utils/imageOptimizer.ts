import path from 'path';
import fs from 'fs';

/**
 * Optimizes an uploaded image using sharp (if installed).
 * Resizes to max 900px width, converts to WebP for better compression.
 * If sharp is not installed, returns the original file path (graceful no-op).
 *
 * @param filePath - Absolute path to the uploaded file
 * @returns Absolute path to the optimized file (may be a new .webp file)
 */
export async function optimizeImage(filePath: string): Promise<string> {
  try {
    // Dynamic import — graceful no-op if sharp is not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp');

    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, path.extname(filePath));
    const outputPath = path.join(dir, `${basename}.webp`);

    await sharp(filePath)
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);

    // Remove the original if we created a new WebP file
    if (outputPath !== filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return outputPath;
  } catch {
    // sharp not installed or failed — return original
    return filePath;
  }
}

/**
 * Safely deletes a file from disk. Does nothing if it doesn't exist.
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Non-fatal
  }
}
