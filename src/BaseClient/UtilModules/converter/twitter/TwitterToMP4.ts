import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import Converter from '../base/Converter.js';
import { uploadToSSH } from '../../sshUpload.js';

export default class TwitterToMP4 extends Converter {
 private onProgress?: (status: string) => Promise<void>;

 constructor(url: string, onProgress?: (status: string) => Promise<void>) {
  super(url);
  this.onProgress = onProgress;
 }

 async convert(): Promise<string> {
  const progress = this.onProgress;
  
  if (progress) await progress('Downloading Twitter/X video...');
  const response = await fetch(this.url);
  
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
  
  // Generate filename with UUID
  const fileName = `${randomUUID()}.mp4`;
  const tempPath = join(tmpdir(), `temp_${fileName}`);
  
  // Download the video
  const fileStream = createWriteStream(tempPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);
  
  // Log file size before upload
  const stats = await fs.stat(tempPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[Twitter MP4] File: ${fileName} | Size: ${fileSizeMB} MB | URL: ${this.url}`);
  
  if (progress) await progress(`Downloaded: ${fileSizeMB} MB`);
  
  // Upload to SSH server and get CDN URL
  if (progress) await progress('Uploading to CDN...');
  const cdnUrl = await uploadToSSH(tempPath, fileName);
  
  // Clean up temp file
  if (progress) await progress('Cleaning up temporary files...');
  await fs.unlink(tempPath).catch(() => {});
  
  return cdnUrl;
 }

}