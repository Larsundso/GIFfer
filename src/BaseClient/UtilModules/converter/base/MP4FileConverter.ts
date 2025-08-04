import type { AttachmentPayload } from 'discord.js';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { tmpdir } from 'os';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import Converter from './Converter.js';

export default abstract class MP4FileConverter extends Converter {
 constructor(url: string) {
  super(url);
 }

 protected async downloadMP4File(): Promise<string> {
  const response = await fetch(this.url);

  if (!response.ok) throw new Error(`Failed to fetch MP4: ${response.statusText}`);

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('video/mp4')) throw new Error('URL does not point to an MP4 file');

  const fileName = this.extractMP4FileName() || 'video.mp4';
  const tempPath = join(tmpdir(), fileName);

  const fileStream = createWriteStream(tempPath);
  await pipeline(response.body as NodeJS.ReadableStream, fileStream);

  return tempPath;
 }

 protected async fetchMP4Buffer(): Promise<Buffer> {
  const response = await fetch(this.url);

  if (!response.ok) throw new Error(`Failed to fetch MP4: ${response.statusText}`);

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('video/mp4')) throw new Error('URL does not point to an MP4 file');

  return Buffer.from(await response.arrayBuffer());
 }

 protected extractMP4FileName(): string | null {
  const urlParts = this.url.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  const fileName = lastPart.split('?')[0];

  return fileName.endsWith('.mp4') ? fileName : null;
 }

 abstract convert(): Promise<AttachmentPayload>;
}