import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import GIFConverterBase from '../base/GIFConverterBase.js';
import MP4FileConverter from '../base/MP4FileConverter.js';
import { uploadToSSH } from '../../sshUpload.js';
import type { ConversionOptions } from '../GIF.js';

export default class MP4toGIF extends MP4FileConverter {
 private gifConverter: GIFConverterBase;
 private options: ConversionOptions;

 constructor(url: string, options?: ConversionOptions) {
  super(url);
  this.options = options || {};
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<string> {
  const progress = this.options.onProgress;
  
  if (progress) await progress('Downloading MP4 file...');
  const mp4Path = await this.downloadMP4File();
  
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