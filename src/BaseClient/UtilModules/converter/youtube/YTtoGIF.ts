import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import GIFConverterBase from '../base/GIFConverterBase.js';
import YTConverter from '../base/YTConverter.js';
import { uploadToSSH } from '../../sshUpload.js';
import type { ConversionOptions } from '../GIF.js';

export default class YTtoGIF extends YTConverter {
 private gifConverter: GIFConverterBase;
 private options: ConversionOptions;

 constructor(url: string, options?: ConversionOptions) {
  super(url);
  this.options = options || {};
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<string> {
  const progress = this.options.onProgress;
  console.log('[YTtoGIF] Progress callback available:', !!progress);
  
  if (progress) {
   console.log('[YTtoGIF] Calling progress: Downloading video from YouTube...');
   await progress('Downloading video from YouTube...');
  }
  // Pass skipAudio = true for GIF conversion
  const mp4Path = await this.downloadYouTubeVideo(this.options.start, this.options.end, progress, true);
  
  if (progress) await progress('Converting video to GIF...');
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path, this.options.fps, progress);

  const fileName = `${randomUUID()}.gif`;
  
  if (progress) await progress('Uploading to CDN...');
  // Upload to SSH server and get CDN URL
  const cdnUrl = await uploadToSSH(tempGifPath, fileName);
  
  if (progress) await progress('Cleaning up temporary files...');
  await this.cleanup(mp4Path, tempGifPath);

  return cdnUrl;
 }

 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  await Promise.all([fs.unlink(mp4Path).catch(() => {}), fs.unlink(gifPath).catch(() => {})]);
 }
}