import type { AttachmentPayload } from 'discord.js';
import { promises as fs } from 'fs';
import GIFConverterBase from '../base/GIFConverterBase.js';
import YTConverter from '../base/YTConverter.js';

export default class YTtoGIF extends YTConverter {
 private gifConverter: GIFConverterBase;

 constructor(url: string) {
  super(url);
  this.gifConverter = new (class extends GIFConverterBase {})();
 }

 async convert(): Promise<AttachmentPayload> {
  const mp4Path = await this.downloadYouTubeVideo();
  const tempGifPath = await this.gifConverter.convertWithAdaptiveResolution(mp4Path);

  const videoId = this.getYouTubeVideoId();
  const fileName = videoId ? `${videoId}.gif` : 'output.gif';
  
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