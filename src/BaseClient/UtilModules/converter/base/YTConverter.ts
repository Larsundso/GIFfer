import type { AttachmentPayload } from 'discord.js';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import ytdl from '@distube/ytdl-core';
import Converter from './Converter.js';

export default abstract class YTConverter extends Converter {
 protected videoInfo: ytdl.videoInfo | null = null;

 constructor(url: string) {
  super(url);
 }

 protected async downloadYouTubeVideo(): Promise<string> {
  this.videoInfo = await ytdl.getInfo(this.url);
  const format = ytdl.chooseFormat(this.videoInfo.formats, {
   quality: 'highest',
   filter: 'videoandaudio',
  });

  if (!format) throw new Error('No suitable video format found');

  const fileName = `${this.videoInfo.videoDetails.videoId}.mp4`;
  const tempPath = join(tmpdir(), fileName);

  const stream = ytdl(this.url, { format });
  const writeStream = createWriteStream(tempPath);

  await pipeline(stream, writeStream);

  return tempPath;
 }

 protected getYouTubeVideoId(): string | null {
  const match = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
 }

 abstract convert(): Promise<AttachmentPayload>;
}