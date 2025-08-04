import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import Converter from '../base/Converter.js';
import { uploadToSSH } from '../../sshUpload.js';

export default class TwitterToMP4 extends Converter {
 constructor(url: string) {
  super(url);
 }

 async convert(): Promise<string> {
  const response = await fetch(this.url);
  
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
  
  // Extract filename from URL or use default
  const fileName = this.extractFileName() || 'twitter_video.mp4';
  const tempPath = join(tmpdir(), fileName);
  
  // Download the video
  const fileStream = createWriteStream(tempPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);
  
  // Log file size before upload
  const stats = await fs.stat(tempPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[Twitter MP4] File: ${fileName} | Size: ${fileSizeMB} MB | URL: ${this.url}`);
  
  // Upload to SSH server and get CDN URL
  const cdnUrl = await uploadToSSH(tempPath, fileName);
  
  // Clean up temp file
  await fs.unlink(tempPath).catch(() => {});
  
  return cdnUrl;
 }

 private extractFileName(): string | null {
  // Try to extract video ID from the URL
  const match = this.url.match(/\/([^\/]+)\.mp4$/);
  if (match) return `twitter_${match[1]}.mp4`;
  
  // Try to extract from amplify_video pattern
  const amplifyMatch = this.url.match(/amplify_video\/(\d+)/);
  if (amplifyMatch) return `twitter_${amplifyMatch[1]}.mp4`;
  
  // Generate based on timestamp
  return `twitter_video_${Date.now()}.mp4`;
 }
}