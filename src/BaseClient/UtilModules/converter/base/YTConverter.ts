import { createWriteStream, promises as fs } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { getTempDirSync } from '../../getTempDir.js';
import Converter from './Converter.js';

export default abstract class YTConverter extends Converter {
 protected videoInfo: ytdl.videoInfo | null = null;

 constructor(url: string) {
  super(url);
 }

 protected async downloadYouTubeVideo(): Promise<string> {
  this.videoInfo = await ytdl.getInfo(this.url);
  
  // Try to get highest quality video (including 4K/8K)
  const videoFormat = ytdl.chooseFormat(this.videoInfo.formats, {
   quality: 'highestvideo',
   filter: 'video',
  });

  // Get highest quality audio
  const audioFormat = ytdl.chooseFormat(this.videoInfo.formats, {
   quality: 'highestaudio',
   filter: 'audio',
  });

  if (!videoFormat) throw new Error('No suitable video format found');
  
  const videoId = this.videoInfo.videoDetails.videoId;
  const uniqueId = `${videoId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const tempDir = getTempDirSync();
  const tempVideoPath = join(tempDir, `${uniqueId}_video.mp4`);
  const tempAudioPath = join(tempDir, `${uniqueId}_audio.mp4`);
  const finalPath = join(tempDir, `${uniqueId}.mp4`);

  // Download video stream
  const videoStream = ytdl(this.url, { format: videoFormat });
  const videoWriteStream = createWriteStream(tempVideoPath);
  await pipeline(videoStream, videoWriteStream);

  // If we have audio, download and merge
  if (audioFormat) {
   const audioStream = ytdl(this.url, { format: audioFormat });
   const audioWriteStream = createWriteStream(tempAudioPath);
   await pipeline(audioStream, audioWriteStream);

   // Merge video and audio using ffmpeg
   await new Promise<void>((resolve, reject) => {
    ffmpeg()
     .input(tempVideoPath)
     .input(tempAudioPath)
     .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
     .output(finalPath)
     .on('end', () => resolve())
     .on('error', (err) => reject(err))
     .run();
   });

   // Cleanup temp files
   await fs.unlink(tempVideoPath).catch(() => {});
   await fs.unlink(tempAudioPath).catch(() => {});
  } else {
   // No audio available, just use video
   await fs.rename(tempVideoPath, finalPath);
  }

  // Log file size
  const stats = await fs.stat(finalPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`[YT Download] Video: ${videoId} | Size: ${fileSizeMB} MB | Quality: ${videoFormat.qualityLabel || videoFormat.quality}`);

  return finalPath;
 }

 protected getYouTubeVideoId(): string | null {
  const match = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
 }

 abstract convert(): Promise<string>;
}