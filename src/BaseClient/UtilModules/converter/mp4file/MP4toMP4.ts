import { randomUUID } from 'crypto';
import MP4FileConverter from '../base/MP4FileConverter.js';
import { uploadBufferToSSH } from '../../sshUpload.js';
import type { MP4ConversionOptions } from '../MP4.js';

export default class MP4toMP4 extends MP4FileConverter {
 private options: MP4ConversionOptions;

 constructor(url: string, options?: MP4ConversionOptions) {
  super(url);
  this.options = options || {};
 }

 async convert(): Promise<string> {
  const progress = this.options.onProgress;
  
  if (progress) await progress('Downloading MP4 file...');
  const buffer = await this.fetchMP4Buffer();
  const fileName = `${randomUUID()}.mp4`;

  if (progress) await progress('Uploading to CDN...');
  // Upload to SSH server and get CDN URL
  const cdnUrl = await uploadBufferToSSH(buffer, fileName);
  
  if (progress) await progress('Upload complete!');
  
  return cdnUrl;
 }
}