import { tmpdir } from 'os';
import { access, constants } from 'fs/promises';

/**
 * Get a writable temporary directory
 * Falls back to /app/temp if /tmp is not writable
 */
export async function getTempDir(): Promise<string> {
 const defaultTmp = tmpdir();
 
 try {
  // Check if default tmp is writable
  await access(defaultTmp, constants.W_OK);
  return defaultTmp;
 } catch {
  // Fall back to app temp directory
  const appTemp = '/app/temp';
  try {
   await access(appTemp, constants.W_OK);
   return appTemp;
  } catch {
   // If neither works, return default and let it fail with a clear error
   return defaultTmp;
  }
 }
}

/**
 * Synchronous version for immediate use
 */
export function getTempDirSync(): string {
 // In Docker, we know /app/temp is available
 if (process.env.NODE_ENV === 'production') {
  return '/app/temp';
 }
 return tmpdir();
}