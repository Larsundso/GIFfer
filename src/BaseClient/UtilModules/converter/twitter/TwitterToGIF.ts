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
import { compressGifWithILoveImgUrl } from '../../iloveimgCompress.js';

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
  
  // Compress the GIF with ILoveImg API and get the download URL
  if (progress) await progress('Compressing and uploading GIF...');
  const iloveimgUrl = await compressGifWithILoveImgUrl(tempGifPath, progress);
  
  let cdnUrl: string;
  if (iloveimgUrl) {
    // Use ILoveIMG URL directly (no need for SSH upload)
    cdnUrl = iloveimgUrl;
    console.log(`[TwitterToGIF] Using ILoveIMG URL: ${cdnUrl}`);
  } else {
    // Fallback to SSH upload if ILoveIMG compression failed or not configured
    const fileName = `${randomUUID()}.gif`;
    if (progress) await progress('Uploading to CDN...');
    cdnUrl = await uploadToSSH(tempGifPath, fileName);
    console.log(`[TwitterToGIF] Using SSH upload fallback: ${cdnUrl}`);
  }
  
  // Cleanup
  if (progress) await progress('Cleaning up temporary files...');
  await this.cleanup(mp4Path, tempGifPath);
  
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


 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  const filesToDelete = [mp4Path, gifPath];
  await Promise.all(filesToDelete.map(file => fs.unlink(file).catch(() => {})));
 }
}