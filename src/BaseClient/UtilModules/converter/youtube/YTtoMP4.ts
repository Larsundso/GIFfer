import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import YTConverter from '../base/YTConverter.js';
import { uploadToSSH } from '../../sshUpload.js';
import type { MP4ConversionOptions } from '../MP4.js';

export default class YTtoMP4 extends YTConverter {
 private options: MP4ConversionOptions;

 constructor(url: string, options?: MP4ConversionOptions) {
  super(url);
  this.options = options || {};
 }

 async convert(): Promise<string> {
  const progress = this.options.onProgress;
  
  if (progress) await progress('Downloading video from YouTube...');
  const tempPath = await this.downloadYouTubeVideo(undefined, undefined, progress);
  
  try {
   const fileName = `${randomUUID()}.mp4`;

   if (progress) await progress('Uploading to CDN...');
   // Upload to SSH server and get CDN URL
   const cdnUrl = await uploadToSSH(tempPath, fileName);
   
   if (progress) await progress('Cleaning up temporary files...');
   // Clean up temp file after successful upload
   await fs.unlink(tempPath).catch(() => {});
   
   return cdnUrl;
  } catch (error) {
   // Clean up temp file on error
   await fs.unlink(tempPath).catch(() => {});
   throw error;
  }
 }
}