import type { AttachmentPayload } from 'discord.js';
import { promises as fs } from 'fs';
import GIFConverterBase from '../base/GIFConverterBase.js';
import MP4FileConverter from '../base/MP4FileConverter.js';

export default class MP4toGIF extends MP4FileConverter {
 private gifConverter: GIFConverterBase;

 constructor(url: string) {
  super(url);
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<AttachmentPayload> {
  const mp4Path = await this.downloadMP4File();
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path);

  const videoName = this.extractMP4FileName();
  const fileName = videoName ? videoName.replace(/\.(mp4|mov|webm|avi|mkv|flv|wmv|m4v)$/i, '.gif') : 'output.gif';
  
  const gifBuffer = await fs.readFile(tempGifPath);
  await this.cleanup(mp4Path, tempGifPath);

  return {
   name: fileName,
   attachment: gifBuffer,
  };
 }

 private async cleanup(mp4Path: string, gifPath: string): Promise<void> {
  await Promise.all([fs.unlink(mp4Path).catch(() => {}), fs.unlink(gifPath).catch(() => {})]);
 }
}