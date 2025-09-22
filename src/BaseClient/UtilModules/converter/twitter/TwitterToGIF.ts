import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import GIFConverterBase from '../base/GIFConverterBase.js';
import Converter from '../base/Converter.js';
import { uploadToSSH } from '../../sshUpload.js';
import { compressGifWithILoveImg } from '../../iloveimgCompress.js';
import { getTempDirSync } from '../../getTempDir.js';

export default class TwitterToGIF extends Converter {
 private gifConverter: GIFConverterBase;
 private onProgress?: (status: string) => Promise<void>;

 constructor(url: string, onProgress?: (status: string) => Promise<void>) {
  super(url);
  this.gifConverter = new (class extends GIFConverterBase {})();
  this.onProgress = onProgress;
 }

 async convert(): Promise<string> {
  const progress = this.onProgress;
  
  // First download the MP4
  if (progress) await progress('Downloading Twitter/X video...');
  const mp4Path = await this.downloadTwitterVideo();
  
  // Convert to GIF with adaptive resolution
  if (progress) await progress('Converting video to GIF...');
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path, undefined, progress);
  
  // Compress the GIF with ILoveImg API if credentials are available
  const tempDir = getTempDirSync();
  const compressedGifPath = join(tempDir, `compressed_${randomUUID()}.gif`);
  const finalGifPath = await compressGifWithILoveImg(tempGifPath, compressedGifPath, progress);
  
  // Generate filename with UUID
  const fileName = `${randomUUID()}.gif`;
  
  // Upload to SSH server and get CDN URL
  if (progress) await progress('Uploading to CDN...');
  const cdnUrl = await uploadToSSH(finalGifPath, fileName);
  
  // Cleanup
  if (progress) await progress('Cleaning up temporary files...');
  await this.cleanup(mp4Path, tempGifPath, finalGifPath === compressedGifPath ? compressedGifPath : undefined);
  
  return cdnUrl;
 }

 private async downloadTwitterVideo(): Promise<string> {
  const response = await fetch(this.url);
  
  if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
  
  const tempPath = join(tmpdir(), `twitter_${Date.now()}.mp4`);
  
  const fileStream = createWriteStream(tempPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);
  
  return tempPath;
 }


 private async cleanup(mp4Path: string, gifPath: string, compressedPath?: string): Promise<void> {
  const filesToDelete = [mp4Path, gifPath];
  if (compressedPath) filesToDelete.push(compressedPath);
  await Promise.all(filesToDelete.map(file => fs.unlink(file).catch(() => {})));
 }
}