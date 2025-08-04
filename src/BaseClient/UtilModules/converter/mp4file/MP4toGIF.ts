import type { AttachmentPayload } from 'discord.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
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

  const mp4Name = this.extractMP4FileName();
  const fileName = mp4Name ? mp4Name.replace('.mp4', '.gif') : 'output.gif';
  
  // Save to output directory
  const outputDir = resolve(process.cwd(), 'output');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = join(outputDir, fileName);
  
  // Copy gif to output directory
  await fs.copyFile(tempGifPath, outputPath);
  
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