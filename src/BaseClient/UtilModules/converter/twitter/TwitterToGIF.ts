import type { AttachmentPayload } from 'discord.js';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import GIFConverterBase from '../base/GIFConverterBase.js';
import Converter from '../base/Converter.js';

export default class TwitterToGIF extends Converter {
 private gifConverter: GIFConverterBase;

 constructor(url: string) {
  super(url);
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<AttachmentPayload> {
  // First download the MP4
  const mp4Path = await this.downloadTwitterVideo();
  
  // Convert to GIF with adaptive resolution
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path);
  
  // Generate filename
  const fileName = this.extractFileName();
  
  const gifBuffer = await fs.readFile(tempGifPath);
  
  // Cleanup
  await this.cleanup(mp4Path, tempGifPath);
  
  return {
   name: fileName,
   attachment: gifBuffer,
  };
 }

 private async downloadTwitterVideo(): Promise<string> {
  const response = await fetch(this.url);
  
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
  
  const tempPath = join(tmpdir(), `twitter_${Date.now()}.mp4`);
  
  const fileStream = createWriteStream(tempPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);
  
  return tempPath;
 }

 private extractFileName(): string {
  // Try to extract video ID from the URL
  const match = this.url.match(/\/([^\/]+)\.mp4$/);
  if (match) return `twitter_${match[1]}.gif`;
  
  // Try to extract from amplify_video pattern
  const amplifyMatch = this.url.match(/amplify_video\/(\d+)/);
  if (amplifyMatch) return `twitter_${amplifyMatch[1]}.gif`;
  
  // Generate based on timestamp
  return `twitter_video_${Date.now()}.gif`;
 }

 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  await Promise.all([
   fs.unlink(mp4Path).catch(() => {}),
   fs.unlink(gifPath).catch(() => {})
  ]);
 }
}