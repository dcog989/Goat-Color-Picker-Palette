import { IMAGE_ANALYSIS } from '../constants';

export function validateImageFile(file: File): void {
  if (!IMAGE_ANALYSIS.ALLOWED_TYPES.includes(file.type as (typeof IMAGE_ANALYSIS.ALLOWED_TYPES)[number])) {
    throw new Error('Unsupported format. Please use JPEG, PNG, WEBP, AVIF, GIF, BMP, or SVG.');
  }
  if (file.size > IMAGE_ANALYSIS.MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const maxMb = IMAGE_ANALYSIS.MAX_FILE_SIZE / (1024 * 1024);
    throw new Error(`Image too large (${sizeMb}MB). Max size is ${maxMb}MB.`);
  }
}
