import type { AttachmentPayload } from 'discord.js';
import { promises as fs } from 'fs';
import YTConverter from '../base/YTConverter.js';

export default class YTtoMP4 extends YTConverter {
 constructor(url: string) {
  super(url);
 }

 async convert(): Promise<AttachmentPayload> {
  const tempPath = await this.downloadYouTubeVideo();
  
  const fileBuffer = await fs.readFile(tempPath);
  await fs.unlink(tempPath);

  const videoId = this.getYouTubeVideoId();
  const fileName = videoId ? `${videoId}.mp4` : 'video.mp4';

  return {
   name: fileName,
   attachment: fileBuffer,
  };
 }
}