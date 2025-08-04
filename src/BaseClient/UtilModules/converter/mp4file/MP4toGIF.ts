import type { AttachmentPayload } from 'discord.js';
import { promises as fs } from 'fs';
import GIFConverterBase from '../base/GIFConverterBase.js';
import MP4FileConverter from '../base/MP4FileConverter.js';
import { uploadToSSH } from '../../sshUpload.js';

export default class MP4toGIF extends MP4FileConverter {
 private gifConverter: GIFConverterBase;

 constructor(url: string) {
  super(url);
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<string> {
  const mp4Path = await this.downloadMP4File();
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path);

  const videoName = this.extractMP4FileName();
  const fileName = videoName ? videoName.replace(/\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)$/i, '.gif') : `output_${Date.now()}.gif`;
  
  // Upload to SSH server and get CDN URL
  const cdnUrl = await uploadToSSH(tempGifPath, fileName);
  
  await this.cleanup(mp4Path, tempGifPath);

  return cdnUrl;
 }

 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  await Promise.all([fs.unlink(mp4Path).catch(() => {}), fs.unlink(gifPath).catch(() => {})]);
 }
}