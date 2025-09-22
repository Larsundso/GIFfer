import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import GIFConverterBase from '../base/GIFConverterBase.js';
import MP4FileConverter from '../base/MP4FileConverter.js';
import { uploadToSSH } from '../../sshUpload.js';
import { compressGifWithILoveImgUrl } from '../../iloveimgCompress.js';
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

  // Compress the GIF with ILoveImg API and get the download URL
  if (progress) await progress('Compressing and uploading GIF...');
  const iloveimgUrl = await compressGifWithILoveImgUrl(tempGifPath, progress);
  
  let cdnUrl: string;
  if (iloveimgUrl) {
    // Use ILoveIMG URL directly (no need for SSH upload)
    cdnUrl = iloveimgUrl;
    console.log(`[MP4toGIF] Using ILoveIMG URL: ${cdnUrl}`);
  } else {
    // Fallback to SSH upload if ILoveIMG compression failed or not configured
    const fileName = this.options.filename || `${randomUUID()}.gif`;
    if (progress) await progress('Uploading to CDN...');
    cdnUrl = await uploadToSSH(tempGifPath, fileName);
    console.log(`[MP4toGIF] Using SSH upload fallback: ${cdnUrl}`);
  }
  
  if (progress) await progress('Cleaning up temporary files...');
  await this.cleanup(mp4Path, tempGifPath);

  return cdnUrl;
 }

 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  const filesToDelete = [mp4Path, gifPath];
  await Promise.all(filesToDelete.map(file => fs.unlink(file).catch(() => {})));
 }
}