import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import Converter from './Converter.js';

export default abstract class MP4FileConverter extends Converter {
 constructor(url: string) {
  super(url);
 }

 protected async downloadMP4File(): Promise<string> {
  const response = await fetch(this.url);

  if (!response.ok) throw new Error(`Failed to fetch MP4: ${response.statusText}`);

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('video/') && !contentType?.includes('application/octet-stream')) {
   throw new Error('URL does not point to a video file');
  }

  const fileName = this.extractMP4FileName() || 'video.mp4';
  const tempPath = join(tmpdir(), fileName);

  const fileStream = createWriteStream(tempPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);

  // Log file size
  const { promises: fs } = await import('fs');
  const stats = await fs.stat(tempPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[MP4 Download] File: ${fileName} | Size: ${fileSizeMB} MB | URL: ${this.url}`);

  return tempPath;
 }

 protected async fetchMP4Buffer(): Promise<Buffer> {
  const response = await fetch(this.url);

  if (!response.ok) throw new Error(`Failed to fetch MP4: ${response.statusText}`);

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('video/') && !contentType?.includes('application/octet-stream')) {
   throw new Error('URL does not point to a video file');
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileSizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
  const fileName = this.extractMP4FileName() || 'video';
  console.log(`[MP4 Buffer] File: ${fileName} | Size: ${fileSizeMB} MB | URL: ${this.url}`);
  
  return buffer;
 }

 protected extractMP4FileName(): string | null {
  const urlParts = this.url.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  const fileName = lastPart.split('?')[0];

  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
  const hasVideoExtension = videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  return hasVideoExtension ? fileName : null;
 }

 abstract convert(): Promise<string>;
}