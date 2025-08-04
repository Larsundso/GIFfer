import type { AttachmentPayload } from 'discord.js';
import MP4FileConverter from '../base/MP4FileConverter.js';

export default class MP4toMP4 extends MP4FileConverter {
 constructor(url: string) {
  super(url);
 }

 async convert(): Promise<AttachmentPayload> {
  const buffer = await this.fetchMP4Buffer();
  const fileName = this.extractMP4FileName() || 'video.mp4';

  return {
   name: fileName,
   attachment: buffer,
  };
 }
}